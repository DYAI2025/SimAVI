import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageIds, deleteAll } = body;

    // Automatisches Cleanup: Bilder älter als 2 Tage
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const oldImages = await prisma.image.findMany({
      where: {
        createdAt: {
          lt: twoDaysAgo
        }
      }
    });

    // Alte Bilder aus S3 löschen
    for (const image of oldImages) {
      if (image.cloudStoragePath) {
        try {
          await deleteFile(image.cloudStoragePath);
        } catch (error) {
          console.error(`Failed to delete old file from S3: ${image.cloudStoragePath}`, error);
        }
      }
    }

    // Alte Bilder aus DB löschen
    await prisma.image.deleteMany({
      where: {
        createdAt: {
          lt: twoDaysAgo
        }
      }
    });

    // Alle Bilder löschen
    if (deleteAll) {
      const allImages = await prisma.image.findMany();
      
      // Aus S3 löschen
      for (const image of allImages) {
        if (image.cloudStoragePath) {
          try {
            await deleteFile(image.cloudStoragePath);
          } catch (error) {
            console.error(`Failed to delete file from S3: ${image.cloudStoragePath}`, error);
          }
        }
      }

      // Aus DB löschen
      const result = await prisma.image.deleteMany({});
      
      return NextResponse.json({ 
        success: true, 
        deletedCount: result.count,
        oldImagesDeleted: oldImages.length,
        message: 'Alle Bilder wurden gelöscht'
      });
    }

    // Spezifische Bilder löschen
    if (imageIds && Array.isArray(imageIds) && imageIds.length > 0) {
      const imagesToDelete = await prisma.image.findMany({
        where: {
          id: {
            in: imageIds
          }
        }
      });

      // Aus S3 löschen
      for (const image of imagesToDelete) {
        if (image.cloudStoragePath) {
          try {
            await deleteFile(image.cloudStoragePath);
          } catch (error) {
            console.error(`Failed to delete file from S3: ${image.cloudStoragePath}`, error);
          }
        }
      }

      // Aus DB löschen
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
        oldImagesDeleted: oldImages.length,
        message: `${result.count} Bild(er) wurden gelöscht`
      });
    }

    // Nur automatisches Cleanup
    return NextResponse.json({ 
      success: true, 
      deletedCount: 0,
      oldImagesDeleted: oldImages.length,
      message: 'Cleanup abgeschlossen'
    });

  } catch (error) {
    console.error('Error deleting images:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Bilder' },
      { status: 500 }
    );
  }
}
