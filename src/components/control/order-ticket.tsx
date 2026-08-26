"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  ChefHatIcon,
  ClockIcon,
  BellRingIcon,
  CakeIcon,
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
import { EditOrderDialog } from "./edit-order-dialog";
import { formatPrice } from "@/constants/config";
import { cn } from "@/lib/utils";
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

/**
 * The three things that actually send a ticket back, in the words staff would
 * use at the pass. The stored sentence is deliberately fuller than the chip:
 * the chip is read by whoever is rejecting, the sentence by the guest.
 */
const REJECTION_PRESETS = [
  { id: "out-of-stock", label: "Out of stock", reason: "Some items are out of stock" },
  {
    id: "customer-cancelled",
    label: "Customer cancelled",
    reason: "Cancelled at the customer's request",
  },
  {
    id: "customer-update",
    label: "Customer changing order",
    reason: "The customer is changing this order",
  },
] as const;

type RejectionPresetId = (typeof REJECTION_PRESETS)[number]["id"];

/** The note's own limit; `rejectOrderSchema` leaves headroom above it for the preset sentence. */
const NOTE_MAX_LENGTH = 300;

/**
 * Preset and note are two halves of one sentence, and either half can stand
 * alone — a preset says the category, the note says which item or when to call
 * back. Both end up in the single reason the guest reads.
 */
function composeReason(presetId: RejectionPresetId | null, note: string): string {
  const preset = REJECTION_PRESETS.find((entry) => entry.id === presetId);
  const trimmed = note.trim();
  if (preset && trimmed) return `${preset.reason} — ${trimmed}`;
  return preset ? preset.reason : trimmed;
}

function RejectOrderButton({ order }: { order: OrderDTO }) {
  const [open, setOpen] = useState(false);
  const [presetId, setPresetId] = useState<RejectionPresetId | null>(null);
  const [note, setNote] = useState("");
  const reject = useRejectOrder();

  const reason = composeReason(presetId, note);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPresetId(null);
          setNote("");
        }
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
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {REJECTION_PRESETS.map((preset) => {
              const selected = preset.id === presetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  // Tapping the chosen one again clears it — the quick options are
                  // a shortcut, never a required field.
                  onClick={() => setPresetId(selected ? null : preset.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={NOTE_MAX_LENGTH}
            placeholder={
              presetId
                ? "Add a detail (optional) — which item, when you'll call back…"
                : "Reason (optional) — pick one above, or write your own"
            }
            rows={2}
          />

          {/* Staff are writing something a customer reads, so show them the customer's view. */}
          {reason && (
            <p className="text-xs text-muted-foreground">
              The guest will see: <span className="text-foreground">{reason}</span>
            </p>
          )}
        </div>

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
  READY: "Ready",
  SERVED: "Served",
  REJECTED: "Rejected",
};

/** The final hand-over means something different at each counter — say the thing staff actually did. */
const HANDOFF_LABEL: Record<OrderDTO["type"], string> = {
  ON_TABLE: "Mark Served",
  TAKEAWAY: "Mark Picked Up",
  DELIVERY: "Mark Dispatched",
};

/**
 * One forward step per status. READY sits between the kitchen finishing and the
 * hand-over actually happening, so a ticket on the pass is visibly still open
 * rather than being closed the moment cooking stops.
 */
function nextStepFor(order: OrderDTO) {
  if (order.status === "PREPARING") {
    return { label: "Mark Ready", status: "READY" as const, icon: BellRingIcon };
  }
  if (order.status === "READY") {
    return { label: HANDOFF_LABEL[order.type], status: "SERVED" as const, icon: CheckIcon };
  }
  return null;
}

/** True when the stored `YYYY-MM-DD` falls on today's month and day. */
function isBirthdayToday(birthday: string | null): boolean {
  if (!birthday) return false;
  const now = new Date();
  const [, month, day] = birthday.split("-");
  return (
    Number(month) === now.getMonth() + 1 && Number(day) === now.getDate()
  );
}

const BIRTHDAY_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

function formatBirthday(birthday: string): string {
  const [year, month, day] = birthday.split("-").map(Number);
  return BIRTHDAY_FORMAT.format(new Date(Date.UTC(year, month - 1, day)));
}

/** Who the ticket belongs to — now captured for every order type, table guests included. */
function CustomerDetails({ order }: { order: OrderDTO }) {
  if (!order.customerName) return null;
  const birthdayToday = isBirthdayToday(order.customerBirthday);

  return (
    <div className="mt-2.5 flex flex-col gap-1 rounded-md bg-muted/60 px-2.5 py-2 text-xs">
      <span className="flex flex-wrap items-center gap-1.5">
        <UserIcon className="size-3 shrink-0 text-muted-foreground" />
        <span className="font-medium">{order.customerName}</span>
        {order.customerBirthday && !birthdayToday && (
          <span className="text-muted-foreground">· born {formatBirthday(order.customerBirthday)}</span>
        )}
      </span>
      {/* The one thing about a birthday that's actually actionable on the floor. */}
      {birthdayToday && (
        <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
          <CakeIcon className="size-3 shrink-0" />
          Birthday today
        </span>
      )}
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

  const nextAction = nextStepFor(order);
  // Standalone tickets stay correctable right up until they change hands; a
  // dine-in guest amends by sending another round instead.
  const isEditable =
    order.type !== "ON_TABLE" &&
    (order.status === "RECEIVED" || order.status === "PREPARING" || order.status === "READY");

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
                : order.status === "READY" || order.status === "PREPARING"
                  ? "default"
                  : "outline"
          }
          className={order.status === "READY" ? "bg-emerald-600 text-white" : undefined}
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
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {isEditable && <EditOrderDialog order={order} />}
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
