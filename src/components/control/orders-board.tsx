"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BikeIcon, UtensilsIcon, ShoppingBagIcon, type LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTableSessions, useOrdersByType } from "@/hooks/use-orders";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import {
  countByState,
  OPEN_STATES,
  STATE_CHIP,
  STATE_LABEL,
  sumCounts,
  totalOf,
  type StateCounts,
} from "@/lib/order-urgency";
import { cn } from "@/lib/utils";
import { TableOrdersPanel, type TableJumpSignal } from "./table-orders-panel";
import type { NotificationTab } from "@/lib/notifications";
import { TypeOrdersPanel } from "./type-orders-panel";

type OrderTab = NotificationTab;

type TabSignal = {
  value: OrderTab;
  label: string;
  icon: LucideIcon;
  /** Per-state counts of tickets still needing something — served and rejected ones have left the board. */
  counts: StateCounts;
};

/**
 * One count per state a tab actually has work in, always in the same order and
 * the same colours, so a glance from the pass says not just "something is
 * waiting" but exactly what kind and how many — without opening the tab.
 * A state with nothing in it shows no chip at all.
 */
function StateChips({ counts }: { counts: StateCounts }) {
  const present = OPEN_STATES.filter((state) => counts[state] > 0);
  if (present.length === 0) return null;

  return (
    <span className="flex shrink-0 items-center gap-1">
      {present.map((state) => (
        <span
          key={state}
          title={`${counts[state]} ${STATE_LABEL[state]}`}
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums",
            STATE_CHIP[state],
            // Only a genuinely new ticket earns motion; if everything is merely
            // cooking the board stays coloured but calm.
            state === "new" && "animate-pulse",
          )}
        >
          {counts[state]}
        </span>
      ))}
    </span>
  );
}

function OrderTabTrigger({ signal }: { signal: TabSignal }) {
  const { icon: Icon, counts } = signal;
  const total = totalOf(counts);

  return (
    <TabsTrigger
      value={signal.value}
      aria-label={
        total === 0
          ? `${signal.label}: nothing outstanding`
          : `${signal.label}: ${total} outstanding — ${OPEN_STATES.filter((state) => counts[state] > 0)
              .map((state) => `${counts[state]} ${STATE_LABEL[state]}`)
              .join(", ")}`
      }
      // Narrow screens can't fit a label and three counts on one line — the label
      // would truncate to nothing — so they stack instead of shrinking.
      className="h-auto min-h-11 w-full flex-col justify-center gap-1 px-2 py-1.5 sm:flex-row sm:gap-3 sm:px-3 sm:py-2"
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <Icon />
        <span className="truncate">{signal.label}</span>
      </span>
      <StateChips counts={counts} />
    </TabsTrigger>
  );
}

function OrdersBoardInner() {
  // The header's notification menu lives in a different tree and may not even be
  // on this page, so it hands the target over in the URL rather than via state.
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedTable = Number(searchParams.get("table"));

  const [activeTab, setActiveTab] = useState<OrderTab>("table");
  const [jumpSignal, setJumpSignal] = useState<TableJumpSignal | null>(null);

  // Adjusted during render (not in an effect) so arriving with ?tab=… shows the
  // right panel on the very first paint instead of flashing the default one.
  const [handledQuery, setHandledQuery] = useState<string | null>(null);
  const queryKey = searchParams.toString();
  if (queryKey !== handledQuery) {
    setHandledQuery(queryKey);
    if (requestedTab === "table" || requestedTab === "takeaway" || requestedTab === "delivery") {
      setActiveTab(requestedTab);
      if (requestedTab === "table" && Number.isInteger(requestedTable) && requestedTable > 0) {
        setJumpSignal({ tableNumber: requestedTable, nonce: queryKey });
      }
    }
  }

  const tableSessions = useTableSessions();
  const takeaway = useOrdersByType("TAKEAWAY");
  const delivery = useOrdersByType("DELIVERY");

  // The chips are counts of live data the server never had, and the header's
  // bell can have already filled this cache before the board hydrates — so they
  // stay empty for the hydration render and appear on the one right after.
  const hydrated = useIsHydrated();
  const sessions = hydrated ? (tableSessions.data ?? []) : [];
  const takeawayOrders = hydrated ? (takeaway.data ?? []) : [];
  const deliveryOrders = hydrated ? (delivery.data ?? []) : [];

  const signals: TabSignal[] = [
    {
      value: "table",
      label: "On Table",
      icon: UtensilsIcon,
      // Every open session rolled into one set of counts for the whole room.
      counts: sumCounts(sessions.map((session) => countByState(session.orders))),
    },
    {
      value: "takeaway",
      label: "Takeaway",
      icon: ShoppingBagIcon,
      counts: countByState(takeawayOrders),
    },
    {
      value: "delivery",
      label: "Delivery",
      icon: BikeIcon,
      counts: countByState(deliveryOrders),
    },
  ];

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderTab)}>
      {/* The list's own height is set behind a `group-data-horizontal` modifier, so a
          plain `h-auto` never wins the merge and the row stays clamped to 32px. */}
      <TabsList className="grid w-full grid-cols-3 gap-1 p-1 group-data-horizontal/tabs:h-auto">
        {signals.map((signal) => (
          <OrderTabTrigger key={signal.value} signal={signal} />
        ))}
      </TabsList>

      <TabsContent value="table" className="mt-4">
        <TableOrdersPanel jumpSignal={jumpSignal} />
      </TabsContent>
      <TabsContent value="takeaway" className="mt-4">
        <TypeOrdersPanel
          type="TAKEAWAY"
          emptyIcon={ShoppingBagIcon}
          emptyLabel="No takeaway orders yet."
        />
      </TabsContent>
      <TabsContent value="delivery" className="mt-4">
        <TypeOrdersPanel type="DELIVERY" emptyIcon={BikeIcon} emptyLabel="No delivery orders yet." />
      </TabsContent>
    </Tabs>
  );
}

export function OrdersBoard() {
  return (
    <Suspense fallback={null}>
      <OrdersBoardInner />
    </Suspense>
  );
}
