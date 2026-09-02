"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import {
  forgetTableSession,
  readGuestOrderIds,
  readRememberedMode,
  readTableSession,
} from "@/lib/guest-session";
import { resumeTableSession } from "@/server/actions/orders";
import { unwrap } from "@/lib/action-result";

/**
 * Asks the server whether a remembered visit is still open. A settled or
 * unknown session is dropped here and now — that check is the whole reason
 * keeping a table is safe. A failed *request* is not an answer, though, so a
 * hiccup leaves the stored visit alone to be retried on the next load.
 */
async function resumeStoredSession(sessionId: string): Promise<{ tableNumber: number } | null> {
  try {
    const session = await unwrap(resumeTableSession(sessionId));
    if (!session) forgetTableSession();
    return session;
  } catch {
    return null;
  }
}

function OrderModeReader() {
  const searchParams = useSearchParams();
  const setTableNumber = useCartStore((s) => s.setTableNumber);
  const setOrderMode = useCartStore((s) => s.setOrderMode);
  const setGuestOrderIds = useCartStore((s) => s.setGuestOrderIds);

  useEffect(() => {
    let cancelled = false;

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
    const stored = readTableSession();

    // 1. A scanned table QR is the only thing in a URL that decides how someone
    //    is ordering — it's proof of where they physically are, and it outranks
    //    any visit this browser was still holding. Scanning a *different* table
    //    means they've moved, so the old visit goes rather than lingering to
    //    win some later load that arrives without a param.
    if (Number.isInteger(parsedTable) && parsedTable > 0) {
      if (stored && stored.tableNumber !== parsedTable) forgetTableSession();
      setTableNumber(parsedTable, { confirmed: true });
      setOrderMode("ON_TABLE");
      return;
    }

    void (async () => {
      // 2. Nothing scanned: rejoin the dine-in visit this browser last ordered
      //    on, as long as the server still calls it open. That's what survives a
      //    refresh — the table comes back, and with it the guest's live tickets.
      if (stored) {
        const session = await resumeStoredSession(stored.sessionId);
        if (cancelled) return;
        if (session) {
          setTableNumber(session.tableNumber, { confirmed: true });
          setOrderMode("ON_TABLE", { persist: false });
          return;
        }
      }

      // 3. No open visit to rejoin, so fall back to a recent pickup/delivery
      //    choice — someone who already told us once isn't asked again.
      const remembered = readRememberedMode();
      if (remembered && !cancelled) {
        setOrderMode(remembered, { persist: false });
      }

      // 4. Nothing scanned, nothing to rejoin, nothing remembered: leave the
      //    mode unset. The guest picks dine in, pickup or delivery at checkout
      //    rather than us guessing — and a dine-in pick names its own table.
    })();

    return () => {
      cancelled = true;
    };
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
