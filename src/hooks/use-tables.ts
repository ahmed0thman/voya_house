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
import type {
  CreateTableInput,
  CreateTablesRangeInput,
  UpdateTableInput,
  DeleteTableInput,
} from "@/lib/validations/table";

export function useTables() {
  return useQuery({
    queryKey: queryKeys.tables.all,
    queryFn: () => listTables(),
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTableInput) => createTable(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
}

export function useCreateTablesRange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTablesRangeInput) => createTablesRange(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTableInput) => updateTable(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteTableInput) => deleteTable(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
    },
  });
}
