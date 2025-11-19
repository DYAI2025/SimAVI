
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validierung
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      );
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    // Prüfen, ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 409 }
      );
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // User erstellen
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || null,
      },
    });

    // Session-Cookie setzen
    const sessionData = JSON.stringify({
      userId: user.id,
      email: user.email,
    });

    const cookie = serialize('simavi-auth', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 Tage
      path: '/',
    });

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );

    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('Registrierungsfehler:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler bei der Registrierung' },
      { status: 500 }
    );
  }
}
