"use server";

import { prisma } from "@/lib/prisma";
import type { Item } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { requireUser } from "@/lib/dal";
import { defineAction } from "@/server/define-action";
import { resolveImageUrl, deleteObject } from "@/lib/storage/r2";
import {
  createItemSchema,
  updateItemSchema,
  deleteItemSchema,
  reorderItemsSchema,
  listItemsSchema,
} from "@/lib/validations/item";

export type ItemImageDTO = {
  /** R2 object key — send this back (not `url`) when saving `images`. */
  key: string;
  url: string;
};

export type ItemDTO = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  images: ItemImageDTO[];
  isAvailable: boolean;
  sortOrder: number;
};

function toItemDTO(item: Item): ItemDTO {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    price: item.price.toNumber(),
    images: item.images.map((key) => ({ key, url: resolveImageUrl(key) })),
    isAvailable: item.isAvailable,
    sortOrder: item.sortOrder,
  };
}

/** Best-effort — a failed cleanup shouldn't block the DB change that already succeeded. */
export async function deleteImagesBestEffort(keys: string[]): Promise<void> {
  await requireUser();
  await Promise.allSettled(keys.map((key) => deleteObject(key)));
}

export type OrderableItemDTO = {
  id: string;
  name: string;
  price: number;
  brandSlug: string;
  categoryTitle: string;
};

/**
 * Everything staff can put on a ticket, flat and pre-sorted. The whole menu is
 * a few dozen rows, so it ships in one query and gets filtered in the browser —
 * far better than a round trip per keystroke while a customer waits on the phone.
 */
export const listOrderableItems = defineAction({
  auth: "user",
  handler: async (): Promise<OrderableItemDTO[]> => {
  const items = await prisma.item.findMany({
    where: { isAvailable: true },
    include: { category: { include: { brand: true } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price.toNumber(),
    brandSlug: item.category.brand.slug,
    categoryTitle: item.category.title,
  }));
  },
});

export const listItems = defineAction({
  auth: "user",
  schema: listItemsSchema,
  handler: async (categoryId): Promise<ItemDTO[]> => {
    const items = await prisma.item.findMany({
      where: { categoryId },
      orderBy: { sortOrder: "asc" },
    });
    return items.map(toItemDTO);
  },
});

export const createItem = defineAction({
  auth: "user",
  schema: createItemSchema,
  handler: async (input): Promise<ItemDTO> => {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) throw new ActionError("Category not found.", "NOT_FOUND");

  const item = await prisma.$transaction(async (tx) => {
    const last = await tx.item.findFirst({
      where: { categoryId: input.categoryId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    return tx.item.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        description: input.description || null,
        price: input.price,
        images: input.images,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  });

  return toItemDTO(item);
  },
});

export const updateItem = defineAction({
  auth: "user",
  schema: updateItemSchema,
  handler: async (input): Promise<ItemDTO> => {
  const existing = await prisma.item.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("Item not found.", "NOT_FOUND");

  if (input.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) throw new ActionError("Category not found.", "NOT_FOUND");
  }

  const item = await prisma.item.update({
    where: { id: input.id },
    data: {
      categoryId: input.categoryId,
      name: input.name,
      description:
        input.description === undefined ? undefined : input.description || null,
      price: input.price,
      images: input.images,
      isAvailable: input.isAvailable,
    },
  });

  if (input.images) {
    const nextKeys = new Set(input.images);
    const droppedKeys = existing.images.filter((key) => !nextKeys.has(key));
    // Awaited (not fire-and-forget) since serverless runtimes don't guarantee
    // background work continues after the response is sent.
    if (droppedKeys.length > 0) await deleteImagesBestEffort(droppedKeys);
  }

  return toItemDTO(item);
  },
});

export const deleteItem = defineAction({
  auth: "user",
  schema: deleteItemSchema,
  handler: async (input): Promise<{ id: string }> => {
    const existing = await prisma.item.findUnique({ where: { id: input.id } });
    if (!existing) throw new ActionError("Item not found.", "NOT_FOUND");

    await prisma.item.delete({ where: { id: input.id } });
    if (existing.images.length > 0) {
      await deleteImagesBestEffort(existing.images);
    }
    return { id: input.id };
  },
});

export const reorderItems = defineAction({
  auth: "user",
  schema: reorderItemsSchema,
  handler: async (input): Promise<{ categoryId: string; orderedIds: string[] }> => {
  const items = await prisma.item.findMany({
    where: { categoryId: input.categoryId },
    select: { id: true },
  });
  const knownIds = new Set(items.map((i) => i.id));
  const validOrderedIds = input.orderedIds.filter((id) => knownIds.has(id));

  if (validOrderedIds.length !== knownIds.size) {
    throw new ActionError(
      "Reorder list must include exactly the items currently in this category.",
      "VALIDATION",
    );
  }

  await prisma.$transaction(
    validOrderedIds.map((id, index) =>
      prisma.item.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  return { categoryId: input.categoryId, orderedIds: validOrderedIds };
  },
});
