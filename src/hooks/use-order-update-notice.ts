"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { OrderDTO } from "@/server/actions/orders";

/** What the guest actually agreed to: the lines and what they owe. */
function contentSignature(order: OrderDTO): string {
  const lines = order.items
    .map((item) => `${item.catalogItemId ?? item.name}:${item.quantity}:${item.price}`)
    .sort()
    .join("|");
  return `${lines}#${order.totalPrice}`;
}

/**
 * Staff can amend a live takeaway/delivery ticket, and the guest's next poll
 * would otherwise swap the contents out from under them with no explanation.
 * Compares each ticket against what this session last saw, so the first sighting
 * is silent and only a genuine change speaks up.
 *
 * Rejections are excluded — those get their own, more specific notice.
 */
export function useOrderUpdateNotice(orders: OrderDTO[]) {
  const seen = useRef(new Map<string, string>());

  useEffect(() => {
    for (const order of orders) {
      if (order.status === "REJECTED") continue;

      const signature = contentSignature(order);
      const previous = seen.current.get(order.id);
      seen.current.set(order.id, signature);

      if (previous !== undefined && previous !== signature) {
        toast("Your order was updated by our team", {
          description: "Check the items and total below — call us if anything looks wrong.",
          duration: 10_000,
        });
      }
    }
  }, [orders]);
}
