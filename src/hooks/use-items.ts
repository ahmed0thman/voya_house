"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listItems,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
} from "@/server/actions/items";
import { queryKeys } from "@/lib/query-keys";
import type {
  CreateItemInput,
  UpdateItemInput,
  DeleteItemInput,
  ReorderItemsInput,
} from "@/lib/validations/item";

export function useItems(categoryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.items.list(categoryId ?? ""),
    queryFn: () => listItems(categoryId as string),
    enabled: Boolean(categoryId),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      // categories carry an `itemCount` that just changed too
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.system });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateItemInput) => updateItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteItemInput) => deleteItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      // categories carry an `itemCount` that just changed too
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.system });
    },
  });
}

export function useReorderItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderItemsInput) => reorderItems(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    },
  });
}
