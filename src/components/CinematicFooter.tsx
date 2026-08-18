"use client";

import React, { useRef, forwardRef, useImperativeHandle } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Location01Icon,
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  Clock01Icon,
  Mail01Icon,
  SparklesIcon,
  ArrowUp01Icon,
} from "hugeicons-react";

gsap.registerPlugin(ScrollTrigger);

const CinematicFooter = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function CinematicFooter(props, ref) {
    const internalFooterRef = useRef<HTMLElement>(null);
    useImperativeHandle(ref, () => internalFooterRef.current as HTMLElement);

    useGSAP(
      () => {
        const el = internalFooterRef.current;
        if (!el) return;

        // Anamorphic Lens Flare Beam entrance
        gsap.fromTo(
          el.querySelector(".cinematic-lens-beam"),
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 1.4,
            ease: "expo.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );

        // Credits Staggered Entrance
        gsap.fromTo(
          el.querySelectorAll(".film-credit-item"),
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el.querySelector(".film-credits-grid"),
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      },
      { scope: internalFooterRef }
    );

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <footer
        {...props}
        ref={internalFooterRef}
        className={`relative z-20 w-full bg-[#040504] flex flex-col justify-between pt-20 sm:pt-24 pb-12 px-6 sm:px-10 md:px-16 border-t border-white/[0.07] overflow-hidden text-white select-none ${props.className || ""}`}
      >
        {/* ─── Cinematic Anamorphic Lens Flare Beam ─── */}
        <div className="cinematic-lens-beam absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-[#F1E6C3]/80 to-transparent pointer-events-none origin-center shadow-[0_0_25px_rgba(241,230,195,0.7)]" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[150px] bg-[#F1E6C3]/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl w-full mx-auto flex flex-col justify-between z-10">
          
          {/* ─── Open Minimal Credits Columns (No Cards) ─── */}
          <div className="film-credits-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 pb-14 sm:pb-16 border-b border-white/[0.08]">
            
            {/* Column 1: The Sanctuary */}
            <div className="film-credit-item flex flex-col space-y-3">
              <div className="flex items-center gap-2 text-[#F1E6C3]">
                <Location01Icon size={16} />
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 font-bold">
                  Flagship Location
                </span>
              </div>
              <p className="font-serif text-lg sm:text-xl text-white font-medium">
                Voya House
              </p>
              <p className="font-sans text-xs text-white/60 leading-relaxed">
                123 Voyage Street <br />
                New Cairo, Egypt
              </p>
            </div>

            {/* Column 2: The Repertoire */}
            <div className="film-credit-item flex flex-col space-y-3">
              <div className="flex items-center gap-2 text-[#F1E6C3]">
                <SparklesIcon size={16} />
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 font-bold">
                  The Repertoire
                </span>
              </div>
              <div className="flex flex-col space-y-2 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <Coffee01Icon size={13} className="text-[#F1E6C3]" />
                  <span>01 · Voya Specialty Coffee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf01Icon size={13} className="text-[#B7D39A]" />
                  <span>02 · Papa Voya Healthy Food</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pizza01Icon size={13} className="text-[#D8A98F]" />
                  <span>03 · Mama Voya Comfort Table</span>
                </div>
              </div>
            </div>

            {/* Column 3: House Hours */}
            <div className="film-credit-item flex flex-col space-y-3">
              <div className="flex items-center gap-2 text-[#F1E6C3]">
                <Clock01Icon size={16} />
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 font-bold">
                  Daily Hours
                </span>
              </div>
              <p className="font-serif text-lg sm:text-xl text-white font-medium">
                07:00 &mdash; 23:00
              </p>
              <p className="font-sans text-xs text-white/60 leading-relaxed">
                Seven days a week <br />
                Dine-in · Pickup Window
              </p>
            </div>

            {/* Column 4: Concierge & Socials */}
            <div className="film-credit-item flex flex-col space-y-3">
              <div className="flex items-center gap-2 text-[#F1E6C3]">
                <Mail01Icon size={16} />
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 font-bold">
                  Concierge
                </span>
              </div>
              <a
                href="mailto:concierge@voyahouse.com"
                className="font-mono text-xs text-white/90 hover:text-[#F1E6C3] transition-colors select-all"
              >
                concierge@voyahouse.com
              </a>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="font-mono text-[11px] uppercase tracking-widest text-white/60 hover:text-[#F1E6C3] transition-colors"
                >
                  Instagram
                </a>
                <span className="text-white/20">·</span>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Twitter / X"
                  className="font-mono text-[11px] uppercase tracking-widest text-white/60 hover:text-[#F1E6C3] transition-colors"
                >
                  Twitter
                </a>
              </div>
            </div>

          </div>

          {/* ─── Middle: Replay the Voyage & Tagline ─── */}
          <div className="flex flex-col sm:flex-row items-center justify-between py-8 gap-6">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <Image
                src="/assets/logos/Asset 8.svg"
                alt="Voya Logo"
                width={24}
                height={24}
                className="opacity-90 brightness-110 shrink-0"
              />
              <div className="w-1.5 h-1.5 rounded-full bg-[#F1E6C3] animate-pulse shrink-0 hidden sm:block" />
              <span className="font-serif italic text-xs sm:text-sm text-white/70">
                &ldquo;Every sip a new trip. Designed for the journey.&rdquo;
              </span>
            </div>

            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/10 hover:border-white/40 active:scale-95 transition-all duration-300 backdrop-blur-md cursor-pointer shrink-0"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 group-hover:text-white font-medium">
                Back to Top
              </span>
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/80 group-hover:text-black group-hover:bg-[#F1E6C3] transition-all">
                <ArrowUp01Icon size={11} className="transform group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* ─── Bottom Colophon: Only the Requested Text ─── */}
          <div className="w-full text-center pt-8 border-t border-white/[0.06] text-[11px] text-white/40 font-mono uppercase tracking-[0.25em]">
            2026 VOYA HOUSE INC. ALL RIGHTS RESERVED
          </div>

        </div>
      </footer>
    );
  }
);

export default CinematicFooter;
