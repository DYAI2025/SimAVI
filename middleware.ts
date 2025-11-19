
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Login, Registrierung und API-Auth-Routes sind öffentlich
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/register" ||
    request.nextUrl.pathname.startsWith("/api/auth/login") ||
    request.nextUrl.pathname.startsWith("/api/auth/register") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Prüfe, ob der Nutzer eingeloggt ist
  const authCookie = request.cookies.get("simavi-auth");

  if (!authCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Versuche, die Session-Daten zu parsen
    const sessionData = JSON.parse(authCookie.value);
    
    // Prüfe, ob userId vorhanden ist
    if (!sessionData.userId || !sessionData.email) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (error) {
    // Wenn Parsing fehlschlägt, redirect zur Login-Seite
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
