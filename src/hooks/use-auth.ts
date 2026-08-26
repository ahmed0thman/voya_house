"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, logout, getCurrentUser } from "@/server/actions/auth";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type { LoginInput } from "@/lib/validations/auth";

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser,
    queryFn: () => unwrap(getCurrentUser()),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => unwrap(login(input)),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.currentUser, user);
    },
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
