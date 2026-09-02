"use client";

import { useTranslations } from "next-intl";
import React, { forwardRef, useState, useEffect } from "react";
import Image from "next/image";
import { Coffee01Icon, Leaf01Icon, Pizza01Icon } from "hugeicons-react";
import { usePublicMenu } from "@/hooks/use-public-menu";
import type { BrandMenu } from "@/data/mockMenu";
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
    mascot: "/assets/illustrations/voya-character-4.svg",
    icon: Coffee01Icon,
    accentGlow: "rgba(241, 230, 195, 0.4)",
    borderTone: "border-[#3E3424]/15",
  },
  papa: {
    num: "02",
    mascot: "/assets/illustrations/papa-character-1.svg",
    icon: Leaf01Icon,
    accentGlow: "rgba(183, 211, 154, 0.4)",
    borderTone: "border-[#2D421A]/15",
  },
  mama: {
    num: "03",
    mascot: "/assets/illustrations/mama-character-1.svg",
    icon: Pizza01Icon,
    accentGlow: "rgba(216, 169, 143, 0.4)",
    borderTone: "border-[#4A2E1F]/15",
  },
};

// Brand presentation (bg/text/accent) isn't managed by the control board yet —
// only categories & items are DB-backed for now — so it stays static here.
const BRAND_THEME: Record<BookletCardProps["brandId"], BrandMenu["colors"]> = {
  coffee: { bg: "bg-[#F1E6C3]", text: "text-[#3E3424]", accent: "bg-[#D8C7A0]" },
  papa: { bg: "bg-[#B7D39A]", text: "text-[#2D421A]", accent: "bg-[#98B878]" },
  mama: { bg: "bg-[#D8A98F]", text: "text-[#4A2E1B]", accent: "bg-[#C18C70]" },
};

const BookletCard = forwardRef<HTMLDivElement, BookletCardProps>(
  (
    { brandId, isActive, isInitialActive = false, style, className = "" },
    ref,
  ) => {
    const tBrands = useTranslations("brands");
    const tCovers = useTranslations("booklets.covers");
    const { data: categories, isLoading, isError } = usePublicMenu(brandId);
    const cover = BRAND_COVERS[brandId];
    const colors = BRAND_THEME[brandId];
    const [hasBeenActive, setHasBeenActive] = useState(isActive);

    useEffect(() => {
      if (isActive && !hasBeenActive) {
        setHasBeenActive(true);
      }
    }, [isActive, hasBeenActive]);

    if (!cover) return null;
    const IconComponent = cover.icon;

    const menu: BrandMenu = {
      brandId,
      title: tBrands(brandId),
      colors,
      categories: categories ?? [],
    };

    return (
      <div
        ref={ref}
        className={`absolute top-0 start-0 w-full h-full rounded-[2rem] overflow-hidden ${menu.colors.bg} transform-gpu shadow-[0_20px_50px_rgba(0,0,0,0.3)] will-change-[transform,opacity] select-none ${className}`}
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
              className={`absolute top-3 start-4 flex items-center gap-1.5 font-mono text-[11px] font-bold ${menu.colors.text} opacity-70`}
            >
              <span>{cover.num}</span>
              <IconComponent size={14} />
            </div>

            <div
              className={`absolute top-3 end-4 flex items-center gap-1.5 font-mono text-[11px] font-bold ${menu.colors.text} opacity-70`}
            >
              <IconComponent size={14} />
              <span>{cover.num}</span>
            </div>

            <div
              className={`absolute bottom-3 start-4 flex items-center gap-1.5 font-mono text-[11px] font-bold ${menu.colors.text} opacity-70`}
            >
              <span>{cover.num}</span>
              <IconComponent size={14} />
            </div>

            <div
              className={`absolute bottom-3 end-4 flex items-center gap-1.5 font-mono text-[11px] font-bold ${menu.colors.text} opacity-70`}
            >
              <IconComponent size={14} />
              <span>{cover.num}</span>
            </div>

            {/* Card Header */}
            <div className="flex flex-col items-center text-center mt-3 z-10">
              <span
                className={`font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold ${menu.colors.text} opacity-60`}
              >
                {tCovers(`${brandId}.sub`)}
              </span>
              <h3
                className={`font-serif text-2xl md:text-4xl font-bold tracking-tight mt-1 ${menu.colors.text}`}
              >
                {tBrands(brandId)}
              </h3>
            </div>

            {/* Center Hero: 3D Character Mascot */}
            <div className="relative w-full flex-1 flex items-center justify-center py-2 z-10">
              <div className="relative w-44 h-44 md:w-56 md:h-56 max-h-[35vh]">
                <Image
                  src={cover.mascot}
                  alt={tBrands(brandId)}
                  fill
                  sizes="(max-width: 768px) 180px, 240px"
                  quality={75}
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
                &ldquo;{tCovers(`${brandId}.tagline`)}&rdquo;
              </p>
              <div
                className={`px-4 py-1 rounded-full border ${cover.borderTone} bg-black/5 backdrop-blur-md`}
              >
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.2em] font-bold ${menu.colors.text} opacity-90`}
                >
                  {tCovers(`${brandId}.tag`)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Layer 2: The Interactive Menu (Visible when active) ─── */}
        {hasBeenActive && (
          <div
            className={`absolute inset-0 w-full h-full transition-opacity duration-300 z-20 ${
              isActive
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {menu.categories.length > 0 ? (
              <TalabatMenu menu={menu} autoHintFirstItem={isInitialActive} />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center px-8 text-center font-mono text-sm ${colors.text} opacity-70`}
              >
                {isLoading
                  ? "Loading menu…"
                  : isError
                    ? "Couldn't load the menu. Please try again."
                    : "No items available yet."}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

BookletCard.displayName = "BookletCard";

export default BookletCard;
