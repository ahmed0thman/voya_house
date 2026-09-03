import { z } from "zod";

const priceSchema = z
  .number()
  .positive("Price must be greater than 0")
  .max(100_000, "Price is unreasonably large")
  .refine(
    (val) => Number.isInteger(Math.round(val * 100)),
    "Price can have at most 2 decimal places",
  );

const descriptionSchema = z
  .string()
  .trim()
  .max(500, "Description is too long")
  .optional()
  .or(z.literal(""));

const nameArSchema = z
  .string()
  .trim()
  .max(160, "Name is too long")
  .optional()
  .or(z.literal(""));

/** Which category's items to list. */
export const listItemsSchema = z.uuid();

export const createItemSchema = z.object({
  categoryId: z.uuid(),
  name: z.string().trim().min(1, "Name is required").max(160),
  nameAr: nameArSchema,
  description: descriptionSchema,
  descriptionAr: descriptionSchema,
  price: priceSchema,
  images: z.array(z.string().min(1)).max(8).default([]),
});
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(160).optional(),
  nameAr: nameArSchema,
  description: descriptionSchema,
  descriptionAr: descriptionSchema,
  price: priceSchema.optional(),
  images: z.array(z.string().min(1)).max(8).optional(),
  isAvailable: z.boolean().optional(),
});
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

export const deleteItemSchema = z.object({
  id: z.uuid(),
});
export type DeleteItemInput = z.infer<typeof deleteItemSchema>;

export const reorderItemsSchema = z.object({
  categoryId: z.uuid(),
  orderedIds: z.array(z.uuid()).min(1),
});
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
