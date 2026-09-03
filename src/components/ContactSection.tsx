"use client";

import { useTranslations, useLocale } from "next-intl";
import React, { useState, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { toast } from "sonner";
import {
  Mail01Icon,
  Location01Icon,
  Clock01Icon,
  Message01Icon,
  SparklesIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Coffee01Icon,
  Leaf01Icon,
  Pizza01Icon,
  WhatsappIcon,
  InstagramIcon,
  TiktokIcon,
  Facebook02Icon,
  GoogleMapsIcon,
} from "hugeicons-react";
import { useActiveContactSubjects, useSubmitContactMessage } from "@/hooks/use-contact";
import { BRANCHES, SOCIAL_LINKS } from "@/lib/social-links";

gsap.registerPlugin(ScrollTrigger);

/** Cycled by chip index so admin-managed subjects keep the same visual variety without needing per-subject icon management. */
const TOPIC_PALETTE = [
  { icon: SparklesIcon, color: "#F1E6C3" },
  { icon: Coffee01Icon, color: "#F1E6C3" },
  { icon: Leaf01Icon, color: "#B7D39A" },
  { icon: Pizza01Icon, color: "#D8A98F" },
];

export default function ContactSection() {
  const t = useTranslations("contactForm");
  const tLocations = useTranslations("locations");
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: subjects } = useActiveContactSubjects();
  const submitMessage = useSubmitContactMessage();
  const isSubmitting = submitMessage.isPending;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;

      // Header reveal
      gsap.fromTo(
        el.querySelectorAll(".contact-reveal"),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        },
      );
    },
    { scope: containerRef },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    submitMessage.mutate(
      {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        subjectId: selectedTopic ?? undefined,
      },
      {
        onSuccess: () => setIsSubmitted(true),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const activeSubjectId = selectedTopic ?? subjects?.[0]?.id ?? null;
  const activeSubjectIndex =
    subjects?.findIndex((subject) => subject.id === activeSubjectId) ?? -1;
  const activeTopicObj = TOPIC_PALETTE[
    activeSubjectIndex >= 0 ? activeSubjectIndex % TOPIC_PALETTE.length : 0
  ];

  return (
    <section
      ref={containerRef}
      id="contact"
      className="relative z-20 w-full min-h-screen bg-[#080907] flex flex-col items-center justify-center py-28 px-4 sm:px-6 md:px-12 border-t border-white/10 shadow-[0_-25px_60px_rgba(0,0,0,0.9)] overflow-hidden text-white"
    >
      {/* ─── Ambient Glow Spheres ─── */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] blur-[150px] pointer-events-none rounded-full transition-all duration-700 opacity-20"
        style={{
          background: `radial-gradient(circle, ${activeTopicObj.color} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />
      <div className="absolute bottom-10 end-10 w-[350px] h-[350px] bg-[#F1E6C3]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-6xl w-full mx-auto relative z-10">
        {/* ─── Top Section Header ─── */}
        <div className="text-center mb-16 md:mb-20 flex flex-col items-center">
          <div className="contact-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-5">
            <span className="w-2 h-2 rounded-full bg-[#F1E6C3] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 font-bold">
              {t("eyebrow")}
            </span>
          </div>

          <h2 className="contact-reveal font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white leading-tight">
            {t("join")}{" "}
            <span className="text-[#F1E6C3] italic">{t("voyaHouse")}</span>
          </h2>

          <p className="contact-reveal font-sans text-sm sm:text-base text-white/70 max-w-lg mt-4 leading-relaxed">
            {t("intro")}
          </p>
        </div>

        {/* ─── Two-Column Luxury Card ─── */}
        <div className="contact-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-stretch">
          {/* Left Column: Direct House Touchpoints */}
          <div className="lg:col-span-5 rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent p-6 sm:p-8 md:p-10 backdrop-blur-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 end-0 w-48 h-48 bg-[#F1E6C3]/10 blur-3xl pointer-events-none rounded-full" />

            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2">
                  <Image
                    src="/assets/logos/Asset 21.svg"
                    alt={t("emblemAlt")}
                    width={24}
                    height={24}
                    sizes="24px"
                    className="opacity-90 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-white">
                    {t("houseOfVoya")}
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#F1E6C3]">
                    {t("flagshipSanctuary")}
                  </span>
                </div>
              </div>

              <p className="font-sans text-sm text-white/70 leading-relaxed mb-8">
                {t("harmony")}
              </p>

              {/* Information Rows */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] shrink-0 mt-0.5">
                    <Location01Icon size={16} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                      {tLocations("heading")}
                    </span>
                    {BRANCHES.map((branch) => (
                      <div key={branch.id}>
                        <p className="font-serif text-sm sm:text-base text-white/90 leading-snug">
                          {tLocations(`${branch.id}.label`)} —{" "}
                          {tLocations(`${branch.id}.address`)}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <a
                            href={`tel:${branch.phone}`}
                            dir="ltr"
                            className="font-mono text-white/60 hover:text-[#F1E6C3] transition-colors"
                          >
                            {branch.phone}
                          </a>
                          <a
                            href={branch.mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-white/60 hover:text-[#F1E6C3] transition-colors"
                          >
                            <GoogleMapsIcon size={12} />
                            {tLocations("viewOnMap")}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] shrink-0 mt-0.5">
                    <Clock01Icon size={16} />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                      {t("houseHours")}
                    </span>
                    <p className="font-serif text-sm sm:text-base text-white/90 leading-snug mt-0.5">
                      {t("hoursValue")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] shrink-0 mt-0.5">
                    <WhatsappIcon size={16} />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                      {t("conciergeDesk")}
                    </span>
                    <a
                      href={SOCIAL_LINKS.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="block font-mono text-sm text-white/90 hover:text-[#F1E6C3] transition-colors leading-snug mt-0.5"
                    >
                      {t("chatOnWhatsapp")}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Ornamental Indicator */}
            <div className="pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="font-serif italic text-xs text-white/50 text-center sm:text-start">
                &ldquo;{t("quote")}&rdquo;
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("followUs")}
                    className="text-white/50 hover:text-[#F1E6C3] transition-colors"
                  >
                    <InstagramIcon size={15} />
                  </a>
                  <a
                    href={SOCIAL_LINKS.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("followUs")}
                    className="text-white/50 hover:text-[#F1E6C3] transition-colors"
                  >
                    <TiktokIcon size={15} />
                  </a>
                  <a
                    href={SOCIAL_LINKS.facebook}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t("followUs")}
                    className="text-white/50 hover:text-[#F1E6C3] transition-colors"
                  >
                    <Facebook02Icon size={15} />
                  </a>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#F1E6C3] font-bold">
                  {t("est")}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Luxury Concierge Form */}
          <div className="lg:col-span-7 rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-black/40 p-6 sm:p-8 md:p-10 backdrop-blur-2xl flex flex-col justify-between shadow-2xl relative">
            {isSubmitted ? (
              <div className="py-16 flex flex-col items-center text-center justify-center h-full">
                <div className="w-16 h-16 rounded-full bg-[#F1E6C3]/20 border border-[#F1E6C3] flex items-center justify-center text-[#F1E6C3] mb-6 animate-bounce">
                  <CheckmarkCircle02Icon size={32} />
                </div>
                <h3 className="font-serif text-3xl font-medium text-white mb-2">
                  {t("messageReceived")}
                </h3>
                <p className="font-sans text-sm text-white/70 max-w-sm mb-8 leading-relaxed">
                  {t.rich("thankYou", {
                    name: formData.name,
                    b: (chunks) => (
                      <strong className="text-white">{chunks}</strong>
                    ),
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: "", email: "", message: "" });
                  }}
                  className="px-6 py-2.5 rounded-full border border-white/20 hover:border-white text-xs font-mono uppercase tracking-widest text-white/80 hover:text-white transition-all"
                >
                  {t("sendAnother")}
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col h-full justify-between gap-6"
              >
                <div>
                  {/* Topic Selector Chips */}
                  {!!subjects?.length && (
                    <div className="mb-6">
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-3">
                        {t("selectTopic")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {subjects.map((subject, index) => {
                          const { icon: Icon } =
                            TOPIC_PALETTE[index % TOPIC_PALETTE.length];
                          const isSelected = activeSubjectId === subject.id;
                          const label =
                            (locale === "ar" && subject.labelAr) ||
                            subject.label;
                          return (
                            <button
                              type="button"
                              key={subject.id}
                              onClick={() => setSelectedTopic(subject.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all duration-300 ${
                                isSelected
                                  ? "bg-white text-black font-bold border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-[1.02]"
                                  : "bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              <Icon
                                size={14}
                                className={
                                  isSelected ? "text-black" : "text-white/60"
                                }
                              />
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Input Fields */}
                  <div className="space-y-4">
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-name"
                          className="block font-mono text-[10px] uppercase tracking-widest text-white/60"
                        >
                          {t("yourName")}
                        </label>
                        <div className="relative">
                          <input
                            id="contact-name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder={t("namePlaceholder")}
                            className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/15 focus:border-[#F1E6C3] rounded-2xl py-3.5 ps-11 pe-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(241,230,195,0.15)]"
                          />
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="absolute start-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-email"
                          className="block font-mono text-[10px] uppercase tracking-widest text-white/60"
                        >
                          {t("emailAddress")}
                        </label>
                        <div className="relative">
                          <input
                            id="contact-email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            placeholder={t("emailPlaceholder")}
                            className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/15 focus:border-[#F1E6C3] rounded-2xl py-3.5 ps-11 pe-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(241,230,195,0.15)]"
                          />
                          <Mail01Icon
                            size={16}
                            className="absolute start-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Message Area */}
                    <div className="space-y-1.5 pt-1">
                      <label
                        htmlFor="contact-message"
                        className="block font-mono text-[10px] uppercase tracking-widest text-white/60"
                      >
                        {t("howCanWeWelcome")}
                      </label>
                      <div className="relative">
                        <textarea
                          id="contact-message"
                          required
                          rows={4}
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              message: e.target.value,
                            })
                          }
                          placeholder={t("messagePlaceholder")}
                          className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/15 focus:border-[#F1E6C3] rounded-2xl py-3.5 ps-11 pe-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(241,230,195,0.15)] resize-none"
                        />
                        <Message01Icon
                          size={16}
                          className="absolute start-4 top-4 text-white/40 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/10 gap-4">
                  <span className="font-mono text-[10px] text-white/40">
                    {t("directReply")}
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#F1E6C3] text-black font-extrabold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_4px_25px_rgba(241,230,195,0.35)] disabled:opacity-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 pointer-events-none" />
                    <span>
                      {isSubmitting ? t("delivering") : t("deliverMessage")}
                    </span>
                    <ArrowRight01Icon
                      size={14}
                      className="transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform icon-auto-dir"
                    />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
