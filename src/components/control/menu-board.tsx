"use client";

import { useState } from "react";
import { useBrands } from "@/hooks/use-brands";
import { useCategories } from "@/hooks/use-categories";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryPanel } from "./category-panel";
import { ItemPanel } from "./item-panel";

export function MenuBoard() {
  const { data: brands, isLoading: brandsLoading, isError: brandsError } =
    useBrands();
  const [selectedBrandId, setSelectedBrandId] = useState<string>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>();

  const activeBrandId = brands?.some((b) => b.id === selectedBrandId)
    ? selectedBrandId
    : brands?.[0]?.id;

  const { data: categories, isLoading: categoriesLoading } =
    useCategories(activeBrandId);

  const activeCategoryId = categories?.some((c) => c.id === selectedCategoryId)
    ? selectedCategoryId
    : categories?.[0]?.id;

  if (brandsLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (brandsError || !brands?.length) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Couldn&apos;t load brands. Is the database running and seeded? (
        <code>npm run db:seed</code>)
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs
        value={activeBrandId}
        onValueChange={(value) => {
          setSelectedBrandId(value);
          setSelectedCategoryId(undefined);
        }}
      >
        <TabsList>
          {brands.map((brand) => (
            <TabsTrigger key={brand.id} value={brand.id}>
              {brand.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
        <CategoryPanel
          brandId={activeBrandId!}
          categories={categories ?? []}
          isLoading={categoriesLoading}
          selectedCategoryId={activeCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
        {activeCategoryId ? (
          <ItemPanel categoryId={activeCategoryId} />
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {categoriesLoading
              ? "Loading categories…"
              : "Create a category to left adding items."}
          </div>
        )}
      </div>
    </div>
  );
}
