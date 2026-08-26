import type { OrderStatus } from "@/generated/prisma/client";

/**
 * The three states a ticket can sit in while it still needs someone. Ordered
 * left-to-right the way work actually flows, so a row of counts always reads
 * the same way and staff can find the number they want by position alone.
 */
export const OPEN_STATES = ["new", "preparing", "ready"] as const;
export type OpenState = (typeof OPEN_STATES)[number];

const STATUS_FOR_STATE: Record<OpenState, OrderStatus> = {
  new: "RECEIVED",
  preparing: "PREPARING",
  ready: "READY",
};

export type StateCounts = Record<OpenState, number>;

export function countByState(orders: { status: OrderStatus }[]): StateCounts {
  return {
    new: orders.filter((o) => o.status === STATUS_FOR_STATE.new).length,
    preparing: orders.filter((o) => o.status === STATUS_FOR_STATE.preparing).length,
    ready: orders.filter((o) => o.status === STATUS_FOR_STATE.ready).length,
  };
}

export function sumCounts(counts: StateCounts[]): StateCounts {
  return counts.reduce<StateCounts>(
    (total, current) => ({
      new: total.new + current.new,
      preparing: total.preparing + current.preparing,
      ready: total.ready + current.ready,
    }),
    { new: 0, preparing: 0, ready: 0 },
  );
}

export function totalOf(counts: StateCounts): number {
  return counts.new + counts.preparing + counts.ready;
}

/** Filled while the state has work in it; recessive at zero, so the row stays scannable. */
export const STATE_CHIP: Record<OpenState, string> = {
  new: "bg-destructive text-white",
  preparing: "bg-amber-500 text-black",
  ready: "bg-emerald-600 text-white",
};

export const STATE_LABEL: Record<OpenState, string> = {
  new: "new",
  preparing: "preparing",
  ready: "ready",
};

/** A single dot for the table list, coloured by whatever most needs a person. */
export function urgencyDotClass(orders: { status: OrderStatus }[]): string {
  const counts = countByState(orders);
  if (counts.new > 0) return "bg-destructive";
  if (counts.ready > 0) return "bg-emerald-500";
  if (counts.preparing > 0) return "bg-amber-500";
  return "bg-muted-foreground/40";
}
