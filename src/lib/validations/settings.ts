import { z } from "zod";

/**
 * Accepts however an admin naturally types a number (spaces, dashes, a
 * leading "+" or "00") and normalizes to the digits-only international
 * format a wa.me link expects (e.g. "201097073224"). Empty clears the
 * setting — WhatsApp handoff after checkout is simply skipped for guests.
 */
export const whatsappOrderNumberSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^\d]/g, "").replace(/^00/, ""))
  .refine((digits) => digits.length === 0 || (digits.length >= 8 && digits.length <= 15), {
    message: "Enter a valid phone number in international format.",
  })
  .transform((digits) => (digits.length === 0 ? null : digits))
  .optional();

export const updateAppSettingsSchema = z.object({
  whatsappOrderNumber: whatsappOrderNumberSchema,
});
export type UpdateAppSettingsInput = z.infer<typeof updateAppSettingsSchema>;
