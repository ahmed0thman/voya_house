"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import SplitText from "@/components/SplitText";

import {
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  ArrowRight01Icon,
} from "hugeicons-react";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const groundGlowRef = useRef<HTMLDivElement>(null);

  // Draw first frame when images are ready
  useEffect(() => {
    if (!isLoaded) return;
    const firstImg = imagesRef.current[0];
    if (firstImg && firstImg.complete && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        canvasRef.current.width = 720;
        canvasRef.current.height = 1280;
        ctx.clearRect(0, 0, 720, 1280);
        ctx.drawImage(firstImg, 0, 0);
      }
    }
  }, [isLoaded, imagesRef]);

  // ─── GSAP Master Timeline (scroll-driven) ──────────────────────────────
  useGSAP(
    () => {
      if (!introDone) return;
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

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
            const img = imagesRef.current[currentFrame];
            if (img && img.complete && canvasRef.current) {
              const ctx = canvasRef.current.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, 720, 1280);
                ctx.drawImage(img, 0, 0);
              }
            }
            updateProgress(self.progress);
          },
        },
      });

      // Overlay colors for the 5 phases
      masterTl
        .to(overlay, { backgroundColor: "rgba(0,0,0,0)", duration: 0.2 }, 0)
        .to(
          overlay,
          { backgroundColor: "rgba(0,0,0,0.4)", duration: 0.2 },
          0.2,
        )
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
          ".s1-explore-btn",
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

        // 4. Explore Button fade up
        tl.fromTo(
          ".s1-explore-btn",
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
        className="absolute bottom-0 left-0 w-full h-[7vh] blur-[30px] pointer-events-none"
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
              alt="Voya House"
              width={230}
              height={50}
              priority
              style={{ width: "215px", height: "auto" }}
              className="object-contain"
            />
          </div>

          {/* Primary Tagline */}
          <div className="s1-subtitle-wrapper flex flex-col items-center opacity-0">
            <p className="text-[12px] font-sans font-semibold uppercase tracking-[0.24em] text-[#080907]">
              Where people come together
            </p>
          </div>

          {/* Explore The House Button */}
          <button
            onClick={onExploreHouse}
            className="s1-explore-btn group flex items-center gap-2 mt-8 px-7 py-2.5 rounded-lg border border-black/20 bg-[#F1E6C3] hover:bg-white active:scale-95 transition-all text-black font-sans font-medium text-[11px] uppercase tracking-[0.25em] cursor-pointer pointer-events-auto shadow-sm opacity-0"
          >
            <span>Explore the House</span>
            <ArrowRight01Icon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Section 2: Family Reveal */}
      <div className="ui-section-2 absolute inset-0 text-white opacity-0 invisible">
        <div className="absolute top-30 left-0 w-full text-center px-6">
          <h2 className="s2-title font-serif text-4xl sm:text-5xl font-medium leading-[1.15] whitespace-break-spaces">
            <SplitText text="A Modern Family" />
            <br />
            <SplitText text="Experience" />
          </h2>
        </div>
        <div className="absolute top-72 left-0 w-full flex flex-col items-center text-center px-6">
          <p className="s2-desc max-w-lg text-sm text-white/90 font-medium mb-8 whitespace-break-spaces">
            <SplitText text="Everyday rituals, mindful choices, and sweet moments made for sharing." />
          </p>
        </div>
      </div>

      {/* Section 3: Voya Coffee */}
      <div className="ui-section-3 absolute inset-0 text-white opacity-0 invisible">
        <div className="absolute left-2 top-24 flex flex-col items-center">
          <div className="s3-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <Coffee01Icon size={32} className="text-[#F1E6C3]" />
          </div>
          <div className="s3-vertical-text mt-6 font-mono uppercase text-[12px] text-[#F1E6C3] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
            <SplitText text="VOYA " />
          </div>
        </div>
        <div className="absolute top-[20%] left-0 w-full text-center">
          <h2 className="s3-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center whitespace-break-spaces">
            <SplitText text="Quality in" />
            <SplitText text="everyday rituals." />
          </h2>
        </div>
        <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
          <p className="s3-desc max-w-lg text-sm text-white/90 font-medium mb-8">
            <SplitText text="A reflection of calmness and exploration. We source and roast with intention to bring you the perfect cup." />
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
              Discover the Roast
            </span>
            <ArrowRight01Icon
              size={16}
              className="text-black transform translate-x-0 group-hover:translate-x-1.5 transition-all duration-300"
            />
          </button>
        </div>
      </div>

      {/* Section 4: Papa Voya */}
      <div className="ui-section-4 absolute inset-0 text-white opacity-0 invisible">
        <div className="absolute left-[5%] top-24 flex flex-col items-center">
          <div className="s4-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <Leaf01Icon size={32} className="text-[#B7D39A]" />
          </div>
          <div className="s4-vertical-text mt-6 font-mono uppercase text-[12px] text-[#B7D39A] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
            <SplitText text="PAPA VOYA" />
          </div>
        </div>
        <div className="absolute top-[20%] left-0 w-full text-center">
          <h2 className="s4-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center whitespace-break-spaces">
            <SplitText text="Nourishment" />
            <SplitText text="and strength." />
          </h2>
        </div>
        <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
          <p className="s4-desc max-w-lg text-sm text-white/90 font-medium mb-8">
            <SplitText text="Balanced meals and mindful choices. Clean energy that reflects strength, balance, and confidence." />
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
              Explore Healthy Menu
            </span>
            <ArrowRight01Icon
              size={16}
              className="text-black transform translate-x-0 group-hover:translate-x-1.5 transition-all duration-300"
            />
          </button>
        </div>
      </div>

      {/* Section 5: Mama Voya */}
      <div className="ui-section-5 absolute inset-0 text-white opacity-0 invisible">
        <div className="absolute left-[5%] top-24 flex flex-col items-center">
          <div className="s5-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <Pizza01Icon size={32} className="text-[#D8A98F]" />
          </div>
          <div className="s5-vertical-text mt-6 font-mono uppercase text-[12px] text-[#D8A98F] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
            <SplitText text="MAMA VOYA" />
          </div>
        </div>
        <div className="absolute top-[20%] left-0 w-full text-center">
          <h2 className="s5-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center whitespace-break-spaces">
            <SplitText text="Warmth &" />
            <SplitText text="Hospitality." />
          </h2>
        </div>
        <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
          <p className="s5-desc max-w-lg text-sm text-white/90 font-medium mb-8">
            <SplitText text="Nurturing flavors and generous portions. Comfort food that feels like coming home." />
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
              Taste the Comfort
            </span>
            <ArrowRight01Icon
              size={16}
              className="text-black transform translate-x-0 group-hover:translate-x-1.5 transition-all duration-300"
            />
          </button>
        </div>
      </div>
    </>
  );
}
