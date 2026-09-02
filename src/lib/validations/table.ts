import { z } from "zod";

const numberSchema = z
  .number()
  .int("Must be a whole number")
  .positive("Must be a positive number")
  .max(999, "Table number is unreasonably large");

const labelSchema = z.string().trim().max(60, "Label is too long").optional().or(z.literal(""));

export const createTableSchema = z.object({
  number: numberSchema,
  label: labelSchema,
});
export type CreateTableInput = z.infer<typeof createTableSchema>;

export const updateTableSchema = z.object({
  id: z.uuid(),
  number: numberSchema,
  label: labelSchema,
  isActive: z.boolean(),
});
export type UpdateTableInput = z.infer<typeof updateTableSchema>;

export const deleteTableSchema = z.object({
  id: z.uuid(),
});
export type DeleteTableInput = z.infer<typeof deleteTableSchema>;

const MAX_RANGE_SIZE = 200;

export const createTablesRangeSchema = z
  .object({
    start: numberSchema,
    end: numberSchema,
  })
  .refine((data) => data.end >= data.start, {
    message: "End must be greater than or equal to left",
    path: ["right"],
  })
  .refine((data) => data.end - data.start + 1 <= MAX_RANGE_SIZE, {
    message: `Range is too large — ${MAX_RANGE_SIZE} tables max at once`,
    path: ["right"],
  });
export type CreateTablesRangeInput = z.infer<typeof createTablesRangeSchema>;
