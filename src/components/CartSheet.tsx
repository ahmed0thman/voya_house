"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Cancel01Icon,
  ShoppingBag01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  Add01Icon,
  Remove01Icon,
  SparklesIcon,
  Clock01Icon,
  Location01Icon,
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  ArrowDown01Icon,
  DiscountTag01Icon,
  DeliveryTruck01Icon,
  Store01Icon,
  User03Icon,
  Call02Icon,
  MapPinpoint01Icon,
  BirthdayCakeIcon,
} from "hugeicons-react";
import { toast } from "sonner";
import DeliveryLocationPicker from "@/components/DeliveryLocationPicker";
import { useTranslations } from "next-intl";
import { useCartStore, formatTableDigits } from "@/store/useCartStore";
import { useGuestOrders, usePlaceOrder, useValidateOfferCode } from "@/hooks/use-table-orders";
import { useGuestTables } from "@/hooks/use-tables";
import { useRejectedOrderRecovery } from "@/hooks/use-rejected-order-recovery";
import { useOrderUpdateNotice } from "@/hooks/use-order-update-notice";
import {
  EMPTY_CONTACT,
  readGuestContact,
  rememberTableSession,
  saveGuestContact,
  type OrderMode,
} from "@/lib/guest-session";
import type { OrderDTO } from "@/server/actions/orders";
import type { CreateOrderInput } from "@/lib/validations/order";
import { formatPrice } from "@/constants/config";

/** Bounds the birthday picker — nobody was born tomorrow. */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

function formatOrderTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** DB ids are full UUIDs — too long for a ticket badge, so show a short, still-unique-enough tag. */
function formatTicketId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/** Colour and icon only — the name comes from the `brands` namespace. */
const BRAND_CONFIG = {
  coffee: { color: "#F1E6C3", icon: Coffee01Icon },
  papa: { color: "#B7D39A", icon: Leaf01Icon },
  mama: { color: "#D8A98F", icon: Pizza01Icon },
};

/**
 * The same sheet serves three very different guests — one waiting at a table,
 * one walking over to collect, one waiting at home. Only the wording, the
 * destination block and the last tracker step actually differ, so those live
 * here rather than as branches sprinkled through the markup.
 */
/** The sheet also has to render before the guest has told us how they want their order. */
type SheetMode = OrderMode | "UNCHOSEN";

/**
 * Only the icon is structural. Every word that used to live here now comes from
 * the `cart.modes.<MODE>` namespace, keyed by the same mode name, so the three
 * voices stay side by side in the catalogue where a translator can see them
 * together rather than scattered through the markup.
 */
const MODE_ICON: Record<SheetMode, typeof Location01Icon> = {
  UNCHOSEN: ShoppingBag01Icon,
  ON_TABLE: Location01Icon,
  TAKEAWAY: Store01Icon,
  DELIVERY: DeliveryTruck01Icon,
};

/**
 * What an unrouted guest can pick at checkout. Dine in is included because
 * plenty of people sit down and open the site directly rather than scanning
 * the QR on their table — they just have to say which table they're at.
 */
const MODE_CHOICES = ["ON_TABLE", "DELIVERY", "TAKEAWAY"] as const;

/**
 * Lets a guest name the table they're sitting at when they didn't scan its QR.
 * Only active tables are offered, and the order is still re-checked server-side
 * — this is convenience, not authority.
 */
function TablePicker({
  tableNumber,
  onSelect,
  error,
}: {
  tableNumber: number | null;
  onSelect: (table: number | null) => void;
  error?: string;
}) {
  const t = useTranslations("tablePicker");
  const tCommon = useTranslations("common");
  const { data: tables = [], isLoading, isError } = useGuestTables();
  /** No active tables configured at all. Not an error — just nothing to offer. */
  const noneFree = !isLoading && !isError && tables.length === 0;

  return (
    <div className="mb-3">
      <label
        htmlFor="cart-table-picker"
        className="block font-mono text-[9px] uppercase tracking-widest text-white/50 mb-1.5"
      >
        {t("question")}
      </label>
      <div
        className={`flex items-center gap-2 px-3 rounded-xl bg-black/30 border transition-all ${
          error ? "border-red-500/60" : "border-white/10 focus-within:border-[#F1E6C3]"
        }`}
      >
        <Location01Icon size={14} className="text-white/40 shrink-0" />
        <select
          id="cart-table-picker"
          value={tableNumber ?? ""}
          disabled={isLoading || isError || noneFree}
          onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : null)}
          aria-invalid={!!error}
          className="flex-1 min-w-0 bg-transparent py-2.5 text-xs text-white outline-none [color-scheme:dark] disabled:opacity-50 cursor-pointer"
        >
          <option value="">
            {isLoading
              ? t("loading")
              : isError
                ? t("error")
                : noneFree
                  ? t("none")
                  : t("select")}
          </option>
          {tables.map((table) => (
            <option key={table.number} value={table.number}>
              {tCommon("tableNumber", { number: formatTableDigits(table.number) })}
              {table.label ? ` · ${table.label}` : ""}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <span className="block px-1 mt-1 text-[10px] text-red-400 font-mono">{error}</span>
      )}
      {(isError || noneFree) && !error && (
        <span className="block px-1 mt-1 text-[10px] text-white/40 font-mono">
          {t("help")}
        </span>
      )}
    </div>
  );
}

/** The guest's live tracker steps, in order — a status's index in here is its progress. */
const PROGRESS_ORDER = ["RECEIVED", "PREPARING", "READY", "SERVED"] as const;

/** Reads the table off the ticket itself — a placed order's own table is the authority, not whatever the cart is set to now. */
function OrderProgressTracker({ order }: { order: OrderDTO }) {
  const t = useTranslations("cart");
  const tCommon = useTranslations("common");
  const mode = useTranslations(`cart.modes.${order.type}`);
  const steps = [
    { label: t("progress.received"), hint: t("progress.receivedHint") },
    { label: t("progress.preparing"), hint: t("progress.preparingHint") },
    { label: mode("readyStepLabel"), hint: mode("readyStepHint") },
    {
      label: mode("finalStepLabel"),
      hint:
        order.type === "ON_TABLE" && order.tableNumber !== null
          ? t("progress.toTable", {
              table: tCommon("tableNumber", { number: formatTableDigits(order.tableNumber) }),
            })
          : mode("finalStepHint"),
    },
  ];
  const currentIndex = PROGRESS_ORDER.indexOf(order.status as (typeof PROGRESS_ORDER)[number]);

  return (
    <div className="grid grid-cols-4 gap-1 sm:gap-2 relative mb-6">
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        // The last step is terminal — landing on it is completion, not "in progress".
        const isComplete = isDone || (isCurrent && index === steps.length - 1);

        return (
          <div
            key={step.label}
            className={`flex flex-col items-center text-center ${isDone || isCurrent ? "" : "opacity-40"}`}
          >
            <div
              className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center mb-1.5 ${
                isComplete
                  ? "bg-[#B7D39A] text-black shadow-[0_0_15px_rgba(183,211,154,0.5)]"
                  : isCurrent
                    ? "bg-[#F1E6C3] text-black animate-bounce shadow-[0_0_15px_rgba(241,230,195,0.5)]"
                    : "border border-white/30 text-white bg-transparent"
              }`}
            >
              {isComplete ? "\u2713" : isCurrent ? "\u25cf" : index + 1}
            </div>
            <span
              className={`font-mono text-[9px] sm:text-[10px] font-bold ${
                isCurrent ? "text-[#F1E6C3]" : isDone ? "text-white/90" : "text-white/60"
              }`}
            >
              {step.label}
            </span>
            <span className="font-mono text-[8px] sm:text-[9px] text-white/40">{step.hint}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function CartSheet() {
  const {
    items,
    orderMode,
    tableNumber,
    tableConfirmed,
    isCartOpen,
    viewingOrderStatus,
    closeCart,
    setOrderMode,
    setTableNumber,
    confirmTable,
    setViewingOrderStatus,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const { data: activeOrders = [] } = useGuestOrders();
  const placeOrderMutation = usePlaceOrder();
  const validateOfferMutation = useValidateOfferCode();
  useRejectedOrderRecovery(activeOrders);
  useOrderUpdateNotice(activeOrders);

  const t = useTranslations("cart");
  const tCommon = useTranslations("common");
  const tMode = useTranslations("orderMode");
  const tBrands = useTranslations("brands");
  const tValidation = useTranslations("validation");
  /** Copy for the mode in play; the sheet still renders before one is chosen. */
  const copy = useTranslations(`cart.modes.${orderMode ?? "UNCHOSEN"}`);
  const SheetModeIcon = MODE_ICON[orderMode ?? "UNCHOSEN"];
  // No table scanned and nothing remembered — we refuse to guess where the food goes.
  const needsModeChoice = orderMode === null;

  // Seeded from the last order this browser placed, so a regular isn't retyping
  // their address every time. Lazy initializer — localStorage is client-only.
  const [contact, setContact] = useState(() =>
    typeof window === "undefined" ? EMPTY_CONTACT : readGuestContact(),
  );
  const [specialNotes, setSpecialNotes] = useState("");
  const [offerCodeInput, setOfferCodeInput] = useState("");
  const [appliedOffer, setAppliedOffer] = useState<{
    code: string;
    name: string | null;
    discountType: "PERCENT" | "FIXED";
    discountValue: number;
  } | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"name" | "phone" | "address" | "table", string>>
  >({});

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const hasItems = items.length > 0;
  const hasOrders = activeOrders.length > 0;

  // Set default selected order to latest order when available
  const activeSelectedOrder: OrderDTO | undefined =
    activeOrders.find((o) => o.id === selectedOrderId) || activeOrders[0];

  // If there are no new cart items, but orders exist, automatically show the order status view!
  const showOrderStatus = viewingOrderStatus || (!hasItems && hasOrders);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeCart]);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  // Main Sheet Opening entrance (runs ONLY when isCartOpen changes)
  useGSAP(
    () => {
      if (!sheetRef.current) return;

      if (isCartOpen) {
        gsap.fromTo(
          sheetRef.current,
          { opacity: 0, backdropFilter: "blur(0px)" },
          { opacity: 1, backdropFilter: "blur(24px)", duration: 0.35, ease: "power3.out" }
        );

        gsap.fromTo(
          sheetRef.current.querySelectorAll(".cart-anim-item"),
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.03, ease: "power3.out", delay: 0.05 }
        );
      }
    },
    { dependencies: [isCartOpen], scope: sheetRef }
  );

  // Smooth inner content transition when switching tabs or selecting tickets (no sheet flash)
  useGSAP(
    () => {
      if (!contentRef.current || !isCartOpen) return;

      gsap.fromTo(
        contentRef.current,
        { opacity: 0.7, y: 6 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
      );
    },
    { dependencies: [showOrderStatus, selectedOrderId], scope: contentRef }
  );

  const navigateToMenus = () => {
    setViewingOrderStatus(false);
    closeCart();
    const target = document.getElementById("booklets");
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  };

/** Mirrors the server's schema so the guest sees the same rule highlighted on the field, not a raw Zod error. */
  const validateContact = (): typeof fieldErrors => {
    const next: typeof fieldErrors = {};
    if (contact.name.trim().length < 2) next.name = tValidation("name");
    if ((contact.phone.match(/\d/g)?.length ?? 0) < 7) next.phone = tValidation("phone");
    if (orderMode === "DELIVERY" && contact.address.trim().length < 10) {
      next.address = tValidation("address");
    }
    if (orderMode === "ON_TABLE" && tableNumber === null) {
      next.table = tValidation("table");
    }
    return next;
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (orderMode === null) {
      toast.error(t("chooseMethodFirst"));
      return;
    }

    const invalid = validateContact();
    if (Object.keys(invalid).length > 0) {
      setFieldErrors(invalid);
      return;
    }
    setFieldErrors({});

    const common = {
      customerName: contact.name.trim(),
      customerPhone: contact.phone.trim(),
      customerBirthday: contact.birthday || undefined,
      specialNotes,
      offerCode: appliedOffer?.code,
      items: items.map((item) => ({ itemId: item.id, quantity: item.quantity })),
    };
    const input: CreateOrderInput =
      // `validateContact` has already refused a dine-in order with no table,
      // so the assertion here can't fire on a real submit.
      orderMode === "ON_TABLE"
        ? {
            type: "ON_TABLE",
            tableNumber: tableNumber!,
            ...common,
          }
        : orderMode === "TAKEAWAY"
          ? { type: "TAKEAWAY", ...common }
          : { type: "DELIVERY", deliveryAddress: contact.address.trim(), ...common };

    placeOrderMutation.mutate(input, {
      onSuccess: (newOrder) => {
        saveGuestContact(contact);
        setSelectedOrderId(newOrder.id);
        setSpecialNotes("");
        setOfferCodeInput("");
        setAppliedOffer(null);
        clearCart();
        setViewingOrderStatus(true);
        // A self-picked table is now fact rather than a guess: it just got a
        // real order sent to it, so the next round behaves exactly like a
        // scanned table — locked in, no picker. Storing the visit it opened is
        // what lets a refresh (or a later trip back without the QR) land on
        // this same tab instead of an empty page with no table and no tickets.
        if (orderMode === "ON_TABLE") {
          confirmTable();
          if (newOrder.tableSessionId && newOrder.tableNumber !== null) {
            rememberTableSession(newOrder.tableSessionId, newOrder.tableNumber);
          }
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleApplyOfferCode = () => {
    if (!offerCodeInput.trim()) return;
    validateOfferMutation.mutate(offerCodeInput, {
      onSuccess: (offer) => {
        setAppliedOffer(offer);
        toast.success(
          offer.discountType === "PERCENT"
            ? `${offer.discountValue}% off applied`
            : `${formatPrice(offer.discountValue)} off applied`,
        );
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  if (!isCartOpen) return null;

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const discountAmount = appliedOffer
    ? appliedOffer.discountType === "PERCENT"
      ? totalPrice * (appliedOffer.discountValue / 100)
      : Math.min(appliedOffer.discountValue, totalPrice)
    : 0;
  const finalTotal = totalPrice - discountAmount;

  return (
    <div
      ref={sheetRef}
      className="fixed inset-0 z-[100] bg-[#080907]/95 backdrop-blur-2xl flex flex-col justify-between p-3.5 sm:p-6 md:p-10 overflow-y-auto text-white select-none"
    >
      {/* ─── Top Header Bar ─── */}
      <div className="cart-anim-item flex justify-between items-center w-full max-w-4xl mx-auto pb-3 sm:pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] shrink-0">
            <SheetModeIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-2xl text-white font-medium">
                {showOrderStatus ? copy("ordersTitle") : copy("cartTitle")}
              </h2>
              {orderMode && (
                <span className="px-2 py-0.5 rounded-full border border-[#F1E6C3]/30 bg-[#F1E6C3]/10 font-mono text-[9px] sm:text-[10px] text-[#F1E6C3] font-bold">
                  {orderMode === "ON_TABLE" && tableNumber !== null
                    ? tCommon("tableNumber", { number: formatTableDigits(tableNumber) })
                    : tMode(orderMode)}
                </span>
              )}
            </div>
            <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-white/50">
              {copy("subtitle")}
            </p>
          </div>
        </div>

        <button
          onClick={closeCart}
          aria-label={t("closeCart")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
        >
          <Cancel01Icon size={16} />
        </button>
      </div>

      {/* ─── Dedicated Segmented Control (When both new items & active orders exist) ─── */}
      {hasItems && hasOrders && (
        <div className="cart-anim-item w-full max-w-4xl mx-auto my-3 shrink-0">
          <div className="p-1 rounded-2xl bg-white/[0.05] border border-white/10 grid grid-cols-2 gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setViewingOrderStatus(false)}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !showOrderStatus
                  ? "bg-[#F1E6C3] text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <ShoppingBag01Icon size={13} />
              <span>{copy("cartTabLabel")} ({totalItems})</span>
            </button>
            
            <button
              type="button"
              onClick={() => setViewingOrderStatus(true)}
              className={`relative py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                showOrderStatus
                  ? "bg-[#F1E6C3] text-black font-bold shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {/* Pulsing Glowing Dot to attract user eye */}
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${showOrderStatus ? "bg-black" : "bg-[#B7D39A]"} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${showOrderStatus ? "bg-black" : "bg-[#B7D39A] shadow-[0_0_8px_rgba(183,211,154,1)]"}`} />
              </span>

              <Clock01Icon size={13} className={showOrderStatus ? "text-black" : "text-[#F1E6C3]"} />
              <span>My Orders ({activeOrders.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content Stage ─── */}
      <div ref={contentRef} className="w-full max-w-4xl mx-auto py-3 sm:py-6 flex-1 flex flex-col justify-center">
        
        {/* VIEW 1: LIVE ORDER STATUS FOR ALL TICKETS */}
        {showOrderStatus && activeSelectedOrder ? (
          <div className="cart-anim-item flex flex-col items-center max-w-2xl mx-auto w-full text-center">
            
            {/* Multi-Ticket Interactive Switcher */}
            {activeOrders.length > 1 && (
              <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/40 shrink-0 me-1">
                  {t("tickets")}
                </span>
                {activeOrders.map((order, idx) => {
                  const isSelected = order.id === activeSelectedOrder.id;
                  const roundNum = activeOrders.length - idx;
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl flex items-center gap-2 font-mono text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#F1E6C3] text-black border-[#F1E6C3] font-bold shadow-lg scale-105"
                          : "bg-white/[0.04] text-white/70 border-white/10 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-black" : "bg-[#B7D39A]"} animate-pulse`} />
                      <span>Round {roundNum}</span>
                      <span className="opacity-60 text-[10px]">({formatTicketId(order.id)})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Ticket Status Card */}
            <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-8 text-start shadow-xl">
              
              {/* Ticket Top Header */}
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F1E6C3]/20 text-[#F1E6C3] flex items-center justify-center font-bold text-xs">
                    {activeOrders.findIndex((o) => o.id === activeSelectedOrder.id) + 1}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl text-white font-medium">
                      Ticket {formatTicketId(activeSelectedOrder.id)}
                    </h3>
                    <span className="font-mono text-[10px] text-white/50">
                      Placed at {formatOrderTime(activeSelectedOrder.createdAt)} ·{" "}
                      {activeSelectedOrder.tableNumber !== null
                        ? tCommon("tableNumber", {
                            number: formatTableDigits(activeSelectedOrder.tableNumber),
                          })
                        : tMode(activeSelectedOrder.type)}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    activeSelectedOrder.status === "REJECTED"
                      ? "bg-red-500/15 border border-red-500/40 text-red-400"
                      : activeSelectedOrder.status === "SERVED"
                        ? "bg-white/[0.06] border border-white/15 text-white/50"
                        : activeSelectedOrder.status === "READY"
                          ? "bg-[#B7D39A]/25 border border-[#B7D39A]/60 text-[#B7D39A]"
                          : activeSelectedOrder.status === "PREPARING"
                            ? "bg-[#F1E6C3]/20 border border-[#F1E6C3]/40 text-[#F1E6C3]"
                            : "bg-white/10 border border-white/25 text-white/80"
                  }`}
                >
                  {activeSelectedOrder.status !== "SERVED" && activeSelectedOrder.status !== "REJECTED" && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full animate-ping ${
                        activeSelectedOrder.status === "READY"
                          ? "bg-[#B7D39A]"
                          : activeSelectedOrder.status === "PREPARING"
                            ? "bg-[#F1E6C3]"
                            : "bg-white/70"
                      }`}
                    />
                  )}
                  {activeSelectedOrder.status === "REJECTED"
                    ? t("status.rejected")
                    : activeSelectedOrder.status === "SERVED"
                      ? t(`modes.${activeSelectedOrder.type}.servedLabel`)
                      : activeSelectedOrder.status === "READY"
                        ? t(`modes.${activeSelectedOrder.type}.readyLabel`)
                        : activeSelectedOrder.status === "PREPARING"
                          ? t("status.inPreparation")
                          : t("status.orderReceived")}
                </span>
              </div>

              {activeSelectedOrder.status === "REJECTED" ? (
                /* Rejected Ticket Notice — no kitchen tracker, this one never got made */
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
                  <p className="text-sm text-red-300 font-medium mb-1">
                    {t("rejected.notice")}
                  </p>
                  <p className="text-xs text-white/50">
                    {activeSelectedOrder.rejectionReason
                      ? `Reason: "${activeSelectedOrder.rejectionReason}"`
                      : t("rejected.itemsRestored")}
                  </p>
                </div>
              ) : (
                <OrderProgressTracker order={activeSelectedOrder} />
              )}

              {/* Items in this specific ticket */}
              <div className="pt-3 sm:pt-4 border-t border-white/10 space-y-2.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#F1E6C3] font-bold block">
                  Items in Ticket {formatTicketId(activeSelectedOrder.id)} ({activeSelectedOrder.items.reduce((s, i) => s + i.quantity, 0)}):
                </span>
                {activeSelectedOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-center text-xs text-white/90">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-[#F1E6C3]">
                        {it.quantity}×
                      </span>
                      <span className="font-medium">{it.name}</span>
                    </div>
                    <span className="font-mono text-white/50 shrink-0">{formatPrice(it.price * it.quantity)}</span>
                  </div>
                ))}
                {activeSelectedOrder.discountAmount > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] text-white/50">
                    <div className="flex justify-between">
                      <span>{t("subtotal")}</span>
                      <span className="font-mono">{formatPrice(activeSelectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#B7D39A]">
                      <span>Discount{activeSelectedOrder.offerCode ? ` (${activeSelectedOrder.offerCode})` : ""}</span>
                      <span className="font-mono">-{formatPrice(activeSelectedOrder.discountAmount)}</span>
                    </div>
                  </div>
                )}
              </div>

              {activeSelectedOrder.specialNotes && (
                <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-white/60 italic">
                  Note: &ldquo;{activeSelectedOrder.specialNotes}&rdquo;
                </div>
              )}

              {/* Where it's going and who to call — reassurance that we got it right. */}
              {activeSelectedOrder.customerName && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5 text-[11px] text-white/60">
                  <div className="flex items-center gap-2">
                    <User03Icon size={12} className="text-white/30 shrink-0" />
                    <span>
                      {activeSelectedOrder.customerName}
                      {activeSelectedOrder.customerPhone ? ` · ${activeSelectedOrder.customerPhone}` : ""}
                    </span>
                  </div>
                  {activeSelectedOrder.deliveryAddress && (
                    <div className="flex items-start gap-2">
                      <MapPinpoint01Icon size={12} className="text-white/30 shrink-0 mt-0.5" />
                      <span>{activeSelectedOrder.deliveryAddress}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List of All Other Tickets (Expandable Cards) */}
            {activeOrders.length > 1 && (
              <div className="w-full space-y-2.5 mb-6 text-start">
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/40 block px-1">
                  {t("allTickets", {
                    mode: tMode(activeSelectedOrder.type),
                    count: activeOrders.length,
                  })}
                </span>

                {activeOrders.map((order, idx) => {
                  const isSelected = order.id === activeSelectedOrder.id;
                  const isExpanded = !!expandedOrders[order.id];
                  const roundNum = activeOrders.length - idx;

                  return (
                    <div
                      key={order.id}
                      className={`rounded-2xl border transition-all ${
                        isSelected
                          ? "bg-white/[0.04] border-[#F1E6C3]/40"
                          : "bg-white/[0.02] border-white/10 hover:border-white/20"
                      } p-3.5 sm:p-4`}
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="flex items-center gap-3 text-start cursor-pointer flex-1"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-white">
                            R{roundNum}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-sm text-white font-medium">
                                Ticket {formatTicketId(order.id)}
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded-full font-mono text-[9px] font-bold ${
                                  order.status === "REJECTED"
                                    ? "bg-red-500/15 text-red-400"
                                    : order.status === "SERVED"
                                      ? "bg-white/[0.06] text-white/50"
                                      : order.status === "READY"
                                        ? "bg-[#B7D39A]/25 text-[#B7D39A]"
                                        : order.status === "PREPARING"
                                          ? "bg-[#F1E6C3]/20 text-[#F1E6C3]"
                                          : "bg-white/10 text-white/80"
                                }`}
                              >
                                {order.status === "REJECTED"
                                  ? t("status.rejected")
                                  : order.status === "SERVED"
                                    ? t(`modes.${order.type}.servedLabel`)
                                    : order.status === "READY"
                                      ? t(`modes.${order.type}.readyLabel`)
                                      : order.status === "PREPARING"
                                        ? "Preparing"
                                        : "Received"}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-white/40">
                              {formatOrderTime(order.createdAt)} · {order.items.length} item types · {formatPrice(order.totalPrice)}
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleOrderExpand(order.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                            aria-label={t("toggleDetails")}
                          >
                            <ArrowDown01Icon
                              size={16}
                              className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Item Breakdown */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                          {order.items.map((it) => (
                            <div key={it.id} className="flex justify-between items-center text-xs text-white/70">
                              <span>{it.quantity}× {it.name}</span>
                              <span className="font-mono text-white/40">{formatPrice(it.price * it.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <button
                type="button"
                onClick={navigateToMenus}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#F1E6C3] text-black font-extrabold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_4px_25px_rgba(241,230,195,0.35)] cursor-pointer"
              >
                <Add01Icon size={16} className="text-black" />
                <span>{t("requestMoreItems")}</span>
              </button>

              {hasItems && (
                <button
                  type="button"
                  onClick={() => setViewingOrderStatus(false)}
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/20 hover:border-white/50 text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  Review New Cart ({totalItems})
                </button>
              )}
            </div>

          </div>
        ) : !hasItems && !hasOrders ? (
          /* VIEW 2: FULL EMPTY STATE (ONLY WHEN NO ITEMS AND NO ACTIVE ORDERS) */
          <div className="cart-anim-item flex flex-col items-center text-center max-w-sm mx-auto py-8 sm:py-12">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-4 sm:mb-5">
              <ShoppingBag01Icon size={24} />
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-1.5 sm:mb-2">
              {copy("emptyTitle")}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-white/60 mb-6 sm:mb-8 leading-relaxed">
              {copy("emptyBody")}
            </p>
            <button
              onClick={navigateToMenus}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F1E6C3] text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <SparklesIcon size={14} />
              <span>{t("browseMenus")}</span>
            </button>
          </div>
        ) : (
          /* VIEW 3: ACTIVE CART ITEMS REVIEW & PLACE ORDER (MOBILE-OPTIMIZED) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start w-full">
            
            {/* Left: Items List */}
            <div className="lg:col-span-7 flex flex-col space-y-2.5 sm:space-y-3 max-h-[48vh] sm:max-h-[55vh] overflow-y-auto pe-1.5">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
                  {copy("cartTabLabel")} Items ({totalItems})
                </span>
                <button
                  onClick={clearCart}
                  className="font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                >
                  {t("clearAll")}
                </button>
              </div>

              {items.map((item) => {
                const brand = BRAND_CONFIG[item.brandId] || BRAND_CONFIG.coffee;
                const BrandIcon = brand.icon;

                return (
                  <div
                    key={item.id}
                    className="cart-anim-item group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-300 gap-2.5 sm:gap-0"
                  >
                    {/* Top part on mobile: Icon + Name + Brand + Delete */}
                    <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${brand.color}20`, color: brand.color }}
                        >
                          <BrandIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-serif text-sm sm:text-base text-white font-medium truncate max-w-[160px] sm:max-w-[200px]">
                              {item.name}
                            </h4>
                            <span
                              className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded font-bold shrink-0"
                              style={{ background: `${brand.color}25`, color: brand.color }}
                            >
                              {tBrands(item.brandId)}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-white/50 hidden sm:inline">
                            {formatPrice(item.price)} each
                          </span>
                        </div>
                      </div>

                      {/* Delete button (Mobile top right) */}
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={t("removeItem")}
                        className="text-white/30 hover:text-red-400 transition-colors p-1 cursor-pointer sm:hidden"
                      >
                        <Delete02Icon size={16} />
                      </button>
                    </div>

                    {/* Bottom part on mobile: Price & Quantity Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t border-white/5 sm:border-0 sm:ms-3">
                      <span className="font-mono text-xs text-white/60 sm:hidden">
                        {formatPrice(item.price)} each
                      </span>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 border border-white/10">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                            aria-label={t("decreaseQuantity")}
                          >
                            <Remove01Icon size={11} />
                          </button>
                          <span className="w-5 text-center font-mono text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                            aria-label={t("increaseQuantity")}
                          >
                            <Add01Icon size={11} />
                          </button>
                        </div>

                        <span className="font-mono text-sm font-bold text-white min-w-16 text-end">
                          {formatPrice(item.price * item.quantity)}
                        </span>

                        {/* Delete button (Desktop) */}
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={t("removeItem")}
                          className="text-white/30 hover:text-red-400 transition-colors p-1 cursor-pointer hidden sm:block"
                        >
                          <Delete02Icon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Table Order Review & Submit */}
            <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-6 backdrop-blur-xl flex flex-col justify-between shadow-2xl">
              <div>
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#F1E6C3] font-bold block mb-3">
                  {copy("destinationHeading")}
                </span>

                {needsModeChoice ? (
                  /* Nothing scanned and nothing remembered. The guest says where the order
                     goes before anything else — a wrong guess sends someone's food astray.
                     Dine in is offered here too, for someone already sitting down who
                     opened the site directly instead of scanning their table's QR. */
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {MODE_CHOICES.map((mode) => {
                      const ModeIcon = MODE_ICON[mode];
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setOrderMode(mode)}
                          className="group flex flex-col items-center gap-1.5 rounded-xl border border-white/15 bg-black/30 px-2 py-4 text-center transition-all hover:border-[#F1E6C3]/60 hover:bg-white/[0.06] active:scale-95 cursor-pointer"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1E6C3]/10 text-[#F1E6C3] transition-colors group-hover:bg-[#F1E6C3] group-hover:text-black">
                            <ModeIcon size={17} />
                          </span>
                          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                            {tMode(mode)}
                          </span>
                          <span className="font-sans text-[10px] leading-tight text-white/45">
                            {t(`modeHint.${mode}`)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {orderMode === "ON_TABLE" && tableConfirmed ? (
                      /* Either scanned, or already ordered here once this session — either
                         way it's not something to pick from a list or re-choose anymore. */
                      <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 mb-3">
                        <div className="flex items-center gap-2">
                          <Location01Icon size={15} className="text-[#F1E6C3]" />
                          <span className="font-serif text-xs sm:text-sm text-white font-medium">{t("tableLabel")}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#F1E6C3]">
                          {tableNumber !== null
                            ? tCommon("tableNumber", { number: formatTableDigits(tableNumber) })
                            : "—"}
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Still a free choice after the fact — someone who picked delivery
                            may decide to swing by and collect it, or to sit down instead. */}
                        <div className="p-1 rounded-xl bg-black/40 border border-white/10 grid grid-cols-3 gap-1 font-mono text-[10px] mb-3">
                          {MODE_CHOICES.map((mode) => {
                            const ModeIcon = MODE_ICON[mode];
                            const isActive = orderMode === mode;
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setOrderMode(mode)}
                                className={`py-2 px-1.5 rounded-lg flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all cursor-pointer ${
                                  isActive
                                    ? "bg-[#F1E6C3] text-black font-bold"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                              >
                                <ModeIcon size={13} />
                                <span>{tMode(mode)}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Walked in without scanning — they name the table themselves. */}
                        {orderMode === "ON_TABLE" && (
                          <TablePicker
                            tableNumber={tableNumber}
                            onSelect={(table) => {
                              setTableNumber(table);
                              setFieldErrors((f) => ({ ...f, table: undefined }));
                            }}
                            error={fieldErrors.table}
                          />
                        )}
                      </>
                    )}

                    {/* Asked of every guest now — a name and number to call, whether they're
                        at table four or across town. */}
                    <div className="space-y-2 mb-3">
                      <div>
                        <div
                          className={`flex items-center gap-2 px-3 rounded-xl bg-black/30 border transition-all ${
                            fieldErrors.name ? "border-red-500/60" : "border-white/10 focus-within:border-[#F1E6C3]"
                          }`}
                        >
                          <User03Icon size={14} className="text-white/40 shrink-0" />
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => {
                              setContact((c) => ({ ...c, name: e.target.value }));
                              setFieldErrors((f) => ({ ...f, name: undefined }));
                            }}
                            placeholder={t("namePlaceholder")}
                            autoComplete="name"
                            aria-invalid={!!fieldErrors.name}
                            className="flex-1 min-w-0 bg-transparent py-2.5 text-xs text-white placeholder-white/30 outline-none"
                          />
                        </div>
                        {fieldErrors.name && (
                          <span className="block px-1 mt-1 text-[10px] text-red-400 font-mono">{fieldErrors.name}</span>
                        )}
                      </div>

                      <div>
                        <div
                          className={`flex items-center gap-2 px-3 rounded-xl bg-black/30 border transition-all ${
                            fieldErrors.phone ? "border-red-500/60" : "border-white/10 focus-within:border-[#F1E6C3]"
                          }`}
                        >
                          <Call02Icon size={14} className="text-white/40 shrink-0" />
                          <input
                            type="tel"
                            inputMode="tel"
                            value={contact.phone}
                            onChange={(e) => {
                              setContact((c) => ({ ...c, phone: e.target.value }));
                              setFieldErrors((f) => ({ ...f, phone: undefined }));
                            }}
                            placeholder={t("phonePlaceholder")}
                            autoComplete="tel"
                            aria-invalid={!!fieldErrors.phone}
                            className="flex-1 min-w-0 bg-transparent py-2.5 text-xs text-white placeholder-white/30 outline-none"
                          />
                        </div>
                        {fieldErrors.phone && (
                          <span className="block px-1 mt-1 text-[10px] text-red-400 font-mono">{fieldErrors.phone}</span>
                        )}
                      </div>

                      {/* A blank date input reads as broken without a label, and the native
                          picker needs color-scheme:dark to not blind anyone on this sheet. */}
                      <div className="flex items-center gap-2 px-3 rounded-xl bg-black/30 border border-white/10 focus-within:border-[#F1E6C3] transition-all">
                        <BirthdayCakeIcon size={14} className="text-white/40 shrink-0" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-white/35 shrink-0">
                          {t("birthday")}
                        </span>
                        <input
                          type="date"
                          value={contact.birthday}
                          max={TODAY_ISO}
                          onChange={(e) => setContact((c) => ({ ...c, birthday: e.target.value }))}
                          aria-label={t("birthdayAria")}
                          className="flex-1 min-w-0 bg-transparent py-2.5 text-xs text-white/80 outline-none [color-scheme:dark]"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-white/25 shrink-0">
                          {t("optional")}
                        </span>
                      </div>

                      {orderMode === "DELIVERY" && (
                        <DeliveryLocationPicker
                          address={contact.address}
                          onAddressChange={(address) => {
                            setContact((c) => ({ ...c, address }));
                            setFieldErrors((f) => ({ ...f, address: undefined }));
                          }}
                          error={fieldErrors.address}
                        />
                      )}
                    </div>
                  </>
                )}

                {!needsModeChoice && (
                  <>
                {/* Special Kitchen Notes */}
                <div className="mb-4">
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-white/50 mb-1.5">
                    {t("kitchenNotes")}
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={t("notesPlaceholder")}
                    className="w-full bg-black/30 border border-white/10 focus:border-[#F1E6C3] rounded-xl p-2.5 text-xs text-white placeholder-white/30 outline-none transition-all resize-none"
                  />
                </div>

                {/* Offer Code */}
                <div className="mb-4">
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-white/50 mb-1.5">
                    {t("offerCode")}
                  </label>
                  {appliedOffer ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#B7D39A]/10 border border-[#B7D39A]/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <DiscountTag01Icon size={14} className="text-[#B7D39A] shrink-0" />
                        <span className="font-mono text-xs font-bold text-[#B7D39A] truncate">
                          {appliedOffer.code}
                          {appliedOffer.name ? ` · ${appliedOffer.name}` : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedOffer(null);
                          setOfferCodeInput("");
                        }}
                        aria-label={t("removeOfferCode")}
                        className="text-white/40 hover:text-white transition-colors cursor-pointer shrink-0 ms-2"
                      >
                        <Cancel01Icon size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={offerCodeInput}
                        onChange={(e) => setOfferCodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleApplyOfferCode();
                          }
                        }}
                        placeholder={t("offerPlaceholder")}
                        className="flex-1 min-w-0 bg-black/30 border border-white/10 focus:border-[#F1E6C3] rounded-xl p-2.5 text-xs text-white placeholder-white/30 outline-none transition-all uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyOfferCode}
                        disabled={!offerCodeInput.trim() || validateOfferMutation.isPending}
                        className="shrink-0 px-3.5 py-2.5 rounded-xl border border-white/20 hover:border-[#F1E6C3]/60 text-[10px] font-mono uppercase tracking-wider text-white/80 hover:text-[#F1E6C3] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {validateOfferMutation.isPending ? "Checking…" : "Apply"}
                      </button>
                    </div>
                  )}
                </div>
                  </>
                )}

                {/* Bill Summary */}
                <div className="space-y-1.5 pt-2.5 border-t border-white/10 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span>Items ({totalItems})</span>
                    <span className="font-mono">{formatPrice(totalPrice)}</span>
                  </div>
                  {appliedOffer && (
                    <div className="flex justify-between text-[#B7D39A]">
                      <span>Discount ({appliedOffer.code})</span>
                      <span className="font-mono">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t("hospitality")}</span>
                    <span className="font-mono text-[#B7D39A]">{t("included")}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-white/10 text-sm sm:text-base text-white font-serif font-medium">
                    <span>{orderMode === "ON_TABLE" ? t("roundTotal") : t("orderTotal")}</span>
                    <span className="font-mono font-bold text-[#F1E6C3] text-base sm:text-lg">
                      {formatPrice(finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 mt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placeOrderMutation.isPending || needsModeChoice}
                  className="group relative w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-full bg-[#F1E6C3] text-black font-extrabold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-white hover:scale-[1.02] active:scale-98 shadow-[0_4px_25px_rgba(241,230,195,0.35)] disabled:opacity-50 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 pointer-events-none" />
                  <span>{placeOrderMutation.isPending ? copy("submitPendingLabel") : copy("submitLabel")}</span>
                  <ArrowRight01Icon size={14} className="transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform icon-auto-dir" />
                </button>
                <span className="block text-center font-mono text-[9px] text-white/40 mt-2">
                  {copy("submitNote")}
                </span>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ─── Bottom Footer ─── */}
      <div className="cart-anim-item flex justify-between items-center w-full max-w-4xl mx-auto pt-3 border-t border-white/10 text-[9px] sm:text-[10px] text-white/40 font-mono uppercase tracking-widest shrink-0">
        <span>{t("footerBrand")}</span>
        <span>{t("footerTagline")}</span>
      </div>
    </div>
  );
}
