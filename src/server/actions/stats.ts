"use server";

import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/dal";
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

export async function getDashboardStats(): Promise<DashboardStatsDTO> {
  await requireUser();
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
}

export type SystemStatusDTO = {
  database: { connected: boolean; brandCount: number };
  storage: StorageStatusDTO;
  brands: { id: string; slug: string; name: string; categoryCount: number; itemCount: number }[];
};

export async function getSystemStatus(): Promise<SystemStatusDTO> {
  await requireAdmin();
  const [dbResult, storage] = await Promise.all([
    prisma.brand
      .findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { categories: true } } },
      })
      .then((brands) => ({ ok: true as const, brands }))
      .catch(() => ({ ok: false as const, brands: [] })),
    getStorageStatus(),
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
    database: { connected: dbResult.ok, brandCount: dbResult.brands.length },
    storage,
    brands: brandsWithCounts,
  };
}
