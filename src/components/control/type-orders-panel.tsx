"use client";

import type { LucideIcon } from "lucide-react";
import { useOrdersByType } from "@/hooks/use-orders";
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
  const { data: orders, isLoading, isError } = useOrdersByType(type);

  if (isLoading) {
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
