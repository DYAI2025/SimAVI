
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCSV } from "@/lib/export-helpers";

export async function GET() {
  try {
    const images = await prisma.image.findMany({
      where: { analysisStatus: "completed" },
      orderBy: { createdAt: "desc" },
    });

    const csvContent = generateCSV(images);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="image-analysis-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error generating CSV:", error);
    return NextResponse.json({ error: "Failed to generate CSV" }, { status: 500 });
  }
}
