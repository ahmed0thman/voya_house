"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import { Cancel01Icon, Touch01Icon, ArrowRight01Icon } from "hugeicons-react";
import BookletCard from "./BookletCard";

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

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // 1. Instantly set the geometric states of all cards without animating
    const pos = getPositions(activeBrand);
    
    gsap.set(cardsRef.current[activeBrand], {
      y: "0%",
      rotationX: 0,
      scale: 1,
      z: 0,
      transformOrigin: "bottom center",
    });

    gsap.set(cardsRef.current[pos.left], {
      y: "5%",
      scale: 0.95,
      z: -50,
      rotationZ: 5,
      transformOrigin: "bottom center",
    });
    
    gsap.set(cardsRef.current[pos.right], {
      y: "10%",
      scale: 0.9,
      z: -100,
      rotationZ: 10,
      transformOrigin: "bottom center",
    });

    // 2. Delay the animation slightly to allow React and the browser to 
    // finish painting the heavy DOM (3 full menus). This prevents main-thread blocking lag.
    const entranceTimer = setTimeout(() => {
      gsap.to(bgRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      });

      gsap.to(cardsRef.current[activeBrand], {
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
      });

      gsap.to(cardsRef.current[pos.left], {
        opacity: 0.7,
        duration: 0.8,
        ease: "power2.out",
      });
      
      gsap.to(cardsRef.current[pos.right], {
        opacity: 0.4,
        duration: 0.8,
        ease: "power2.out",
      });
    }, 50);

    return () => {
      clearTimeout(entranceTimer);
      document.body.style.overflow = "";
    };
  }, []); // Run only on mount

  // Handle Switcher Animation
  useEffect(() => {
    const pos = getPositions(activeBrand);

    if (isSwitching) {
      // Fan out at 40% scale
      gsap.to(cardsRef.current[pos.center], {
        scale: 0.6,
        y: "-30%",
        x: "0%",
        z: -100,
        rotationY: 0,
        rotationZ: 0,
        opacity: hoverBrand === pos.center ? 1 : 0.8,
        boxShadow:
          hoverBrand === pos.center
            ? "0 0 80px rgba(255,255,255,0.6)"
            : "0 20px 40px rgba(0,0,0,0.4)",
        duration: 0.5,
        ease: "power3.out",
        transformOrigin: "bottom center",
      });

      gsap.to(cardsRef.current[pos.left], {
        scale: hoverBrand === pos.left ? 0.7 : 0.6,
        y: hoverBrand === pos.left ? "-15%" : "-30%",
        x: hoverBrand === pos.left ? "0%" : "-30%",
        z: hoverBrand === pos.left ? -50 : -200,
        rotationY: hoverBrand === pos.left ? 0 : 15,
        rotationZ: hoverBrand === pos.left ? 0 : -5,
        opacity: hoverBrand === pos.left ? 1 : 0.5,
        boxShadow:
          hoverBrand === pos.left
            ? "0 0 80px rgba(255,255,255,0.6)"
            : "0 20px 40px rgba(0,0,0,0.4)",
        duration: 0.5,
        ease: "power3.out",
        transformOrigin: "bottom center",
      });

      gsap.to(cardsRef.current[pos.right], {
        scale: hoverBrand === pos.right ? 0.7 : 0.6,
        y: hoverBrand === pos.right ? "-15%" : "-30%",
        x: hoverBrand === pos.right ? "0%" : "30%",
        z: hoverBrand === pos.right ? -50 : -200,
        rotationY: hoverBrand === pos.right ? 0 : -15,
        rotationZ: hoverBrand === pos.right ? 0 : 5,
        opacity: hoverBrand === pos.right ? 1 : 0.5,
        boxShadow:
          hoverBrand === pos.right
            ? "0 0 80px rgba(255,255,255,0.6)"
            : "0 20px 40px rgba(0,0,0,0.4)",
        duration: 0.5,
        ease: "power3.out",
        transformOrigin: "bottom center",
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
        boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
        duration: 0.6,
        ease: "power3.out",
        transformOrigin: "bottom center",
      });

      gsap.to(cardsRef.current[pos.left], {
        scale: 0.95,
        y: "5%",
        x: "0%",
        z: -50,
        rotationY: 0,
        rotationZ: 5,
        opacity: 0.7,
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        duration: 0.6,
        ease: "power3.out",
        transformOrigin: "bottom center",
      });

      gsap.to(cardsRef.current[pos.right], {
        scale: 0.9,
        y: "10%",
        x: "0%",
        z: -100,
        rotationY: 0,
        rotationZ: 10,
        opacity: 0.4,
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        duration: 0.6,
        ease: "power3.out",
        transformOrigin: "bottom center",
      });
    }
  }, [isSwitching, activeBrand, hoverBrand]);

  const handleClose = () => {
    const tl = gsap.timeline({ onComplete: onClose });

    // Animate all out
    BRANDS.forEach((brand) => {
      tl.to(
        cardsRef.current[brand],
        {
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
        },
        0,
      );
    });

    tl.to(
      bgRef.current,
      {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
      },
      "-=0.2",
    );
  };

  // Switcher Handlers
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

  const handlePointerDown = (e: React.PointerEvent) => {
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
      {/* Optimized: static blur and bg-color; we only animate opacity for 60fps performance */}
      <div ref={bgRef} className="absolute inset-0 z-0 backdrop-blur-[16px] bg-black/60 opacity-0" onClick={handleClose} />

      {/* 3D Booklet Container - Set to 100vh - 5rem */}
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-4xl h-[calc(100vh-6rem)] mb-12"
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
          />
        ))}

        {/* Global Close Button inside the booklet container area */}
        <button
          onClick={handleClose}
          className="absolute top-0 right-0 -mt-2 -mr-2 md:-mt-4 md:-mr-4 z-50 p-2 md:p-3 bg-black text-white hover:bg-black/80 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/20 transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
          <Cancel01Icon size={20} className="relative z-10" />
        </button>
      </div>

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

      {/* The Switcher Button - Positioned Under the Booklet Container and scaled down by 25% */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
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
              <ArrowRight01Icon size={18} className="animate-wiggle-arrow text-white" strokeWidth={2.5} />
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
