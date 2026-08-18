"use client";

import React, { forwardRef, useState, useEffect } from "react";
import Image from "next/image";
import { Coffee01Icon, Leaf01Icon, Pizza01Icon } from "hugeicons-react";
import { menuData } from "@/data/mockMenu";
import TalabatMenu from "./TalabatMenu";

interface BookletCardProps {
  brandId: "coffee" | "papa" | "mama";
  isActive: boolean;
  isInitialActive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const BRAND_COVERS = {
  coffee: {
    num: "01",
    title: "Voya Coffee",
    sub: "SIGNATURE ROASTS",
    mascot: "/assets/illustrations/voya-character-4.svg",
    tagline: "Quality in everyday rituals. Sourced & roasted with intention.",
    tag: "CAFE & ARTISAN BAKERY",
    icon: Coffee01Icon,
    accentGlow: "rgba(241, 230, 195, 0.4)",
    borderTone: "border-[#3E3424]/15",
  },
  papa: {
    num: "02",
    title: "Papa Voya",
    sub: "WELLNESS & NOURISHMENT",
    mascot: "/assets/illustrations/papa-character-1.svg",
    tagline:
      "Balanced meals and clean energy. Strength, balance, and vitality.",
    tag: "HEALTHY KITCHEN & BOWLS",
    icon: Leaf01Icon,
    accentGlow: "rgba(183, 211, 154, 0.4)",
    borderTone: "border-[#2D421A]/15",
  },
  mama: {
    num: "03",
    title: "Mama Voya",
    sub: "WARMTH & HOSPITALITY",
    mascot: "/assets/illustrations/mama-character-1.svg",
    tagline:
      "Nurturing flavors and generous portions. Comfort food that feels like home.",
    tag: "COMFORT FOOD & PASTAS",
    icon: Pizza01Icon,
    accentGlow: "rgba(216, 169, 143, 0.4)",
    borderTone: "border-[#4A2E1F]/15",
  },
};

const BookletCard = forwardRef<HTMLDivElement, BookletCardProps>(
  (
    { brandId, isActive, isInitialActive = false, style, className = "" },
    ref,
  ) => {
    const menu = menuData[brandId];
    const cover = BRAND_COVERS[brandId];
    const [hasBeenActive, setHasBeenActive] = useState(isActive);

    useEffect(() => {
      if (isActive && !hasBeenActive) {
        setHasBeenActive(true);
      }
    }, [isActive, hasBeenActive]);

    if (!menu || !cover) return null;
    const IconComponent = cover.icon;

    return (
      <div
        ref={ref}
        className={`absolute top-0 left-0 w-full h-full rounded-[2rem] overflow-hidden ${menu.colors.bg} transform-gpu shadow-[0_20px_50px_rgba(0,0,0,0.3)] will-change-[transform,opacity] select-none ${className}`}
        style={{
          transformStyle: "preserve-3d",
          pointerEvents: isActive ? "auto" : "none",
          ...style,
        }}
      >
        {/* ─── Layer 1: Mascot Playing Card Back (Visible when stacked/switching) ─── */}
        <div
          className={`absolute inset-0 w-full h-full p-4 md:p-6 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${
            isActive ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Ornamental Outer Frame */}
          <div
            className={`relative w-full h-full rounded-[1.5rem] border ${cover.borderTone} p-4 md:p-6 flex flex-col justify-between items-center overflow-hidden`}
          >
            {/* Background Radial Glow */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${cover.accentGlow} 0%, rgba(0,0,0,0) 70%)`,
              }}
            />

            {/* Corner Indices (Playing Card Style) */}
            <div
              className={`absolute top-3 left-4 flex items-center gap-1.5 font-mono text-[11px] font-bold ${menu.colors.text} opacity-70`}
            >
              <span>{cover.num}</span>
              <IconComponent size={14} />
            </div>

            <div
              className={`absolute top-3 right-4 flex items-center gap-1.5 font-mono text-[11px] font-bold ${menu.colors.text} opacity-70`}
            >
              <IconComponent size={14} />
              <span>{cover.num}</span>
            </div>

            <div
              className={`absolute bottom-3 left-4 flex items-center gap-1.5 font-mono text-[11px] font-bold ${menu.colors.text} opacity-70`}
            >
              <span>{cover.num}</span>
              <IconComponent size={14} />
            </div>

            <div
              className={`absolute bottom-3 right-4 flex items-center gap-1.5 font-mono text-[11px] font-bold ${menu.colors.text} opacity-70`}
            >
              <IconComponent size={14} />
              <span>{cover.num}</span>
            </div>

            {/* Card Header */}
            <div className="flex flex-col items-center text-center mt-3 z-10">
              <span
                className={`font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold ${menu.colors.text} opacity-60`}
              >
                {cover.sub}
              </span>
              <h3
                className={`font-serif text-2xl md:text-4xl font-bold tracking-tight mt-1 ${menu.colors.text}`}
              >
                {cover.title}
              </h3>
            </div>

            {/* Center Hero: 3D Character Mascot */}
            <div className="relative w-full flex-1 flex items-center justify-center py-2 z-10">
              <div className="relative w-44 h-44 md:w-56 md:h-56 max-h-[35vh]">
                <Image
                  src={cover.mascot}
                  alt={`${cover.title} Mascot`}
                  fill
                  sizes="(max-width: 768px) 180px, 240px"
                  className="object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:scale-105"
                  priority
                />
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex flex-col items-center text-center z-10 max-w-xs mb-2">
              <p
                className={`font-serif italic text-xs md:text-sm ${menu.colors.text} opacity-80 leading-relaxed mb-3`}
              >
                "{cover.tagline}"
              </p>
              <div
                className={`px-4 py-1 rounded-full border ${cover.borderTone} bg-black/5 backdrop-blur-md`}
              >
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.2em] font-bold ${menu.colors.text} opacity-90`}
                >
                  {cover.tag}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Layer 2: The Interactive Menu (Visible when active) ─── */}
        {hasBeenActive && (
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
              isActive
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <TalabatMenu menu={menu} autoHintFirstItem={isInitialActive} />
          </div>
        )}
      </div>
    );
  },
);

BookletCard.displayName = "BookletCard";

export default BookletCard;
