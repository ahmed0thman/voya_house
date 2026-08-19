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
} from "hugeicons-react";
import { useCartStore, PlacedOrder } from "@/store/useCartStore";
import { formatPrice } from "@/constants/config";

const BRAND_CONFIG = {
  coffee: { label: "Voya Coffee", color: "#F1E6C3", icon: Coffee01Icon },
  papa: { label: "Papa Voya", color: "#B7D39A", icon: Leaf01Icon },
  mama: { label: "Mama Voya", color: "#D8A98F", icon: Pizza01Icon },
};

export default function CartSheet() {
  const {
    items,
    activeOrders,
    tableNumber,
    isCartOpen,
    viewingOrderStatus,
    closeCart,
    setViewingOrderStatus,
    updateQuantity,
    removeItem,
    clearCart,
    placeOrder,
    getTotalPrice,
    getTotalItems,
  } = useCartStore();

  const [specialNotes, setSpecialNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const hasItems = items.length > 0;
  const hasOrders = activeOrders.length > 0;

  // Set default selected order to latest order when available
  const activeSelectedOrder: PlacedOrder | undefined =
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

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newOrder = placeOrder(specialNotes);
      if (newOrder) {
        setSelectedOrderId(newOrder.id);
      }
      setSpecialNotes("");
      setIsSubmitting(false);
    }, 600);
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

  return (
    <div
      ref={sheetRef}
      className="fixed inset-0 z-[100] bg-[#080907]/95 backdrop-blur-2xl flex flex-col justify-between p-3.5 sm:p-6 md:p-10 overflow-y-auto text-white select-none"
    >
      {/* ─── Top Header Bar ─── */}
      <div className="cart-anim-item flex justify-between items-center w-full max-w-4xl mx-auto pb-3 sm:pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] shrink-0">
            <ShoppingBag01Icon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg sm:text-2xl text-white font-medium">
                {showOrderStatus ? "Table Orders" : "Table Cart"}
              </h2>
              <span className="px-2 py-0.5 rounded-full border border-[#F1E6C3]/30 bg-[#F1E6C3]/10 font-mono text-[9px] sm:text-[10px] text-[#F1E6C3] font-bold">
                {tableNumber}
              </span>
            </div>
            <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-white/50">
              In-House Dining · Sanctuary
            </p>
          </div>
        </div>

        <button
          onClick={closeCart}
          aria-label="Close Cart"
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
              <span>New Round ({totalItems})</span>
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
              <span>In Kitchen ({activeOrders.length})</span>
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
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/40 shrink-0 mr-1">
                  Tickets:
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
                      <span className="opacity-60 text-[10px]">({order.id})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Ticket Status Card */}
            <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 mb-5 sm:mb-8 text-left shadow-xl">
              
              {/* Ticket Top Header */}
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#F1E6C3]/20 text-[#F1E6C3] flex items-center justify-center font-bold text-xs">
                    {activeOrders.findIndex((o) => o.id === activeSelectedOrder.id) + 1}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg sm:text-xl text-white font-medium">
                      Ticket {activeSelectedOrder.id}
                    </h3>
                    <span className="font-mono text-[10px] text-white/50">
                      Placed at {activeSelectedOrder.placedAt} · {activeSelectedOrder.tableNumber}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#B7D39A]/20 border border-[#B7D39A]/40 text-[#B7D39A] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7D39A] animate-ping" />
                  In Preparation
                </span>
              </div>

              {/* 3 Step Live Progress Tracker */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 relative mb-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-7 h-7 rounded-full bg-[#B7D39A] text-black font-bold text-xs flex items-center justify-center mb-1.5 shadow-[0_0_15px_rgba(183,211,154,0.5)]">
                    ✓
                  </div>
                  <span className="font-mono text-[9px] sm:text-[10px] text-white/90 font-bold">1. Received</span>
                  <span className="font-mono text-[8px] sm:text-[9px] text-white/40">Barista / Chef</span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-7 h-7 rounded-full bg-[#F1E6C3] text-black font-bold text-xs flex items-center justify-center mb-1.5 animate-bounce shadow-[0_0_15px_rgba(241,230,195,0.5)]">
                    ●
                  </div>
                  <span className="font-mono text-[9px] sm:text-[10px] text-[#F1E6C3] font-bold">2. Preparing</span>
                  <span className="font-mono text-[8px] sm:text-[9px] text-white/40">Crafting Round</span>
                </div>

                <div className="flex flex-col items-center text-center opacity-40">
                  <div className="w-7 h-7 rounded-full border border-white/30 text-white font-bold text-xs flex items-center justify-center mb-1.5">
                    3
                  </div>
                  <span className="font-mono text-[9px] sm:text-[10px] text-white/60">3. Serving</span>
                  <span className="font-mono text-[8px] sm:text-[9px] text-white/40">To {tableNumber}</span>
                </div>
              </div>

              {/* Items in this specific ticket */}
              <div className="pt-3 sm:pt-4 border-t border-white/10 space-y-2.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#F1E6C3] font-bold block">
                  Items in Ticket {activeSelectedOrder.id} ({activeSelectedOrder.items.reduce((s, i) => s + i.quantity, 0)}):
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
              </div>

              {activeSelectedOrder.specialNotes && (
                <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-white/60 italic">
                  Note: &ldquo;{activeSelectedOrder.specialNotes}&rdquo;
                </div>
              )}
            </div>

            {/* List of All Other Tickets (Expandable Cards) */}
            {activeOrders.length > 1 && (
              <div className="w-full space-y-2.5 mb-6 text-left">
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/40 block px-1">
                  All Table Tickets ({activeOrders.length} rounds sent):
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
                          className="flex items-center gap-3 text-left cursor-pointer flex-1"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-white">
                            R{roundNum}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-sm text-white font-medium">
                                Ticket {order.id}
                              </span>
                              <span className="px-2 py-0.2 rounded-full bg-[#B7D39A]/20 text-[#B7D39A] font-mono text-[9px] font-bold">
                                In Kitchen
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-white/40">
                              {order.placedAt} · {order.items.length} item types · {formatPrice(order.totalPrice)}
                            </span>
                          </div>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleOrderExpand(order.id)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                            aria-label="Toggle details"
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
                <span>Request More Items</span>
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
              Your Table Order is Empty
            </h3>
            <p className="font-sans text-xs sm:text-sm text-white/60 mb-6 sm:mb-8 leading-relaxed">
              Explore our 3D menu booklets to select specialty coffee, healthy dishes, or comfort food for your table.
            </p>
            <button
              onClick={navigateToMenus}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F1E6C3] text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <SparklesIcon size={14} />
              <span>Browse Menus</span>
            </button>
          </div>
        ) : (
          /* VIEW 3: ACTIVE CART ITEMS REVIEW & PLACE ORDER (MOBILE-OPTIMIZED) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start w-full">
            
            {/* Left: Items List */}
            <div className="lg:col-span-7 flex flex-col space-y-2.5 sm:space-y-3 max-h-[48vh] sm:max-h-[55vh] overflow-y-auto pr-1.5">
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">
                  New Round Items ({totalItems})
                </span>
                <button
                  onClick={clearCart}
                  className="font-mono text-[10px] uppercase tracking-wider text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear All
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
                              {brand.label}
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
                        aria-label="Remove item"
                        className="text-white/30 hover:text-red-400 transition-colors p-1 cursor-pointer sm:hidden"
                      >
                        <Delete02Icon size={16} />
                      </button>
                    </div>

                    {/* Bottom part on mobile: Price & Quantity Controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t border-white/5 sm:border-0 sm:ml-3">
                      <span className="font-mono text-xs text-white/60 sm:hidden">
                        {formatPrice(item.price)} each
                      </span>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/40 border border-white/10">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Remove01Icon size={11} />
                          </button>
                          <span className="w-5 text-center font-mono text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Add01Icon size={11} />
                          </button>
                        </div>

                        <span className="font-mono text-sm font-bold text-white min-w-16 text-right">
                          {formatPrice(item.price * item.quantity)}
                        </span>

                        {/* Delete button (Desktop) */}
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
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
                  Destination & Notes
                </span>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Location01Icon size={15} className="text-[#F1E6C3]" />
                    <span className="font-serif text-xs sm:text-sm text-white font-medium">Table</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#F1E6C3]">
                    {tableNumber}
                  </span>
                </div>

                {/* Special Kitchen Notes */}
                <div className="mb-4">
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-white/50 mb-1.5">
                    Kitchen Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Extra hot, ice on side..."
                    className="w-full bg-black/30 border border-white/10 focus:border-[#F1E6C3] rounded-xl p-2.5 text-xs text-white placeholder-white/30 outline-none transition-all resize-none"
                  />
                </div>

                {/* Bill Summary */}
                <div className="space-y-1.5 pt-2.5 border-t border-white/10 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span>Round Items ({totalItems})</span>
                    <span className="font-mono">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hospitality</span>
                    <span className="font-mono text-[#B7D39A]">Included</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-white/10 text-sm sm:text-base text-white font-serif font-medium">
                    <span>Round Total</span>
                    <span className="font-mono font-bold text-[#F1E6C3] text-base sm:text-lg">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 mt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  className="group relative w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-full bg-[#F1E6C3] text-black font-extrabold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-white hover:scale-[1.02] active:scale-98 shadow-[0_4px_25px_rgba(241,230,195,0.35)] disabled:opacity-50 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 pointer-events-none" />
                  <span>{isSubmitting ? "Transmitting..." : "Send Request to Kitchen"}</span>
                  <ArrowRight01Icon size={14} className="transform group-hover:translate-x-1 transition-transform" />
                </button>
                <span className="block text-center font-mono text-[9px] text-white/40 mt-2">
                  No payment online · Settle at table
                </span>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ─── Bottom Footer ─── */}
      <div className="cart-anim-item flex justify-between items-center w-full max-w-4xl mx-auto pt-3 border-t border-white/10 text-[9px] sm:text-[10px] text-white/40 font-mono uppercase tracking-widest shrink-0">
        <span>Voya Sanctuary</span>
        <span>Every Sip a New Trip</span>
      </div>
    </div>
  );
}
