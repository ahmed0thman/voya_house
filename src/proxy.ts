import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";
import { routing } from "@/i18n/routing";

const handleGuestLocale = createIntlMiddleware(routing);

/**
 * Optimistic check only (cookie presence, no DB hit) — the real,
 * DB-validated check lives in the DAL (`src/lib/dal.ts`) and runs in the
 * `(authenticated)` layout and every mutating Server Action. This just
 * keeps unauthenticated users from ever seeing the control board shell.
 */
function handleControlAuth(request: NextRequest) {
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

/**
 * Two sites share this origin and want opposite things from a request.
 *
 * `/control` is staff-only and English-only: it gets the auth gate and must
 * never be rewritten to `/en/control`, which would break every existing
 * bookmark and the login redirect alike. Everything else is the guest site,
 * where the locale prefix is mandatory — including bare `/`, whose redirect to
 * `/en` or `/ar` carries the query string with it, so a table's printed
 * `/?table=7` QR code still lands the guest on their table.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/control")) {
    return handleControlAuth(request);
  }

  return handleGuestLocale(request);
}

export const config = {
  /**
   * Everything except Next's own internals and the files served straight from
   * `public/` — the frame sequence alone is hundreds of images, and running a
   * locale redirect on each one would be pure overhead. Anything with a file
   * extension is treated as an asset.
   */
  matcher: ["/((?!_next|.*\\..*).*)"],
};
