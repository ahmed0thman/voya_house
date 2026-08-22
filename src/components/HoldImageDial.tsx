"use client";

import React, { useState, useEffect } from 'react';

interface HoldImageDialProps {
  images: string[];
  onHoldChange?: (holding: boolean) => void;
  autoHint?: boolean;
}

export default function HoldImageDial({ images }: HoldImageDialProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images]);

  const ITEM_SIZE = 100;

  return (
    <div 
      className="relative shrink-0 rounded-[16px] overflow-hidden bg-white/70 backdrop-blur-2xl border border-white/30 shadow-[0_4px_10px_rgba(0,0,0,0.1)]" 
      style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
    >
      {images.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`Gallery image ${idx}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            idx === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          draggable={false}
        />
      ))}
    </div>
  );
}
