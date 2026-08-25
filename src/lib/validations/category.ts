import { z } from "zod";

export const createCategorySchema = z.object({
  brandId: z.uuid(),
  title: z.string().trim().min(1, "Title is required").max(120),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1, "Title is required").max(120).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const deleteCategorySchema = z.object({
  id: z.uuid(),
  /** Cascade-delete the category's items too. Without it, delete fails if items exist. */
  force: z.boolean().optional().default(false),
});
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;

export const reorderCategoriesSchema = z.object({
  brandId: z.uuid(),
  orderedIds: z.array(z.uuid()).min(1),
});
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
