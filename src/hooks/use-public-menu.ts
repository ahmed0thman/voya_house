"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicMenu } from "@/server/actions/public-menu";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";

export function usePublicMenu(brandSlug: "coffee" | "papa" | "mama") {
  return useQuery({
    queryKey: queryKeys.publicMenu.brand(brandSlug),
    queryFn: () => unwrap(getPublicMenu(brandSlug)),
    staleTime: 60 * 1000,
  });
}
