"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";
import { useDeleteCategory, useReorderCategories } from "@/hooks/use-categories";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteConfirmButton } from "./delete-confirm-button";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/server/actions/categories";

export function CategoryPanel({
  brandId,
  categories,
  isLoading,
  selectedCategoryId,
  onSelectCategory,
}: {
  brandId: string;
  categories: CategoryDTO[];
  isLoading: boolean;
  selectedCategoryId: string | undefined;
  onSelectCategory: (id: string) => void;
}) {
  const deleteCategory = useDeleteCategory();
  const reorderCategories = useReorderCategories();

  const move = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const orderedIds = categories.map((c) => c.id);
    [orderedIds[index], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[index],
    ];
    reorderCategories.mutate(
      { brandId, orderedIds },
      { onError: (error) => toast.error(error.message) },
    );
  };

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-medium">Categories</h2>
        <CategoryFormDialog mode="create" brandId={brandId} />
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : !categories.length ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No categories yet.
        </p>
      ) : (
        <ul className="divide-y">
          {categories.map((category, index) => (
            <li
              key={category.id}
              className={cn(
                "flex items-center gap-1 p-2",
                selectedCategoryId === category.id && "bg-muted",
              )}
            >
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUpIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === categories.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDownIcon className="size-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className="flex flex-1 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "truncate",
                    !category.isActive && "text-muted-foreground line-through",
                  )}
                >
                  {category.title}
                </span>
                <Badge variant="secondary">{category.itemCount}</Badge>
              </button>

              <div className="flex shrink-0 items-center">
                <CategoryFormDialog mode="edit" category={category} />
                <DeleteConfirmButton
                  title="Delete this category?"
                  description={
                    category.itemCount > 0
                      ? `"${category.title}" has ${category.itemCount} item(s). Deleting it will delete them too.`
                      : `"${category.title}" will be permanently removed.`
                  }
                  isPending={deleteCategory.isPending}
                  onConfirm={() =>
                    deleteCategory.mutate(
                      { id: category.id, force: category.itemCount > 0 },
                      { onError: (error) => toast.error(error.message) },
                    )
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
