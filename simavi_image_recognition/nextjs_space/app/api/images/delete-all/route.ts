import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    // Alle Bilder aus Datenbank abrufen
    const images = await prisma.image.findMany();

    if (images.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'Keine Bilder zum Löschen vorhanden'
      });
    }

    // Dateien aus S3 löschen
    let deletedFromS3 = 0;
    for (const image of images) {
      if (image.cloudStoragePath) {
        try {
          await deleteFile(image.cloudStoragePath);
          deletedFromS3++;
        } catch (error) {
          console.error(`Failed to delete file from S3: ${image.cloudStoragePath}`, error);
        }
      }
    }

    // Alle Bilder aus Datenbank löschen
    const result = await prisma.image.deleteMany({});

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      deletedFromS3,
      message: `Alle ${result.count} Bilder erfolgreich gelöscht`
    });

  } catch (error) {
    console.error('Error deleting all images:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen aller Bilder' },
      { status: 500 }
    );
  }
}
