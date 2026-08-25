"use client";

import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { toast } from "sonner";
import { useDeleteItem, useItems, useReorderItems, useUpdateItem } from "@/hooks/use-items";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemFormDialog } from "./item-form-dialog";
import { DeleteConfirmButton } from "./delete-confirm-button";
import { formatPrice } from "@/constants/config";

export function ItemPanel({ categoryId }: { categoryId: string }) {
  const { data: items, isLoading } = useItems(categoryId);
  const deleteItem = useDeleteItem();
  const reorderItems = useReorderItems();
  const updateItem = useUpdateItem();

  const move = (index: number, direction: -1 | 1) => {
    if (!items) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const orderedIds = items.map((i) => i.id);
    [orderedIds[index], orderedIds[targetIndex]] = [
      orderedIds[targetIndex],
      orderedIds[index],
    ];
    reorderItems.mutate(
      { categoryId, orderedIds },
      { onError: (error) => toast.error(error.message) },
    );
  };

  return (
    <div className="rounded-xl border">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-medium">Items</h2>
        <ItemFormDialog mode="create" categoryId={categoryId} />
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !items?.length ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No items in this category yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Item</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col">
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
                      disabled={index === items.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDownIcon className="size-3.5" />
                    </button>
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-2.5">
                    {item.images[0] && (
                      <div className="relative size-8 shrink-0 overflow-hidden rounded-md border">
                        <Image
                          src={item.images[0].url}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="max-w-xs truncate text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatPrice(item.price)}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={(checked) =>
                      updateItem.mutate(
                        { id: item.id, isAvailable: checked },
                        { onError: (error) => toast.error(error.message) },
                      )
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <ItemFormDialog mode="edit" item={item} />
                    <DeleteConfirmButton
                      title="Delete this item?"
                      description={`"${item.name}" will be permanently removed.`}
                      isPending={deleteItem.isPending}
                      onConfirm={() =>
                        deleteItem.mutate(
                          { id: item.id },
                          { onError: (error) => toast.error(error.message) },
                        )
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
