"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { BellRingIcon } from "lucide-react";
import { useTableSessions, useOrdersByType } from "@/hooks/use-orders";

export type OrderTab = "table" | "takeaway" | "delivery";

type IncomingOrder = { tab: OrderTab; tableNumber: number | null; customerName: string | null };

/**
 * Watches every order type at once — regardless of which tab is currently
 * open — and fires a high-visibility toast the moment a new ticket lands.
 * Runs its own copies of the same polling queries the tab panels use;
 * react-query dedupes by key so this doesn't add extra network traffic.
 */
export function useNewOrderNotifications(onJump: (tab: OrderTab, tableNumber?: number) => void) {
  const tableSessions = useTableSessions();
  const takeaway = useOrdersByType("TAKEAWAY");
  const delivery = useOrdersByType("DELIVERY");

  // `null` means "haven't established a baseline yet" — we never notify for
  // orders that were already sitting there when the page loaded.
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!tableSessions.data || !takeaway.data || !delivery.data) return;

    const current = new Map<string, IncomingOrder>();
    for (const session of tableSessions.data) {
      for (const order of session.orders) {
        if (order.status === "RECEIVED") {
          current.set(order.id, {
            tab: "table",
            tableNumber: session.tableNumber,
            customerName: null,
          });
        }
      }
    }
    for (const order of takeaway.data) {
      if (order.status === "RECEIVED") {
        current.set(order.id, { tab: "takeaway", tableNumber: null, customerName: order.customerName });
      }
    }
    for (const order of delivery.data) {
      if (order.status === "RECEIVED") {
        current.set(order.id, { tab: "delivery", tableNumber: null, customerName: order.customerName });
      }
    }

    if (seenIds.current === null) {
      seenIds.current = new Set(current.keys());
      return;
    }

    for (const [id, incoming] of current) {
      if (!seenIds.current.has(id)) {
        notifyNewOrder(incoming, onJump);
      }
    }
    seenIds.current = new Set(current.keys());
  }, [tableSessions.data, takeaway.data, delivery.data, onJump]);
}

function notifyNewOrder(incoming: IncomingOrder, onJump: (tab: OrderTab, tableNumber?: number) => void) {
  const who = incoming.customerName ? ` — ${incoming.customerName}` : "";
  const title =
    incoming.tab === "table"
      ? `New order — Table ${incoming.tableNumber}`
      : incoming.tab === "takeaway"
        ? `New takeaway order${who}`
        : `New delivery order${who}`;

  toast(title, {
    icon: <BellRingIcon className="size-4" />,
    duration: 12_000,
    className: "border-2 border-destructive font-medium",
    action: {
      label: "View",
      onClick: () => onJump(incoming.tab, incoming.tableNumber ?? undefined),
    },
  });
}
