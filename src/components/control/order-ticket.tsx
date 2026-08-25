"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  ChefHatIcon,
  ClockIcon,
  CoffeeIcon,
  LeafIcon,
  MapPinIcon,
  PhoneIcon,
  PizzaIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useUpdateOrderStatus, useRejectOrder } from "@/hooks/use-orders";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/constants/config";
import type { OrderDTO } from "@/server/actions/orders";

export const BRAND_ICON: Record<string, typeof CoffeeIcon> = {
  coffee: CoffeeIcon,
  papa: LeafIcon,
  mama: PizzaIcon,
};

export const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

/** DB ids are full UUIDs — too long for a ticket badge, so show a short, still-unique-enough tag. */
export function formatTicketId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/** Short "how long ago" for scanning a list at a glance — falls back to a clock time past an hour. */
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  return TIME_FORMAT.format(new Date(iso));
}

function RejectOrderButton({ order }: { order: OrderDTO }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const reject = useRejectOrder();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setReason("");
      }}
    >
      <AlertDialogTrigger render={<Button size="sm" variant="outline" className="text-destructive hover:text-destructive" />}>
        <XIcon />
        Reject
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject this ticket?</AlertDialogTitle>
          <AlertDialogDescription>
            The guest will see this ticket as rejected and its items will be moved back into their
            cart to review and resend. Use this for a mistaken or unwanted order — not once it&apos;s
            already being prepared.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional) — e.g. out of stock, ordered by mistake…"
          rows={2}
        />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={reject.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => {
              reject.mutate(
                { id: order.id, reason },
                { onError: (error) => toast.error(error.message) },
              );
              setOpen(false);
            }}
          >
            {reject.isPending ? "Rejecting…" : "Reject Ticket"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const STATUS_LABEL: Record<OrderDTO["status"], string> = {
  RECEIVED: "Received",
  PREPARING: "Preparing",
  SERVED: "Served",
  REJECTED: "Rejected",
};

/** "Served" means something different at each counter — say the thing staff actually did. */
const HANDOFF_LABEL: Record<OrderDTO["type"], string> = {
  ON_TABLE: "Mark Served",
  TAKEAWAY: "Mark Picked Up",
  DELIVERY: "Mark Dispatched",
};

/** Who to call about a takeaway/delivery ticket — a dine-in guest is simply at their table. */
function CustomerDetails({ order }: { order: OrderDTO }) {
  if (order.type === "ON_TABLE" || !order.customerName) return null;

  return (
    <div className="mt-2.5 flex flex-col gap-1 rounded-md bg-muted/60 px-2.5 py-2 text-xs">
      <span className="flex items-center gap-1.5">
        <UserIcon className="size-3 shrink-0 text-muted-foreground" />
        <span className="font-medium">{order.customerName}</span>
      </span>
      {order.customerPhone && (
        <a
          href={`tel:${order.customerPhone}`}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
        >
          <PhoneIcon className="size-3 shrink-0" />
          {order.customerPhone}
        </a>
      )}
      {order.deliveryAddress && (
        <span className="flex items-start gap-1.5 text-muted-foreground">
          <MapPinIcon className="mt-0.5 size-3 shrink-0" />
          {order.deliveryAddress}
        </span>
      )}
    </div>
  );
}

export function OrderTicket({ order }: { order: OrderDTO }) {
  const updateStatus = useUpdateOrderStatus();

  const nextAction =
    order.status === "PREPARING"
      ? { label: HANDOFF_LABEL[order.type], status: "SERVED" as const, icon: CheckIcon }
      : null;

  return (
    <div className={`rounded-lg border p-3 ${order.status === "REJECTED" ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {formatTicketId(order.id)}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ClockIcon className="size-3" />
            {TIME_FORMAT.format(new Date(order.createdAt))}
          </span>
        </div>
        <Badge
          variant={
            order.status === "REJECTED"
              ? "destructive"
              : order.status === "SERVED"
                ? "secondary"
                : order.status === "PREPARING"
                  ? "default"
                  : "outline"
          }
        >
          {STATUS_LABEL[order.status]}
        </Badge>
      </div>

      <ul className="mt-2.5 flex flex-col gap-1.5 text-sm">
        {order.items.map((item) => {
          const Icon = BRAND_ICON[item.brandSlug] ?? CoffeeIcon;
          return (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {item.quantity}×
                </span>
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          );
        })}
      </ul>

      <CustomerDetails order={order} />

      {order.specialNotes && (
        <p className="mt-2.5 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground italic">
          &ldquo;{order.specialNotes}&rdquo;
        </p>
      )}

      {order.status === "REJECTED" && order.rejectionReason && (
        <p className="mt-2.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          Rejected: {order.rejectionReason}
        </p>
      )}

      <div className="mt-2.5 border-t pt-2.5">
        {order.discountAmount > 0 && (
          <div className="mb-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount{order.offerCode ? ` (${order.offerCode})` : ""}</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{formatPrice(order.totalPrice)}</span>
          <div className="flex items-center gap-1.5">
            {order.status === "RECEIVED" && <RejectOrderButton order={order} />}
            {nextAction && (
              <Button
                size="sm"
                disabled={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate(
                    { id: order.id, status: nextAction.status },
                    { onError: (error) => toast.error(error.message) },
                  )
                }
              >
                <nextAction.icon />
                {nextAction.label}
              </Button>
            )}
            {order.status === "RECEIVED" && (
              <Button
                size="sm"
                variant="outline"
                disabled={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate(
                    { id: order.id, status: "PREPARING" },
                    { onError: (error) => toast.error(error.message) },
                  )
                }
              >
                <ChefHatIcon />
                Start Preparing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
