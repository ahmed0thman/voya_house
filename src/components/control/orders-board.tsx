"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BikeIcon,
  UtensilsIcon,
  ShoppingBagIcon,
  SearchIcon,
  ClipboardListIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { matchesOrderSearch } from "@/lib/order-search";
import { cn } from "@/lib/utils";
import { TableOrdersPanel, type TableJumpSignal } from "./table-orders-panel";
import type { NotificationTab } from "@/lib/notifications";
import { TypeOrdersPanel } from "./type-orders-panel";
import { OrderTicket, channelLabelFor } from "./order-ticket";
import type { OrderDTO, TableSessionDTO } from "@/server/actions/orders";

type OrderTab = NotificationTab;

// Stable references so the `useMemo` combining them below doesn't see a "new"
// array (and recompute) on every render just because nothing has loaded yet.
const NO_SESSIONS: TableSessionDTO[] = [];
const NO_ORDERS: OrderDTO[] = [];

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
  const [search, setSearch] = useState("");

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
  const sessions = hydrated ? (tableSessions.data ?? NO_SESSIONS) : NO_SESSIONS;
  const takeawayOrders = hydrated ? (takeaway.data ?? NO_ORDERS) : NO_ORDERS;
  const deliveryOrders = hydrated ? (delivery.data ?? NO_ORDERS) : NO_ORDERS;

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

  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0;

  // Flattened across every tab — a ticket a staff member is searching for could
  // be dine-in, takeaway or delivery, and they shouldn't have to guess which
  // tab to check first.
  const allOrders: OrderDTO[] = useMemo(
    () => [...sessions.flatMap((session) => session.orders), ...takeawayOrders, ...deliveryOrders],
    [sessions, takeawayOrders, deliveryOrders],
  );

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return allOrders
      .filter((order) => matchesOrderSearch(order, trimmedSearch))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, isSearching, trimmedSearch]);

  const isLoading = !hydrated || tableSessions.isLoading || takeaway.isLoading || delivery.isLoading;
  const isError = tableSessions.isError || takeaway.isError || delivery.isError;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 start-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search ticket, name, phone, table, item…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="ps-8 pe-8"
        />
        {isSearching && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setSearch("")}
            className="absolute top-1/2 end-1 -translate-y-1/2"
          >
            <XIcon />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {isSearching ? (
        isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : isError ? (
          <p className="rounded-xl border p-6 text-center text-sm text-destructive">
            Couldn&apos;t load orders.
          </p>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border p-16 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <ClipboardListIcon className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              No orders match &quot;{trimmedSearch}&quot;.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {searchResults.map((order) => (
              <OrderTicket key={order.id} order={order} channelLabel={channelLabelFor(order)} />
            ))}
          </div>
        )
      ) : (
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
      )}
    </div>
  );
}

export function OrdersBoard() {
  return (
    <Suspense fallback={null}>
      <OrdersBoardInner />
    </Suspense>
  );
}
