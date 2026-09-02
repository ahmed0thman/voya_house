"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import SplitText from "@/components/SplitText";
import { findNearestLoadedFrame } from "@/lib/frame-sequence";

import { useTranslations } from "next-intl";
import {
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  ArrowRight01Icon,
} from "hugeicons-react";

// Intrinsic size of the frame sequence (public/assets/frames/*.jpg).
// The canvas backing store is locked to this in JSX so it never depends on
// when the first image finishes decoding.
const FRAME_WIDTH = 720;
const FRAME_HEIGHT = 1280;

interface MobileStageProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pageRef: React.RefObject<HTMLDivElement | null>;
  imagesRef: React.MutableRefObject<HTMLImageElement[]>;
  frameCount: number;
  introDone: boolean;
  isLoaded: boolean;
  onIntroDone: () => void;
  onExploreHouse: () => void;
  onOpenMenu: (menu: "coffee" | "papa" | "mama") => void;
  updateProgress: (progress: number) => void;
}

export default function MobileStage({
  containerRef,
  pageRef,
  imagesRef,
  frameCount,
  introDone,
  isLoaded,
  onIntroDone,
  onExploreHouse,
  onOpenMenu,
  updateProgress,
}: MobileStageProps) {
  const tHero = useTranslations("hero");
  const tMobile = useTranslations("mobile");
  const tStage = useTranslations("stage");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const groundGlowRef = useRef<HTMLDivElement>(null);

  // Draw the first frame as soon as it is available. On a slow connection the
  // loader dismisses on the 3.5s fallback timer, before frame 1 has decoded —
  // so retry on load instead of bailing out, otherwise the canvas stays empty
  // until the first scroll.
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    const firstImg = imagesRef.current[0];
    if (!canvas || !firstImg) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      ctx.drawImage(firstImg, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    };

    if (firstImg.complete && firstImg.naturalWidth > 0) {
      draw();
      return;
    }

    firstImg.addEventListener("load", draw);
    return () => firstImg.removeEventListener("load", draw);
  }, [isLoaded, imagesRef]);

  // ─── GSAP Master Timeline (scroll-driven) ──────────────────────────────
  useGSAP(
    () => {
      if (!introDone) return;
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

      // Android/iOS collapse and re-show the URL bar while scrolling, which
      // fires a resize and would otherwise make ScrollTrigger refresh and jump
      // mid-scroll. The stage is sized to the large viewport, so ignore it.
      ScrollTrigger.config({ ignoreMobileResize: true });

      const el = containerRef.current;
      const overlay = overlayRef.current;
      const groundGlow = groundGlowRef.current;

      if (!el || !overlay || !groundGlow) return;

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=500%",
          scrub: 1.5,
          pin: true,
          onUpdate: (self) => {
            const currentFrame = Math.max(
              0,
              Math.min(
                frameCount - 1,
                Math.floor(self.progress * (frameCount - 1)),
              ),
            );
            // On a slow connection the exact frame may still be in flight —
            // fall back to the nearest already-loaded frame so the canvas
            // keeps tracking scroll position instead of freezing on stale
            // content.
            const img = findNearestLoadedFrame(imagesRef.current, currentFrame);
            if (img && canvasRef.current) {
              const ctx = canvasRef.current.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
                ctx.drawImage(img, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
              }
            }
            updateProgress(self.progress);
          },
        },
      });

      // Overlay colors for the 5 phases
      masterTl
        .to(overlay, { backgroundColor: "rgba(0,0,0,0)", duration: 0.2 }, 0)
        .to(overlay, { backgroundColor: "rgba(0,0,0,0.4)", duration: 0.2 }, 0.2)
        .to(
          overlay,
          { backgroundColor: "rgba(0,0,0,0.3)", duration: 0.2 },
          0.4,
        );

      // Ground Glow colors for the characters
      masterTl
        .set(groundGlow, { backgroundColor: "rgba(0,0,0,0)" }, 0)
        // Coffee Glow
        .to(
          groundGlow,
          { backgroundColor: "rgba(241, 230, 195, 0.4)", duration: 0.05 },
          0.4,
        )
        .to(
          groundGlow,
          { backgroundColor: "rgba(0,0,0,0)", duration: 0.03 },
          0.55,
        )
        // Papa Glow
        .to(
          groundGlow,
          { backgroundColor: "rgba(183, 211, 154, 0.4)", duration: 0.05 },
          0.6,
        )
        .to(
          groundGlow,
          { backgroundColor: "rgba(0,0,0,0)", duration: 0.03 },
          0.75,
        )
        // Mama Glow
        .to(
          groundGlow,
          { backgroundColor: "rgba(216, 169, 143, 0.4)", duration: 0.05 },
          0.8,
        )
        .to(
          groundGlow,
          { backgroundColor: "rgba(0,0,0,0)", duration: 0.05 },
          0.95,
        );

      // ==========================================
      // Section 1: Hero (0 to 0.2)
      // ==========================================
      masterTl
        .fromTo(
          ".ui-section-1",
          { autoAlpha: 1, pointerEvents: "auto" },
          { autoAlpha: 0, pointerEvents: "none", duration: 0.04 },
          0.14,
        )
        .fromTo(
          ".s1-logo",
          { autoAlpha: 1, y: 0, scale: 1 },
          { autoAlpha: 0, y: -45, scale: 0.95, duration: 0.12 },
          0.02,
        )
        .fromTo(
          ".s1-subtitle-wrapper",
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -40, duration: 0.1 },
          0.04,
        )
        .fromTo(
          ".s1-scroll-indicator",
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -35, duration: 0.08 },
          0.06,
        )
        .fromTo(
          ".header-brand-logo",
          { autoAlpha: 0, y: -6 },
          { autoAlpha: 1, y: 0, duration: 0.04 },
          0.12,
        );

      // ==========================================
      // Section 2: Family Reveal (0.2 to 0.4)
      // ==========================================
      masterTl
        .set(".ui-section-2", { autoAlpha: 1 }, 0.2)
        .fromTo(
          ".s2-title .char",
          { opacity: 0, scale: 1.2, color: "#ffffff" },
          {
            opacity: 1,
            scale: 1,
            color: "#e8e4db",
            duration: 0.02,
            stagger: 0.002,
          },
          0.22,
        )
        .fromTo(
          ".s2-desc .char",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.015, stagger: 0.0005 },
          0.24,
        )
        .to(".ui-section-2", { autoAlpha: 0, y: -40, duration: 0.05 }, 0.35);

      // ==========================================
      // Section 3: Coffee (0.4 to 0.6)
      // ==========================================
      masterTl
        .set(".ui-section-3", { autoAlpha: 1 }, 0.4)
        .fromTo(
          ".s3-icon",
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.014 },
          0.4,
        )
        .fromTo(
          ".s3-vertical-text .char",
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.014, stagger: 0.002 },
          0.41,
        )
        .fromTo(
          ".s3-title .char",
          { opacity: 0, scale: 1.2, color: "#ffffff" },
          {
            opacity: 1,
            scale: 1,
            color: "#F1E6C3",
            duration: 0.02,
            stagger: 0.002,
          },
          0.42,
        )
        .fromTo(
          ".s3-desc .char",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.015, stagger: 0.0005 },
          0.44,
        )
        .fromTo(
          ".s3-btn",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.01 },
          0.46,
        )
        .to(".ui-section-3", { autoAlpha: 0, duration: 0.05 }, 0.55);

      // ==========================================
      // Section 4: Papa Voya (0.6 to 0.8)
      // ==========================================
      masterTl
        .set(".ui-section-4", { autoAlpha: 1 }, 0.6)
        .fromTo(
          ".s4-icon",
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.014 },
          0.6,
        )
        .fromTo(
          ".s4-vertical-text .char",
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.014, stagger: 0.002 },
          0.61,
        )
        .fromTo(
          ".s4-title .char",
          { opacity: 0, scale: 1.2, color: "#ffffff" },
          {
            opacity: 1,
            scale: 1,
            color: "#B7D39A",
            duration: 0.02,
            stagger: 0.002,
          },
          0.62,
        )
        .fromTo(
          ".s4-desc .char",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.015, stagger: 0.0005 },
          0.64,
        )
        .fromTo(
          ".s4-btn",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.01 },
          0.66,
        )
        .to(".ui-section-4", { autoAlpha: 0, duration: 0.05 }, 0.75);

      // ==========================================
      // Section 5: Mama Voya (0.8 to 1.0)
      // ==========================================
      masterTl
        .set(".ui-section-5", { autoAlpha: 1 }, 0.8)
        .fromTo(
          ".s5-icon",
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.014 },
          0.8,
        )
        .fromTo(
          ".s5-vertical-text .char",
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.014, stagger: 0.002 },
          0.81,
        )
        .fromTo(
          ".s5-title .char",
          { opacity: 0, scale: 1.2, color: "#ffffff" },
          {
            opacity: 1,
            scale: 1,
            color: "#D8A98F",
            duration: 0.02,
            stagger: 0.002,
          },
          0.82,
        )
        .fromTo(
          ".s5-desc .char",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.015, stagger: 0.0005 },
          0.84,
        )
        .fromTo(
          ".s5-btn",
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.01 },
          0.86,
        )
        .to(".ui-section-5", { autoAlpha: 0, duration: 0.05 }, 0.95);

      // Header background & glowing line
      masterTl.fromTo(
        [".header-bg", ".header-glow"],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.05, ease: "power2.out" },
        0.15,
      );
    },
    { scope: pageRef, dependencies: [introDone] },
  );

  // ─── Hero Entrance Animation ────────────────────────────────
  useGSAP(
    () => {
      if (isLoaded && !introDone) {
        const tl = gsap.timeline({
          onComplete: () => {
            onIntroDone();
          },
        });

        // 1. Fade in header & hero section container
        tl.to(
          ".voya-header",
          {
            opacity: 1,
            duration: 1.0,
            ease: "power2.out",
          },
          0,
        );
        tl.set(".header-brand-logo", { autoAlpha: 0 }, 0);

        tl.to(
          ".ui-section-1",
          {
            autoAlpha: 1,
            duration: 1.0,
            ease: "power2.out",
          },
          0,
        );

        // 2. Logo smooth scale and graceful dissolve
        tl.fromTo(
          ".s1-logo",
          { autoAlpha: 0, scale: 0.94, y: 15 },
          {
            autoAlpha: 1,
            scale: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
          },
          0.2,
        );

        // 3. Subtitle fade up
        tl.fromTo(
          ".s1-subtitle-wrapper",
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" },
          0.5,
        );

        // 4. Scroll indicator fade up
        tl.fromTo(
          ".s1-scroll-indicator",
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" },
          0.8,
        );
      }
    },
    { scope: pageRef, dependencies: [isLoaded, introDone] },
  );

  return (
    <>
      {/* Mobile Canvas Sequence Background */}
      <canvas
        ref={canvasRef}
        width={FRAME_WIDTH}
        height={FRAME_HEIGHT}
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      <div
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
      />

      {/* GROUND GLOW */}
      <div
        ref={groundGlowRef}
        className="absolute bottom-0 start-0 w-full h-[7vh] blur-[30px] pointer-events-none"
        style={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
      />

      {/* Mobile UI Overlay Sections */}
      {/* Section 1: Hero */}
      <div className="ui-section-1 absolute inset-0 flex flex-col items-center justify-center px-6 text-[#080907] pb-[28vh] opacity-0 invisible">
        {/* Main Brand & Editorial Group — Placed peacefully in the sky */}
        <div className="flex flex-col items-center text-center gap-2">
          {/* Horizontal Luxury Brand Masthead */}
          <div className="s1-logo opacity-0">
            <Image
              src="/assets/logos/Asset 26.svg"
              alt={tHero("brand")}
              width={230}
              height={50}
              loading="eager"
              fetchPriority="high"
              style={{ width: "215px", height: "auto" }}
              className="object-contain"
            />
          </div>

          {/* Primary Tagline */}
          <div className="s1-subtitle-wrapper flex flex-col items-center opacity-0">
            <p className="text-[12px] font-sans font-semibold uppercase tracking-[0.24em] text-[#080907]">
              {tHero("tagline")}
            </p>
          </div>

          {/* Scroll Down Indicator */}
          <button
            onClick={onExploreHouse}
            aria-label={tHero("scrollToExplore")}
            className="s1-scroll-indicator group flex flex-col items-center gap-3 mt-36 cursor-pointer pointer-events-auto opacity-0"
          >
            <span className="font-sans font-semibold uppercase tracking-[0.24em] text-[10px] text-brand-black/70">
              {tHero("scroll")}
            </span>
            <span className="w-6 h-10 rounded-full border-2 border-black/30 overflow-hidden flex justify-center pt-2 group-hover:border-black/50 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-black/50 scroll-dot-anim" />
            </span>
          </button>
        </div>
      </div>

      {/* Section 2: Family Reveal */}
      <div className="ui-section-2 absolute inset-0 text-white opacity-0 invisible">
        <div className="absolute top-30 start-0 w-full text-center px-6">
          <h2 className="s2-title font-serif text-4xl sm:text-5xl font-medium leading-[1.15] whitespace-break-spaces">
            <SplitText text={tMobile("familyTitle1")} />
            <br />
            <SplitText text={tMobile("familyTitle2")} />
          </h2>
        </div>
        <div className="absolute top-72 start-0 w-full flex flex-col items-center text-center px-6">
          <p className="s2-desc max-w-lg text-sm text-white/90 font-medium mb-8 whitespace-break-spaces">
            <SplitText text={tMobile("familyDesc")} />
          </p>
        </div>
      </div>

      {/* Section 3: Voya Coffee */}
      <div className="ui-section-3 absolute inset-0 text-white opacity-0 invisible">
        <div className="absolute start-2 top-24 flex flex-col items-center">
          <div className="s3-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <Coffee01Icon size={32} className="text-[#F1E6C3]" />
          </div>
          <div className="s3-vertical-text mt-6 font-mono uppercase text-[12px] text-[#F1E6C3] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
            <SplitText text={tMobile("coffeeVertical")} />
          </div>
        </div>
        <div className="absolute top-[20%] start-0 w-full text-center">
          <h2 className="s3-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center whitespace-break-spaces">
            <SplitText text={tMobile("coffeeTitle1")} />
            <SplitText text={tMobile("coffeeTitle2")} />
          </h2>
        </div>
        <div className="absolute top-[70%] start-0 w-full flex flex-col items-center text-center px-6">
          <p className="s3-desc max-w-lg text-sm text-white/90 font-medium mb-8">
            <SplitText text={tStage("coffeeBodyMobile")} />
          </p>
          <button
            onClick={() => onOpenMenu("coffee")}
            className="s3-btn animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#F1E6C3] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(241,230,195,0.4)] hover:shadow-[0_12px_40px_rgba(241,230,195,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F1E6C3] focus-visible:outline-none overflow-hidden"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
              <Coffee01Icon size={16} className="text-black" />
            </div>
            <span className="font-sans font-bold text-xs tracking-widest uppercase text-black">
              {tStage("coffee.cta")}
            </span>
            <ArrowRight01Icon
              size={16}
              className="text-black transform translate-x-0 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-all duration-300 icon-auto-dir"
            />
          </button>
        </div>
      </div>

      {/* Section 4: Papa Voya */}
      <div className="ui-section-4 absolute inset-0 text-white opacity-0 invisible">
        <div className="absolute start-[5%] top-24 flex flex-col items-center">
          <div className="s4-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <Leaf01Icon size={32} className="text-[#B7D39A]" />
          </div>
          <div className="s4-vertical-text mt-6 font-mono uppercase text-[12px] text-[#B7D39A] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
            <SplitText text={tMobile("papaVertical")} />
          </div>
        </div>
        <div className="absolute top-[20%] start-0 w-full text-center">
          <h2 className="s4-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center whitespace-break-spaces">
            <SplitText text={tMobile("papaTitle1")} />
            <SplitText text={tMobile("papaTitle2")} />
          </h2>
        </div>
        <div className="absolute top-[70%] start-0 w-full flex flex-col items-center text-center px-6">
          <p className="s4-desc max-w-lg text-sm text-white/90 font-medium mb-8">
            <SplitText text={tStage("papaBodyMobile")} />
          </p>
          <button
            onClick={() => onOpenMenu("papa")}
            className="s4-btn animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#B7D39A] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(183,211,154,0.4)] hover:shadow-[0_12px_40px_rgba(183,211,154,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#B7D39A] focus-visible:outline-none overflow-hidden"
            style={{ animationDelay: "1.5s" }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
              <Leaf01Icon size={16} className="text-black" />
            </div>
            <span className="font-sans font-bold text-xs tracking-widest uppercase text-black">
              {tStage("papa.cta")}
            </span>
            <ArrowRight01Icon
              size={16}
              className="text-black transform translate-x-0 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-all duration-300 icon-auto-dir"
            />
          </button>
        </div>
      </div>

      {/* Section 5: Mama Voya */}
      <div className="ui-section-5 absolute inset-0 text-white opacity-0 invisible">
        <div className="absolute start-[5%] top-24 flex flex-col items-center">
          <div className="s5-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <Pizza01Icon size={32} className="text-[#D8A98F]" />
          </div>
          <div className="s5-vertical-text mt-6 font-mono uppercase text-[12px] text-[#D8A98F] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
            <SplitText text={tMobile("mamaVertical")} />
          </div>
        </div>
        <div className="absolute top-[20%] start-0 w-full text-center">
          <h2 className="s5-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center whitespace-break-spaces">
            <SplitText text={tMobile("mamaTitle1")} />
            <SplitText text={tMobile("mamaTitle2")} />
          </h2>
        </div>
        <div className="absolute top-[70%] start-0 w-full flex flex-col items-center text-center px-6">
          <p className="s5-desc max-w-lg text-sm text-white/90 font-medium mb-8">
            <SplitText text={tStage("mamaBodyMobile")} />
          </p>
          <button
            onClick={() => onOpenMenu("mama")}
            className="s5-btn animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#D8A98F] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(216,169,143,0.4)] hover:shadow-[0_12px_40px_rgba(216,169,143,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D8A98F] focus-visible:outline-none overflow-hidden"
            style={{ animationDelay: "3s" }}
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
              <Pizza01Icon size={16} className="text-black" />
            </div>
            <span className="font-sans font-bold text-xs tracking-widest uppercase text-black">
              {tStage("mama.cta")}
            </span>
            <ArrowRight01Icon
              size={16}
              className="text-black transform translate-x-0 group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-all duration-300 icon-auto-dir"
            />
          </button>
        </div>
      </div>
    </>
  );
}
