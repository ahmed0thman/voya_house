import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import {
  getSessionTokenFromCookies,
  validateSessionToken,
  type SessionUser,
} from "@/lib/session";

/**
 * The "secure" check (per Next.js auth guidance): validated against the
 * database, not just cookie presence. Cached per request so every call site
 * (layout, pages, Server Actions) shares one DB round trip.
 */
export const getCurrentSession = cache(async (): Promise<{ user: SessionUser } | null> => {
  const token = await getSessionTokenFromCookies();
  if (!token) return null;
  return validateSessionToken(token);
});

export async function requireUser(): Promise<SessionUser> {
  const session = await getCurrentSession();
  if (!session) redirect("/control/login");
  return session.user;
}

/** Admins only — Staff gets bounced to the Orders page, the only view they have. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/control/orders");
  return user;
}
