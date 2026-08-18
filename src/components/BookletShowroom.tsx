"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from "hugeicons-react";

gsap.registerPlugin(ScrollTrigger);

interface BookletShowroomProps {
  onOpenBooklet: (menu: "coffee" | "papa" | "mama") => void;
}

interface CardData {
  id: "papa" | "coffee" | "mama";
  tabLabel: string;
  num: string;
  tag: string;
  title: string;
  desc: string;
  bg: string;
  borderTone: string;
  textColor: string;
  accentGlow: string;
  btnBg: string;
  btnText: string;
  svg: string;
  icon: typeof Coffee01Icon;
}

const CARDS: CardData[] = [
  {
    id: "papa",
    tabLabel: "Papa",
    num: "02",
    tag: "WELLNESS & NOURISHMENT",
    title: "Papa Voya",
    desc: "Balanced meals and clean energy. Strength and vitality.",
    bg: "bg-[#B7D39A]",
    borderTone: "border-[#2D421A]/15",
    textColor: "text-[#2D421A]",
    accentGlow: "rgba(183, 211, 154, 0.6)",
    btnBg: "bg-[#2D421A]",
    btnText: "text-[#B7D39A]",
    svg: "/assets/illustrations/papa-character-1.svg",
    icon: Leaf01Icon,
  },
  {
    id: "coffee",
    tabLabel: "Voya",
    num: "01",
    tag: "SIGNATURE ROASTS",
    title: "Voya Coffee",
    desc: "Quality in everyday rituals. Sourced & roasted with intention.",
    bg: "bg-[#F1E6C3]",
    borderTone: "border-[#3E3424]/15",
    textColor: "text-[#3E3424]",
    accentGlow: "rgba(241, 230, 195, 0.6)",
    btnBg: "bg-[#3E3424]",
    btnText: "text-[#F1E6C3]",
    svg: "/assets/illustrations/voya-character-4.svg",
    icon: Coffee01Icon,
  },
  {
    id: "mama",
    tabLabel: "Mama",
    num: "03",
    tag: "WARMTH & HOSPITALITY",
    title: "Mama Voya",
    desc: "Comfort food that feels like coming home.",
    bg: "bg-[#D8A98F]",
    borderTone: "border-[#4A2E1F]/15",
    textColor: "text-[#4A2E1F]",
    accentGlow: "rgba(216, 169, 143, 0.6)",
    btnBg: "bg-[#4A2E1F]",
    btnText: "text-[#D8A98F]",
    svg: "/assets/illustrations/mama-character-1.svg",
    icon: Pizza01Icon,
  },
];

export default function BookletShowroom({ onOpenBooklet }: BookletShowroomProps) {
  // centerIndex: 0 = Papa, 1 = Coffee (default center), 2 = Mama
  const [centerIndex, setCenterIndex] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const dragDeltaRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  // Helper to map card index to -1 (Left), 0 (Center), or 1 (Right)
  const getRelPos = useCallback(
    (cardIdx: number): -1 | 0 | 1 => {
      const diff = (cardIdx - centerIndex + 3) % 3;
      if (diff === 0) return 0;
      if (diff === 1) return 1;
      return -1;
    },
    [centerIndex]
  );

  // Smoothly update card positions with GSAP
  const updateCardPositions = useCallback(
    (animate = true) => {
      const isMobile = window.innerWidth < 768;
      const duration = animate ? 0.65 : 0;

      CARDS.forEach((_, idx) => {
        const cardEl = cardsRef.current[idx];
        if (!cardEl) return;

        const relPos = getRelPos(idx);

        let targetX = 0;
        let targetY = 0;
        let targetRot = 0;
        let targetScale = 1;
        let targetZ = 10;

        if (isMobile) {
          if (relPos === 0) {
            targetX = 0;
            targetY = -12;
            targetRot = 0;
            targetScale = 1.0;
            targetZ = 30;
          } else if (relPos === -1) {
            targetX = -85;
            targetY = 10;
            targetRot = -10;
            targetScale = 0.92;
            targetZ = 10;
          } else {
            targetX = 85;
            targetY = 10;
            targetRot = 10;
            targetScale = 0.92;
            targetZ = 10;
          }
        } else {
          // Desktop / Tablet
          if (relPos === 0) {
            targetX = 0;
            targetY = -18;
            targetRot = 0;
            targetScale = 1.0;
            targetZ = 30;
          } else if (relPos === -1) {
            targetX = -220;
            targetY = 14;
            targetRot = -12;
            targetScale = 0.95;
            targetZ = 10;
          } else {
            targetX = 220;
            targetY = 14;
            targetRot = 12;
            targetScale = 0.95;
            targetZ = 10;
          }
        }

        gsap.to(cardEl, {
          xPercent: -50,
          yPercent: -50,
          x: targetX,
          y: targetY,
          rotateZ: targetRot,
          scale: targetScale,
          zIndex: targetZ,
          duration,
          ease: "back.out(1.3)",
          overwrite: "auto",
        });
      });
    },
    [getRelPos]
  );

  // Trigger position updates when centerIndex changes (after entrance)
  useEffect(() => {
    if (isInitializedRef.current) {
      updateCardPositions(true);
    }
  }, [centerIndex, updateCardPositions]);

  // Entrance ScrollTrigger Animation
  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 72%",
          toggleActions: "play none none none",
        },
        onComplete: () => {
          isInitializedRef.current = true;
          updateCardPositions(false);
        },
      });

      tl.fromTo(
        ".booklet-showroom-header",
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" }
      );

      const isMobile = window.innerWidth < 768;
      const leftX = isMobile ? -85 : -220;
      const rightX = isMobile ? 85 : 220;
      const leftRot = isMobile ? -10 : -12;
      const rightRot = isMobile ? 10 : 12;

      // Cards initial reveal (Deck fan out)
      tl.fromTo(
        cardsRef.current[0], // Papa
        { y: 130, opacity: 0, scale: 0.88, xPercent: -50, yPercent: -50, x: 0, rotateZ: 0 },
        {
          xPercent: -50,
          yPercent: -50,
          x: leftX,
          y: isMobile ? 10 : 14,
          opacity: 1,
          scale: isMobile ? 0.92 : 0.95,
          rotateZ: leftRot,
          duration: 0.9,
          ease: "back.out(1.25)",
        },
        "-=0.2"
      );

      tl.fromTo(
        cardsRef.current[1], // Coffee
        { y: 130, opacity: 0, scale: 0.88, xPercent: -50, yPercent: -50, x: 0, rotateZ: 0 },
        {
          xPercent: -50,
          yPercent: -50,
          x: 0,
          y: isMobile ? -12 : -18,
          opacity: 1,
          scale: 1,
          rotateZ: 0,
          duration: 0.9,
          ease: "back.out(1.25)",
        },
        "-=0.75"
      );

      tl.fromTo(
        cardsRef.current[2], // Mama
        { y: 130, opacity: 0, scale: 0.88, xPercent: -50, yPercent: -50, x: 0, rotateZ: 0 },
        {
          xPercent: -50,
          yPercent: -50,
          x: rightX,
          y: isMobile ? 10 : 14,
          opacity: 1,
          scale: isMobile ? 0.92 : 0.95,
          rotateZ: rightRot,
          duration: 0.9,
          ease: "back.out(1.25)",
        },
        "-=0.75"
      );
    },
    { scope: containerRef }
  );

  // Swipe & Pointer Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    dragDeltaRef.current = 0;
    hasMovedRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;

    // Check if horizontal intent is clear
    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        hasMovedRef.current = true;
        dragDeltaRef.current = deltaX;

        // Interactive elastic follow while dragging
        const isMobile = window.innerWidth < 768;
        const spread = isMobile ? 85 : 220;

        CARDS.forEach((_, idx) => {
          const cardEl = cardsRef.current[idx];
          if (!cardEl) return;
          const relPos = getRelPos(idx);

          let baseX = relPos === 0 ? 0 : relPos === -1 ? -spread : spread;
          let baseRot = relPos === 0 ? 0 : relPos === -1 ? (isMobile ? -10 : -12) : isMobile ? 10 : 12;

          gsap.set(cardEl, {
            x: baseX + deltaX * 0.4,
            rotateZ: baseRot + deltaX * 0.04,
          });
        });
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const deltaX = dragDeltaRef.current;
    const threshold = 45; // Threshold in px to trigger swipe

    if (deltaX < -threshold) {
      // Swiped Left -> Cycle Next
      setCenterIndex((prev) => (prev + 1) % 3);
    } else if (deltaX > threshold) {
      // Swiped Right -> Cycle Prev
      setCenterIndex((prev) => (prev - 1 + 3) % 3);
    } else {
      // Return to resting position
      updateCardPositions(true);
    }

    dragDeltaRef.current = 0;
  };

  const handleCardClick = (idx: number, cardId: "coffee" | "papa" | "mama") => {
    // If user dragged, ignore click
    if (hasMovedRef.current) return;

    const relPos = getRelPos(idx);
    if (relPos === 0) {
      // Center card clicked -> open booklet
      onOpenBooklet(cardId);
    } else {
      // Side card clicked -> bring to center
      setCenterIndex(idx);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative z-20 w-full min-h-screen bg-[#080907] flex flex-col items-center justify-center py-24 px-4 sm:px-6 md:px-12 border-t border-white/10 shadow-[0_-25px_60px_rgba(0,0,0,0.9)] overflow-hidden select-none"
      style={{ perspective: "1200px" }}
    >
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-[#F1E6C3]/10 via-[#B7D39A]/10 to-[#D8A98F]/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col items-center">
        {/* Section Header */}
        <div className="booklet-showroom-header text-center mb-10 md:mb-14 flex flex-col items-center max-w-2xl px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-4">
            <span className="w-2 h-2 rounded-full bg-[#F1E6C3] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 font-bold">
              The House of Voya
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-6xl font-medium text-white tracking-tight leading-tight">
            Three Flavors. One House.
          </h2>
          <p className="font-sans text-sm md:text-base text-white/70 mt-3 md:mt-4 leading-relaxed">
            Explore our complete trilogy of crafted menus. Swipe or select any booklet to unveil our curated roasts, mindful wellness recipes, and comforting home classics.
          </p>
        </div>

        {/* ─── The Hand-Held Playing Cards Fan / Swiper Stage ─── */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-full max-w-4xl h-[470px] sm:h-[530px] md:h-[590px] flex items-center justify-center my-2 cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {CARDS.map((card, idx) => {
            const IconComponent = card.icon;
            const relPos = getRelPos(idx);
            const isCenter = relPos === 0;

            return (
              <div
                key={card.id}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                onClick={() => handleCardClick(idx, card.id)}
                className={`group absolute top-1/2 left-1/2 w-[220px] sm:w-[270px] md:w-[330px] h-[380px] sm:h-[450px] md:h-[510px] rounded-[1.8rem] md:rounded-[2rem] ${card.bg} p-3.5 sm:p-4 md:p-5 flex flex-col justify-between cursor-pointer border ${card.borderTone} shadow-[0_20px_45px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.8)] opacity-0`}
                style={{
                  transformStyle: "preserve-3d",
                  transition: "box-shadow 0.3s ease",
                }}
              >
                {/* Inner Ornamental Border */}
                <div
                  className={`relative w-full h-full rounded-[1.2rem] md:rounded-[1.4rem] border ${card.borderTone} p-2.5 sm:p-3 md:p-4 flex flex-col justify-between items-center overflow-hidden`}
                >
                  {/* Radial Ambient Glow */}
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
                    style={{
                      background: `radial-gradient(circle at 50% 45%, ${card.accentGlow} 0%, rgba(0,0,0,0) 70%)`,
                    }}
                  />

                  {/* Corner Indices */}
                  <div className={`absolute top-2.5 left-3 flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold ${card.textColor} opacity-70`}>
                    <span>{card.num}</span>
                    <IconComponent size={12} />
                  </div>
                  <div className={`absolute top-2.5 right-3 flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold ${card.textColor} opacity-70`}>
                    <IconComponent size={12} />
                    <span>{card.num}</span>
                  </div>
                  <div className={`absolute bottom-2.5 left-3 flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold ${card.textColor} opacity-70`}>
                    <span>{card.num}</span>
                    <IconComponent size={12} />
                  </div>
                  <div className={`absolute bottom-2.5 right-3 flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold ${card.textColor} opacity-70`}>
                    <IconComponent size={12} />
                    <span>{card.num}</span>
                  </div>

                  {/* Card Title & Subtitle */}
                  <div className="flex flex-col items-center text-center mt-1 z-10">
                    <span className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.25em] font-bold ${card.textColor} opacity-60`}>
                      {card.tag}
                    </span>
                    <h3 className={`font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mt-0.5 ${card.textColor}`}>
                      {card.title}
                    </h3>
                  </div>

                  {/* Vector Mascot Illustration */}
                  <div className="relative w-full flex-1 flex items-center justify-center py-1 z-10">
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44">
                      <Image
                        src={card.svg}
                        alt={`${card.title} Mascot`}
                        fill
                        sizes="(max-width: 768px) 120px, 180px"
                        className="object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.2)]"
                      />
                    </div>
                  </div>

                  {/* Card Footer & Action Button */}
                  <div className="flex flex-col items-center text-center z-10 w-full mb-0.5">
                    <p className={`font-serif italic text-[10px] sm:text-[11px] md:text-xs ${card.textColor} opacity-80 leading-relaxed mb-2 line-clamp-2`}>
                      {card.desc}
                    </p>
                    <div
                      className={`w-full py-2 sm:py-2.5 px-3 rounded-full ${card.btnBg} ${card.btnText} font-bold text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md transition-transform ${
                        isCenter ? "group-hover:scale-105" : ""
                      }`}
                    >
                      <span>{isCenter ? "Open Booklet" : "Select"}</span>
                      <ArrowRight01Icon size={12} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Interactive Navigation Pill Controls ─── */}
        <div className="flex items-center gap-3 mt-4 z-20">
          <button
            onClick={() => setCenterIndex((prev) => (prev - 1 + 3) % 3)}
            aria-label="Previous booklet"
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-md"
          >
            <ArrowLeft01Icon size={16} />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md">
            {CARDS.map((card, idx) => {
              const isCurrent = centerIndex === idx;
              return (
                <button
                  key={card.id}
                  onClick={() => setCenterIndex(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                    isCurrent
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {card.tabLabel}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCenterIndex((prev) => (prev + 1) % 3)}
            aria-label="Next booklet"
            className="w-10 h-10 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-md"
          >
            <ArrowRight01Icon size={16} />
          </button>
        </div>

        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 mt-3">
          Swipe or Click to Cycle
        </span>
      </div>
    </div>
  );
}
