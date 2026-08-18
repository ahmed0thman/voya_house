"use client";

import Image from "next/image";
import { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import Header from "@/components/Header";
import SplitText from "@/components/SplitText";
import SoundToggle from "@/components/SoundToggle";
import { useAmbientSound } from "@/components/useAmbientSound";
import { Coffee01Icon, Leaf01Icon, Pizza01Icon, ArrowRight01Icon } from "hugeicons-react";
import MenuStackOverlay from "@/components/MenuStackOverlay";
import BookletShowroom from "@/components/BookletShowroom";
import BrandStorySection from "@/components/BrandStorySection";
import ContactSection from "@/components/ContactSection";
import CinematicFooter from "@/components/CinematicFooter";

// Section snap points as scroll progress (0–1)
const SNAP_POINTS = [0, 0.3, 0.55, 0.74, 0.95];
const TOTAL_SECTIONS = 9; // 5 video sections + booklets + story + contact + footer
const SCROLL_DURATION = 3.5; // seconds per section transition
const COOLDOWN_MS = 3600; // lock input during animation

export default function Home() {
  const container = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const groundGlowRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<'coffee' | 'papa' | 'mama' | null>(null);
  const bookletsRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameCount = 361;

  // Loading state
  const [isLoaded, setIsLoaded] = useState(false);

  // Ambient sound engine
  const { isMuted, toggleMute, enableSound, updateProgress, setDucked, cleanup: cleanupSound } = useAmbientSound();
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
      // Sections 0-4 (video container)
      const scrollMax = el.scrollHeight - window.innerHeight;
      scrollTarget = SNAP_POINTS[target] * scrollMax;
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

  // ─── Reset Scroll Position on Mount ───────────────────────────────────────────
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
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

    for (let i = 1; i <= frameCount; i++) {
      const img = new window.Image();
      const paddedIndex = i.toString().padStart(4, "0");
      img.src = `/assets/frames/frame_${paddedIndex}.jpg`;
      images.push(img);

      img.onload = () => {
        loadedCount++;
        // Dismiss loading screen when the first few frames are ready
        if (loadedCount === 1) {
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            canvas.width = 720;
            canvas.height = 1280;
            if (ctx) ctx.drawImage(img, 0, 0);
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

  // Lock scroll while loading
  useEffect(() => {
    if (!isLoaded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoaded]);

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
          end: "bottom bottom",
          scrub: 1.5, // Smoothing for mobile scrolling
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
              ctx.drawImage(img, 0, 0);
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
      masterTl.to(
        ".ui-section-1",
        { autoAlpha: 0, y: -40, duration: 0.05 },
        0.15,
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
          { opacity: 0, scale: 1.2, color: "#fff" },
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
        // Glow emphasis on title
        .to(
          ".s3-title .char",
          {
            textShadow:
              "0 0 20px #F1E6C3, 0 0 40px #F1E6C3, 0 0 80px rgba(241,230,195,0.4)",
            duration: 0.015,
            stagger: 0.001,
            ease: "power2.out",
          },
          0.47,
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
          { opacity: 0, scale: 1.2, color: "#fff" },
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
        // Glow emphasis on title
        .to(
          ".s4-title .char",
          {
            textShadow:
              "0 0 20px #B7D39A, 0 0 40px #B7D39A, 0 0 80px rgba(183,211,154,0.4)",
            duration: 0.015,
            stagger: 0.001,
            ease: "power2.out",
          },
          0.67,
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
          { opacity: 0, scale: 1.2, color: "#fff" },
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
        .to(
          ".s5-title .char",
          {
            textShadow:
              "0 0 20px #D8A98F, 0 0 40px #D8A98F, 0 0 80px rgba(216,169,143,0.4)",
            duration: 0.015,
            stagger: 0.001,
            ease: "power2.out",
          },
          0.87,
        )
        .to(".ui-section-5", { autoAlpha: 0, duration: 0.05 }, 0.95);

      // Header visibility (fades in only after 5th section)
      masterTl.fromTo(
        ".site-header",
        { opacity: 0 },
        { opacity: 1, duration: 0.05 },
        0.95,
      );
    },
    { scope: container },
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
      if (isLoaded) {
        const tl = gsap.timeline();

        // Fade in section container
        tl.to(".ui-section-1", {
          autoAlpha: 1,
          duration: 0.8,
          ease: "power2.out",
        });

        // Animate VOYA wavy bottom-up
        tl.fromTo(
          ".s1-title .char",
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.05,
            ease: "back.out(1.5)",
          },
          "-=0.4",
        );

        // Slide up the subtitle wrapper AFTER the title finishes
        tl.fromTo(
          ".s1-subtitle-wrapper",
          { autoAlpha: 0, y: 15 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "+=0.2", // Wait for title to finish
        );

        // Immediately after sliding up, sweep the marker
        tl.to(
          ".s1-subtitle-marker",
          {
            backgroundSize: "100% 100%",
            color: "#080907", // Change text to dark so it's readable on the yellow marker
            duration: 0.6,
            ease: "power2.out",
          },
          ">", // Run exactly when the previous animation finishes
        );
        // Fade in scroll indicator
        tl.to(
          ".s1-scroll-indicator",
          { autoAlpha: 1, duration: 0.8, ease: "power2.out" },
          "+=0.2", // Wait a tiny bit after marker sweep
        );
      }
    },
    { scope: container, dependencies: [isLoaded] },
  );

  return (
    <>
      {/* 500vh Master Scroll Container */}
      <main
        ref={container}
        className="relative w-full h-[500vh] bg-[#080907] selection:bg-[#B7D39A] selection:text-black font-sans"
      >
        <Header onOpenBooklet={(menu) => setActiveMenu(menu)} />

        {/* FIXED Viewport Stage */}
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden">
          {/* CANVAS SEQUENCE BACKGROUND */}
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

          {/* UI STAGE */}

          {/* Section 1: Hero */}
          <div className="ui-section-1 absolute inset-0 flex flex-col justify-end pb-[15vh] px-6 text-white opacity-0 invisible">
            <div className="flex flex-col items-center">
              <h1 className="s1-title font-serif text-[5rem] md:text-[9rem] leading-none tracking-tight m-0 p-0 font-medium drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                <SplitText text="VOYA" />
              </h1>
              <div className="s1-subtitle-wrapper mt-4 flex opacity-0 invisible">
                <p
                  className="s1-subtitle-marker text-xs md:text-sm font-bold uppercase tracking-widest px-2 py-1"
                  style={{
                    backgroundImage:
                      "linear-gradient(120deg, #F1E6C3 0%, #F1E6C3 100%)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "0% 100%",
                    backgroundPosition: "0 100%",
                    color: "rgba(255, 255, 255, 0.9)",
                    display: "inline-block",
                  }}
                >
                  Where people come together
                </p>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="s1-scroll-indicator absolute bottom-[1%] left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 invisible">
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/70 mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                Scroll
              </span>
              <div className="w-[1px] h-10 bg-white/20 relative rounded-full">
                {/* Glowing moving dot */}
                <div
                  className="scroll-dot-anim absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff]"
                  style={{ left: "50%", marginLeft: "-3px", top: 0 }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Family Reveal */}
          <div className="ui-section-2 absolute inset-0 text-white opacity-0 invisible">
            <div className="absolute top-[10%] left-0 w-full text-center px-6">
              <h2 className="s2-title font-serif text-5xl md:text-7xl font-medium leading-[1.05] drop-shadow-[0_8px_24px_rgba(255,255,255,0.2)] whitespace-break-spaces">
                <SplitText text="A Modern Family" />
                <br />
                <SplitText text="Experience" />
              </h2>
            </div>

            <div className="absolute top-[40%] left-0 w-full flex flex-col items-center text-center px-6">
              <p className="s2-desc max-w-lg text-sm md:text-base text-white/90 font-medium mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] whitespace-break-spaces">
                <SplitText text="Everyday rituals, mindful choices, and sweet moments made for sharing." />
              </p>
            </div>
          </div>

          {/* Section 3: Voya Coffee */}
          <div className="ui-section-3 absolute inset-0 text-white opacity-0 invisible">
            <div className="absolute top-[2%] left-[5%] flex flex-col items-center">
              <div className="s3-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <Coffee01Icon size={32} className="text-[#F1E6C3]" />
              </div>
              <div className="s3-vertical-text mt-6 font-mono uppercase text-[10px] text-[#F1E6C3] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
                <SplitText text="VOYA " />
              </div>
            </div>

            <div className="absolute top-[20%] left-0 w-full text-center">
              <h2 className="s3-title font-serif text-4xl md:text-7xl font-medium leading-[1.05] drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
                <SplitText text="Quality in" />
                <br />
                <SplitText text="everyday rituals." />
              </h2>
            </div>

            <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
              <p className="s3-desc max-w-lg text-sm md:text-base text-white/90 font-medium mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                <SplitText text="A reflection of calmness and exploration. We source and roast with intention to bring you the perfect cup." />
              </p>
              <button 
                onClick={() => setActiveMenu('coffee')}
                className="s3-btn animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#F1E6C3] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(241,230,195,0.4)] hover:shadow-[0_12px_40px_rgba(241,230,195,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#F1E6C3] focus-visible:outline-none overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
                  <Coffee01Icon size={16} className="text-black" />
                </div>
                <span className="font-sans font-bold text-xs md:text-sm tracking-widest uppercase text-black">
                  Discover the Roast
                </span>
                <ArrowRight01Icon size={16} className="text-black transform translate-x-0 group-hover:translate-x-1.5 transition-all duration-300" />
              </button>
            </div>
          </div>

          {/* Section 4: Papa Voya */}
          <div className="ui-section-4 absolute inset-0 text-white opacity-0 invisible">
            <div className="absolute top-[2%] left-[5%] flex flex-col items-center">
              <div className="s4-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <Leaf01Icon size={32} className="text-[#B7D39A]" />
              </div>
              <div className="s4-vertical-text mt-6 font-mono uppercase text-[10px] text-[#B7D39A] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
                <SplitText text="PAPA VOYA" />
              </div>
            </div>

            <div className="absolute top-[20%] left-0 w-full text-center">
              <h2 className="s4-title font-serif text-4xl md:text-7xl font-medium leading-[1.05] drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
                <SplitText text="Nourishment" />
                <br />
                <SplitText text="and strength." />
              </h2>
            </div>

            <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
              <p className="s4-desc max-w-lg text-sm md:text-base text-white/90 font-medium mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                <SplitText text="Balanced meals and mindful choices. Clean energy that reflects strength, balance, and confidence." />
              </p>
              <button 
                onClick={() => setActiveMenu('papa')}
                className="s4-btn animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#B7D39A] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(183,211,154,0.4)] hover:shadow-[0_12px_40px_rgba(183,211,154,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#B7D39A] focus-visible:outline-none overflow-hidden"
                style={{ animationDelay: "1.5s" }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
                  <Leaf01Icon size={16} className="text-black" />
                </div>
                <span className="font-sans font-bold text-xs md:text-sm tracking-widest uppercase text-black">
                  Explore Healthy Menu
                </span>
                <ArrowRight01Icon size={16} className="text-black transform translate-x-0 group-hover:translate-x-1.5 transition-all duration-300" />
              </button>
            </div>
          </div>

          {/* Section 5: Mama Voya */}
          <div className="ui-section-5 absolute inset-0 text-white opacity-0 invisible">
            <div className="absolute top-[2%] left-[5%] flex flex-col items-center">
              <div className="s5-icon p-4 bg-black/40 rounded-2xl border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <Pizza01Icon size={32} className="text-[#D8A98F]" />
              </div>
              <div className="s5-vertical-text mt-6 font-mono uppercase text-[10px] text-[#D8A98F] drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-bold tracking-[0.3em] [writing-mode:vertical-rl] [text-orientation:upright]">
                <SplitText text="MAMA VOYA" />
              </div>
            </div>

            <div className="absolute top-[20%] left-0 w-full text-center">
              <h2 className="s5-title font-serif text-4xl md:text-7xl font-medium leading-[1.05] drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
                <SplitText text="Warmth &" />
                <br />
                <SplitText text="Hospitality." />
              </h2>
            </div>

            <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
              <p className="s5-desc max-w-lg text-sm md:text-base text-white/90 font-medium mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                <SplitText text="Nurturing flavors and generous portions. Comfort food that feels like coming home." />
              </p>
              <button 
                onClick={() => setActiveMenu('mama')}
                className="s5-btn animate-cta-wiggle group relative inline-flex items-center gap-4 px-8 py-4 rounded-full bg-[#D8A98F] text-black font-extrabold border border-white/40 backdrop-blur-xl transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(216,169,143,0.4)] hover:shadow-[0_12px_40px_rgba(216,169,143,0.7)] hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#D8A98F] focus-visible:outline-none overflow-hidden"
                style={{ animationDelay: "3s" }}
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 pointer-events-none" />
                <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-colors">
                  <Pizza01Icon size={16} className="text-black" />
                </div>
                <span className="font-sans font-bold text-xs md:text-sm tracking-widest uppercase text-black">
                  Taste the Comfort
                </span>
                <ArrowRight01Icon size={16} className="text-black transform translate-x-0 group-hover:translate-x-1.5 transition-all duration-300" />
              </button>
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

      {/* ─── Loading Screen ─── */}
      {!isLoaded && (
        <div
          ref={loaderRef}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080907]"
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
              height={140}
              className="drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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
        <MenuStackOverlay initialBrandId={activeMenu} onClose={() => setActiveMenu(null)} />
      )}
    </>
  );
}
