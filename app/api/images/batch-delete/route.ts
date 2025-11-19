
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';
import { getSessionFromCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Session-Daten abrufen
    const session = getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageIds } = body;

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Keine Bild-IDs angegeben' },
        { status: 400 }
      );
    }

    // Nur eigene Bilder aus Datenbank abrufen
    const images = await prisma.image.findMany({
      where: {
        id: { in: imageIds },
        userId: session.userId,
      },
    });

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Keine Bilder gefunden' },
        { status: 404 }
      );
    }

    // S3-Dateien löschen
    const deletePromises = images
      .filter((img) => img.cloudStoragePath)
      .map(async (img) => {
        try {
          await deleteFile(img.cloudStoragePath!);
        } catch (error) {
          console.error(`Fehler beim Löschen von ${img.cloudStoragePath}:`, error);
        }
      });

    await Promise.allSettled(deletePromises);

    // Datenbank-Einträge löschen
    const deleteResult = await prisma.image.deleteMany({
      where: {
        id: { in: imageIds },
        userId: session.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${deleteResult.count} Bild(er) erfolgreich gelöscht`,
        deletedCount: deleteResult.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fehler beim Batch-Löschen:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Löschen' },
      { status: 500 }
    );
  }
}
