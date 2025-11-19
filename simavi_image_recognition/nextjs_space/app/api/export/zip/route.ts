

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFileSignedUrl } from "@/lib/s3";
import archiver from "archiver";
import { PassThrough } from "stream";

export async function GET(request: NextRequest) {
  try {
    // Hole alle erfolgreich analysierten Bilder
    const images = await prisma.image.findMany({
      where: {
        analysisStatus: "completed",
        newName: { not: null },
      },
      select: {
        id: true,
        cloudStoragePath: true,
        newName: true,
        mimeType: true,
      },
    });

    if (images.length === 0) {
      return NextResponse.json(
        { message: "Keine analysierten Bilder zum Download verfügbar" },
        { status: 404 }
      );
    }

    // Erstelle ZIP-Archiv
    const archive = archiver("zip", {
      zlib: { level: 6 }, // Kompressionsgrad
    });

    // Sammle alle Chunks in einem Buffer Array
    const chunks: Buffer[] = [];
    
    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Promise für das Finalisieren des Archivs
    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on("error", (err) => {
        reject(err);
      });
    });

    // Füge alle Bilder zum Archiv hinzu
    const imagePromises = images.map(async (image) => {
      try {
        // Generiere Signed URL
        const signedUrl = await getFileSignedUrl(image.cloudStoragePath);
        
        // Lade das Bild herunter
        const response = await fetch(signedUrl);
        if (!response.ok) {
          console.error(`Failed to fetch image ${image.id}: ${response.statusText}`);
          return;
        }

        const buffer = await response.arrayBuffer();
        
        // Füge das Bild mit dem neuen Namen zum Archiv hinzu
        archive.append(Buffer.from(buffer), { name: image.newName || `image_${image.id}.jpg` });
      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
      }
    });

    // Warte darauf, dass alle Bilder hinzugefügt wurden
    await Promise.all(imagePromises);

    // Finalisiere das Archiv
    await archive.finalize();

    // Warte auf den vollständigen Buffer
    const zipBuffer = await archivePromise;

    // Sende das ZIP als Response
    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="umbenannte-bilder-${Date.now()}.zip"`,
      },
    });
  } catch (error) {
    console.error("ZIP export error:", error);
    return NextResponse.json(
      { message: "Fehler beim Erstellen des ZIP-Archivs", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
