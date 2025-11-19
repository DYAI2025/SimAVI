
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateJSON } from "@/lib/export-helpers";

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      where: { analysisStatus: "completed" },
      orderBy: { createdAt: "desc" },
    });

    const jsonContent = generateJSON(images);

    return new NextResponse(jsonContent, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="image-analysis-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Error generating JSON:", error);
    return NextResponse.json({ error: "Failed to generate JSON" }, { status: 500 });
  }
}
