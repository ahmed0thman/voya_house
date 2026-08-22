"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function GlobalCursor() {
  const mousePos = useRef({ x: -1000, y: -1000 });
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorAuraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run on desktop devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    // Force hide default cursors
    document.documentElement.style.setProperty('cursor', 'none', 'important');
    const style = document.createElement('style');
    style.innerHTML = `* { cursor: none !important; }`;
    document.head.appendChild(style);

    const tick = () => {
      if (cursorRef.current) {
        gsap.set(cursorRef.current, {
          left: mousePos.current.x,
          top: mousePos.current.y,
        });
      }
    };
    gsap.ticker.add(tick);

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      if (cursorRef.current && gsap.getProperty(cursorRef.current, "opacity") === 0) {
        gsap.to(cursorRef.current, { opacity: 1, duration: 0.3 });
      }
    };

    const handleMouseLeave = () => {
      if (cursorRef.current) gsap.to(cursorRef.current, { opacity: 0, duration: 0.3 });
    };

    const handleMouseDown = () => {
      if (cursorAuraRef.current) {
        gsap.to(cursorAuraRef.current, { scale: 0.5, duration: 0.15, ease: "power2.out" });
      }
    };

    const handleMouseUp = () => {
      if (cursorAuraRef.current) {
        gsap.to(cursorAuraRef.current, { scale: 1, duration: 0.3, ease: "back.out(2)" });
      }
    };

    // Hover effect on interactable elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, input, [role="button"]')) {
        if (cursorAuraRef.current) {
          gsap.to(cursorAuraRef.current, { scale: 1.5, backgroundColor: "rgba(255, 255, 255, 0.2)", duration: 0.3 });
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, input, [role="button"]')) {
        if (cursorAuraRef.current) {
          gsap.to(cursorAuraRef.current, { scale: 1, backgroundColor: "rgba(255, 255, 255, 0.1)", duration: 0.3 });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);

  return (
    <div 
      ref={cursorRef}
      className="pointer-events-none fixed z-[9999] flex items-center justify-center hidden md:flex mix-blend-difference"
      style={{ transform: 'translate(-50%, -50%)', opacity: 0 }}
    >
      <div 
        ref={cursorAuraRef}
        className="absolute w-12 h-12 rounded-full border border-white/50 bg-white/10"
      />
      <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
    </div>
  );
}
