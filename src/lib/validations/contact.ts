import { z } from "zod";

const labelSchema = z.string().trim().min(1, "Label is required").max(120);
const labelArSchema = z
  .string()
  .trim()
  .max(120, "Label is too long")
  .optional()
  .or(z.literal(""));

export const createContactSubjectSchema = z.object({
  label: labelSchema,
  labelAr: labelArSchema,
});
export type CreateContactSubjectInput = z.infer<typeof createContactSubjectSchema>;

export const updateContactSubjectSchema = z.object({
  id: z.uuid(),
  label: labelSchema.optional(),
  labelAr: labelArSchema,
  isActive: z.boolean().optional(),
});
export type UpdateContactSubjectInput = z.infer<typeof updateContactSubjectSchema>;

export const deleteContactSubjectSchema = z.object({
  id: z.uuid(),
});
export type DeleteContactSubjectInput = z.infer<typeof deleteContactSubjectSchema>;

export const reorderContactSubjectsSchema = z.object({
  orderedIds: z.array(z.uuid()).min(1),
});
export type ReorderContactSubjectsInput = z.infer<typeof reorderContactSubjectsSchema>;

export const submitContactMessageSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email("Enter a valid email address"),
  message: z.string().trim().min(1, "Enter a message").max(2000),
  subjectId: z.uuid().optional(),
});
export type SubmitContactMessageInput = z.infer<typeof submitContactMessageSchema>;

export const listContactMessagesSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type ListContactMessagesInput = z.infer<typeof listContactMessagesSchema>;
