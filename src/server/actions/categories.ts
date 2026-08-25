"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { requireUser } from "@/lib/dal";
import { slugify } from "@/lib/slug";
import { deleteImagesBestEffort } from "@/server/actions/items";
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  reorderCategoriesSchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type DeleteCategoryInput,
  type ReorderCategoriesInput,
} from "@/lib/validations/category";

export type CategoryDTO = {
  id: string;
  brandId: string;
  title: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  itemCount: number;
};

function toCategoryDTO(
  category: Prisma.CategoryGetPayload<{ include: { _count: { select: { items: true } } } }>,
): CategoryDTO {
  return {
    id: category.id,
    brandId: category.brandId,
    title: category.title,
    slug: category.slug,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
    itemCount: category._count.items,
  };
}

const MAX_SLUG_ATTEMPTS = 25;

async function generateUniqueCategorySlug(
  tx: Prisma.TransactionClient,
  brandId: string,
  title: string,
): Promise<string> {
  const base = slugify(title) || "category";

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await tx.category.findUnique({
      where: { brandId_slug: { brandId, slug: candidate } },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  throw new ActionError(
    "Could not generate a unique slug for this category title.",
    "CONFLICT",
  );
}

export async function listCategories(brandId?: string): Promise<CategoryDTO[]> {
  await requireUser();
  const categories = await prisma.category.findMany({
    where: brandId ? { brandId } : undefined,
    include: { _count: { select: { items: true } } },
    orderBy: [{ brandId: "asc" }, { sortOrder: "asc" }],
  });
  return categories.map(toCategoryDTO);
}

export async function createCategory(
  rawInput: CreateCategoryInput,
): Promise<CategoryDTO> {
  await requireUser();
  const input = createCategorySchema.parse(rawInput);

  const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
  if (!brand) throw new ActionError("Brand not found.", "NOT_FOUND");

  const category = await prisma.$transaction(async (tx) => {
    const slug = await generateUniqueCategorySlug(tx, input.brandId, input.title);
    const last = await tx.category.findFirst({
      where: { brandId: input.brandId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    return tx.category.create({
      data: {
        brandId: input.brandId,
        title: input.title,
        slug,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
      include: { _count: { select: { items: true } } },
    });
  });

  return toCategoryDTO(category);
}

export async function updateCategory(
  rawInput: UpdateCategoryInput,
): Promise<CategoryDTO> {
  await requireUser();
  const input = updateCategorySchema.parse(rawInput);

  const existing = await prisma.category.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("Category not found.", "NOT_FOUND");

  const category = await prisma.category.update({
    where: { id: input.id },
    data: {
      title: input.title,
      isActive: input.isActive,
    },
    include: { _count: { select: { items: true } } },
  });

  return toCategoryDTO(category);
}

export async function deleteCategory(rawInput: DeleteCategoryInput): Promise<{ id: string }> {
  await requireUser();
  const input = deleteCategorySchema.parse(rawInput);

  const existing = await prisma.category.findUnique({
    where: { id: input.id },
    include: { _count: { select: { items: true } } },
  });
  if (!existing) throw new ActionError("Category not found.", "NOT_FOUND");

  if (existing._count.items > 0 && !input.force) {
    throw new ActionError(
      `This category still has ${existing._count.items} item(s). Delete or move them first, or pass force to delete everything.`,
      "CONFLICT",
    );
  }

  let orphanedImageKeys: string[] = [];

  await prisma.$transaction(async (tx) => {
    if (input.force) {
      const items = await tx.item.findMany({
        where: { categoryId: input.id },
        select: { images: true },
      });
      orphanedImageKeys = items.flatMap((item) => item.images);
      await tx.item.deleteMany({ where: { categoryId: input.id } });
    }
    await tx.category.delete({ where: { id: input.id } });
  });

  if (orphanedImageKeys.length > 0) {
    await deleteImagesBestEffort(orphanedImageKeys);
  }

  return { id: input.id };
}

export async function reorderCategories(
  rawInput: ReorderCategoriesInput,
): Promise<{ brandId: string; orderedIds: string[] }> {
  await requireUser();
  const input = reorderCategoriesSchema.parse(rawInput);

  const categories = await prisma.category.findMany({
    where: { brandId: input.brandId },
    select: { id: true },
  });
  const knownIds = new Set(categories.map((c) => c.id));
  const validOrderedIds = input.orderedIds.filter((id) => knownIds.has(id));

  if (validOrderedIds.length !== knownIds.size) {
    throw new ActionError(
      "Reorder list must include exactly the categories currently in this brand.",
      "VALIDATION",
    );
  }

  await prisma.$transaction(
    validOrderedIds.map((id, index) =>
      prisma.category.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  return { brandId: input.brandId, orderedIds: validOrderedIds };
}
