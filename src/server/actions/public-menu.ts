"use server";

import { prisma } from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/storage/r2";

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
export async function getPublicMenu(brandSlug: string): Promise<PublicMenuCategory[]> {
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
    title: category.title,
    items: category.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: item.price.toNumber(),
      image: item.images[0] ? resolveImageUrl(item.images[0]) : "",
    })),
  }));
}
