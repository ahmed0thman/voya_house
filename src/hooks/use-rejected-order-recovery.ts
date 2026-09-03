"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/useCartStore";
import type { OrderDTO } from "@/server/actions/orders";

const STORAGE_KEY = "voya_restored_rejections";

function getRestoredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveRestoredIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Watches the guest's own tickets for a staff rejection and moves that
 * ticket's items back into the live cart so they can adjust and resend.
 * Tracked in localStorage (not a ref) so a rejection that happens while the
 * guest's tab is closed still gets recovered on their next visit — this
 * only ever needs to fire once per order, ever, for this browser.
 */
export function useRejectedOrderRecovery(orders: OrderDTO[]) {
  const t = useTranslations("cart.rejected");
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const rejected = orders.filter((o) => o.status === "REJECTED");
    if (rejected.length === 0) return;

    const restored = getRestoredIds();
    let changed = false;

    for (const order of rejected) {
      if (restored.has(order.id)) continue;
      changed = true;
      restored.add(order.id);

      let restoredAny = false;
      for (const item of order.items) {
        if (item.catalogItemId) {
          addItem(
            {
              id: item.catalogItemId,
              name: item.name,
              price: item.price,
              image: item.image ?? undefined,
              brandId: item.brandSlug as "coffee" | "papa" | "mama",
            },
            item.quantity,
          );
          restoredAny = true;
        }
      }

      toast.error(
        order.rejectionReason ? t("toastReason", { reason: order.rejectionReason }) : t("toastGeneric"),
        {
          description: restoredAny ? t("toastDescription") : undefined,
          duration: 10_000,
        },
      );
    }

    if (changed) saveRestoredIds(restored);
  }, [orders, addItem, t]);
}
