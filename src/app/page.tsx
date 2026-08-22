"use client";

import Image from "next/image";
import { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import Header from "@/components/Header";
import SplitText from "@/components/SplitText";
import HighlighterSweep from "@/components/HighlighterSweep";
import SoundToggle from "@/components/SoundToggle";
import { useAmbientSound } from "@/components/useAmbientSound";
import {
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  ArrowRight01Icon,
} from "hugeicons-react";
import MenuStackOverlay from "@/components/MenuStackOverlay";
import BookletShowroom from "@/components/BookletShowroom";
import BrandStorySection from "@/components/BrandStorySection";
import ContactSection from "@/components/ContactSection";
import CinematicFooter from "@/components/CinematicFooter";
import CartSheet from "@/components/CartSheet";
import TableParamSync from "@/components/TableParamSync";

// Section snap points as scroll progress (0–1)
const SNAP_POINTS = [0, 0.3, 0.55, 0.74, 0.95];
const TOTAL_SECTIONS = 9; // 5 video sections + booklets + story + contact + footer
const SCROLL_DURATION = 3.5; // seconds per section transition
const COOLDOWN_MS = 3600; // lock input during animation

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasMobileRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const groundGlowRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<
    "coffee" | "papa" | "mama" | null
  >(null);
  const bookletsRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameCount = 361;

  // Loading state
  const [isLoaded, setIsLoaded] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  // Ambient sound engine
  const {
    isMuted,
    toggleMute,
    enableSound,
    updateProgress,
    setDucked,
    cleanup: cleanupSound,
  } = useAmbientSound();
  const videoReady = useRef(false);
  const minTimeReached = useRef(false);

  // Mutable refs for navigation state
  const currentIndex = useRef(0);
  const isAnimating = useRef(false);

  // Duck audio when menu booklet is open
  useEffect(() => {
    setDucked(activeMenu !== null);
  }, [activeMenu, setDucked]);

  // Navigate to a specific section index
  const goToSection = useCallback((index: number) => {
    const el = container.current;
    if (!el || isAnimating.current) return;

    // Clamp index
    const target = Math.max(0, Math.min(index, TOTAL_SECTIONS - 1));
    if (target === currentIndex.current) return;

    isAnimating.current = true;
    currentIndex.current = target;

    let scrollTarget = 0;

    if (target < SNAP_POINTS.length) {
      // Sections 0-4 (video container pinned across 500vh)
      const st = ScrollTrigger.getAll().find(
        (s) => s.vars?.trigger === container.current,
      );
      const totalDist = st ? st.end - st.start : 5 * window.innerHeight;
      scrollTarget = (st ? st.start : 0) + SNAP_POINTS[target] * totalDist;
    } else if (target === 5 && bookletsRef.current) {
      // Booklets Showroom Section
      scrollTarget = bookletsRef.current.offsetTop;
    } else if (target === 6 && storyRef.current) {
      // Brand Story Section
      scrollTarget = storyRef.current.offsetTop;
    } else if (target === 7 && contactRef.current) {
      // Contact Section
      scrollTarget = contactRef.current.offsetTop;
    } else if (target === 8) {
      // Footer Section (scroll to absolute bottom)
      scrollTarget = document.documentElement.scrollHeight - window.innerHeight;
    }

    gsap.to(window, {
      scrollTo: { y: scrollTarget, autoKill: false },
      duration: SCROLL_DURATION,
      ease: "power2.inOut",
      onComplete: () => {
        setTimeout(
          () => {
            isAnimating.current = false;
          },
          Math.max(50, COOLDOWN_MS - SCROLL_DURATION * 1000),
        );
      },
    });
  }, []);

  // Handler for "Explore the House" button
  const handleExploreHouse = useCallback(() => {
    if (isAnimating.current) return;
    enableSound();

    // 1. Instantly unlock scroll & mark entered
    setHasEntered(true);
    document.body.style.overflow = "";
    isAnimating.current = true;
    currentIndex.current = 1;

    const st = ScrollTrigger.getAll().find(
      (s) => s.vars?.trigger === container.current,
    );
    const totalDist = st ? st.end - st.start : 5 * window.innerHeight;
    const targetScroll = (st ? st.start : 0) + 0.34 * totalDist; // Exact last frame of Section 2 (Family)

    // 2. Auto-scroll: masterTl automatically animates hero elements in sync with scroll
    gsap.to(window, {
      scrollTo: { y: targetScroll, autoKill: false },
      duration: 2.5,
      ease: "power2.inOut",
      onComplete: () => {
        isAnimating.current = false;
      },
    });
  }, [enableSound]);

  // ─── Reset Scroll Position on Mount ───────────────────────────────────────────
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
  }, []);

  // ─── Loading screen logic & Image Preloading ──────────────────────────────────
  useEffect(() => {
    const tryDismiss = () => {
      if (videoReady.current && minTimeReached.current && !isLoaded) {
        // Animate loader out
        const loader = loaderRef.current;
        if (loader) {
          gsap.to(loader, {
            autoAlpha: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => setIsLoaded(true),
          });
        } else {
          setIsLoaded(true);
        }
      }
    };

    // Minimum 1 second display
    const minTimer = setTimeout(() => {
      minTimeReached.current = true;
      tryDismiss();
    }, 1000);

    // Fallback timer: Force dismiss after 3.5 seconds
    const fallbackTimer = setTimeout(() => {
      if (!isLoaded) {
        videoReady.current = true;
        minTimeReached.current = true;
        tryDismiss();
      }
    }, 3500);

    // Preload image sequence
    const images: HTMLImageElement[] = [];
    imagesRef.current = images;
    let loadedCount = 0;

    const isDesktop = window.innerWidth >= 768;
    for (let i = 1; i <= frameCount; i++) {
      const img = new window.Image();
      const paddedIndex = i.toString().padStart(4, "0");
      // Frame 64 is where the editorial stage starts fading in (progress
      // 0.18), so that is the first frame the right-hand panel actually
      // shows. Everything from there on needs the transparent PNGs.
      if (isDesktop && i >= 64) {
        img.src = `/assets/frames-web/frame_${paddedIndex}.png`;
      } else {
        img.src = `/assets/frames/frame_${paddedIndex}.jpg`;
      }
      images.push(img);

      img.onload = () => {
        loadedCount++;
        // Dismiss loading screen when the first few frames are ready
        if (loadedCount === 1) {
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            canvasRef.current.width = 720;
            canvasRef.current.height = 1280;
            if (ctx) {
              ctx.clearRect(0, 0, 720, 1280);
              ctx.drawImage(img, 0, 0);
            }
          }
          if (canvasMobileRef.current) {
            const ctxMobile = canvasMobileRef.current.getContext("2d");
            canvasMobileRef.current.width = 720;
            canvasMobileRef.current.height = 1280;
            if (ctxMobile) {
              ctxMobile.clearRect(0, 0, 720, 1280);
              ctxMobile.drawImage(img, 0, 0);
            }
          }
          videoReady.current = true;
          tryDismiss();
        }
      };
    }

    return () => {
      clearTimeout(minTimer);
      clearTimeout(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock scroll while loading OR until user clicks "Explore the House"
  useEffect(() => {
    if (!isLoaded || !hasEntered) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoaded, hasEntered]);

  // Prevent wheel & touch gestures until "Explore the House" is clicked
  useEffect(() => {
    if (hasEntered || !isLoaded) return;

    const preventScroll = (e: Event) => {
      if (!hasEntered) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
    };
  }, [hasEntered, isLoaded]);

  // ─── Auto-unmute on first interaction ─────────────────────────────────
  useEffect(() => {
    const handleFirstTap = () => {
      enableSound();
      window.removeEventListener("pointerup", handleFirstTap);
      window.removeEventListener("touchend", handleFirstTap);
      window.removeEventListener("click", handleFirstTap);
    };

    // Catch the very first interaction (click/touch) to start audio
    // iOS Safari strictly requires touchend or click to unlock AudioContext (touchstart is often ignored for scrolling)
    window.addEventListener("pointerup", handleFirstTap, { once: true });
    window.addEventListener("touchend", handleFirstTap, { once: true });
    window.addEventListener("click", handleFirstTap, { once: true });

    return () => {
      window.removeEventListener("pointerup", handleFirstTap);
      window.removeEventListener("touchend", handleFirstTap);
      window.removeEventListener("click", handleFirstTap);
    };
  }, [enableSound]);

  // ─── Wheel & Touch hijack (Disabled for free natural scroll) ───
  useEffect(() => {
    // Free scroll is active
  }, [goToSection]);

  // ─── GSAP Animation Timeline ──────────────────────────────
  useGSAP(
    () => {
      if (!introDone) return;
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

      const el = container.current;
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      const groundGlow = groundGlowRef.current;

      if (!el || !canvas || !overlay || !groundGlow) return;
      const ctx = canvas.getContext("2d");

      // ScrollTrigger drives the animation timeline from scroll position.
      // NO snap config — we handle snapping ourselves via the wheel hijack.
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=500%",
          scrub: 1.5, // Smoothing for mobile scrolling
          pin: true,
          onUpdate: (self) => {
            if (!ctx) return;
            // Map scroll progress (0-1) to frame index (0-360)
            const currentFrame = Math.max(
              0,
              Math.min(
                frameCount - 1,
                Math.floor(self.progress * (frameCount - 1)),
              ),
            );
            const img = imagesRef.current[currentFrame];
            if (img && img.complete) {
              if (canvasRef.current) {
                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                  ctx.clearRect(0, 0, 720, 1280);
                  ctx.drawImage(img, 0, 0);
                }
              }
              if (canvasMobileRef.current) {
                const ctxMobile = canvasMobileRef.current.getContext("2d");
                if (ctxMobile) {
                  ctxMobile.clearRect(0, 0, 720, 1280);
                  ctxMobile.drawImage(img, 0, 0);
                }
              }
            }

            // Drive ambient sound crossfading from scroll position
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
        // Fully visible at 0, smoothly dissolves & floats up to 0.15, fully restores on reverse scroll to 0
        .fromTo(
          [".ui-section-1", ".desktop-hero-stage"],
          { autoAlpha: 1, pointerEvents: "auto" },
          { autoAlpha: 0, pointerEvents: "none", duration: 0.04 },
          0.14,
        )
        .fromTo(
          [".s1-logo", ".s1-desktop-logo"],
          { autoAlpha: 1, y: 0, scale: 1 },
          { autoAlpha: 0, y: -45, scale: 0.95, duration: 0.12 },
          0.02,
        )
        .fromTo(
          [".s1-subtitle-wrapper", ".s1-desktop-subtitle-wrapper"],
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -40, duration: 0.1 },
          0.04,
        )
        .fromTo(
          [".s1-explore-btn", ".s1-desktop-explore-btn"],
          { autoAlpha: 1, y: 0 },
          { autoAlpha: 0, y: -35, duration: 0.08 },
          0.06,
        )
        .fromTo(
          ".header-brand-logo",
          { autoAlpha: 0, y: -6 },
          { autoAlpha: 1, y: 0, duration: 0.04 },
          0.12,
        )
        .fromTo(
          ".desktop-editorial-stage",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.04 },
          0.18,
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
        .to(".ui-section-2", { autoAlpha: 0, y: -40, duration: 0.05 }, 0.35)
        // Desktop Experience 1 (Collective)
        .to(
          ".exp-items-track",
          { y: "0vh", duration: 0.04, ease: "power2.out" },
          0.2,
        )
        .to(
          ".exp-item-1",
          { opacity: 1, x: 20, duration: 0.03, ease: "power2.out" },
          0.22,
        )
        .to(
          ".exp-item-1",
          { opacity: 0.2, x: 0, duration: 0.03, ease: "power2.out" },
          0.37,
        );

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
          ".s3-title",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.02, ease: "power2.out" },
          0.42,
        )
        .fromTo(
          ".s3-highlight",
          { clipPath: "inset(0% 100% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.05,
            ease: "power2.inOut",
          },
          0.43,
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
        .to(".ui-section-3", { autoAlpha: 0, duration: 0.05 }, 0.55)
        // Desktop Experience 2 (Coffee)
        .to(
          ".exp-items-track",
          { y: "-75vh", duration: 0.04, ease: "power2.out" },
          0.38,
        )
        .to(
          ".exp-item-2",
          { opacity: 1, x: 20, duration: 0.03, ease: "power2.out" },
          0.42,
        )
        .to(
          ".exp-item-2",
          { opacity: 0.2, x: 0, duration: 0.03, ease: "power2.out" },
          0.57,
        );

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
          ".s4-title",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.02, ease: "power2.out" },
          0.62,
        )
        .fromTo(
          ".s4-highlight",
          { clipPath: "inset(0% 100% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.05,
            ease: "power2.inOut",
          },
          0.63,
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
        .to(".ui-section-4", { autoAlpha: 0, duration: 0.05 }, 0.75)
        // Desktop Experience 3 (Papa)
        .to(
          ".exp-items-track",
          { y: "-150vh", duration: 0.04, ease: "power2.out" },
          0.58,
        )
        .to(
          ".exp-item-3",
          { opacity: 1, x: 20, duration: 0.03, ease: "power2.out" },
          0.62,
        )
        .to(
          ".exp-item-3",
          { opacity: 0.2, x: 0, duration: 0.03, ease: "power2.out" },
          0.77,
        );

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
          ".s5-title",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.02, ease: "power2.out" },
          0.82,
        )
        .fromTo(
          ".s5-highlight",
          { clipPath: "inset(0% 100% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 0.05,
            ease: "power2.inOut",
          },
          0.83,
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
        .to(".ui-section-5", { autoAlpha: 0, duration: 0.05 }, 0.95)
        // Desktop Experience 4 (Mama)
        .to(
          ".exp-items-track",
          { y: "-225vh", duration: 0.04, ease: "power2.out" },
          0.78,
        )
        .to(
          ".exp-item-4",
          { opacity: 1, x: 20, duration: 0.03, ease: "power2.out" },
          0.82,
        );

      // Header background & glowing line: transparent in Hero (0 to 0.15), fades in as Section 2 reveals (0.15 to 0.20)
      masterTl.fromTo(
        [".header-bg", ".header-glow"],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.05, ease: "power2.out" },
        0.15,
      );
    },
    { scope: pageRef, dependencies: [introDone] },
  );

  // Cleanup sound engine on unmount
  useEffect(() => {
    return () => {
      cleanupSound();
    };
  }, [cleanupSound]);

  // ─── Hero Entrance Animation ────────────────────────────────
  useGSAP(
    () => {
      if (isLoaded && !introDone) {
        const tl = gsap.timeline({
          onComplete: () => {
            setIntroDone(true);
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
          0,
        );
        tl.set(".header-brand-logo", { autoAlpha: 0 }, 0);

        tl.to(
          [".ui-section-1", ".desktop-hero-stage"],
          {
            autoAlpha: 1,
            duration: 1.0,
            ease: "power2.out",
          },
          0,
        );

        // 2. Logo smooth scale and graceful dissolve
        tl.fromTo(
          [".s1-logo", ".s1-desktop-logo"],
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
          [".s1-subtitle-wrapper", ".s1-desktop-subtitle-wrapper"],
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" },
          0.5,
        );

        // 4. Explore Button fade up
        tl.fromTo(
          [".s1-explore-btn", ".s1-desktop-explore-btn"],
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out" },
          0.8,
        );
      }
    },
    { scope: pageRef, dependencies: [isLoaded, introDone] },
  );

  return (
    <div ref={pageRef} className="relative w-full bg-[#080907]">
      <Header onOpenBooklet={(menu) => setActiveMenu(menu)} />

      <main
        ref={container}
        className="relative w-full h-[100dvh] bg-[#080907] selection:bg-[#B7D39A] selection:text-black font-sans overflow-hidden"
      >
        {/* Viewport Stage */}
        <div className="absolute inset-0 w-full h-full">
          {/* ─── MOBILE STAGE (< md) ─── */}
          <div className="md:hidden">
            {/* Mobile Canvas Sequence Background */}
            <canvas
              ref={canvasMobileRef}
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
                  onClick={handleExploreHouse}
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
                <h2 className="s3-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center">
                  <HighlighterSweep
                    text="Quality in"
                    highlightBg="#F1E6C3"
                    highlightText="#080907"
                    baseText="#FFFFFF"
                    highlightLayerClassName="s3-highlight"
                  />
                  <HighlighterSweep
                    text="everyday rituals."
                    highlightBg="#F1E6C3"
                    highlightText="#080907"
                    baseText="#FFFFFF"
                    highlightLayerClassName="s3-highlight"
                  />
                </h2>
              </div>
              <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
                <p className="s3-desc max-w-lg text-sm text-white/90 font-medium mb-8">
                  <SplitText text="A reflection of calmness and exploration. We source and roast with intention to bring you the perfect cup." />
                </p>
                <button
                  onClick={() => setActiveMenu("coffee")}
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
                <h2 className="s4-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center">
                  <HighlighterSweep
                    text="Nourishment"
                    highlightBg="#B7D39A"
                    highlightText="#080907"
                    baseText="#FFFFFF"
                    highlightLayerClassName="s4-highlight"
                  />
                  <HighlighterSweep
                    text="and strength."
                    highlightBg="#B7D39A"
                    highlightText="#080907"
                    baseText="#FFFFFF"
                    highlightLayerClassName="s4-highlight"
                  />
                </h2>
              </div>
              <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
                <p className="s4-desc max-w-lg text-sm text-white/90 font-medium mb-8">
                  <SplitText text="Balanced meals and mindful choices. Clean energy that reflects strength, balance, and confidence." />
                </p>
                <button
                  onClick={() => setActiveMenu("papa")}
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
                <h2 className="s5-title font-serif text-4xl font-medium leading-[1.15] flex flex-col items-center">
                  <HighlighterSweep
                    text="Warmth &"
                    highlightBg="#D8A98F"
                    highlightText="#080907"
                    baseText="#FFFFFF"
                    highlightLayerClassName="s5-highlight"
                  />
                  <HighlighterSweep
                    text="Hospitality."
                    highlightBg="#D8A98F"
                    highlightText="#080907"
                    baseText="#FFFFFF"
                    highlightLayerClassName="s5-highlight"
                  />
                </h2>
              </div>
              <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
                <p className="s5-desc max-w-lg text-sm text-white/90 font-medium mb-8">
                  <SplitText text="Nurturing flavors and generous portions. Comfort food that feels like coming home." />
                </p>
                <button
                  onClick={() => setActiveMenu("mama")}
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
          </div>

          {/* ─── DESKTOP / TABLET (md: and up) HERO SECTION 1 ─── */}
          <div className="desktop-hero-stage hidden md:flex absolute inset-0 z-30 flex-col items-center justify-center p-12 bg-[#080907]/90 backdrop-blur-sm text-white opacity-0 invisible">
            {/* Main Center Stage */}
            <div className="flex flex-col items-center text-center">
              <div className="s1-desktop-logo mb-6 opacity-0">
                <Image
                  src="/assets/logos/Asset 26.svg"
                  alt="Voya House"
                  width={340}
                  height={75}
                  priority
                  style={{ width: "320px", height: "auto" }}
                  className="object-contain invert brightness-200"
                />
              </div>
              <div className="s1-desktop-subtitle-wrapper flex flex-col items-center opacity-0">
                <p className="text-sm font-sans font-medium uppercase tracking-[0.3em] text-[#F4EFE9] mb-6">
                  Where people come together
                </p>
              </div>
              <button
                onClick={handleExploreHouse}
                className="s1-desktop-explore-btn group flex items-center gap-2 mt-8 opacity-0 px-9 py-3.5 rounded-lg border border-[#F1E6C3] bg-[#F1E6C3] hover:bg-white active:scale-95 transition-all text-black font-sans font-medium text-xs uppercase tracking-[0.28em] cursor-pointer shadow-lg"
              >
                <span>Explore the House</span>
                <ArrowRight01Icon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* ─── DESKTOP / TABLET (md: and up) EDITORIAL SCROLLYTELLING (Sections 2–5) ─── */}
          <div className="desktop-editorial-stage hidden md:flex flex-row gap-20 absolute inset-0 w-full h-full pointer-events-none opacity-0 invisible z-20">
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
                  FEATURED EXPERIENCES
                </p>
                <h2
                  className="font-serif text-white"
                  style={{
                    fontSize: "clamp(2rem, 3.5vw, 3rem)",
                    lineHeight: 1.15,
                    marginBottom: "1rem",
                  }}
                >
                  The Voya <span style={{ color: "#F1E6C3" }}>Experience</span>
                </h2>
                <p
                  style={{
                    color: "#888",
                    maxWidth: "320px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Handcrafted culinary crafts and mindful rituals designed for
                  the whole family.
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
                      The Modern Collective
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
                      A private, bespoke sanctuary bringing specialty coffee,
                      mindful nourishment, and artisanal comfort together under
                      one warm roof.
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
                          HOUSES
                        </div>
                        <div
                          className="font-bold"
                          style={{ color: "#F1E6C3", fontSize: "13px" }}
                        >
                          3 Artisanal Brands
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
                          EXPERIENCE
                        </div>
                        <div
                          className="font-bold"
                          style={{ color: "#F1E6C3", fontSize: "13px" }}
                        >
                          All-Day Sanctuary
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
                          Explore the House
                        </span>
                        <ArrowRight01Icon
                          size={16}
                          className="text-black transform translate-x-0 group-hover:translate-x-1.5 transition-all duration-300"
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
                      Quality in Everyday Rituals
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
                      A reflection of calmness and exploration. We source and
                      roast with intention to craft the perfect specialty cup
                      for every moment.
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
                          ROAST ORIGIN
                        </div>
                        <div
                          className="font-bold"
                          style={{ color: "#F1E6C3", fontSize: "13px" }}
                        >
                          Ethiopia &amp; Colombia
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
                          BREW CRAFT
                        </div>
                        <div
                          className="font-bold"
                          style={{ color: "#F1E6C3", fontSize: "13px" }}
                        >
                          Pour-Over V60
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => setActiveMenu("coffee")}
                        className="animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#F1E6C3] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(241,230,195,0.4)] hover:shadow-[0_12px_40px_rgba(241,230,195,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F1E6C3] focus-visible:outline-none overflow-hidden"
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
                      Nourishment and Strength
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
                      Balanced meals and mindful choices. Clean energy and
                      wholesome ingredients that reflect vitality, balance, and
                      confidence.
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
                          PHILOSOPHY
                        </div>
                        <div
                          className="font-bold"
                          style={{ color: "#B7D39A", fontSize: "13px" }}
                        >
                          Mindful Nutrition
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
                          SOURCING
                        </div>
                        <div
                          className="font-bold"
                          style={{ color: "#B7D39A", fontSize: "13px" }}
                        >
                          100% Organic
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => setActiveMenu("papa")}
                        className="animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#B7D39A] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(183,211,154,0.4)] hover:shadow-[0_12px_40px_rgba(183,211,154,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#B7D39A] focus-visible:outline-none overflow-hidden"
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
                      Warmth &amp; Hospitality
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
                      Nurturing flavors and generous portions. Comfort food,
                      freshly baked sourdough, and handcrafted treats that feel
                      like coming home.
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
                          BAKERY
                        </div>
                        <div
                          className="font-bold"
                          style={{ color: "#D8A98F", fontSize: "13px" }}
                        >
                          Artisanal Sourdough
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
                          PORTIONS
                        </div>
                        <div
                          className="font-bold"
                          style={{ color: "#D8A98F", fontSize: "13px" }}
                        >
                          Generous &amp; Shared
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => setActiveMenu("mama")}
                        className="animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#D8A98F] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(216,169,143,0.4)] hover:shadow-[0_12px_40px_rgba(216,169,143,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D8A98F] focus-visible:outline-none overflow-hidden"
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
                  className="w-full h-full object-cover"
                />
                {/* Edge blurring inset shadow to perfectly blend video edges into the container background (#E5E1DA) */}
                {/* <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ boxShadow: "inset 0 0 60px 40px #E5E1DA" }}
                /> */}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── The Trilogy Booklets Showroom Section ─── */}
      <section ref={bookletsRef} id="booklets" className="w-full">
        <BookletShowroom onOpenBooklet={(menu) => setActiveMenu(menu)} />
      </section>

      {/* ─── The Brand Overview Storytelling Section ─── */}
      <div ref={storyRef} className="w-full">
        <BrandStorySection onSelectMenu={(menu) => setActiveMenu(menu)} />
      </div>

      {/* ─── Contact Section (The Theater Override) ─── */}
      <div ref={contactRef} className="w-full">
        <ContactSection />
      </div>

      {/* ─── Cinematic Footer Section ─── */}
      <CinematicFooter ref={footerRef} />

      {/* ─── Sound Toggle ─── */}
      <SoundToggle
        isMuted={isMuted}
        onToggle={toggleMute}
        isPageLoaded={isLoaded}
      />

      {/* ─── Table Param Sync (QR Code) & Table Cart Sheet Overlay ─── */}
      <TableParamSync />
      <CartSheet />

      {/* ─── Loading Screen ─── */}
      {!isLoaded && (
        <div
          ref={loaderRef}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-[#080907]"
        >
          {/* Brand logo with subtle pulse */}
          <div
            className="mb-4"
            style={{ animation: "loaderPulse 2s ease-in-out infinite" }}
          >
            <Image
              src="/assets/logos/Asset 11.svg"
              alt="Voya"
              width={140}
              height={203}
              priority
              loading="eager"
              style={{ width: "auto", height: "100px" }}
            />
          </div>

          {/* V60 Pour-over Animation */}
          <div className="mt-8 relative flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-20 h-20 overflow-visible">
              <defs>
                <clipPath id="cupClip">
                  {/* Inner bounds of the cup to mask the coffee filling up */}
                  <path d="M 32,50 L 32,80 Q 32,88 40,88 L 60,88 Q 68,88 68,80 L 68,50 Z" />
                </clipPath>
              </defs>

              {/* V60 Cone */}
              <polygon
                points="15,10 85,10 55,43 45,43"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dripper Base */}
              <line
                x1="30"
                y1="46"
                x2="70"
                y2="46"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Cup Body */}
              <path
                d="M 30,50 L 30,80 Q 30,90 40,90 L 60,90 Q 70,90 70,80 L 70,50"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Cup Handle */}
              <path
                d="M 70,58 C 85,58 85,78 70,78"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Animated Drip */}
              <circle
                cx="50"
                cy="48"
                r="1.5"
                fill="#F1E6C3"
                className="drip-anim"
              />

              {/* Coffee inside cup */}
              <g clipPath="url(#cupClip)">
                <rect
                  x="30"
                  y="90"
                  width="40"
                  height="40"
                  fill="#F1E6C3"
                  className="coffee-fill"
                />
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* Render the Luxury Menu Booklet if active */}
      {activeMenu && (
        <MenuStackOverlay
          initialBrandId={activeMenu}
          onClose={() => setActiveMenu(null)}
        />
      )}
    </div>
  );
}
