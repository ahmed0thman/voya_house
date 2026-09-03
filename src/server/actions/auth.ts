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
import {
  generateChallengeToken,
  hashChallengeToken,
  generateTwoFactorCode,
  hashTwoFactorCode,
  verifyTwoFactorCode as checkTwoFactorCode,
  maskEmail,
  setTwoFactorChallengeCookie,
  clearTwoFactorChallengeCookie,
  getTwoFactorChallengeTokenFromCookies,
  TWO_FACTOR_CODE_DURATION_MS,
  TWO_FACTOR_MAX_ATTEMPTS,
  TWO_FACTOR_RESEND_COOLDOWN_MS,
} from "@/lib/two-factor";
import { sendTwoFactorCodeEmail } from "@/lib/email/send-two-factor-code";
import { getCurrentSession } from "@/lib/dal";
import { defineAction } from "@/server/define-action";
import { loginSchema, verifyTwoFactorSchema } from "@/lib/validations/auth";

export type AuthUserDTO = {
  id: string;
  name: string;
  username: string;
  role: "ADMIN" | "STAFF";
};

export type LoginResult =
  | { status: "ok"; user: AuthUserDTO }
  | { status: "2fa_required"; maskedEmail: string };

async function issueTwoFactorChallenge(user: { id: string; name: string; email: string | null }) {
  // Enforced at account creation (see validations/user.ts) — this only guards
  // legacy rows from before that rule existed.
  if (!user.email) {
    throw new ActionError(
      "This admin account has no email on file. Ask another admin to add one before signing in.",
      "VALIDATION",
    );
  }

  const code = generateTwoFactorCode();
  const token = generateChallengeToken();

  await prisma.twoFactorChallenge.create({
    data: {
      userId: user.id,
      tokenHash: hashChallengeToken(token),
      codeHash: hashTwoFactorCode(code),
      expiresAt: new Date(Date.now() + TWO_FACTOR_CODE_DURATION_MS),
    },
  });

  try {
    await sendTwoFactorCodeEmail({ to: user.email, name: user.name, code });
  } catch (error) {
    // Fail closed in production — a real admin must actually receive the code.
    // Locally, a not-yet-verified Resend domain (or a recipient outside its
    // sandbox allowance) would otherwise lock every admin out entirely, so
    // the code lands in the server console instead of the inbox.
    if (process.env.NODE_ENV === "production") throw error;
    console.warn(
      `[2fa] email delivery failed in development — sign-in code for ${user.email}: ${code}`,
    );
    console.warn("[2fa] underlying error:", error);
  }
  await setTwoFactorChallengeCookie(token);

  return { status: "2fa_required" as const, maskedEmail: maskEmail(user.email) };
}

export const login = defineAction({
  auth: "public",
  schema: loginSchema,
  handler: async (input): Promise<LoginResult> => {
    const user = await prisma.user.findUnique({ where: { username: input.username } });
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      // Deliberately generic — don't reveal whether the username exists.
      throw new ActionError("Invalid username or password.", "UNAUTHORIZED");
    }

    if (user.role === "ADMIN") {
      return issueTwoFactorChallenge(user);
    }

    const { token } = await createSession(user.id);
    await setSessionCookie(token);

    return {
      status: "ok",
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
    };
  },
});

export const verifyTwoFactorCode = defineAction({
  auth: "public",
  schema: verifyTwoFactorSchema,
  handler: async (input): Promise<AuthUserDTO> => {
    const token = await getTwoFactorChallengeTokenFromCookies();
    if (!token) {
      throw new ActionError("Your verification session expired. Please sign in again.", "UNAUTHORIZED");
    }

    const challenge = await prisma.twoFactorChallenge.findUnique({
      where: { tokenHash: hashChallengeToken(token) },
      include: { user: true },
    });

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      if (challenge) await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      await clearTwoFactorChallengeCookie();
      throw new ActionError("Your verification session expired. Please sign in again.", "UNAUTHORIZED");
    }

    if (challenge.attempts >= TWO_FACTOR_MAX_ATTEMPTS) {
      await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      await clearTwoFactorChallengeCookie();
      throw new ActionError("Too many incorrect attempts. Please sign in again.", "UNAUTHORIZED");
    }

    if (!checkTwoFactorCode(input.code, challenge.codeHash)) {
      const attempts = challenge.attempts + 1;
      await prisma.twoFactorChallenge.update({ where: { id: challenge.id }, data: { attempts } });
      const remaining = TWO_FACTOR_MAX_ATTEMPTS - attempts;
      throw new ActionError(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
          : "Too many incorrect attempts. Please sign in again.",
        "UNAUTHORIZED",
      );
    }

    await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } });
    await clearTwoFactorChallengeCookie();

    const { token: sessionToken } = await createSession(challenge.user.id);
    await setSessionCookie(sessionToken);

    return {
      id: challenge.user.id,
      name: challenge.user.name,
      username: challenge.user.username,
      role: challenge.user.role,
    };
  },
});

export const resendTwoFactorCode = defineAction({
  auth: "public",
  handler: async (): Promise<{ maskedEmail: string }> => {
    const token = await getTwoFactorChallengeTokenFromCookies();
    if (!token) {
      throw new ActionError("Your verification session expired. Please sign in again.", "UNAUTHORIZED");
    }

    const challenge = await prisma.twoFactorChallenge.findUnique({
      where: { tokenHash: hashChallengeToken(token) },
      include: { user: true },
    });

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      if (challenge) await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      await clearTwoFactorChallengeCookie();
      throw new ActionError("Your verification session expired. Please sign in again.", "UNAUTHORIZED");
    }

    const ageMs = Date.now() - challenge.createdAt.getTime();
    if (ageMs < TWO_FACTOR_RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((TWO_FACTOR_RESEND_COOLDOWN_MS - ageMs) / 1000);
      throw new ActionError(`Please wait ${waitSeconds}s before requesting another code.`, "VALIDATION");
    }

    if (!challenge.user.email) {
      throw new ActionError("This admin account has no email on file.", "VALIDATION");
    }

    await prisma.twoFactorChallenge.delete({ where: { id: challenge.id } });
    return issueTwoFactorChallenge(challenge.user);
  },
});

export const logout = defineAction({
  auth: "public",
  handler: async (): Promise<{ ok: true }> => {
    const token = await getSessionTokenFromCookies();
    if (token) await invalidateSessionByToken(token);
    await clearSessionCookie();
    return { ok: true };
  },
});

export const getCurrentUser = defineAction({
  auth: "public",
  handler: async (): Promise<AuthUserDTO | null> => {
    const session = await getCurrentSession();
    if (!session) return null;

    return {
      id: session.user.id,
      name: session.user.name,
      username: session.user.username,
      role: session.user.role,
    };
  },
});
