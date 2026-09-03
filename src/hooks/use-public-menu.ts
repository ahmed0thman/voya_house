"use client";

import { useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getPublicMenu } from "@/server/actions/public-menu";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";

export function usePublicMenu(brandSlug: "coffee" | "papa" | "mama") {
  // The server action resolves titles/names by locale itself, so the cache
  // key must include it too — otherwise switching languages without a full
  // page reload would keep serving the other language's cached response.
  const locale = useLocale();
  return useQuery({
    queryKey: queryKeys.publicMenu.brand(brandSlug, locale),
    queryFn: () => unwrap(getPublicMenu(brandSlug)),
    staleTime: 60 * 1000,
  });
}
