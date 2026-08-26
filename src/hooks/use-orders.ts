"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOpenTableSessions,
  listOrdersByType,
  editOrder,
  updateOrderStatus,
  rejectOrder,
  settleTableSession,
} from "@/server/actions/orders";
import { listOrderableItems } from "@/server/actions/items";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import type {
  EditOrderInput,
  UpdateOrderStatusInput,
  RejectOrderInput,
  SettleTableSessionInput,
} from "@/lib/validations/order";

/** Kitchen queue — polled so new tickets show up without a manual refresh. */
const POLL_INTERVAL_MS = 10_000;

export function useTableSessions() {
  return useQuery({
    queryKey: queryKeys.orders.sessions,
    queryFn: () => unwrap(listOpenTableSessions()),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useOrdersByType(type: "TAKEAWAY" | "DELIVERY") {
  return useQuery({
    queryKey: queryKeys.orders.byType(type),
    queryFn: () => unwrap(listOrdersByType(type)),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

/** The menu barely moves during a shift, so this is fetched once and reused. */
export function useOrderableItems(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.items.orderable,
    queryFn: () => unwrap(listOrderableItems()),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEditOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EditOrderInput) => unwrap(editOrder(input)),
    onSuccess: (order) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.byType(order.type === "DELIVERY" ? "DELIVERY" : "TAKEAWAY"),
      });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateOrderStatusInput) => unwrap(updateOrderStatus(input)),
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
    mutationFn: (input: RejectOrderInput) => unwrap(rejectOrder(input)),
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
    mutationFn: (input: SettleTableSessionInput) => unwrap(settleTableSession(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.sessions });
    },
  });
}
