"use client";

import { useQuery } from "@tanstack/react-query";
import { listBrands } from "@/server/actions/brands";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: () => unwrap(listBrands()),
    staleTime: 5 * 60 * 1000,
  });
}
