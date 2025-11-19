import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const { imageIds } = await request.json();

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json(
        { error: 'Keine Bild-IDs angegeben' },
        { status: 400 }
      );
    }

    // Bilder aus Datenbank abrufen
    const images = await prisma.image.findMany({
      where: {
        id: {
          in: imageIds
        }
      }
    });

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

    // Bilder aus Datenbank löschen
    const result = await prisma.image.deleteMany({
      where: {
        id: {
          in: imageIds
        }
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      deletedFromS3,
      message: `${result.count} Bild(er) erfolgreich gelöscht`
    });

  } catch (error) {
    console.error('Error batch deleting images:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Bilder' },
      { status: 500 }
    );
  }
}
