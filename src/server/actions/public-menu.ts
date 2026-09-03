"use server";

import { getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/storage/r2";
import { defineAction } from "@/server/define-action";
import { brandSlugSchema } from "@/lib/validations/menu";

export type PublicMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type PublicMenuCategory = {
  id: string;
  title: string;
  items: PublicMenuItem[];
};

/**
 * Unauthenticated on purpose — this feeds the public landing page menu
 * booklets, which guests browse without ever logging in. Only active
 * categories and available items are returned; hidden/86'd stock never
 * reaches the client.
 */
export const getPublicMenu = defineAction({
  auth: "public",
  schema: brandSlugSchema,
  handler: async (brandSlug): Promise<PublicMenuCategory[]> => {
  const locale = await getLocale();

  const categories = await prisma.category.findMany({
    where: { brand: { slug: brandSlug }, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    title: (locale === "ar" && category.titleAr) || category.title,
    items: category.items.map((item) => ({
      id: item.id,
      name: (locale === "ar" && item.nameAr) || item.name,
      description: (locale === "ar" && item.descriptionAr) || item.description || "",
      price: item.price.toNumber(),
      image: item.images[0] ? resolveImageUrl(item.images[0]) : "",
    })),
  }));
  },
});
