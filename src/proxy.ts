import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

/**
 * Optimistic check only (cookie presence, no DB hit) — the real,
 * DB-validated check lives in the DAL (`src/lib/dal.ts`) and runs in the
 * `(authenticated)` layout and every mutating Server Action. This just
 * keeps unauthenticated users from ever seeing the control board shell.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (pathname === "/control/login") {
    if (hasSessionCookie) {
      return NextResponse.redirect(new URL("/control", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    const loginUrl = new URL("/control/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/control/:path*"],
};
