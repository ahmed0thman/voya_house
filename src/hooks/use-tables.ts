"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTables,
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
