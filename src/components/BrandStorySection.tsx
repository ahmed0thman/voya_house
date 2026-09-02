"use client";

import { useTranslations } from "next-intl";
import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  ArrowRight01Icon,
  Location01Icon,
} from "hugeicons-react";

gsap.registerPlugin(ScrollTrigger);

interface BrandStorySectionProps {
  onSelectMenu?: (menu: "coffee" | "papa" | "mama") => void;
}

export default function BrandStorySection({ onSelectMenu }: BrandStorySectionProps) {
  const t = useTranslations("story");
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = sectionRef.current;
      if (!el) return;

      // Header Animation
      gsap.fromTo(
        el.querySelectorAll(".story-header-item"),
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el.querySelector(".story-header"),
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      // 3 Experience Cards Stagger
      gsap.fromTo(
        el.querySelectorAll(".story-experience-card"),
        { y: 50, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          stagger: 0.18,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el.querySelector(".story-experience-grid"),
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );

      // Warm Invitation Banner
      gsap.fromTo(
        el.querySelector(".story-invitation-banner"),
        { y: 45, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el.querySelector(".story-invitation-banner"),
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  const scrollToContact = () => {
    const contactEl = document.getElementById("contact");
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="story"
      className="relative z-20 w-full min-h-screen bg-[#080907] flex flex-col items-center justify-center py-28 px-4 sm:px-6 md:px-12 border-t border-white/10 shadow-[0_-25px_60px_rgba(0,0,0,0.9)] overflow-hidden text-white select-none"
    >
      {/* ─── Soft Ambient Lighting ─── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[500px] bg-gradient-to-r from-[#F1E6C3]/10 via-[#B7D39A]/10 to-[#D8A98F]/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-16 start-1/4 w-[400px] h-[400px] bg-[#F1E6C3]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col items-center">
        
        {/* ─── Warm About-Us Header ─── */}
        <div className="story-header text-center mb-16 md:mb-20 flex flex-col items-center max-w-3xl">
          <div className="story-header-item inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-5">
            <span className="w-2 h-2 rounded-full bg-[#F1E6C3] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 font-bold">
              {t("eyebrow")}
            </span>
          </div>

          <h2 className="story-header-item font-serif text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-[1.1] text-white mb-6">
            {t("headingLine1")} <br />
            <span className="text-[#F1E6C3] italic">{t("headingLine2")}</span>
          </h2>

          <p className="story-header-item font-sans text-sm sm:text-base md:text-lg text-white/70 leading-relaxed max-w-2xl">
            {t("intro")}
          </p>
        </div>

        {/* ─── 3 Guest Experience Cards ─── */}
        <div className="story-experience-grid grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full mb-16 md:mb-20">
          
          {/* Experience 1: Coffee */}
          <div
            onClick={() => onSelectMenu?.("coffee")}
            className="story-experience-card group relative rounded-[2rem] border border-[#F1E6C3]/20 bg-gradient-to-b from-[#F1E6C3]/[0.08] to-white/[0.02] p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-[#F1E6C3]/50 shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_60px_rgba(241,230,195,0.2)] backdrop-blur-xl overflow-hidden"
          >
            <div className="absolute -top-20 -end-20 w-48 h-48 bg-[#F1E6C3]/15 blur-3xl pointer-events-none rounded-full group-hover:bg-[#F1E6C3]/25 transition-all duration-500" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#F1E6C3]/15 border border-[#F1E6C3]/30 flex items-center justify-center text-[#F1E6C3] mb-6 group-hover:scale-110 transition-transform duration-300">
                <Coffee01Icon size={22} />
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-white tracking-tight mb-3">
                {t("morningRitual")}
              </h3>

              <p className="font-sans text-sm text-white/70 leading-relaxed mb-6">
                {t("coffeeBody")}
              </p>
            </div>

            <div className="pt-5 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-[#F1E6C3]">
              <span>{t("discoverRoasts")}</span>
              <div className="w-8 h-8 rounded-full bg-[#F1E6C3]/10 flex items-center justify-center group-hover:bg-[#F1E6C3] group-hover:text-black transition-all">
                <ArrowRight01Icon size={14} className="transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform icon-auto-dir" />
              </div>
            </div>
          </div>

          {/* Experience 2: Papa Voya */}
          <div
            onClick={() => onSelectMenu?.("papa")}
            className="story-experience-card group relative rounded-[2rem] border border-[#B7D39A]/20 bg-gradient-to-b from-[#B7D39A]/[0.08] to-white/[0.02] p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-[#B7D39A]/50 shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_60px_rgba(183,211,154,0.2)] backdrop-blur-xl overflow-hidden"
          >
            <div className="absolute -top-20 -end-20 w-48 h-48 bg-[#B7D39A]/15 blur-3xl pointer-events-none rounded-full group-hover:bg-[#B7D39A]/25 transition-all duration-500" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#B7D39A]/15 border border-[#B7D39A]/30 flex items-center justify-center text-[#B7D39A] mb-6 group-hover:scale-110 transition-transform duration-300">
                <Leaf01Icon size={22} />
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-white tracking-tight mb-3">
                {t("mindfulNourishment")}
              </h3>

              <p className="font-sans text-sm text-white/70 leading-relaxed mb-6">
                {t("papaBody")}
              </p>
            </div>

            <div className="pt-5 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-[#B7D39A]">
              <span>{t("exploreHealthy")}</span>
              <div className="w-8 h-8 rounded-full bg-[#B7D39A]/10 flex items-center justify-center group-hover:bg-[#B7D39A] group-hover:text-black transition-all">
                <ArrowRight01Icon size={14} className="transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform icon-auto-dir" />
              </div>
            </div>
          </div>

          {/* Experience 3: Mama Voya */}
          <div
            onClick={() => onSelectMenu?.("mama")}
            className="story-experience-card group relative rounded-[2rem] border border-[#D8A98F]/20 bg-gradient-to-b from-[#D8A98F]/[0.08] to-white/[0.02] p-6 sm:p-8 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-[#D8A98F]/50 shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_60px_rgba(216,169,143,0.2)] backdrop-blur-xl overflow-hidden"
          >
            <div className="absolute -top-20 -end-20 w-48 h-48 bg-[#D8A98F]/15 blur-3xl pointer-events-none rounded-full group-hover:bg-[#D8A98F]/25 transition-all duration-500" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#D8A98F]/15 border border-[#D8A98F]/30 flex items-center justify-center text-[#D8A98F] mb-6 group-hover:scale-110 transition-transform duration-300">
                <Pizza01Icon size={22} />
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-medium text-white tracking-tight mb-3">
                {t("familyTable")}
              </h3>

              <p className="font-sans text-sm text-white/70 leading-relaxed mb-6">
                {t("mamaBody")}
              </p>
            </div>

            <div className="pt-5 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-[#D8A98F]">
              <span>{t("tasteComfort")}</span>
              <div className="w-8 h-8 rounded-full bg-[#D8A98F]/10 flex items-center justify-center group-hover:bg-[#D8A98F] group-hover:text-black transition-all">
                <ArrowRight01Icon size={14} className="transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform icon-auto-dir" />
              </div>
            </div>
          </div>

        </div>

        {/* ─── Warm Invitation Banner ─── */}
        <div className="story-invitation-banner w-full rounded-[2.5rem] border border-white/15 bg-gradient-to-r from-white/[0.04] via-white/[0.07] to-white/[0.04] p-8 sm:p-10 md:p-12 backdrop-blur-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="flex flex-col max-w-2xl text-center md:text-start">
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#F1E6C3] font-bold mb-2">
              {t("community")}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-medium text-white tracking-tight leading-tight">
              {t("communityText")}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-white/70 mt-3 leading-relaxed">
              {t("communityBody")}
            </p>
          </div>

          <button
            onClick={scrollToContact}
            className="shrink-0 inline-flex items-center gap-3 px-7 py-4 rounded-full bg-[#F1E6C3] text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_4px_25px_rgba(241,230,195,0.4)]"
          >
            <Location01Icon size={18} className="text-black" />
            <span>{t("visitUs")}</span>
            <ArrowRight01Icon size={16} className="text-black icon-auto-dir" />
          </button>
        </div>

      </div>
    </section>
  );
}
