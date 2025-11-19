
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/s3";
import { prisma } from "@/lib/db";
import { getSessionFromCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Session-Daten abrufen
    const session = getSessionFromCookie(request);
    if (!session) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadResults = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const cloudStoragePath = await uploadFile(buffer, file.name, file.type);

        const imageRecord = await prisma.image.create({
          data: {
            originalName: file.name,
            cloudStoragePath: cloudStoragePath,
            fileSize: file.size,
            mimeType: file.type,
            analysisStatus: "pending",
            userId: session.userId,
          },
        });

        uploadResults.push({
          imageId: imageRecord.id,
          originalName: file.name,
          message: "Upload successful",
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        uploadResults.push({
          originalName: file.name,
          error: "Upload failed",
        });
      }
    }

    return NextResponse.json({
      message: "Upload completed",
      results: uploadResults,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
