
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

    // Nur eigene Bilder aus Datenbank abrufen
    const images = await prisma.image.findMany({
      where: {
        userId: session.userId,
      },
      select: {
        id: true,
        cloudStoragePath: true,
      },
    });

    if (images.length === 0) {
      return NextResponse.json(
        { success: true, message: 'Keine Bilder zum Löschen vorhanden', deletedCount: 0 },
        { status: 200 }
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

    // Alle eigenen Datenbank-Einträge löschen
    const deleteResult = await prisma.image.deleteMany({
      where: {
        userId: session.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Alle ${deleteResult.count} Bilder erfolgreich gelöscht`,
        deletedCount: deleteResult.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fehler beim Löschen aller Bilder:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler beim Löschen' },
      { status: 500 }
    );
  }
}
