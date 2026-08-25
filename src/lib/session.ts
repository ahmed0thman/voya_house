import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";
import { SESSION_COOKIE_NAME } from "@/lib/session-constants";

/** Sliding window: any validated request within this long of expiry pushes it back out. */
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24;
/**
 * The browser cookie just needs to outlive the DB session — expiresAt (not
 * cookie Max-Age) is the real gate, and it's the only one a Server
 * Component render is allowed to update (Next.js forbids `cookies().set()`
 * outside a Server Function/Route Handler, so the cookie's lifetime can't
 * slide on every page view the way the DB row does).
 */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export type SessionUser = Pick<User, "id" | "name" | "username" | "role">;

const SESSION_USER_SELECT = { id: true, name: true, username: true, role: true } as const;

export async function createSession(userId: string): Promise<{ token: string }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  return { token };
}

export async function validateSessionToken(
  token: string,
): Promise<{ user: SessionUser } | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: SESSION_USER_SELECT } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const remainingMs = session.expiresAt.getTime() - Date.now();
  if (remainingMs < SESSION_REFRESH_THRESHOLD_MS) {
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() + SESSION_DURATION_MS) },
    });
  }

  return { user: session.user };
}

export async function invalidateSessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}
