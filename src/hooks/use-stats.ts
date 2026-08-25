"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getSystemStatus } from "@/server/actions/stats";
import { queryKeys } from "@/lib/query-keys";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.stats.dashboard,
    queryFn: () => getDashboardStats(),
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: queryKeys.stats.system,
    queryFn: () => getSystemStatus(),
  });
}
