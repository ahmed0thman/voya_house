import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "STAFF"]);

export const createUserSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(
        /^[a-z0-9._-]+$/i,
        "Only letters, numbers, dots, underscores and hyphens",
      ),
    role: userRoleSchema,
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    id: z.uuid(),
    name: z.string().trim().min(1, "Name is required").max(120),
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(50)
      .regex(
        /^[a-z0-9._-]+$/i,
        "Only letters, numbers, dots, underscores and hyphens",
      ),
    role: userRoleSchema,
    /** Omit (or leave both blank) to keep the current password. */
    password: z.string().max(72).optional(),
    passwordConfirmation: z.string().optional(),
  })
  .refine((data) => !data.password || data.password.length >= 8, {
    message: "Password must be at least 8 characters",
    path: ["password"],
  })
  .refine((data) => (data.password ?? "") === (data.passwordConfirmation ?? ""), {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const deleteUserSchema = z.object({
  id: z.uuid(),
});
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
