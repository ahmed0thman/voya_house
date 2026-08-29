"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  listGuestOrders,
  listSessionOrdersForTable,
  type OrderDTO,
} from "@/server/actions/orders";
import { validateOfferCode } from "@/server/actions/offers";
import { queryKeys } from "@/lib/query-keys";
import { unwrap } from "@/lib/action-result";
import { useCartStore } from "@/store/useCartStore";
import type { CreateOrderInput } from "@/lib/validations/order";

/** Polls so a ticket's status (e.g. moved to "Preparing") updates on its own while the guest waits. */
const POLL_INTERVAL_MS = 15_000;

/**
 * Every ticket in the table's currently open session — stays visible (even once
 * served) until staff settle the table. Disabled until a table is actually
 * known: a guest who hasn't scanned or picked one yet has no session to poll.
 */
export function useTableOrders(tableNumber: number | null) {
  return useQuery({
    queryKey: queryKeys.orders.table(tableNumber ?? 0),
    queryFn: () => unwrap(listSessionOrdersForTable(tableNumber!)),
    enabled: tableNumber !== null,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

/** The pickup/delivery equivalent — no table to key off, so the browser's own list of ticket ids drives it. */
export function useGuestTicketOrders(orderIds: string[]) {
  return useQuery({
    queryKey: queryKeys.orders.guest(orderIds),
    queryFn: () => unwrap(listGuestOrders(orderIds)),
    enabled: orderIds.length > 0,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

/**
 * The one hook the guest UI should use: whichever list of "my orders" is right
 * for how this guest is ordering. Both branches are always mounted so the query
 * keys stay stable across a mode switch at checkout — the inactive one is just
 * disabled and costs nothing.
 */
export function useGuestOrders() {
  const orderMode = useCartStore((s) => s.orderMode);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const guestOrderIds = useCartStore((s) => s.guestOrderIds);

  const tableQuery = useTableOrders(tableNumber);
  const ticketQuery = useGuestTicketOrders(guestOrderIds);

  return orderMode === "ON_TABLE" ? tableQuery : ticketQuery;
}

/** A one-off "Apply" click, not a background query — the real check happens again in `createOrder`. */
export function useValidateOfferCode() {
  return useMutation({
    mutationFn: (code: string) => unwrap(validateOfferCode(code)),
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const trackGuestOrder = useCartStore((s) => s.trackGuestOrder);
  const guestOrderIds = useCartStore((s) => s.guestOrderIds);

  return useMutation({
    mutationFn: (input: CreateOrderInput) => unwrap(createOrder(input)),
    onSuccess: (order, variables) => {
      if (variables.type === "ON_TABLE") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.table(variables.tableNumber),
        });
        return;
      }
      // Remembering the id widens the tracked set, which moves the status view
      // onto a new (id-derived) query key. Seed that key with what we already
      // have so the guest sees their ticket at once rather than a blank sheet
      // until the next poll lands.
      const previous = queryClient.getQueryData<OrderDTO[]>(queryKeys.orders.guest(guestOrderIds));
      const nextIds = trackGuestOrder(order.id);
      queryClient.setQueryData(queryKeys.orders.guest(nextIds), [
        order,
        ...(previous ?? []).filter((o) => o.id !== order.id),
      ]);
    },
  });
}
