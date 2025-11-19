
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/s3";

export async function GET() {
  try {
    // Automatisches Cleanup: Bilder älter als 2 Tage löschen
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const oldImages = await prisma.image.findMany({
        where: {
          createdAt: {
            lt: twoDaysAgo
          }
        }
      });

      // Alte Dateien aus S3 löschen
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
      if (oldImages.length > 0) {
        await prisma.image.deleteMany({
          where: {
            createdAt: {
              lt: twoDaysAgo
            }
          }
        });
        console.log(`Automatisches Cleanup: ${oldImages.length} alte Bilder gelöscht`);
      }
    } catch (cleanupError) {
      console.error("Error during automatic cleanup:", cleanupError);
      // Fahre fort mit dem Abrufen der Bilder, auch wenn Cleanup fehlschlägt
    }

    // Bilder abrufen
    const images = await prisma.image.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { imageId, newName } = await request.json();

    if (!imageId || !newName) {
      return NextResponse.json(
        { error: "Image ID and new name are required" },
        { status: 400 }
      );
    }

    const updatedImage = await prisma.image.update({
      where: { id: imageId },
      data: { newName },
    });

    return NextResponse.json({
      message: "Name updated successfully",
      image: updatedImage,
    });
  } catch (error) {
    console.error("Error updating image name:", error);
    return NextResponse.json(
      { error: "Failed to update image name" },
      { status: 500 }
    );
  }
}
