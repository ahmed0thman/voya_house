"use client";

import Image from "next/image";
import { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import Header from "@/components/Header";
import SplitText from "@/components/SplitText";
import { Coffee01Icon, Leaf01Icon, Pizza01Icon } from "hugeicons-react";

// Section snap points as scroll progress (0–1)
const SNAP_POINTS = [0, 0.3, 0.55, 0.74, 0.95];
const TOTAL_SECTIONS = 7; // 5 video sections + contact + footer
const SCROLL_DURATION = 3.5; // seconds per section transition
const COOLDOWN_MS = 3600; // lock input during animation

export default function Home() {
  const container = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const groundGlowRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  // Loading state
  const [isLoaded, setIsLoaded] = useState(false);
  const videoReady = useRef(false);
  const minTimeReached = useRef(false);

  // Mutable refs for the wheel-hijack state machine
  const currentIndex = useRef(0);
  const isAnimating = useRef(false);
  const touchStartY = useRef(0);

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
    } else if (target === 5 && contactRef.current) {
      // Contact Section
      scrollTarget = contactRef.current.offsetTop;
    } else if (target === 6) {
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

  // ─── Loading screen logic ──────────────────────────────────
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
    const timer = setTimeout(() => {
      minTimeReached.current = true;
      tryDismiss();
    }, 1000);

    const video = videoRef.current;
    if (video) {
      const onReady = () => {
        videoReady.current = true;
        tryDismiss();
      };
      // canplaythrough = enough data buffered to play without stalling
      if (video.readyState >= 4) {
        onReady();
      } else {
        video.addEventListener("canplaythrough", onReady, { once: true });
      }
    }

    return () => clearTimeout(timer);
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

  // ─── Wheel & Touch hijack ──────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // ← THIS is the key: browser never scrolls on its own

      if (isAnimating.current) return; // ignore input during transition

      if (e.deltaY > 0) {
        goToSection(currentIndex.current + 1);
      } else if (e.deltaY < 0) {
        goToSection(currentIndex.current - 1);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimating.current) return;
      const delta = touchStartY.current - e.changedTouches[0].clientY;
      const threshold = 50; // minimum px to count as a swipe
      if (Math.abs(delta) < threshold) return;

      if (delta > 0) {
        goToSection(currentIndex.current + 1);
      } else {
        goToSection(currentIndex.current - 1);
      }
    };

    // Keyboard support (arrow keys, space, page up/down)
    const onKeyDown = (e: KeyboardEvent) => {
      if (isAnimating.current) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        goToSection(currentIndex.current + 1);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goToSection(currentIndex.current - 1);
      }
    };

    // passive: false is CRITICAL — it allows preventDefault on wheel
    // window.addEventListener("wheel", onWheel, { passive: false });
    // window.addEventListener("touchstart", onTouchStart, { passive: true });
    // window.addEventListener("touchend", onTouchEnd, { passive: true });
    // window.addEventListener("keydown", onKeyDown);

    return () => {
      // window.removeEventListener("wheel", onWheel);
      // window.removeEventListener("touchstart", onTouchStart);
      // window.removeEventListener("touchend", onTouchEnd);
      // window.removeEventListener("keydown", onKeyDown);
    };
  }, [goToSection]);

  // ─── GSAP Animation Timeline ──────────────────────────────
  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

      const el = container.current;
      const video = videoRef.current;
      const overlay = overlayRef.current;
      const groundGlow = groundGlowRef.current;
      const footer = footerRef.current;

      if (!el || !video || !overlay || !groundGlow) return;

      video.pause();
      video.currentTime = 0;

      // ScrollTrigger drives the animation timeline from scroll position.
      // NO snap config — we handle snapping ourselves via the wheel hijack.
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6, // Tighter scrub for responsiveness since we control scroll
          onUpdate: (self) => {
            const duration = video.duration || 15;
            video.currentTime = self.progress * duration;
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

      // Header visibility (fades in after Hero)
      masterTl.fromTo(
        ".site-header",
        { opacity: 0 },
        { opacity: 1, duration: 0.05 },
        0.15,
      );

      // ==========================================
      // Section 2: Family Reveal (0.2 to 0.4)
      // ==========================================
      masterTl
        .fromTo(
          ".ui-section-2",
          { autoAlpha: 0, y: 40, scale: 0.95 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.05 },
          0.2,
        )
        .to(
          ".ui-section-2",
          { autoAlpha: 0, y: -40, scale: 0.95, duration: 0.05 },
          0.35,
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
        );

      // Footer Logo Parallax/Fade
      if (footer) {
        gsap.from(".footer-logo span", {
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
          y: 100,
          opacity: 0,
          stagger: 0.1,
        });
      }
    },
    { scope: container },
  );

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
      <Header />

      {/* 500vh Master Scroll Container */}
      <main
        ref={container}
        className="relative w-full h-[500vh] bg-[#080907] selection:bg-[#B7D39A] selection:text-black font-sans"
      >
        {/* FIXED Viewport Stage */}
        <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden">
          {/* VIDEO BACKGROUND */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover scale-105"
            muted
            playsInline
            preload="auto"
            src="/assets/voya-motion-landing.mp4"
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
            <div className="s1-scroll-indicator absolute bottom-[2%] left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 invisible">
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-white/70 mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                Scroll
              </span>
              <div className="w-[1px] h-16 bg-white/20 relative rounded-full">
                {/* Glowing moving dot */}
                <div
                  className="scroll-dot-anim absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff]"
                  style={{ left: "50%", marginLeft: "-3px", top: 0 }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Family Reveal */}
          <div className="ui-section-2 absolute inset-0 flex flex-col items-center px-6 text-center text-white opacity-0 invisible">
            <div className="max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-10 md:p-16 rounded-[2rem] shadow-2xl relative overflow-hidden mt-[20vh]">
              <h2 className="font-serif text-3xl md:text-5xl font-medium tracking-tight mb-4 relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                A Modern Family Experience
              </h2>
              <p className="text-sm md:text-base text-white/90 font-light relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Everyday rituals, mindful choices, and sweet moments made for
                sharing.
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
                <SplitText text="SPECIALTY" />
              </div>
            </div>

            <div className="absolute top-[30%] left-0 w-full text-center">
              <h2 className="s3-title font-serif text-5xl md:text-7xl font-medium leading-[1.05] drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
                <SplitText text="Quality in" />
                <br />
                <SplitText text="everyday rituals." />
              </h2>
            </div>

            <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
              <p className="s3-desc max-w-lg text-sm md:text-base text-white/90 font-medium mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                <SplitText text="A reflection of calmness and exploration. We source and roast with intention to bring you the perfect cup." />
              </p>
              <button className="s3-btn bg-white/90 backdrop-blur-md text-black px-8 py-4 text-xs md:text-sm font-bold hover:bg-[#F1E6C3] transition-colors rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                Discover the Roast
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

            <div className="absolute top-[30%] left-0 w-full text-center">
              <h2 className="s4-title font-serif text-5xl md:text-7xl font-medium leading-[1.05] drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
                <SplitText text="Nourishment" />
                <br />
                <SplitText text="and strength." />
              </h2>
            </div>

            <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
              <p className="s4-desc max-w-lg text-sm md:text-base text-white/90 font-medium mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                <SplitText text="Balanced meals and mindful choices. Clean energy that reflects strength, balance, and confidence." />
              </p>
              <button className="s4-btn bg-white/90 backdrop-blur-md text-black px-8 py-4 text-xs md:text-sm font-bold hover:bg-[#B7D39A] transition-colors rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                Explore Healthy Menu
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

            <div className="absolute top-[30%] left-0 w-full text-center">
              <h2 className="s5-title font-serif text-5xl md:text-7xl font-medium leading-[1.05] drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
                <SplitText text="Warmth &" />
                <br />
                <SplitText text="Hospitality." />
              </h2>
            </div>

            <div className="absolute top-[70%] left-0 w-full flex flex-col items-center text-center px-6">
              <p className="s5-desc max-w-lg text-sm md:text-base text-white/90 font-medium mb-8 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                <SplitText text="Nurturing flavors and generous portions. Comfort food that feels like coming home." />
              </p>
              <button className="s5-btn bg-white/90 backdrop-blur-md text-black px-8 py-4 text-xs md:text-sm font-bold hover:bg-[#D8A98F] transition-colors rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                Taste the Comfort
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Contact Section (The Theater Override) ─── */}
      <section
        ref={contactRef}
        id="contact"
        className="relative z-20 w-full min-h-screen bg-[#080907] flex flex-col items-center justify-center py-20 px-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
      >
        <div className="max-w-4xl w-full mx-auto relative z-10">
          <div className="text-center mb-16 flex flex-col items-center">
            <Image
              src="/assets/logos/Asset 21.svg"
              alt="Voya Icon"
              width={60}
              height={60}
              className="mb-8 opacity-80"
            />
            <p className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-white/50 mb-4">
              End of the Line
            </p>
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white font-medium drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span className="text-[#F1E6C3]">Join</span> the Voyage.
            </h2>
          </div>

          <form className="flex flex-col gap-6 md:gap-8 bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2rem] shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              <div className="relative z-0 w-full mt-2 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#F1E6C3] after:scale-x-0 focus-within:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center after:shadow-[0_0_12px_rgba(241,230,195,0.9)]">
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="block py-2 px-0 w-full text-base text-white bg-transparent border-0 border-b border-white/30 appearance-none focus:outline-none focus:ring-0 peer transition-all"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="name"
                  className="peer-focus:font-medium absolute text-sm text-white/50 duration-300 transform -translate-y-6 scale-75 top-2 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#F1E6C3] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Name
                </label>
              </div>
              <div className="relative z-0 w-full mt-2 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#F1E6C3] after:scale-x-0 focus-within:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center after:shadow-[0_0_12px_rgba(241,230,195,0.9)]">
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="block py-2 px-0 w-full text-base text-white bg-transparent border-0 border-b border-white/30 appearance-none focus:outline-none focus:ring-0 peer transition-all"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="email"
                  className="peer-focus:font-medium absolute text-sm text-white/50 duration-300 transform -translate-y-6 scale-75 top-2 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#F1E6C3] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                >
                  Email
                </label>
              </div>
            </div>
            <div className="relative z-0 w-full mt-4 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#F1E6C3] after:scale-x-0 focus-within:after:scale-x-100 after:transition-transform after:duration-300 after:origin-center after:shadow-[0_0_12px_rgba(241,230,195,0.9)]">
              <textarea
                name="message"
                id="message"
                className="block py-2 px-0 w-full text-base text-white bg-transparent border-0 border-b border-white/30 appearance-none focus:outline-none focus:ring-0 peer transition-all resize-none [field-sizing:content]"
                placeholder=" "
                required
              ></textarea>
              <label
                htmlFor="message"
                className="peer-focus:font-medium absolute text-sm text-white/50 duration-300 transform -translate-y-6 scale-75 top-2 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#F1E6C3] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                Message
              </label>
            </div>
            <button
              type="button"
              className="self-end bg-[#F1E6C3] text-black font-bold text-sm uppercase tracking-wider px-10 py-4 rounded-full hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(241,230,195,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] hover:-translate-y-1"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* ─── Footer Section ─── */}
      <footer
        ref={footerRef}
        className="relative z-20 w-full bg-[#050505] flex flex-col justify-between pt-24 pb-12 px-6 md:px-12 border-t border-white/5 overflow-hidden"
      >
        <div className="flex flex-col md:flex-row justify-between w-full max-w-7xl mx-auto flex-1 z-10 gap-12 md:gap-0">
          <div className="flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-12 md:mb-0">
              <Image
                src="/assets/logos/Asset 8.svg"
                alt="Voya Logo"
                width={32}
                height={32}
                className="opacity-90"
              />
              <div className="w-1.5 h-1.5 rounded-full bg-[#F1E6C3] animate-pulse"></div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/50">
                Est. 2026
              </span>
            </div>
            <ul className="flex flex-col gap-5 text-white/70 font-light text-sm md:text-base mt-8 md:mt-0">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 hover:text-[#F1E6C3] transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 hover:text-[#F1E6C3] transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  Twitter
                </a>
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-end text-left md:text-right mt-auto md:mt-0">
            <div className="flex items-center md:justify-end gap-2 mb-4 text-white/40">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <p className="text-xs font-mono uppercase tracking-[0.2em]">
                Visit Us
              </p>
            </div>
            <p className="text-white/80 font-serif text-xl md:text-2xl leading-relaxed">
              123 Voyage Street
              <br />
              New Cairo, EG
            </p>
          </div>
        </div>

        <div className="w-full flex justify-center items-end mt-24 md:mt-32 relative z-0">
          <h1 className="footer-logo font-serif text-[22vw] leading-none text-white/[0.03] tracking-tighter w-full text-center select-none flex justify-between">
            <span>V</span>
            <span>O</span>
            <span>Y</span>
            <span>A</span>
          </h1>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-center text-[10px] text-white/30 font-mono uppercase mt-8 md:mt-4 gap-4 md:gap-0">
          <span>© 2026 Voya. All Rights Reserved.</span>
          <span>Designed for the Journey</span>
        </div>
      </footer>

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
    </>
  );
}
