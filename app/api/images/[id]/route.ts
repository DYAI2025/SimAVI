
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';
import { getSessionFromCookie } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Session-Daten abrufen
    const session = getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const imageId = parseInt(params.id);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Ungültige Bild-ID' },
        { status: 400 }
      );
    }

    // Bild aus Datenbank abrufen und Berechtigung prüfen
    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        userId: session.userId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Bild nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      );
    }

    // Datei aus S3 löschen
    if (image.cloudStoragePath) {
      try {
        await deleteFile(image.cloudStoragePath);
      } catch (error) {
        console.error('Fehler beim Löschen der S3-Datei:', error);
      }
    }

    // Datenbank-Eintrag löschen
    await prisma.image.delete({
      where: { id: imageId },
    });

    return NextResponse.json(
      { success: true, message: 'Bild erfolgreich gelöscht' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fehler beim Löschen des Bildes:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Löschen' },
      { status: 500 }
    );
  }
}
