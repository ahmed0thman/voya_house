"use client";

import { useTranslations } from "next-intl";
import { useDirectionFactor } from "@/lib/direction";
import { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import HeroFlashlightEffect from "@/components/HeroFlashlightEffect";
import { findNearestLoadedFrame } from "@/lib/frame-sequence";
import {
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  ArrowRight01Icon,
} from "hugeicons-react";

// Intrinsic size of the frame sequence (public/assets/frames-web/*.png and
// public/assets/frames/*.jpg). The canvas backing store is locked to this in
// JSX so it never depends on when the first image finishes decoding.
const FRAME_WIDTH = 720;
const FRAME_HEIGHT = 1280;



interface DesktopStageProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pageRef: React.RefObject<HTMLDivElement | null>;
  imagesRef: React.MutableRefObject<HTMLImageElement[]>;
  frameCount: number;
  introDone: boolean;
  isLoaded: boolean;
  bookletsRef: React.RefObject<HTMLElement | null>;
  onIntroDone: () => void;
  onExploreHouse: () => void;
  onOpenMenu: (menu: "coffee" | "papa" | "mama") => void;
  updateProgress: (progress: number) => void;
}

export default function DesktopStage({
  containerRef,
  pageRef,
  imagesRef,
  frameCount,
  introDone,
  isLoaded,
  bookletsRef,
  onIntroDone,
  onExploreHouse,
  onOpenMenu,
  updateProgress,
}: DesktopStageProps) {
  const t = useTranslations("stage");
  // GSAP moves raw pixels, which don't know about `dir` — see useDirectionFactor.
  const dirFactor = useDirectionFactor();
  const tHero = useTranslations("hero");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw the first frame as soon as it is available. On a slow connection the
  // loader dismisses on the 3.5s fallback timer, before frame 1 has decoded —
  // so retry on load instead of bailing out, otherwise the canvas stays empty
  // until the first scroll.
  useEffect(() => {
    if (!isLoaded || !imagesRef.current.length) return;
    const canvas = canvasRef.current;
    const img = imagesRef.current[0];
    if (!canvas || !img) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      ctx.drawImage(img, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    };

    if (img.complete && img.naturalWidth > 0) {
      draw();
      return;
    }

    img.addEventListener("load", draw);
    return () => img.removeEventListener("load", draw);
  }, [isLoaded, imagesRef]);

  useGSAP(
    () => {
      if (!introDone) return;
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=500%",
          scrub: 1.5,
          pin: true,
          onUpdate: (self) => {
            updateProgress(self.progress);
            if (imagesRef.current && imagesRef.current.length > 0) {
              const frameIndex = Math.max(
                0,
                Math.min(
                  frameCount - 1,
                  Math.floor(self.progress * (frameCount - 1)),
                ),
              );
              const canvas = canvasRef.current;
              // On a slow connection the exact frame may still be in flight —
              // fall back to the nearest already-loaded frame so the canvas
              // keeps tracking scroll position instead of freezing on stale
              // content.
              const img = findNearestLoadedFrame(imagesRef.current, frameIndex);
              if (canvas && img) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
                  ctx.drawImage(img, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
                }
              }
            }
          },
        },
      });

      // Section 1: Hero (0 to 0.2)
      masterTl
        .fromTo(
          ".desktop-hero-stage",
          { autoAlpha: 1, pointerEvents: "auto" },
          { autoAlpha: 0, pointerEvents: "none", duration: 0.04 },
          0.14
        )
        .fromTo(
          ".s1-desktop-logo",
          { autoAlpha: 1, y: 0, scale: 1 },
          { autoAlpha: 0, y: -45, scale: 0.95, duration: 0.12 },
          0.02
        )
        .fromTo(
          ".s1-desktop-subtitle-wrapper",
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -40, duration: 0.1 },
          0.04
        )
        .fromTo(
          ".s1-desktop-explore-btn",
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -35, duration: 0.08 },
          0.06
        )
        .fromTo(
          ".header-brand-logo",
          { autoAlpha: 0, y: -6 },
          { autoAlpha: 1, y: 0, duration: 0.04 },
          0.12
        )
        .fromTo(
          ".desktop-editorial-stage",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.04 },
          0.18
        );

      // Section 2 (0.2 to 0.4)
      masterTl
        .to(
          ".exp-items-track",
          { y: "0vh", duration: 0.04, ease: "power2.out" },
          0.2
        )
        .to(
          ".exp-item-1",
          { opacity: 1, x: 20 * dirFactor, duration: 0.03, ease: "power2.out" },
          0.22
        )
        .to(
          ".exp-item-1",
          { opacity: 0.2, x: 0, duration: 0.03, ease: "power2.out" },
          0.37
        );

      // Section 3 (0.4 to 0.6)
      masterTl
        .to(
          ".exp-items-track",
          { y: "-75vh", duration: 0.04, ease: "power2.out" },
          0.38
        )
        .to(
          ".exp-item-2",
          { opacity: 1, x: 20 * dirFactor, duration: 0.03, ease: "power2.out" },
          0.42
        )
        .to(
          ".exp-item-2",
          { opacity: 0.2, x: 0, duration: 0.03, ease: "power2.out" },
          0.57
        );

      // Section 4 (0.6 to 0.8)
      masterTl
        .to(
          ".exp-items-track",
          { y: "-150vh", duration: 0.04, ease: "power2.out" },
          0.58
        )
        .to(
          ".exp-item-3",
          { opacity: 1, x: 20 * dirFactor, duration: 0.03, ease: "power2.out" },
          0.62
        )
        .to(
          ".exp-item-3",
          { opacity: 0.2, x: 0, duration: 0.03, ease: "power2.out" },
          0.77
        );

      // Section 5 (0.8 to 1.0)
      masterTl
        .to(
          ".exp-items-track",
          { y: "-225vh", duration: 0.04, ease: "power2.out" },
          0.78
        )
        .to(
          ".exp-item-4",
          { opacity: 1, x: 20 * dirFactor, duration: 0.03, ease: "power2.out" },
          0.82
        );

      // Header background & glowing line
      masterTl.fromTo(
        [".header-bg", ".header-glow"],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.05, ease: "power2.out" },
        0.15
      );
    },
    { scope: pageRef, dependencies: [introDone] }
  );

  // Entrance Animation
  useGSAP(
    () => {
      if (isLoaded && !introDone) {
        const tl = gsap.timeline({
          onComplete: () => {
            onIntroDone();
          },
        });

        // 1. Fade in header & hero section containers
        tl.to(
          ".voya-header",
          {
            opacity: 1,
            duration: 1.0,
            ease: "power2.out",
          },
          0
        );
        tl.set(".header-brand-logo", { autoAlpha: 0 }, 0);

        tl.to(
          ".desktop-hero-stage",
          {
            autoAlpha: 1,
            duration: 1.0,
            ease: "power2.out",
          },
          0
        );

        // 2. Logo smooth scale and graceful dissolve
        tl.fromTo(
          ".s1-desktop-logo",
          { autoAlpha: 0, scale: 0.94, y: 15 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
          },
          0.2
        );

        // 3. Subtitle fade up
        tl.fromTo(
          ".s1-desktop-subtitle-wrapper",
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" },
          0.5
        );

        // 4. Explore Button fade up
        tl.fromTo(
          ".s1-desktop-explore-btn",
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" },
          0.8
        );
      }
    },
    { scope: pageRef, dependencies: [isLoaded, introDone] }
  );

  return (
    <>
      {/* ─── DESKTOP / TABLET (md: and up) HERO SECTION 1 ─── */}
      <div className="desktop-hero-stage flex absolute inset-0 z-30 flex-col items-center justify-center p-12 text-white opacity-0 invisible overflow-hidden cursor-none">
        <HeroFlashlightEffect />
        {/* Main Center Stage */}
        <div className="flex flex-col items-center text-center relative z-40 pointer-events-none">
          <div className="s1-desktop-logo mb-6 opacity-0">
            <Image
              src="/assets/logos/Asset 26.svg"
              alt={tHero("brand")}
              width={340}
              height={75}
              sizes="320px"
              loading="eager"
              fetchPriority="high"
              style={{ width: "320px", height: "auto" }}
              className="object-contain invert brightness-200"
            />
          </div>
          <div className="s1-desktop-subtitle-wrapper flex flex-col items-center opacity-0">
            <p className="text-sm font-sans font-medium uppercase tracking-[0.3em] text-[#F4EFE9] mb-6">
              {tHero("tagline")}
            </p>
          </div>
          <button
            onClick={onExploreHouse}
            className="s1-desktop-explore-btn pointer-events-auto group flex items-center gap-2 mt-8 opacity-0 px-9 py-3.5 rounded-lg border border-[#F1E6C3] bg-[#F1E6C3] hover:bg-white active:scale-95 transition-all text-black font-sans font-medium text-xs uppercase tracking-[0.28em] cursor-none shadow-lg"
          >
            <span>{tHero("cta")}</span>
            <ArrowRight01Icon className="w-5 h-5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform icon-auto-dir" />
          </button>
        </div>
      </div>

      {/* ─── DESKTOP / TABLET (md: and up) EDITORIAL SCROLLYTELLING (Sections 2–5) ─── */}
      <div className="desktop-editorial-stage flex flex-row gap-20 absolute inset-0 w-full h-full pointer-events-none opacity-0 invisible z-20">
        {/* LEFT COLUMN: Dark editorial pane */}
        <div
          className="h-full relative z-20 flex flex-col pointer-events-auto overflow-hidden"
          style={{ width: "42%", backgroundColor: "#080907" }}
        >
          {/* Fixed header — kicker + section title + description */}
          <div
            className="relative z-30"
            style={{
              paddingLeft: "14%",
              paddingRight: "10%",
              paddingTop: "5.5rem",
            }}
          >
            <p
              className="uppercase font-mono font-semibold"
              style={{
                color: "#F1E6C3",
                letterSpacing: "3px",
                marginBottom: "1rem",
                fontSize: "10px",
              }}
            >
              {t("featured")}
            </p>
            <h2
              className="font-serif text-white"
              style={{
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                lineHeight: 1.15,
                marginBottom: "1rem",
              }}
            >
              {t("theVoya")} <span style={{ color: "#F1E6C3" }}>{t("experience")}</span>
            </h2>
            <p
              style={{
                color: "#888",
                maxWidth: "320px",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              {t("familyTagline")}
            </p>
          </div>

          {/* Scrolling items track */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{ marginTop: "1.5rem" }}
          >
            <div className="exp-items-track w-full flex flex-col">
              {/* ── Experience 1: The Modern Collective ── */}
              <div
                className="exp-item-1 w-full flex flex-col justify-center shrink-0"
                style={{
                  height: "75vh",
                  paddingLeft: "14%",
                  paddingRight: "10%",
                }}
              >
                <h3
                  className="font-serif text-white"
                  style={{
                    fontSize: "clamp(2rem, 3vw, 2.75rem)",
                    lineHeight: 1.2,
                    marginBottom: "1.25rem",
                  }}
                >
                  {t("modernCollective")}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#999",
                    marginBottom: "2rem",
                    maxWidth: "340px",
                    lineHeight: 1.7,
                  }}
                >
                  {t("collectiveBody")}
                </p>

                <div
                  className="flex items-center"
                  style={{ marginBottom: "2rem" }}
                >
                  <div style={{ paddingRight: "1.5rem" }}>
                    <div
                      className="uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        color: "#777",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {t("houses")}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "#F1E6C3", fontSize: "13px" }}
                    >
                      {t("housesValue")}
                    </div>
                  </div>
                  <div
                    style={{
                      width: "1px",
                      height: "2.25rem",
                      backgroundColor: "#333",
                    }}
                  />
                  <div style={{ paddingLeft: "1.5rem" }}>
                    <div
                      className="uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        color: "#777",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {t("experienceLabel")}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "#F1E6C3", fontSize: "13px" }}
                    >
                      {t("allDaySanctuary")}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (bookletsRef.current) {
                        bookletsRef.current.scrollIntoView({
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#F1E6C3] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(241,230,195,0.4)] hover:shadow-[0_12px_40px_rgba(241,230,195,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F1E6C3] focus-visible:outline-none overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
                    <span className="font-sans font-bold text-xs tracking-widest uppercase text-black">
                      {tHero("cta")}
                    </span>
                    <ArrowRight01Icon
                      size={16}
                      className="text-black transform translate-x-0 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-all duration-300 icon-auto-dir"
                    />
                  </button>
                </div>
              </div>

              {/* ── Experience 2: Voya Coffee ── */}
              <div
                className="exp-item-2 w-full flex flex-col justify-center opacity-20 shrink-0"
                style={{
                  height: "75vh",
                  paddingLeft: "14%",
                  paddingRight: "10%",
                }}
              >
                <h3
                  className="font-serif text-white"
                  style={{
                    fontSize: "clamp(2rem, 3vw, 2.75rem)",
                    lineHeight: 1.2,
                    marginBottom: "1.25rem",
                  }}
                >
                  {t("coffee.heading")}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#999",
                    marginBottom: "2rem",
                    maxWidth: "340px",
                    lineHeight: 1.7,
                  }}
                >
                  {t("coffeeBody")}
                </p>

                <div
                  className="flex items-center"
                  style={{ marginBottom: "2rem" }}
                >
                  <div style={{ paddingRight: "1.5rem" }}>
                    <div
                      className="uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        color: "#777",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {t("coffee.roastOriginLabel")}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "#F1E6C3", fontSize: "13px" }}
                    >
                      {t("coffee.roastOrigin")}
                    </div>
                  </div>
                  <div
                    style={{
                      width: "1px",
                      height: "2.25rem",
                      backgroundColor: "#333",
                    }}
                  />
                  <div style={{ paddingLeft: "1.5rem" }}>
                    <div
                      className="uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        color: "#777",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {t("coffee.brewCraftLabel")}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "#F1E6C3", fontSize: "13px" }}
                    >
                      {t("coffee.brewCraft")}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => onOpenMenu("coffee")}
                    className="animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#F1E6C3] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(241,230,195,0.4)] hover:shadow-[0_12px_40px_rgba(241,230,195,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F1E6C3] focus-visible:outline-none overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
                      <Coffee01Icon size={16} className="text-black" />
                    </div>
                    <span className="font-sans font-bold text-xs tracking-widest uppercase text-black">
                      {t("coffee.cta")}
                    </span>
                    <ArrowRight01Icon
                      size={16}
                      className="text-black transform translate-x-0 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-all duration-300 icon-auto-dir"
                    />
                  </button>
                </div>
              </div>

              {/* ── Experience 3: Papa Voya ── */}
              <div
                className="exp-item-3 w-full flex flex-col justify-center opacity-20 shrink-0"
                style={{
                  height: "75vh",
                  paddingLeft: "14%",
                  paddingRight: "10%",
                }}
              >
                <h3
                  className="font-serif text-white"
                  style={{
                    fontSize: "clamp(2rem, 3vw, 2.75rem)",
                    lineHeight: 1.2,
                    marginBottom: "1.25rem",
                  }}
                >
                  {t("papa.heading")}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#999",
                    marginBottom: "2rem",
                    maxWidth: "340px",
                    lineHeight: 1.7,
                  }}
                >
                  {t("papaBody")}
                </p>

                <div
                  className="flex items-center"
                  style={{ marginBottom: "2rem" }}
                >
                  <div style={{ paddingRight: "1.5rem" }}>
                    <div
                      className="uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        color: "#777",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {t("papa.philosophyLabel")}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "#B7D39A", fontSize: "13px" }}
                    >
                      {t("papa.philosophy")}
                    </div>
                  </div>
                  <div
                    style={{
                      width: "1px",
                      height: "2.25rem",
                      backgroundColor: "#333",
                    }}
                  />
                  <div style={{ paddingLeft: "1.5rem" }}>
                    <div
                      className="uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        color: "#777",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {t("papa.sourcingLabel")}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "#B7D39A", fontSize: "13px" }}
                    >
                      {t("papa.sourcing")}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => onOpenMenu("papa")}
                    className="animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#B7D39A] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(183,211,154,0.4)] hover:shadow-[0_12px_40px_rgba(183,211,154,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#B7D39A] focus-visible:outline-none overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
                      <Leaf01Icon size={16} className="text-black" />
                    </div>
                    <span className="font-sans font-bold text-xs tracking-widest uppercase text-black">
                      {t("papa.cta")}
                    </span>
                    <ArrowRight01Icon
                      size={16}
                      className="text-black transform translate-x-0 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-all duration-300 icon-auto-dir"
                    />
                  </button>
                </div>
              </div>

              {/* ── Experience 4: Mama Voya ── */}
              <div
                className="exp-item-4 w-full flex flex-col justify-center opacity-20 shrink-0"
                style={{
                  height: "75vh",
                  paddingLeft: "14%",
                  paddingRight: "10%",
                }}
              >
                <h3
                  className="font-serif text-white"
                  style={{
                    fontSize: "clamp(2rem, 3vw, 2.75rem)",
                    lineHeight: 1.2,
                    marginBottom: "1.25rem",
                  }}
                >
                  {t("mama.heading")}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    color: "#999",
                    marginBottom: "2rem",
                    maxWidth: "340px",
                    lineHeight: 1.7,
                  }}
                >
                  {t("mamaBody")}
                </p>

                <div
                  className="flex items-center"
                  style={{ marginBottom: "2rem" }}
                >
                  <div style={{ paddingRight: "1.5rem" }}>
                    <div
                      className="uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        color: "#777",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {t("mama.bakeryLabel")}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "#D8A98F", fontSize: "13px" }}
                    >
                      {t("mama.bakery")}
                    </div>
                  </div>
                  <div
                    style={{
                      width: "1px",
                      height: "2.25rem",
                      backgroundColor: "#333",
                    }}
                  />
                  <div style={{ paddingLeft: "1.5rem" }}>
                    <div
                      className="uppercase"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "1.5px",
                        color: "#777",
                        marginBottom: "0.375rem",
                      }}
                    >
                      {t("mama.portionsLabel")}
                    </div>
                    <div
                      className="font-bold"
                      style={{ color: "#D8A98F", fontSize: "13px" }}
                    >
                      {t("mama.portions")}
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => onOpenMenu("mama")}
                    className="animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#D8A98F] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(216,169,143,0.4)] hover:shadow-[0_12px_40px_rgba(216,169,143,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D8A98F] focus-visible:outline-none overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
                      <Pizza01Icon size={16} className="text-black" />
                    </div>
                    <span className="font-sans font-bold text-xs tracking-widest uppercase text-black">
                      {t("mama.cta")}
                    </span>
                    <ArrowRight01Icon
                      size={16}
                      className="text-black transform translate-x-0 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-all duration-300 icon-auto-dir"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 9:16 canvas centered in a background-matched container */}
        <div
          className="h-full relative overflow-hidden flex items-center justify-center ps-16"
          style={{
            width: "58%",
            background:
              "radial-gradient(ellipse at 50% 60%, #F0ECE7 0%, #E5E1DA 100%)",
            boxShadow: "inset -80px 0 120px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Smooth gradient shadow fading from the dark left into the background */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "45%",
              background:
                "linear-gradient(to right, rgba(8,9,7,1) 0%, rgba(8,9,7,0.9) 10%, rgba(8,9,7,0.7) 25%, rgba(8,9,7,0.4) 45%, rgba(8,9,7,0.15) 70%, rgba(8,9,7,0.02) 90%, transparent 100%)",
              zIndex: 10,
              pointerEvents: "none" as const,
            }}
          />
          {/* Bottom vignette for depth */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "35%",
              background:
                "linear-gradient(to top, rgba(8,9,7,0.75) 0%, rgba(8,9,7,0.4) 30%, rgba(8,9,7,0.15) 65%, rgba(8,9,7,0.02) 90%, transparent 100%)",
              zIndex: 10,
              pointerEvents: "none" as const,
            }}
          />

          {/* 9:16 Aspect Ratio Wrapper to perfectly bound the canvas */}
          <div className="relative h-full aspect-[9/16] z-0">
            <canvas
              ref={canvasRef}
              width={FRAME_WIDTH}
              height={FRAME_HEIGHT}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </>
  );
}
