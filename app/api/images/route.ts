
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteFile } from "@/lib/s3";
import { getSessionFromCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Session-Daten abrufen
    const session = getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    // Automatisches Cleanup: Bilder älter als 2 Tage löschen (nur eigene)
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const oldImages = await prisma.image.findMany({
        where: {
          userId: session.userId,
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
            userId: session.userId,
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

    // Nur eigene Bilder abrufen
    const images = await prisma.image.findMany({
      where: {
        userId: session.userId,
      },
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
    // Session-Daten abrufen
    const session = getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const { imageId, newName } = await request.json();

    if (!imageId || !newName) {
      return NextResponse.json(
        { error: "Image ID and new name are required" },
        { status: 400 }
      );
    }

    // Prüfen, ob das Bild dem User gehört
    const image = await prisma.image.findFirst({
      where: {
        id: imageId,
        userId: session.userId,
      },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Bild nicht gefunden oder keine Berechtigung" },
        { status: 404 }
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
