"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { readGuestOrderIds, readRememberedMode } from "@/lib/guest-session";

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

    // 1. A scanned table QR is the only thing in a URL that decides how someone
    //    is ordering — it's proof of where they physically are.
    if (Number.isInteger(parsedTable) && parsedTable > 0) {
      setTableNumber(parsedTable);
      setOrderMode("ON_TABLE");
      return;
    }

    // 2. Otherwise fall back to a recent pickup/delivery choice, so someone who
    //    already told us once isn't asked again on every page. Dine-in is never
    //    remembered: a table guest is sitting at the QR code, and a settled visit
    //    must not follow them into the next param-less load.
    const remembered = readRememberedMode();
    if (remembered) {
      setOrderMode(remembered, { persist: false });
    }

    // 3. Nothing scanned, nothing remembered: leave the mode unset. The guest
    //    picks pickup or delivery at checkout rather than us guessing for them.
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
