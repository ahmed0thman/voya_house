"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { readGuestOrderIds, readOrderContext } from "@/lib/guest-session";

/** `?pickup=true`, `?pickup=1` and a bare `?pickup` all mean the same thing; only an explicit no is a no. */
function isFlagSet(value: string | null): boolean {
  if (value === null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "false" && normalized !== "0" && normalized !== "no";
}

function OrderModeReader() {
  const searchParams = useSearchParams();
  const setTableNumber = useCartStore((s) => s.setTableNumber);
  const setOrderMode = useCartStore((s) => s.setOrderMode);
  const setGuestOrderIds = useCartStore((s) => s.setGuestOrderIds);

  useEffect(() => {
    // Tickets this browser placed for pickup/delivery — the only way those
    // guests can follow an order they have no table number for.
    setGuestOrderIds(readGuestOrderIds());

    const tableParam =
      searchParams.get("table") ||
      searchParams.get("t") ||
      searchParams.get("tableNumber") ||
      searchParams.get("table_number") ||
      searchParams.get("tbl");
    const parsedTable = tableParam ? Number(tableParam) : NaN;

    // 1. A scanned table QR wins outright — it's the strongest signal of where the guest is.
    if (Number.isInteger(parsedTable) && parsedTable > 0) {
      setTableNumber(parsedTable);
      setOrderMode("ON_TABLE");
      return;
    }

    // 2. Explicit off-premise links. Pickup is opt-in via param; delivery is the
    //    bare-URL default, so its param exists only to override a remembered mode.
    if (isFlagSet(searchParams.get("pickup")) || isFlagSet(searchParams.get("takeaway"))) {
      setOrderMode("TAKEAWAY");
      return;
    }
    if (isFlagSet(searchParams.get("delivery"))) {
      setOrderMode("DELIVERY");
      return;
    }

    // 3. No param: keep whatever the guest was last doing, if it's still recent —
    //    an in-house guest who taps a plain internal link stays at their table.
    const remembered = readOrderContext();
    if (remembered) {
      if (remembered.mode === "ON_TABLE" && remembered.tableNumber) {
        setTableNumber(remembered.tableNumber);
      }
      setOrderMode(remembered.mode, { persist: false });
      return;
    }

    // 4. Nothing to go on — someone who found the site on their own is ordering delivery.
    setOrderMode("DELIVERY", { persist: false });
  }, [searchParams, setTableNumber, setOrderMode, setGuestOrderIds]);

  return null;
}

export default function OrderModeSync() {
  return (
    <Suspense fallback={null}>
      <OrderModeReader />
    </Suspense>
  );
}
