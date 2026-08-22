"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Cancel01Icon,
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  SparklesIcon,
  Location01Icon,
  ArrowRight01Icon,
  ShoppingBag01Icon,
} from "hugeicons-react";
import { useCartStore } from "@/store/useCartStore";

interface HeaderProps {
  onOpenBooklet?: (menu: "coffee" | "papa" | "mama") => void;
}

const NAV_LINKS = [
  { id: "booklets", label: "The Trilogy Showroom", num: "01", tag: "Collectible Menus", icon: SparklesIcon },
  { id: "story", label: "About Voya House", num: "02", tag: "Our Story & Sanctuary", icon: SparklesIcon },
  { id: "contact", label: "Visit & Concierge", num: "03", tag: "Flagship & Inquiries", icon: Location01Icon },
];

const QUICK_BOOKLETS = [
  { id: "coffee" as const, label: "Voya Coffee", desc: "Specialty Roasts & Rituals", icon: Coffee01Icon, color: "#F1E6C3" },
  { id: "papa" as const, label: "Papa Voya", desc: "Mindful Meals & Vitality", icon: Leaf01Icon, color: "#B7D39A" },
  { id: "mama" as const, label: "Mama Voya", desc: "Comfort Food & Family Table", icon: Pizza01Icon, color: "#D8A98F" },
];

export default function Header({ onOpenBooklet }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const openCart = useCartStore((s) => s.openCart);
  const activeOrdersCount = useCartStore((s) => s.activeOrders.length);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // GSAP animation for mobile sheet
  useGSAP(
    () => {
      if (!sheetRef.current) return;

      if (isOpen) {
        gsap.fromTo(
          sheetRef.current,
          { opacity: 0, backdropFilter: "blur(0px)" },
          { opacity: 1, backdropFilter: "blur(24px)", duration: 0.4, ease: "power3.out" }
        );

        gsap.fromTo(
          sheetRef.current.querySelectorAll(".sheet-anim-item"),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power3.out", delay: 0.1 }
        );
      }
    },
    { dependencies: [isOpen], scope: sheetRef }
  );

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleBookletClick = (menu: "coffee" | "papa" | "mama") => {
    setIsOpen(false);
    onOpenBooklet?.(menu);
  };

  const handleCartClick = () => {
    setIsOpen(false);
    openCart();
  };

  return (
    <>
      <header className="voya-header fixed top-0 left-0 w-full z-40 px-4 sm:px-6 py-4 md:px-12 pointer-events-none text-white transition-all duration-300">
        {/* Dynamic Glassy Background & Glowing Bottom Border */}
        <div className="header-bg absolute inset-0 pointer-events-none opacity-0 invisible bg-[#080907]/45 backdrop-blur-xl" />
        <div
          className="header-glow absolute bottom-0 left-0 w-full h-[1px] pointer-events-none opacity-0 invisible shadow-[0_1px_10px_rgba(241,230,195,0.5),0_0_20px_rgba(255,255,255,0.25)]"
          style={{
            background:
              "linear-gradient(90deg, rgba(241, 230, 195, 0) 0%, rgba(241, 230, 195, 0.4) 20%, rgba(255, 255, 255, 0.85) 50%, rgba(241, 230, 195, 0.4) 80%, rgba(241, 230, 195, 0) 100%)",
          }}
        />

        <div className="relative z-10 flex justify-between items-center w-full max-w-7xl mx-auto pointer-events-auto">
          
          {/* Logo / Brand Name */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="header-brand-logo font-serif text-2xl tracking-[0.1em] flex items-center gap-3 font-medium text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] cursor-pointer group transition-opacity duration-300"
          >
            <span>VOYA</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#F1E6C3] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-block">
              House
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 px-6 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="font-mono text-xs uppercase tracking-[0.2em] text-white/70 hover:text-[#F1E6C3] transition-colors cursor-pointer"
              >
                {link.label.replace("The ", "").replace("About ", "")}
              </button>
            ))}
          </nav>

          {/* Right Actions: Cart Button & Menu Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Luxury Cart Button */}
            <button
              onClick={handleCartClick}
              aria-label={`Table Cart (${totalItems} items)`}
              className="relative inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 rounded-full bg-[#F1E6C3] hover:bg-white text-black font-mono text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.25)] active:scale-95 cursor-pointer"
            >
              {/* Glowing Pulsing Dot when Cart is Not Empty */}
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F1E6C3] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#F1E6C3] shadow-[0_0_12px_rgba(241,230,195,1)] border-2 border-black"></span>
                </span>
              )}

              <ShoppingBag01Icon size={16} className="text-black shrink-0" />
              <span className="hidden sm:inline">
                {totalItems > 0 ? `Order (${totalItems})` : activeOrdersCount > 0 ? `Orders (${activeOrdersCount})` : "Order"}
              </span>
              <span className="sm:hidden font-mono text-xs">
                {totalItems > 0 ? totalItems : ""}
              </span>
            </button>

            {/* Hamburger Button with Frosted Capsule */}
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open Navigation Menu"
              className="flex flex-col items-end space-y-[5px] p-2.5 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md hover:bg-black/60 active:scale-95 group cursor-pointer transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
            >
              <span className="block w-5 h-[2px] bg-white transition-all duration-300 group-hover:w-6 group-hover:bg-[#F1E6C3]"></span>
              <span className="block w-3.5 h-[2px] bg-white transition-all duration-300 group-hover:w-6 group-hover:bg-[#F1E6C3]"></span>
            </button>
          </div>

        </div>
      </header>

      {/* ─── Mobile / Full-Screen Menu Sheet ─── */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={sheetRef}
            className="fixed inset-0 z-[100] bg-[#080907]/95 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-10 md:p-14 overflow-y-auto text-white"
          >
            {/* Top Bar inside Sheet */}
            <div className="sheet-anim-item flex justify-between items-center w-full max-w-5xl mx-auto pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/logos/Asset 8.svg"
                  alt="Voya Logo"
                  width={28}
                  height={28}
                  className="opacity-90 brightness-110"
                />
                <span className="font-serif text-xl tracking-[0.15em] font-medium text-white">
                  VOYA HOUSE
                </span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close Menu"
                className="w-11 h-11 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <Cancel01Icon size={18} />
              </button>
            </div>

            {/* Center Navigation Content */}
            <div className="w-full max-w-5xl mx-auto my-auto py-8 grid grid-cols-1 md:grid-cols-12 gap-10">
              {/* Primary Section Links */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                <span className="sheet-anim-item font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold mb-2">
                  Navigation Directory
                </span>

                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="sheet-anim-item group flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-[#F1E6C3]/40 bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] group-hover:scale-105 transition-transform shrink-0">
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#F1E6C3]/60 font-bold">
                              {link.num}
                            </span>
                            <h3 className="font-serif text-lg sm:text-xl text-white group-hover:text-[#F1E6C3] transition-colors font-medium">
                              {link.label}
                            </h3>
                          </div>
                          <p className="font-sans text-xs text-white/50">
                            {link.tag}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-[#F1E6C3] group-hover:text-black flex items-center justify-center text-white/60 transition-all">
                        <ArrowRight01Icon size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quick 3D Menus Drawer & Cart Link */}
              <div className="md:col-span-5 flex flex-col space-y-3">
                <span className="sheet-anim-item font-mono text-[10px] uppercase tracking-[0.25em] text-[#F1E6C3]/80 font-bold mb-2">
                  Instant Menu Booklets
                </span>

                {QUICK_BOOKLETS.map((booklet) => {
                  const Icon = booklet.icon;
                  return (
                    <button
                      key={booklet.id}
                      onClick={() => handleBookletClick(booklet.id)}
                      className="sheet-anim-item group flex items-center gap-4 p-3.5 rounded-2xl border border-white/10 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.08] transition-all text-left cursor-pointer"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${booklet.color}20`, color: booklet.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-base text-white group-hover:text-[#F1E6C3] transition-colors truncate">
                          {booklet.label}
                        </h4>
                        <p className="font-sans text-[11px] text-white/50 truncate">
                          {booklet.desc}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 group-hover:text-white shrink-0">
                        Open ↗
                      </span>
                    </button>
                  );
                })}

                {/* View Table Order inside Sheet */}
                <button
                  onClick={handleCartClick}
                  className="sheet-anim-item group mt-2 flex items-center justify-between p-4 rounded-2xl border border-[#F1E6C3]/30 bg-[#F1E6C3]/10 hover:bg-[#F1E6C3]/20 transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F1E6C3] text-black flex items-center justify-center">
                      <ShoppingBag01Icon size={16} />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-white block">
                        Table Cart & Status
                      </span>
                      <span className="font-sans text-[11px] text-white/60">
                        {totalItems > 0 ? `${totalItems} unplaced items` : activeOrdersCount > 0 ? `${activeOrdersCount} active requests` : "No items yet"}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#F1E6C3] font-bold">
                    View ↗
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Sheet Footer */}
            <div className="sheet-anim-item flex flex-col sm:flex-row justify-between items-center w-full max-w-5xl mx-auto pt-6 border-t border-white/10 gap-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-xs text-white/50 font-mono">
                <span>123 Voyage Street, New Cairo</span>
                <span className="hidden sm:inline">·</span>
                <span>07:00 &mdash; 23:00 Daily</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-[#F1E6C3]">
                <a href="mailto:concierge@voyahouse.com" className="hover:underline">
                  concierge@voyahouse.com
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
