"use client";

import { useQuery } from "@tanstack/react-query";
import { getBusinessDashboard, getOrdersReport } from "@/server/actions/reports";
import type { DashboardRangeInput, OrdersReportInput } from "@/lib/validations/reports";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";

export function useBusinessDashboard(range: DashboardRangeInput) {
  return useQuery({
    queryKey: queryKeys.reports.dashboard(JSON.stringify(range)),
    queryFn: () => unwrap(getBusinessDashboard(range)),
    staleTime: 30 * 1000,
  });
}

export function useOrdersReport(filters: OrdersReportInput) {
  return useQuery({
    queryKey: queryKeys.reports.orders(JSON.stringify(filters)),
    queryFn: () => unwrap(getOrdersReport(filters)),
    staleTime: 15 * 1000,
    placeholderData: (previous) => previous,
  });
}
