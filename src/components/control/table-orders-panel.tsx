"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ClipboardListIcon, ClockIcon, ReceiptTextIcon } from "lucide-react";
import { useTableSessions, useSettleTableSession } from "@/hooks/use-orders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/constants/config";
import { cn } from "@/lib/utils";
import { OrderTicket, formatRelativeTime } from "./order-ticket";
import type { OrderDTO, TableSessionDTO } from "@/server/actions/orders";

/** Red = a ticket hasn't even been started; amber = something's cooking; calm gray = fully served, just waiting to be settled. */
function statusDotClass(session: TableSessionDTO): string {
  if (session.orders.some((o) => o.status === "RECEIVED")) return "bg-destructive";
  if (session.orders.some((o) => o.status === "PREPARING")) return "bg-amber-500";
  return "bg-muted-foreground/40";
}

/** A settled table is only ever billed for what was actually served — rejected tickets are free. */
function isSettleable(session: TableSessionDTO): boolean {
  return session.orders.every((o) => o.status === "SERVED" || o.status === "REJECTED");
}

type BillLine = { name: string; quantity: number; lineTotal: number };

function buildBillLines(orders: OrderDTO[]): BillLine[] {
  const byName = new Map<string, BillLine>();
  for (const order of orders) {
    for (const item of order.items) {
      const lineTotal = item.price * item.quantity;
      const existing = byName.get(item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.lineTotal += lineTotal;
      } else {
        byName.set(item.name, { name: item.name, quantity: item.quantity, lineTotal });
      }
    }
  }
  return [...byName.values()];
}

function SettleSessionButton({ session }: { session: TableSessionDTO }) {
  const [open, setOpen] = useState(false);
  const settle = useSettleTableSession();

  const canSettle = isSettleable(session);
  const billableOrders = session.orders.filter((o) => o.status === "SERVED");
  const rejectedCount = session.orders.filter((o) => o.status === "REJECTED").length;
  const billLines = buildBillLines(billableOrders);
  const totalItems = billLines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = billableOrders.reduce((sum, o) => sum + o.subtotal, 0);
  const discount = billableOrders.reduce((sum, o) => sum + o.discountAmount, 0);
  const total = billableOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="flex flex-col items-end gap-1">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger render={<Button size="sm" disabled={!canSettle} />}>
          <ReceiptTextIcon />
          Settle & Close
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Settle Table {session.tableNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Review the bill before closing out this table. The guest&apos;s order history for this
              visit will no longer be shown, and their next order opens a new session.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border text-sm">
            {billLines.length === 0 ? (
              <p className="p-3 text-muted-foreground">No served items to bill.</p>
            ) : (
              <div className="divide-y">
                {billLines.map((line) => (
                  <div key={line.name} className="flex justify-between px-3 py-2">
                    <span>
                      {line.quantity}× {line.name}
                    </span>
                    <span className="text-muted-foreground">{formatPrice(line.lineTotal)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t px-3 py-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t px-3 py-2 font-semibold">
              <span>
                Total ({totalItems} item{totalItems === 1 ? "" : "s"})
              </span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {rejectedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {rejectedCount} rejected ticket{rejectedCount === 1 ? "" : "s"} not included in this bill.
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={settle.isPending}
              onClick={() => {
                settle.mutate(
                  { id: session.id },
                  { onError: (error) => toast.error(error.message) },
                );
                setOpen(false);
              }}
            >
              {settle.isPending ? "Settling…" : "Settle & Close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!canSettle && (
        <span className="text-[11px] text-muted-foreground">Waiting on tickets to finish</span>
      )}
    </div>
  );
}

function TableList({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: TableSessionDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {sessions.map((session) => {
        const isSelected = session.id === selectedId;
        const latest = session.orders[0]?.createdAt ?? session.openedAt;
        return (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors",
              isSelected ? "border-foreground/30 bg-muted" : "border-transparent hover:bg-muted/60",
            )}
          >
            <span className={cn("size-2 shrink-0 rounded-full", statusDotClass(session))} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-medium">Table {session.tableNumber}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatPrice(session.totalPrice)}</span>
              </span>
              <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {session.orders.length} ticket{session.orders.length === 1 ? "" : "s"}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="size-3" />
                  {formatRelativeTime(latest)}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TableSessionDetail({ session }: { session: TableSessionDTO }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h2 className="text-base font-semibold">Table {session.tableNumber}</h2>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ClockIcon className="size-3" />
            Opened at {TIME_FORMAT.format(new Date(session.openedAt))} · {formatPrice(session.totalPrice)}
          </span>
        </div>
        <SettleSessionButton session={session} />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {session.orders.map((order) => (
          <OrderTicket key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

/** A one-shot "jump to this table" request — `nonce` changes each time so the same table can be re-requested. */
export type TableJumpSignal = { tableNumber: number; nonce: number };

export function TableOrdersPanel({ jumpSignal }: { jumpSignal: TableJumpSignal | null }) {
  const { data: sessions, isLoading, isError } = useTableSessions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Adjusted synchronously during render (not in an effect) so a new poll result or a fresh
  // notification jump is reflected in the very render that receives it, with no extra commit.
  const [seenSessions, setSeenSessions] = useState(sessions);
  const [handledJumpNonce, setHandledJumpNonce] = useState<number | null>(null);

  if (sessions !== seenSessions) {
    setSeenSessions(sessions);
    // Fall back to the most recent table whenever nothing valid is selected (first load, or the
    // previously-selected table just settled and dropped out of the list).
    if (!sessions?.length) {
      if (selectedId !== null) setSelectedId(null);
    } else if (!sessions.some((s) => s.id === selectedId)) {
      setSelectedId(sessions[0].id);
    }
  }

  // A notification's "View" action jumps the detail pane straight to that table.
  if (jumpSignal && jumpSignal.nonce !== handledJumpNonce && sessions) {
    setHandledJumpNonce(jumpSignal.nonce);
    const requested = sessions.find((s) => s.tableNumber === jumpSignal.tableNumber);
    if (requested) setSelectedId(requested.id);
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
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

  if (!sessions?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border p-16 text-center">
        <div className="rounded-full bg-muted p-3 text-muted-foreground">
          <ClipboardListIcon className="size-5" />
        </div>
        <p className="text-sm text-muted-foreground">No tables with open orders yet.</p>
      </div>
    );
  }

  const selectedSession = sessions.find((s) => s.id === selectedId) ?? sessions[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:items-start">
      <div className="rounded-xl border p-2">
        <TableList
          sessions={sessions}
          selectedId={selectedSession.id}
          onSelect={setSelectedId}
        />
      </div>
      <div className="rounded-xl border p-4">
        <TableSessionDetail session={selectedSession} />
      </div>
    </div>
  );
}
