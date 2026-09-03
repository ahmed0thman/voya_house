import "server-only";
import { Resend } from "resend";
import { ActionError } from "@/lib/action-error";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ActionError(`Email is not configured (missing ${name}). See README-BACKEND.md.`, "VALIDATION");
  }
  return value;
}

let client: Resend | null = null;

/** Lazy singleton — mirrors `src/lib/storage/r2.ts`'s `getR2Client()`. */
export function getResendClient(): Resend {
  if (!client) client = new Resend(getEnv("RESEND_API_KEY"));
  return client;
}

/**
 * "Voya Control Board <onboarding@resend.dev>" out of the box — Resend's
 * shared sandbox domain, which needs no DNS setup but can only deliver to the
 * email address the Resend account itself was signed up with. Once a real
 * domain is verified in the Resend dashboard, set EMAIL_FROM to an address on
 * it (e.g. "Voya Control Board <no-reply@voyahouse.com>") to email anyone.
 */
export function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "Voya Control Board <onboarding@resend.dev>";
}
