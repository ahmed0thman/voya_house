import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";
import { routing } from "@/i18n/routing";

const handleGuestLocale = createIntlMiddleware(routing);

const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "";
const r2Hostname = r2PublicUrl ? new URL(r2PublicUrl).hostname : undefined;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://voyahouse.com";
const appOrigin = new URL(appUrl).origin;
const r2Origin = r2Hostname ? `https://${r2Hostname}` : undefined;
const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const r2StorageOrigin = r2AccountId ? `https://${r2AccountId}.r2.cloudflarestorage.com` : undefined;
const isProduction = process.env.NODE_ENV === "production";

const contentSources = ["'self'", appOrigin, r2Origin].filter(
  (source): source is string => Boolean(source),
);
const imageSources = [
  ...contentSources,
  "https://unpkg.com",
  "https://*.tile.openstreetmap.org",
];
const connectSources = [
  ...contentSources,
  r2StorageOrigin,
  "https://nominatim.openstreetmap.org",
].filter((source): source is string => Boolean(source));
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next's statically rendered output and the reviewed JSON-LD include inline
  // scripts; the static inline styles also include a runtime chart stylesheet.
  // va.vercel-scripts.com is Speed Insights' script host — used in dev always,
  // and in production too unless this deploys on Vercel itself (which proxies
  // it same-origin instead).
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imageSources.join(" ")} data: blob:`,
  `connect-src ${connectSources.join(" ")}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const permissionsPolicy = [
  "accelerometer=()",
  "autoplay=()",
  "camera=()",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=()",
  "gamepad=()",
  // The guest delivery picker uses geolocation, restricted to this origin.
  "geolocation=(self)",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "usb=()",
  "web-share=()",
  "xr-spatial-tracking=()",
].join(", ");

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", permissionsPolicy);
  if (isProduction) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

/**
 * Optimistic check only (cookie presence, no DB hit) — the real,
 * DB-validated check lives in the DAL (`src/lib/dal.ts`) and runs in the
 * `(authenticated)` layout and every mutating Server Action. This just
 * keeps unauthenticated users from ever seeing the control board shell.
 */
/** Reachable while signed out — everything else under `/control` requires a session cookie. */
const PUBLIC_CONTROL_PATHS = new Set(["/control/login", "/control/forgot-password"]);

function handleControlAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (PUBLIC_CONTROL_PATHS.has(pathname)) {
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
    return addSecurityHeaders(handleControlAuth(request));
  }

  return addSecurityHeaders(handleGuestLocale(request));
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
