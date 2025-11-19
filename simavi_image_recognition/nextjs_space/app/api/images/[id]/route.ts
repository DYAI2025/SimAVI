import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageId = params.id;

    // Bild aus Datenbank abrufen
    const image = await prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Bild nicht gefunden' },
        { status: 404 }
      );
    }

    // Datei aus S3 löschen
    if (image.cloudStoragePath) {
      try {
        await deleteFile(image.cloudStoragePath);
      } catch (error) {
        console.error(`Failed to delete file from S3: ${image.cloudStoragePath}`, error);
        // Fahre mit DB-Löschung fort, auch wenn S3-Löschung fehlschlägt
      }
    }

    // Bild aus Datenbank löschen
    await prisma.image.delete({
      where: { id: imageId }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Bild erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Bildes' },
      { status: 500 }
    );
  }
}
