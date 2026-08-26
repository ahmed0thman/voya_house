"use server";

import { prisma } from "@/lib/prisma";
import { defineAction } from "@/server/define-action";

export type BrandDTO = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

/** Read-only for now — brand management (rename/create/reorder) isn't in scope yet. */
export const listBrands = defineAction({
  auth: "user",
  handler: async (): Promise<BrandDTO[]> => {
    const brands = await prisma.brand.findMany({ orderBy: { sortOrder: "asc" } });
    return brands.map((brand) => ({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      sortOrder: brand.sortOrder,
    }));
  },
});
