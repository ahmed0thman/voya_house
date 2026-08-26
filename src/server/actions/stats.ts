"use server";

import { prisma } from "@/lib/prisma";
import { defineAction } from "@/server/define-action";
import { getStorageStatus, type StorageStatusDTO } from "@/lib/storage/r2";

export type DashboardStatsDTO = {
  totalCategories: number;
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  itemsWithoutImages: number;
  averagePrice: number;
  totalCatalogValue: number;
  perBrand: {
    brandId: string;
    brandName: string;
    categoryCount: number;
    itemCount: number;
  }[];
};

export const getDashboardStats = defineAction({
  auth: "user",
  handler: async (): Promise<DashboardStatsDTO> => {
  const [totalCategories, totalItems, availableItems, itemsWithoutImages, priceAgg, brands] =
    await Promise.all([
      prisma.category.count(),
      prisma.item.count(),
      prisma.item.count({ where: { isAvailable: true } }),
      prisma.item.count({ where: { images: { isEmpty: true } } }),
      prisma.item.aggregate({ _avg: { price: true }, _sum: { price: true } }),
      prisma.brand.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { categories: true } } },
      }),
    ]);

  const perBrand = await Promise.all(
    brands.map(async (brand) => ({
      brandId: brand.id,
      brandName: brand.name,
      categoryCount: brand._count.categories,
      itemCount: await prisma.item.count({ where: { category: { brandId: brand.id } } }),
    })),
  );

  return {
    totalCategories,
    totalItems,
    availableItems,
    unavailableItems: totalItems - availableItems,
    itemsWithoutImages,
    averagePrice: priceAgg._avg.price?.toNumber() ?? 0,
    totalCatalogValue: priceAgg._sum.price?.toNumber() ?? 0,
    perBrand,
  };
  },
});

export type SystemStatusDTO = {
  database: { connected: boolean; brandCount: number; usedBytes?: number; maxBytes: number };
  storage: StorageStatusDTO;
  brands: { id: string; slug: string; name: string; categoryCount: number; itemCount: number }[];
};

/**
 * The Postgres connection this app holds (DATABASE_URL/DIRECT_URL) can report actual
 * bytes used (`pg_database_size`), but Supabase's storage *quota* is a plan-level fact
 * only the Management API exposes, which needs a personal access token this app isn't
 * configured with — hardcoded to the project's current plan (Free = 500 MiB) instead.
 * Update this if the plan changes.
 */
const DATABASE_MAX_BYTES = 0.5 * 1024 ** 3;

export const getSystemStatus = defineAction({
  auth: "admin",
  handler: async (): Promise<SystemStatusDTO> => {
  const [dbResult, storage, dbUsedBytes] = await Promise.all([
    prisma.brand
      .findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { categories: true } } },
      })
      .then((brands) => ({ ok: true as const, brands }))
      .catch(() => ({ ok: false as const, brands: [] })),
    getStorageStatus(),
    prisma
      .$queryRaw<{ size: bigint }[]>`SELECT pg_database_size(current_database()) AS size`
      .then(([row]) => Number(row.size))
      .catch(() => undefined),
  ]);

  const brandsWithCounts = await Promise.all(
    dbResult.brands.map(async (brand) => ({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      categoryCount: brand._count.categories,
      itemCount: await prisma.item.count({ where: { category: { brandId: brand.id } } }),
    })),
  );

  return {
    database: {
      connected: dbResult.ok,
      brandCount: dbResult.brands.length,
      usedBytes: dbUsedBytes,
      maxBytes: DATABASE_MAX_BYTES,
    },
    storage,
    brands: brandsWithCounts,
  };
  },
});
