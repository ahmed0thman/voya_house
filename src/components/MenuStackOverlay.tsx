"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  Cancel01Icon,
  Touch01Icon,
  ArrowRight01Icon,
  ShoppingBag01Icon,
  Clock01Icon,
} from "hugeicons-react";
import BookletCard from "./BookletCard";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/constants/config";

type BrandId = "coffee" | "papa" | "mama";
const BRANDS: BrandId[] = ["coffee", "papa", "mama"];

interface MenuStackOverlayProps {
  initialBrandId: BrandId;
  onClose: () => void;
}

export default function MenuStackOverlay({
  initialBrandId,
  onClose,
}: MenuStackOverlayProps) {
  const [activeBrand, setActiveBrand] = useState<BrandId>(initialBrandId);
  const [isSwitching, setIsSwitching] = useState(false);
  const [hoverBrand, setHoverBrand] = useState<BrandId | null>(null);

  const totalItems = useCartStore((s) =>
    s.items.reduce((acc, i) => acc + i.quantity, 0),
  );
  const totalPrice = useCartStore((s) => s.getTotalPrice());
  const activeOrdersCount = useCartStore((s) => s.activeOrders.length);
  const openCart = useCartStore((s) => s.openCart);

  const overlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Record<BrandId, HTMLDivElement | null>>({
    coffee: null,
    papa: null,
    mama: null,
  });

  const getPositions = (active: BrandId) => {
    const others = BRANDS.filter((b) => b !== active);
    return {
      center: active,
      left: others[0],
      right: others[1],
    };
  };

  // ─── 1. Luxury Entrance Timeline (Aligned with RAF via useGSAP) ───
  useGSAP(
    () => {
      document.body.style.overflow = "hidden";
      const pos = getPositions(activeBrand);

      const tl = gsap.timeline();

      // Background overlay smooth fade
      tl.fromTo(
        bgRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.45, ease: "power2.out" },
      );

      // Active Center Card - Tactile 3D physical rise
      tl.fromTo(
        cardsRef.current[activeBrand],
        {
          y: 35,
          scale: 0.96,
          opacity: 0,
          rotationX: 8,
          z: 0,
          transformOrigin: "bottom center",
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          rotationX: 0,
          duration: 0.65,
          ease: "power3.out",
          force3D: true,
        },
        "<0.05",
      );

      // Left Stacked Card - Organic fan out behind left
      tl.fromTo(
        cardsRef.current[pos.left],
        {
          y: "12%",
          scale: 0.92,
          z: -80,
          rotationZ: 0,
          opacity: 0,
          transformOrigin: "bottom center",
        },
        {
          y: "5%",
          scale: 0.95,
          z: -50,
          rotationZ: 5,
          opacity: 0.7,
          duration: 0.65,
          ease: "power3.out",
          force3D: true,
        },
        "<0.08",
      );

      // Right Stacked Card - Organic fan out behind right
      tl.fromTo(
        cardsRef.current[pos.right],
        {
          y: "18%",
          scale: 0.88,
          z: -140,
          rotationZ: 0,
          opacity: 0,
          transformOrigin: "bottom center",
        },
        {
          y: "10%",
          scale: 0.9,
          z: -100,
          rotationZ: 10,
          opacity: 0.4,
          duration: 0.65,
          ease: "power3.out",
          force3D: true,
        },
        "<0.08",
      );

      // Controls (Switcher, Hold Indicator, Close Button)
      tl.fromTo(
        ".overlay-control",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 },
        "<0.15",
      );

      return () => {
        document.body.style.overflow = "";
      };
    },
    { scope: overlayRef },
  );

  // ─── 2. Swiping & Fan-Out Animation (Transform + Opacity only, zero boxShadow churn) ───
  useGSAP(
    () => {
      const pos = getPositions(activeBrand);

      if (isSwitching) {
        // Fan out cards smoothly
        gsap.to(cardsRef.current[pos.center], {
          scale: 0.6,
          y: "-30%",
          x: "0%",
          z: -100,
          rotationY: 0,
          rotationZ: 0,
          opacity: hoverBrand === pos.center ? 1 : 0.8,
          duration: 0.45,
          ease: "power3.out",
          transformOrigin: "bottom center",
          force3D: true,
        });

        gsap.to(cardsRef.current[pos.left], {
          scale: hoverBrand === pos.left ? 0.7 : 0.6,
          y: hoverBrand === pos.left ? "-15%" : "-30%",
          x: hoverBrand === pos.left ? "0%" : "-30%",
          z: hoverBrand === pos.left ? -50 : -200,
          rotationY: hoverBrand === pos.left ? 0 : 15,
          rotationZ: hoverBrand === pos.left ? 0 : -5,
          opacity: hoverBrand === pos.left ? 1 : 0.5,
          duration: 0.45,
          ease: "power3.out",
          transformOrigin: "bottom center",
          force3D: true,
        });

        gsap.to(cardsRef.current[pos.right], {
          scale: hoverBrand === pos.right ? 0.7 : 0.6,
          y: hoverBrand === pos.right ? "-15%" : "-30%",
          x: hoverBrand === pos.right ? "0%" : "30%",
          z: hoverBrand === pos.right ? -50 : -200,
          rotationY: hoverBrand === pos.right ? 0 : -15,
          rotationZ: hoverBrand === pos.right ? 0 : 5,
          opacity: hoverBrand === pos.right ? 1 : 0.5,
          duration: 0.45,
          ease: "power3.out",
          transformOrigin: "bottom center",
          force3D: true,
        });
      } else {
        // Stack collapsed (React Swiper cards style)
        gsap.to(cardsRef.current[pos.center], {
          scale: 1,
          y: "0%",
          x: "0%",
          z: 0,
          rotationY: 0,
          rotationZ: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power3.out",
          transformOrigin: "bottom center",
          force3D: true,
        });

        gsap.to(cardsRef.current[pos.left], {
          scale: 0.95,
          y: "5%",
          x: "0%",
          z: -50,
          rotationY: 0,
          rotationZ: 5,
          opacity: 0.7,
          duration: 0.5,
          ease: "power3.out",
          transformOrigin: "bottom center",
          force3D: true,
        });

        gsap.to(cardsRef.current[pos.right], {
          scale: 0.9,
          y: "10%",
          x: "0%",
          z: -100,
          rotationY: 0,
          rotationZ: 10,
          opacity: 0.4,
          duration: 0.5,
          ease: "power3.out",
          transformOrigin: "bottom center",
          force3D: true,
        });
      }
    },
    { scope: overlayRef, dependencies: [isSwitching, activeBrand, hoverBrand] },
  );

  // ─── 3. Clean Exit Timeline ───
  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });

    tl.to(".overlay-control", { opacity: 0, duration: 0.2, ease: "power2.in" });

    BRANDS.forEach((brand) => {
      tl.to(
        cardsRef.current[brand],
        {
          opacity: 0,
          y: 25,
          duration: 0.35,
          ease: "power2.in",
          force3D: true,
        },
        0,
      );
    });

    tl.to(
      bgRef.current,
      {
        opacity: 0,
        duration: 0.35,
        ease: "power2.in",
      },
      0,
    );
  };

  // ─── 4. Switcher Handlers ───
  const handlePointerMove = (e: PointerEvent) => {
    if (!isSwitching) return;

    const width = window.innerWidth;
    const x = e.clientX;
    const pos = getPositions(activeBrand);

    if (x < width * 0.35) {
      setHoverBrand(pos.left);
    } else if (x > width * 0.65) {
      setHoverBrand(pos.right);
    } else {
      setHoverBrand(pos.center);
    }
  };

  const handlePointerUp = () => {
    if (hoverBrand && hoverBrand !== activeBrand) {
      setActiveBrand(hoverBrand);
    }
    setIsSwitching(false);
    setHoverBrand(null);
  };

  useEffect(() => {
    if (isSwitching) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };
    }
  }, [isSwitching, hoverBrand, activeBrand]);

  const handlePointerDown = () => {
    setIsSwitching(true);
    setHoverBrand(activeBrand);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden flex-col select-none"
      style={{ perspective: "1200px", WebkitTouchCallout: "none" }}
    >
      {/* Background Click to close */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 backdrop-blur-[16px] bg-black/60 opacity-0"
        onClick={handleClose}
      />

      {/* 3D Booklet Container - Sized to comfortably clear floating top controls */}
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-4xl h-[calc(100dvh-7.5rem)] max-h-194 sm:max-h-200 mt-7 sm:mt-9 mb-12 sm:mb-14"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Render Booklets */}
        {BRANDS.map((brand) => (
          <BookletCard
            key={brand}
            ref={(el) => {
              cardsRef.current[brand] = el;
            }}
            className="opacity-0"
            brandId={brand}
            isActive={brand === activeBrand && !isSwitching}
            isInitialActive={brand === initialBrandId}
          />
        ))}
      </div>

      {/* ─── Top Utility Bar: Floating Table Order & Close Buttons ─── */}
      {/* Floating Table Order Button (Light Theme, visible only when user has items in cart or active orders) */}
      {(totalItems > 0 || activeOrdersCount > 0) && (
        <button
          onClick={openCart}
          aria-label={`View Table Order (${totalItems} items)`}
          className="overlay-control absolute top-3.5 left-4 sm:top-5 sm:left-6 z-50 group flex items-center gap-2 sm:gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-[#F1E6C3] hover:bg-white text-black border border-black/10 hover:border-black/20 backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        >
          {/* Pulsing indicator when cart has items or active order */}
          {totalItems > 0 ? (
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-black shadow-[0_0_6px_rgba(0,0,0,0.4)]"></span>
            </span>
          ) : activeOrdersCount > 0 ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D421A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2D421A] shadow-[0_0_8px_rgba(45,66,26,0.5)]"></span>
            </span>
          ) : null}

          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/10 flex items-center justify-center text-black shrink-0">
            {totalItems > 0 ? (
              <ShoppingBag01Icon size={13} className="text-black" />
            ) : (
              <Clock01Icon size={13} className="text-[#2D421A]" />
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
            <span className="text-black font-bold">
              {totalItems > 0
                ? `${totalItems} Item${totalItems > 1 ? "s" : ""}`
                : `${activeOrdersCount} in Kitchen`}
            </span>
            {totalItems > 0 && (
              <>
                <span className="text-black/30">·</span>
                <span className="text-black font-bold">
                  {formatPrice(totalPrice)}
                </span>
              </>
            )}
          </div>

          <span className="font-mono text-[10px] uppercase tracking-wider text-black/60 group-hover:text-black transition-colors pl-0.5 hidden sm:inline">
            View ↗
          </span>
        </button>
      )}

      {/* Global Close Button (Symmetrically aligned on the right) */}
      <button
        onClick={handleClose}
        aria-label="Close Booklet Menu"
        className="overlay-control opacity-0 absolute top-3.5 right-4 sm:top-5 sm:right-6 z-50 p-2 sm:p-2.5 bg-black/80 hover:bg-black/95 text-white/80 hover:text-white rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-white/20 hover:border-white/40 backdrop-blur-xl transition-all hover:scale-105 active:scale-95 group cursor-pointer"
      >
        <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
        <Cancel01Icon size={18} className="relative z-10" />
      </button>

      {/* SVG Arcs during Switch - Overlaid globally */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-40 transition-opacity duration-300"
        style={{ opacity: isSwitching ? 1 : 0 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Arched dashed paths from bottom center to left and right cards */}
        <path
          d="M 50 90 Q 50 50 20 50"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          className="animate-pulse"
        />
        <path
          d="M 50 90 Q 50 50 80 50"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          className="animate-pulse"
        />
      </svg>

      {/* The Switcher Button - Positioned Under the Booklet Container */}
      <div className="overlay-control opacity-0 absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        {isSwitching && (
          <span className="text-white/80 text-[10px] uppercase tracking-widest font-mono font-bold animate-pulse absolute -top-6 w-max">
            Swipe to switch
          </span>
        )}

        <div className="relative flex items-center">
          {/* HOLD Label and Wiggling Arrow */}
          {!isSwitching && (
            <div className="absolute right-full mr-3 flex items-center gap-1.5 pointer-events-none opacity-90">
              <span className="text-white text-sm font-mono font-bold uppercase tracking-widest pt-0.5">
                Hold
              </span>
              <ArrowRight01Icon
                size={18}
                className="animate-wiggle-arrow text-white"
                strokeWidth={2.5}
              />
            </div>
          )}

          <button
            onPointerDown={handlePointerDown}
            className="relative p-3.5 bg-white/20 backdrop-blur-xl border border-white/40 text-white rounded-full hover:scale-110 active:scale-95 transition-transform group shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            style={{ touchAction: "none" }}
          >
            <div className="absolute inset-0 rounded-full bg-white/40 blur-xl animate-[pulse_2s_ease-in-out_infinite]" />
            <Touch01Icon size={24} className="relative z-10" />
          </button>
        </div>
      </div>

      {/* Inline styles for custom animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes wiggle-arrow {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        .animate-wiggle-arrow {
          animation: wiggle-arrow 1.5s ease-in-out infinite;
        }
      `,
        }}
      />
    </div>
  );
}
