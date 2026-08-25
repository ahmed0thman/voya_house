"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOpenTableSessions,
  listOrdersByType,
  updateOrderStatus,
  rejectOrder,
  settleTableSession,
} from "@/server/actions/orders";
import { queryKeys } from "@/lib/query-keys";
import type {
  UpdateOrderStatusInput,
  RejectOrderInput,
  SettleTableSessionInput,
} from "@/lib/validations/order";

/** Kitchen queue — polled so new tickets show up without a manual refresh. */
const POLL_INTERVAL_MS = 10_000;

export function useTableSessions() {
  return useQuery({
    queryKey: queryKeys.orders.sessions,
    queryFn: () => listOpenTableSessions(),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useOrdersByType(type: "TAKEAWAY" | "DELIVERY") {
  return useQuery({
    queryKey: queryKeys.orders.byType(type),
    queryFn: () => listOrdersByType(type),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrderStatusInput) => updateOrderStatus(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byType("TAKEAWAY") });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byType("DELIVERY") });
    },
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RejectOrderInput) => rejectOrder(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.sessions });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byType("TAKEAWAY") });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byType("DELIVERY") });
    },
  });
}

export function useSettleTableSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SettleTableSessionInput) => settleTableSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.sessions });
    },
  });
}
