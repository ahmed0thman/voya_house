"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

export default function HeroFlashlightEffect() {
  const mousePos = useRef({ x: -1000, y: -1000 });
  const maskRadius = useRef({ value: 175 });
  const pulseAnim = useRef<gsap.core.Tween | null>(null);
  
  const bgRef = useRef<HTMLDivElement>(null);

  const updateMask = () => {
    if (bgRef.current) {
      const radius = maskRadius.current.value;
      const maskStr = `radial-gradient(circle ${radius}px at ${mousePos.current.x}px ${mousePos.current.y}px, black 10%, rgba(0,0,0,0.5) 50%, transparent 100%)`;
      bgRef.current.style.webkitMaskImage = maskStr;
      bgRef.current.style.maskImage = maskStr;
    }
  };

  useEffect(() => {
    const tick = () => {
      updateMask();
    };
    gsap.ticker.add(tick);

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      if (bgRef.current) gsap.to(bgRef.current, { opacity: 1, duration: 0.3 });
    };

    const handleMouseLeave = () => {
      if (bgRef.current) gsap.to(bgRef.current, { opacity: 0, duration: 0.3 });
    };

    const handleMouseDown = () => {
      if (pulseAnim.current) pulseAnim.current.kill();
      pulseAnim.current = gsap.to(maskRadius.current, {
        value: 350,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)" 
      });
    };

    const handleMouseUp = () => {
      if (pulseAnim.current) pulseAnim.current.kill();
      pulseAnim.current = gsap.to(maskRadius.current, {
        value: 175,
        duration: 0.4,
        ease: "power2.out"
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      if (pulseAnim.current) pulseAnim.current.kill();
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ backgroundColor: "#080907" }}
    >
      <div 
        ref={bgRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0 }}
      >
        <Image 
          src="/assets/3d-renders/entrance_3d.png" 
          alt="Voya Entrance" 
          fill
          className="object-cover opacity-60"
        />
      </div>
    </div>
  );
}
