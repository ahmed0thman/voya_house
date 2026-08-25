import { z } from "zod";

export const discountTypeSchema = z.enum(["PERCENT", "FIXED"]);

const codeSchema = z
  .string()
  .trim()
  .min(3, "Code must be at least 3 characters")
  .max(30, "Code is too long")
  .transform((value) => value.toUpperCase())
  .refine(
    (value) => /^[A-Z0-9_-]+$/.test(value),
    "Only letters, numbers, hyphens and underscores",
  );

const nameSchema = z.string().trim().max(120, "Name is too long").optional().or(z.literal(""));
const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description is too long")
  .optional()
  .or(z.literal(""));
const discountValueSchema = z
  .number()
  .positive("Must be greater than 0")
  .max(1_000_000, "Value is unreasonably large");

export const createOfferSchema = z
  .object({
    code: codeSchema,
    name: nameSchema,
    description: descriptionSchema,
    discountType: discountTypeSchema,
    discountValue: discountValueSchema,
    validFrom: z.date(),
    validUntil: z.date(),
  })
  .refine((data) => data.discountType !== "PERCENT" || data.discountValue <= 100, {
    message: "A percent discount can't exceed 100",
    path: ["discountValue"],
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: "Valid-until must be after valid-from",
    path: ["validUntil"],
  });
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

export const updateOfferSchema = z
  .object({
    id: z.uuid(),
    code: codeSchema,
    name: nameSchema,
    description: descriptionSchema,
    discountType: discountTypeSchema,
    discountValue: discountValueSchema,
    validFrom: z.date(),
    validUntil: z.date(),
    isActive: z.boolean(),
  })
  .refine((data) => data.discountType !== "PERCENT" || data.discountValue <= 100, {
    message: "A percent discount can't exceed 100",
    path: ["discountValue"],
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: "Valid-until must be after valid-from",
    path: ["validUntil"],
  });
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;

export const deleteOfferSchema = z.object({
  id: z.uuid(),
});
export type DeleteOfferInput = z.infer<typeof deleteOfferSchema>;
