"use client";

import { useMutation } from "@tanstack/react-query";
import {
  requestPasswordReset,
  verifyPasswordResetCode,
  resendPasswordResetCode,
  resetPassword,
} from "@/server/actions/password-reset";
import { unwrap } from "@/lib/action-result";
import type { ActionError } from "@/lib/action-error";
import type {
  RequestPasswordResetInput,
  VerifyPasswordResetCodeInput,
  SetNewPasswordInput,
} from "@/lib/validations/auth";

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (input: RequestPasswordResetInput) => unwrap(requestPasswordReset(input)),
  });
}

export function useVerifyPasswordResetCode() {
  return useMutation({
    mutationFn: (input: VerifyPasswordResetCodeInput) => unwrap(verifyPasswordResetCode(input)),
  });
}

export function useResendPasswordResetCode() {
  return useMutation({
    mutationFn: () => unwrap(resendPasswordResetCode()),
  });
}

export function useResetPassword() {
  return useMutation<{ ok: true }, ActionError, SetNewPasswordInput>({
    mutationFn: (input: SetNewPasswordInput) => unwrap(resetPassword(input)),
  });
}
