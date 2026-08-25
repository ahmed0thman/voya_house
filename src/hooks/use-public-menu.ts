"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicMenu } from "@/server/actions/public-menu";
import { queryKeys } from "@/lib/query-keys";

export function usePublicMenu(brandSlug: "coffee" | "papa" | "mama") {
  return useQuery({
    queryKey: queryKeys.publicMenu.brand(brandSlug),
    queryFn: () => getPublicMenu(brandSlug),
    staleTime: 60 * 1000,
  });
}
