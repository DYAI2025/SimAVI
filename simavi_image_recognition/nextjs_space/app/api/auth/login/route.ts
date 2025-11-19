

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Überprüfe das Passwort
    const correctPassword = process.env.APP_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        { message: "Server-Konfigurationsfehler" },
        { status: 500 }
      );
    }

    if (password === correctPassword) {
      // Setze ein Session-Cookie
      const cookieStore = await cookies();
      cookieStore.set("simavi-auth", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 Tage
        path: "/",
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { message: "Falsches Passwort" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
