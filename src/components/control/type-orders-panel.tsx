"use client";

import type { LucideIcon } from "lucide-react";
import { useOrdersByType } from "@/hooks/use-orders";
import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTicket } from "./order-ticket";

export function TypeOrdersPanel({
  type,
  emptyIcon: EmptyIcon,
  emptyLabel,
}: {
  type: "TAKEAWAY" | "DELIVERY";
  emptyIcon: LucideIcon;
  emptyLabel: string;
}) {
  const { data, isLoading, isError } = useOrdersByType(type);

  // The server always renders this as still loading, but the header's
  // notification bell polls these same keys from outside the board's Suspense
  // boundary — so its fetch can land in the gap before the board hydrates, and
  // the first client render would otherwise show tickets where the HTML being
  // hydrated has a skeleton. Holding the data back for that single render costs
  // one frame and keeps the two sides identical.
  const hydrated = useIsHydrated();
  const orders = hydrated ? data : undefined;

  if (!hydrated || isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-52 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-xl border p-6 text-center text-sm text-destructive">
        Couldn&apos;t load orders.
      </p>
    );
  }

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border p-16 text-center">
        <div className="rounded-full bg-muted p-3 text-muted-foreground">
          <EmptyIcon className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {orders.map((order) => (
        <OrderTicket key={order.id} order={order} />
      ))}
    </div>
  );
}
