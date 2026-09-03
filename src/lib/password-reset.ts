import "server-only";
import { cookies } from "next/headers";

/** How long an admin has to enter the code and pick a new password before the whole flow is dead. */
export const PASSWORD_RESET_DURATION_MS = 1000 * 60 * 15;
/** Wrong code guesses allowed before the flow is dead outright. */
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;
/** Floor between "resend code" clicks, same rationale as the login 2FA flow. */
export const PASSWORD_RESET_RESEND_COOLDOWN_MS = 1000 * 30;

/**
 * Holds the pending-reset challenge token across all three steps (request,
 * code entry, new password) — deliberately separate from both `voya_session`
 * and the login flow's `voya_2fa_challenge`: this cookie alone never proves
 * who's signed in, only that *this browser* is the one that asked to reset
 * *this* account's password.
 */
const PASSWORD_RESET_COOKIE_NAME = "voya_pw_reset";

export async function setPasswordResetChallengeCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PASSWORD_RESET_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PASSWORD_RESET_DURATION_MS / 1000,
  });
}

export async function clearPasswordResetChallengeCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PASSWORD_RESET_COOKIE_NAME);
}

export async function getPasswordResetChallengeTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(PASSWORD_RESET_COOKIE_NAME)?.value;
}
