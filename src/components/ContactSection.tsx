"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
} from "hugeicons-react";

gsap.registerPlugin(ScrollTrigger);

const TOPICS = [
  {
    id: "general",
    label: "General Hello",
    icon: SparklesIcon,
    color: "#F1E6C3",
  },
  {
    id: "coffee",
    label: "Coffee Allocation",
    icon: Coffee01Icon,
    color: "#F1E6C3",
  },
  {
    id: "catering",
    label: "Papa Wellness Catering",
    icon: Leaf01Icon,
    color: "#B7D39A",
  },
  {
    id: "events",
    label: "Mama Family Events",
    icon: Pizza01Icon,
    color: "#D8A98F",
  },
];

export default function ContactSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 900);
  };

  const activeTopicObj =
    TOPICS.find((t) => t.id === selectedTopic) || TOPICS[0];

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
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#F1E6C3]/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-6xl w-full mx-auto relative z-10">
        {/* ─── Top Section Header ─── */}
        <div className="text-center mb-16 md:mb-20 flex flex-col items-center">
          <div className="contact-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md mb-5">
            <span className="w-2 h-2 rounded-full bg-[#F1E6C3] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 font-bold">
              Concierge & Inquiries
            </span>
          </div>

          <h2 className="contact-reveal font-serif text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white leading-tight">
            JOIN <span className="text-[#F1E6C3] italic">VOYA HOUSE.</span>
          </h2>

          <p className="contact-reveal font-sans text-sm sm:text-base text-white/70 max-w-lg mt-4 leading-relaxed">
            Whether you are reserving a table, inquiring about our seasonal bean
            allocations, or planning a private gathering — our house is always
            open.
          </p>
        </div>

        {/* ─── Two-Column Luxury Card ─── */}
        <div className="contact-reveal grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-stretch">
          {/* Left Column: Direct House Touchpoints */}
          <div className="lg:col-span-5 rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent p-6 sm:p-8 md:p-10 backdrop-blur-2xl flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#F1E6C3]/10 blur-3xl pointer-events-none rounded-full" />

            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-2">
                  <Image
                    src="/assets/logos/Asset 21.svg"
                    alt="Voya Emblem"
                    width={24}
                    height={24}
                    className="opacity-90 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-white">
                    The House of Voya
                  </h3>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#F1E6C3]">
                    Flagship Sanctuary
                  </span>
                </div>
              </div>

              <p className="font-sans text-sm text-white/70 leading-relaxed mb-8">
                Experience the harmony of specialty roasting, mindful
                nourishment, and generous comfort hospitality.
              </p>

              {/* Information Rows */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] shrink-0 mt-0.5">
                    <Location01Icon size={16} />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                      Address
                    </span>
                    <p className="font-serif text-sm sm:text-base text-white/90 leading-snug mt-0.5">
                      123 Voyage Street, New Cairo, EG
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] shrink-0 mt-0.5">
                    <Clock01Icon size={16} />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                      House Hours
                    </span>
                    <p className="font-serif text-sm sm:text-base text-white/90 leading-snug mt-0.5">
                      Monday – Sunday · 07:00 – 23:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F1E6C3] shrink-0 mt-0.5">
                    <Mail01Icon size={16} />
                  </div>
                  <div>
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-white/50">
                      Concierge Desk
                    </span>
                    <p className="font-mono text-sm text-white/90 leading-snug mt-0.5 select-all">
                      concierge@voyahouse.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Ornamental Indicator */}
            <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between">
              <span className="font-serif italic text-xs text-white/50">
                &ldquo;Every sip a new trip.&rdquo;
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#F1E6C3] font-bold">
                EST. 2026
              </span>
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
                  Message Received
                </h3>
                <p className="font-sans text-sm text-white/70 max-w-sm mb-8 leading-relaxed">
                  Thank you,{" "}
                  <strong className="text-white">{formData.name}</strong>. Our
                  house concierge will be in touch with you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: "", email: "", message: "" });
                  }}
                  className="px-6 py-2.5 rounded-full border border-white/20 hover:border-white text-xs font-mono uppercase tracking-widest text-white/80 hover:text-white transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col h-full justify-between gap-6"
              >
                <div>
                  {/* Topic Selector Chips */}
                  <div className="mb-6">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-white/60 mb-3">
                      Select Topic
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((topic) => {
                        const Icon = topic.icon;
                        const isSelected = selectedTopic === topic.id;
                        return (
                          <button
                            type="button"
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic.id)}
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
                            <span>{topic.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-4">
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="contact-name"
                          className="block font-mono text-[10px] uppercase tracking-widest text-white/60"
                        >
                          Your Name
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
                            placeholder="e.g. Alexander Vance"
                            className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/15 focus:border-[#F1E6C3] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(241,230,195,0.15)]"
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
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
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
                          Email Address
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
                            placeholder="name@example.com"
                            className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/15 focus:border-[#F1E6C3] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(241,230,195,0.15)]"
                          />
                          <Mail01Icon
                            size={16}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
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
                        How can we welcome you?
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
                          placeholder="Tell us about your inquiry, event date, or coffee preferences..."
                          className="w-full bg-white/[0.04] hover:bg-white/[0.06] focus:bg-white/[0.08] border border-white/15 focus:border-[#F1E6C3] rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-white/25 outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(241,230,195,0.15)] resize-none"
                        />
                        <Message01Icon
                          size={16}
                          className="absolute left-4 top-4 text-white/40 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/10 gap-4">
                  <span className="font-mono text-[10px] text-white/40">
                    Direct reply within 24 hours.
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#F1E6C3] text-black font-extrabold text-xs uppercase tracking-widest transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_4px_25px_rgba(241,230,195,0.35)] disabled:opacity-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 pointer-events-none" />
                    <span>
                      {isSubmitting ? "Delivering..." : "Deliver Message"}
                    </span>
                    <ArrowRight01Icon
                      size={14}
                      className="transform group-hover:translate-x-1 transition-transform"
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
