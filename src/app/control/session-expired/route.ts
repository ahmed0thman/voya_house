import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

// Reached when the DAL finds a session cookie that no longer matches a DB
// session (e.g. the cookie survived a database reset). Route Handlers are
// one of the few places allowed to clear cookies, so this exists purely to
// drop the stale cookie before returning to /control/login — otherwise
// proxy.ts's optimistic cookie check keeps bouncing the request back to
// /control, which redirects back here, forever.
export async function GET(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/control/login", request.url));
}
