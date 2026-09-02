"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTables,
  listGuestTables,
  createTable,
  createTablesRange,
  updateTable,
  deleteTable,
} from "@/server/actions/tables";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type {
  CreateTableInput,
  CreateTablesRangeInput,
  UpdateTableInput,
  DeleteTableInput,
} from "@/lib/validations/table";

export function useTables() {
  return useQuery({
    queryKey: queryKeys.tables.all,
    queryFn: () => unwrap(listTables()),
  });
}

/**
 * The active tables a guest can pick from, for someone who walked in without
 * scanning a QR — includes tables already seated, so a friend joining a party
 * can find and pick the same one. Kept short-lived and refetched whenever the
 * guest comes back to the tab, rather than cached like the admin's static
 * table list, since which tables exist can still change underneath them.
 */
export function useGuestTables(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tables.guest,
    queryFn: () => unwrap(listGuestTables()),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    enabled,
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTableInput) => unwrap(createTable(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
}

export function useCreateTablesRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTablesRangeInput) => unwrap(createTablesRange(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTableInput) => unwrap(updateTable(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTableInput) => unwrap(deleteTable(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
}
