import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

/**
 * Automatisches Cleanup: Löscht Bilder, die älter als 2 Tage sind
 */
export async function POST(request: NextRequest) {
  try {
    // Berechne Zeitpunkt vor 2 Tagen
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Finde alte Bilder
    const oldImages = await prisma.image.findMany({
      where: {
        createdAt: {
          lt: twoDaysAgo
        }
      }
    });

    if (oldImages.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'Keine alten Bilder gefunden'
      });
    }

    // Dateien aus S3 löschen
    let deletedFromS3 = 0;
    for (const image of oldImages) {
      if (image.cloudStoragePath) {
        try {
          await deleteFile(image.cloudStoragePath);
          deletedFromS3++;
        } catch (error) {
          console.error(`Failed to delete old file from S3: ${image.cloudStoragePath}`, error);
        }
      }
    }

    // Alte Bilder aus Datenbank löschen
    const result = await prisma.image.deleteMany({
      where: {
        createdAt: {
          lt: twoDaysAgo
        }
      }
    });

    console.log(`Automatisches Cleanup: ${result.count} alte Bilder gelöscht`);

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      deletedFromS3,
      message: `${result.count} alte Bild(er) automatisch gelöscht (älter als 2 Tage)`
    });

  } catch (error) {
    console.error('Error in automatic cleanup:', error);
    return NextResponse.json(
      { error: 'Fehler beim automatischen Cleanup' },
      { status: 500 }
    );
  }
}
