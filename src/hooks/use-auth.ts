"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  login,
  logout,
  getCurrentUser,
  verifyTwoFactorCode,
  resendTwoFactorCode,
} from "@/server/actions/auth";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type { LoginInput, VerifyTwoFactorInput } from "@/lib/validations/auth";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: () => unwrap(getCurrentUser()),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => unwrap(login(input)),
  });
}

export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VerifyTwoFactorInput) => unwrap(verifyTwoFactorCode(input)),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.currentUser, user);
    },
  });
}

export function useResendTwoFactorCode() {
  return useMutation({
    mutationFn: () => unwrap(resendTwoFactorCode()),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(logout()),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
