import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyTwoFactorSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;

export const requestPasswordResetSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
});
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

/** Same shape as `verifyTwoFactorSchema` — the login and reset flows both just want a 6-digit code. */
export const verifyPasswordResetCodeSchema = verifyTwoFactorSchema;
export type VerifyPasswordResetCodeInput = z.infer<typeof verifyPasswordResetCodeSchema>;

export const setNewPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });
export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>;
