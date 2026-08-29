"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BellRingIcon } from "lucide-react";
import { useTableSessions, useOrdersByType } from "@/hooks/use-orders";
import {
  mergeNotifications,
  readNotifications,
  readSeenOrderIds,
  writeNotifications,
  writeSeenOrderIds,
  type NotificationTab,
  type OrderNotification,
} from "@/lib/notifications";

export type { NotificationTab } from "@/lib/notifications";

export function describeNotification(entry: OrderNotification): string {
  if (entry.tab === "table") return `Table ${entry.tableNumber}`;
  const kind = entry.tab === "takeaway" ? "Takeaway" : "Delivery";
  return entry.customerName ? `${kind} — ${entry.customerName}` : kind;
}

function collectIncoming(
  tableSessions: ReturnType<typeof useTableSessions>["data"],
  takeaway: ReturnType<typeof useOrdersByType>["data"],
  delivery: ReturnType<typeof useOrdersByType>["data"],
): Omit<OrderNotification, "read">[] {
  const incoming: Omit<OrderNotification, "read">[] = [];

  for (const session of tableSessions ?? []) {
    for (const order of session.orders) {
      if (order.status !== "RECEIVED") continue;
      incoming.push({
        id: order.id,
        tab: "table",
        tableNumber: session.tableNumber,
        customerName: order.customerName,
        createdAt: order.createdAt,
      });
    }
  }

  const standalone: [NotificationTab, typeof takeaway][] = [
    ["takeaway", takeaway],
    ["delivery", delivery],
  ];
  for (const [tab, orders] of standalone) {
    for (const order of orders ?? []) {
      if (order.status !== "RECEIVED") continue;
      incoming.push({
        id: order.id,
        tab,
        tableNumber: null,
        customerName: order.customerName,
        createdAt: order.createdAt,
      });
    }
  }

  return incoming;
}

/**
 * The single owner of staff notifications. Watches all three order types at
 * once — whichever page is open — and records every ticket that arrives.
 *
 * Two ideas that are easy to conflate: the persisted list is "orders this
 * browser has been told about", while the toast is "an order arrived while you
 * were sitting here". A fresh browser therefore inherits unread items (they
 * genuinely haven't been seen) without being shouted at for a backlog that
 * predates the session.
 *
 * The list is mirrored in a ref because merging has to read the current value
 * without the effect depending on it — and because firing a toast is a side
 * effect, which must never live inside a state updater: React is free to invoke
 * updaters more than once, and doing so there double-alerts.
 */
export function useOrderNotifications(onOpenOrder?: (entry: OrderNotification) => void) {
  const tableSessions = useTableSessions();
  const takeaway = useOrdersByType("TAKEAWAY");
  const delivery = useOrdersByType("DELIVERY");

  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const listRef = useRef<OrderNotification[]>([]);
  const hydrated = useRef(false);
  /** `false` until the first poll has landed, so a page load never toasts a backlog. */
  const baselineSet = useRef(false);
  /**
   * Toasts from the previous batch that might still be sitting on screen. A new
   * order shouldn't pile its alert on top of ones staff hasn't acted on yet —
   * each new arrival clears whatever's still showing first, so only the latest
   * is ever up. Anything that already timed out or was dismissed by hand is
   * pruned out via the toast's own callbacks, so this never grows unbounded.
   */
  const activeToastIds = useRef<Set<string | number>>(new Set());
  /** Dedup authority for `mergeNotifications` — see `readSeenOrderIds` for why this is separate from `listRef`. */
  const seenIdsRef = useRef<Set<string>>(new Set());

  const commit = useCallback((next: OrderNotification[]) => {
    const saved = writeNotifications(next);
    listRef.current = saved;
    setNotifications(saved);
  }, []);

  const markAllRead = useCallback(() => {
    commit(listRef.current.map((entry) => ({ ...entry, read: true })));
  }, [commit]);

  const markRead = useCallback(
    (id: string) => {
      commit(listRef.current.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)));
    },
    [commit],
  );

  /** Opening from a toast should also clear it from the bell — same act, one place. */
  const openRef = useRef<((entry: OrderNotification) => void) | undefined>(undefined);
  useEffect(() => {
    openRef.current = onOpenOrder
      ? (entry) => {
          markRead(entry.id);
          onOpenOrder(entry);
        }
      : undefined;
  }, [onOpenOrder, markRead]);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = readNotifications();
    listRef.current = stored;
    setNotifications(stored);
    // The display list may have aged entries out already; folding their ids in
    // too keeps dedup working across a reload even before `readSeenOrderIds`
    // catches up on its own (e.g. an older browser that predates this key).
    seenIdsRef.current = new Set([...readSeenOrderIds(), ...stored.map((entry) => entry.id)]);
  }, []);

  useEffect(() => {
    if (!tableSessions.data || !takeaway.data || !delivery.data) return;

    const incoming = collectIncoming(tableSessions.data, takeaway.data, delivery.data);
    const { merged, added, nextSeenIds } = mergeNotifications(
      listRef.current,
      seenIdsRef.current,
      incoming,
    );

    if (added.length > 0) {
      commit(merged);
      seenIdsRef.current = new Set(nextSeenIds);
      writeSeenOrderIds(nextSeenIds);
      if (baselineSet.current) {
        // Clear whatever's still on screen from the last batch before raising
        // the new one, so staff are never looking at a growing pile of alerts.
        for (const id of activeToastIds.current) toast.dismiss(id);
        activeToastIds.current.clear();

        for (const entry of added) {
          const id = toast(`New order — ${describeNotification(entry)}`, {
            icon: <BellRingIcon className="size-4" />,
            duration: 12_000,
            className: "border-2 border-destructive font-medium",
            action: { label: "View", onClick: () => openRef.current?.(entry) },
            onAutoClose: () => activeToastIds.current.delete(id),
            onDismiss: () => activeToastIds.current.delete(id),
          });
          activeToastIds.current.add(id);
        }
      }
    }
    baselineSet.current = true;
  }, [tableSessions.data, takeaway.data, delivery.data, commit]);

  return {
    notifications,
    unreadCount: notifications.filter((entry) => !entry.read).length,
    markAllRead,
    markRead,
  };
}
