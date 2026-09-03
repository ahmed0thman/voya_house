import "server-only";
import { randomBytes, randomInt, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** How long an admin has to enter the code before the challenge is dead. */
export const TWO_FACTOR_CODE_DURATION_MS = 1000 * 60 * 10;
/** Wrong guesses allowed before the challenge is dead outright. */
export const TWO_FACTOR_MAX_ATTEMPTS = 5;
/** Floor between "resend code" clicks, so a slow mail provider can't be hammered. */
export const TWO_FACTOR_RESEND_COOLDOWN_MS = 1000 * 30;

/**
 * Holds the pending-login challenge token between password verification and
 * code entry — deliberately not `voya_session`: no session exists yet, and
 * this cookie alone must never be enough to authenticate anything.
 */
const TWO_FACTOR_COOKIE_NAME = "voya_2fa_challenge";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Same "only the hash is stored" pattern as `Session.tokenHash` (see session.ts). */
export function generateChallengeToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashChallengeToken(token: string): string {
  return sha256Hex(token);
}

/** A 6-digit numeric code, zero-padded — e.g. "042917". */
export function generateTwoFactorCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashTwoFactorCode(code: string): string {
  return sha256Hex(code);
}

export function verifyTwoFactorCode(code: string, storedHash: string): boolean {
  const candidateHash = Buffer.from(hashTwoFactorCode(code), "hex");
  const storedHashBuffer = Buffer.from(storedHash, "hex");
  if (candidateHash.length !== storedHashBuffer.length) return false;
  return timingSafeEqual(candidateHash, storedHashBuffer);
}

/** "ahmed@gmail.com" -> "ah***@gmail.com" — enough for the admin to recognize their own inbox. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(local.length - visible.length, 3))}@${domain}`;
}

export async function setTwoFactorChallengeCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TWO_FACTOR_CODE_DURATION_MS / 1000,
  });
}

export async function clearTwoFactorChallengeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TWO_FACTOR_COOKIE_NAME);
}

export async function getTwoFactorChallengeTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TWO_FACTOR_COOKIE_NAME)?.value;
}
