"use server";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { verifyPassword } from "@/lib/password";
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  getSessionTokenFromCookies,
  invalidateSessionByToken,
} from "@/lib/session";
import { getCurrentSession } from "@/lib/dal";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export type AuthUserDTO = {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "STAFF";
};

export async function login(rawInput: LoginInput): Promise<AuthUserDTO> {
  const input = loginSchema.parse(rawInput);

  const user = await prisma.user.findUnique({ where: { username: input.username } });
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    // Deliberately generic — don't reveal whether the username exists.
    throw new ActionError("Invalid username or password.", "UNAUTHORIZED");
  }

  const { token } = await createSession(user.id);
  await setSessionCookie(token);

  return { id: user.id, name: user.name, username: user.username, role: user.role };
}

export async function logout(): Promise<{ ok: true }> {
  const token = await getSessionTokenFromCookies();
  if (token) await invalidateSessionByToken(token);
  await clearSessionCookie();
  return { ok: true };
}

export async function getCurrentUser(): Promise<AuthUserDTO | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    username: session.user.username,
    role: session.user.role,
  };
}
