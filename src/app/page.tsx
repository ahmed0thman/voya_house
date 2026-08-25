"use client";

import Image from "next/image";
import { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import { useAmbientSound } from "@/components/useAmbientSound";
import MenuStackOverlay from "@/components/MenuStackOverlay";
import BookletShowroom from "@/components/BookletShowroom";
import BrandStorySection from "@/components/BrandStorySection";
import ContactSection from "@/components/ContactSection";
import CinematicFooter from "@/components/CinematicFooter";
import CartSheet from "@/components/CartSheet";
import TableParamSync from "@/components/TableParamSync";
import { useViewport } from "@/hooks/useViewport";
import MobileStage from "@/components/MobileStage";
import DesktopStage from "@/components/DesktopStage";

// Section snap points as scroll progress (0–1)
const SNAP_POINTS = [0, 0.3, 0.55, 0.74, 0.95];
const TOTAL_SECTIONS = 9; // 5 video sections + booklets + story + contact + footer
const SCROLL_DURATION = 3.5; // seconds per section transition
const COOLDOWN_MS = 3600; // lock input during animation
const FRAME_COUNT = 361;

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<
    "coffee" | "papa" | "mama" | null
  >(null);
  const bookletsRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);

  // Loading state
  const [isLoaded, setIsLoaded] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  // Viewport detection — conditionally renders mobile or desktop stage
  const viewport = useViewport();

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

    // 1. Mark animation state
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
    for (let i = 1; i <= FRAME_COUNT; i++) {
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
        // Dismiss loading screen when the first frame is ready
        if (loadedCount === 1) {
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

  // Lock scroll while loading OR during the entrance animation
  useEffect(() => {
    if (!introDone) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [introDone]);

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

  // Cleanup sound engine on unmount
  useEffect(() => {
    return () => {
      cleanupSound();
    };
  }, [cleanupSound]);

  // ─── Shared stage props ───────────────────────────────────────────────
  const stageProps = {
    containerRef: container,
    pageRef,
    imagesRef,
    frameCount: FRAME_COUNT,
    introDone,
    isLoaded,
    onIntroDone: () => setIntroDone(true),
    onExploreHouse: handleExploreHouse,
    onOpenMenu: setActiveMenu as (menu: "coffee" | "papa" | "mama") => void,
    updateProgress,
  };

  return (
    <div ref={pageRef} className="relative w-full bg-[#080907]">
      <Header onOpenBooklet={(menu) => setActiveMenu(menu)} />

      <main
        ref={container}
        className="relative w-full h-[100dvh] bg-[#080907] selection:bg-[#B7D39A] selection:text-black font-sans overflow-hidden"
      >
        {/* Viewport Stage */}
        <div className="absolute inset-0 w-full h-full">
          {viewport === "mobile" && <MobileStage {...stageProps} />}
          {viewport === "desktop" && (
            <DesktopStage {...stageProps} bookletsRef={bookletsRef} />
          )}
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
