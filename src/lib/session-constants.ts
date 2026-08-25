/**
 * Shared with proxy.ts, which can't import `server-only`-guarded code —
 * keep this file free of both that guard and any Node-only APIs.
 */
export const SESSION_COOKIE_NAME = "voya_session";
