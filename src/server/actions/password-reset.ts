"use server";

import { prisma } from "@/lib/prisma";
import { ActionError } from "@/lib/action-error";
import { hashPassword } from "@/lib/password";
import {
  generateChallengeToken,
  hashChallengeToken,
  generateTwoFactorCode,
  hashTwoFactorCode,
  verifyTwoFactorCode as checkCode,
} from "@/lib/two-factor";
import {
  setPasswordResetChallengeCookie,
  clearPasswordResetChallengeCookie,
  getPasswordResetChallengeTokenFromCookies,
  PASSWORD_RESET_DURATION_MS,
  PASSWORD_RESET_MAX_ATTEMPTS,
  PASSWORD_RESET_RESEND_COOLDOWN_MS,
} from "@/lib/password-reset";
import { sendPasswordResetCodeEmail } from "@/lib/email/send-password-reset-code";
import { defineAction } from "@/server/define-action";
import {
  requestPasswordResetSchema,
  verifyPasswordResetCodeSchema,
  setNewPasswordSchema,
} from "@/lib/validations/auth";

/** Generic "your session's dead, start over" error — used everywhere a stale/missing/expired challenge is found. */
const EXPIRED_ERROR = new ActionError(
  "Your password reset session expired. Please start again.",
  "UNAUTHORIZED",
);

async function issuePasswordResetChallenge(user: { id: string; name: string; email: string }) {
  const code = generateTwoFactorCode();
  const token = generateChallengeToken();

  await prisma.passwordResetChallenge.create({
    data: {
      userId: user.id,
      tokenHash: hashChallengeToken(token),
      codeHash: hashTwoFactorCode(code),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_DURATION_MS),
    },
  });

  try {
    await sendPasswordResetCodeEmail({ to: user.email, name: user.name, code });
  } catch (error) {
    // Never let a delivery failure change the response shape here — that would
    // let someone tell eligible usernames apart from ineligible/nonexistent
    // ones just by whether the request "succeeds". Locally, print the code so
    // a not-yet-verified Resend domain doesn't lock development out entirely.
    if (process.env.NODE_ENV === "production") {
      console.error("[password-reset] email send failed:", error);
    } else {
      console.warn(`[password-reset] email delivery failed in development — reset code for ${user.email}: ${code}`);
    }
  }

  await setPasswordResetChallengeCookie(token);
}

export const requestPasswordReset = defineAction({
  auth: "public",
  rateLimit: { limit: 3, windowMs: 15 * 60_000 },
  schema: requestPasswordResetSchema,
  handler: async (input): Promise<{ ok: true }> => {
    const user = await prisma.user.findUnique({ where: { username: input.username } });

    // Password reset is Admin-only (same reasoning as login 2FA — Staff have
    // no email on file to send a code to). Deliberately the *same* response
    // whether the username doesn't exist, belongs to Staff, or belongs to an
    // Admin without an email — an outsider learns nothing from asking.
    if (user && user.role === "ADMIN" && user.email) {
      await issuePasswordResetChallenge({ id: user.id, name: user.name, email: user.email });
    }

    return { ok: true };
  },
});

export const verifyPasswordResetCode = defineAction({
  auth: "public",
  rateLimit: { limit: 10, windowMs: 15 * 60_000 },
  schema: verifyPasswordResetCodeSchema,
  handler: async (input): Promise<{ ok: true }> => {
    const token = await getPasswordResetChallengeTokenFromCookies();
    if (!token) throw EXPIRED_ERROR;

    const challenge = await prisma.passwordResetChallenge.findUnique({
      where: { tokenHash: hashChallengeToken(token) },
    });

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      if (challenge) await prisma.passwordResetChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      await clearPasswordResetChallengeCookie();
      throw EXPIRED_ERROR;
    }

    if (challenge.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      await prisma.passwordResetChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      await clearPasswordResetChallengeCookie();
      throw new ActionError("Too many incorrect attempts. Please start again.", "UNAUTHORIZED");
    }

    if (!checkCode(input.code, challenge.codeHash)) {
      const attempts = challenge.attempts + 1;
      await prisma.passwordResetChallenge.update({ where: { id: challenge.id }, data: { attempts } });
      const remaining = PASSWORD_RESET_MAX_ATTEMPTS - attempts;
      throw new ActionError(
        remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
          : "Too many incorrect attempts. Please start again.",
        "UNAUTHORIZED",
      );
    }

    await prisma.passwordResetChallenge.update({ where: { id: challenge.id }, data: { verified: true } });

    return { ok: true };
  },
});

export const resendPasswordResetCode = defineAction({
  auth: "public",
  rateLimit: { limit: 3, windowMs: 15 * 60_000 },
  handler: async (): Promise<{ ok: true }> => {
    const token = await getPasswordResetChallengeTokenFromCookies();
    if (!token) throw EXPIRED_ERROR;

    const challenge = await prisma.passwordResetChallenge.findUnique({
      where: { tokenHash: hashChallengeToken(token) },
      include: { user: true },
    });

    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      if (challenge) await prisma.passwordResetChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      await clearPasswordResetChallengeCookie();
      throw EXPIRED_ERROR;
    }

    const ageMs = Date.now() - challenge.createdAt.getTime();
    if (ageMs < PASSWORD_RESET_RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((PASSWORD_RESET_RESEND_COOLDOWN_MS - ageMs) / 1000);
      throw new ActionError(`Please wait ${waitSeconds}s before requesting another code.`, "VALIDATION");
    }

    if (!challenge.user.email) throw EXPIRED_ERROR;

    await prisma.passwordResetChallenge.delete({ where: { id: challenge.id } });
    await issuePasswordResetChallenge({
      id: challenge.user.id,
      name: challenge.user.name,
      email: challenge.user.email,
    });

    return { ok: true };
  },
});

export const resetPassword = defineAction({
  auth: "public",
  schema: setNewPasswordSchema,
  handler: async (input): Promise<{ ok: true }> => {
    const token = await getPasswordResetChallengeTokenFromCookies();
    if (!token) throw EXPIRED_ERROR;

    const challenge = await prisma.passwordResetChallenge.findUnique({
      where: { tokenHash: hashChallengeToken(token) },
    });

    if (!challenge || !challenge.verified || challenge.expiresAt.getTime() < Date.now()) {
      if (challenge) await prisma.passwordResetChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
      await clearPasswordResetChallengeCookie();
      throw EXPIRED_ERROR;
    }

    await prisma.user.update({
      where: { id: challenge.userId },
      data: { passwordHash: hashPassword(input.password) },
    });

    await prisma.passwordResetChallenge.delete({ where: { id: challenge.id } });
    await clearPasswordResetChallengeCookie();
    // A reset password should kick every existing session, not just let the
    // old password's sessions quietly keep working alongside the new one.
    await prisma.session.deleteMany({ where: { userId: challenge.userId } });

    return { ok: true };
  },
});
