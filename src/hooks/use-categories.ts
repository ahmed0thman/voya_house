"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/server/actions/categories";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  DeleteCategoryInput,
  ReorderCategoriesInput,
} from "@/lib/validations/category";

export function useCategories(brandId?: string) {
  return useQuery({
    queryKey: queryKeys.categories.list(brandId),
    queryFn: () => unwrap(listCategories(brandId)),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => unwrap(createCategory(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.system });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => unwrap(updateCategory(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteCategoryInput) => unwrap(deleteCategory(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.system });
    },
  });
}

export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderCategoriesInput) => unwrap(reorderCategories(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
