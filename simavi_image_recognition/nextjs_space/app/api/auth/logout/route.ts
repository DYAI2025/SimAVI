

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Lösche das Session-Cookie
    const cookieStore = await cookies();
    cookieStore.delete("simavi-auth");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
