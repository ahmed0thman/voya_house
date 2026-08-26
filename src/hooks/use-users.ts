"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listUsers, createUser, updateUser, deleteUser } from "@/server/actions/users";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type {
  CreateUserInput,
  UpdateUserInput,
  DeleteUserInput,
} from "@/lib/validations/user";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => unwrap(listUsers()),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => unwrap(createUser(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => unwrap(updateUser(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteUserInput) => unwrap(deleteUser(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
