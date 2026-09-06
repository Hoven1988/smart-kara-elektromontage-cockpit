import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, homePathForRole, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/login"];

// TODO: entfernen, sobald echte Accounts (Neon-DB) angebunden sind (Phase 2).
// Solange öffnet sich das Cockpit ohne Anmeldung, damit der Baufortschritt
// ohne Login-Hürde angeschaut werden kann.
const AUTH_DISABLED_FOR_PREVIEW = true;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (AUTH_DISABLED_FOR_PREVIEW || PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL(homePathForRole(session.role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.jpg|icons|sw.js).*)"],
};
