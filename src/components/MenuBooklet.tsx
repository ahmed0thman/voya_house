"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { menuData } from '@/data/mockMenu';
import TalabatMenu from './TalabatMenu';
import { Cancel01Icon } from 'hugeicons-react';

interface MenuBookletProps {
  brandId: 'coffee' | 'papa' | 'mama';
  onClose: () => void;
}

export default function MenuBooklet({ brandId, onClose }: MenuBookletProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const bookletRef = useRef<HTMLDivElement>(null);
  
  const menu = menuData[brandId];

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Entrance Animation
    const tl = gsap.timeline();

    if (overlayRef.current && bookletRef.current) {
      tl.fromTo(
        overlayRef.current,
        { backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' },
        { backdropFilter: 'blur(16px)', backgroundColor: 'rgba(0,0,0,0.6)', duration: 0.8, ease: 'power2.out' }
      ).fromTo(
        bookletRef.current,
        { 
          y: '100%', 
          rotationX: 15, 
          rotationY: -15, 
          rotationZ: -5,
          scale: 0.8,
          opacity: 0,
          boxShadow: '0 0px 0px rgba(0,0,0,0)'
        },
        { 
          y: '0%', 
          rotationX: 0, 
          rotationY: 0, 
          rotationZ: 0,
          scale: 1,
          opacity: 1,
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
          duration: 1.2, 
          ease: 'expo.out'
        },
        "-=0.6"
      );
    }

    return () => {
      // Restore body scroll
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    const tl = gsap.timeline({
      onComplete: onClose
    });
    
    if (overlayRef.current && bookletRef.current) {
      tl.to(bookletRef.current, {
        y: '100%',
        rotationX: -10,
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.in'
      }).to(
        overlayRef.current,
        { backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)', duration: 0.4, ease: 'power2.in' },
        "-=0.3"
      );
    } else {
      onClose();
    }
  };

  if (!menu) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* Background Click to close */}
      <div className="absolute inset-0 z-0" onClick={handleClose} />
      
      {/* 3D Booklet Container */}
      <div 
        ref={bookletRef}
        className={`relative z-10 w-full max-w-4xl h-full max-h-[90vh] rounded-[2rem] overflow-hidden ${menu.colors.bg} transform-gpu`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Subtle inner shadow / light reflection for 3D effect */}
        <div className="absolute inset-0 pointer-events-none rounded-[2rem] border border-white/40 shadow-[inset_0_0_80px_rgba(255,255,255,0.3)] z-30" />
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 z-40 p-3 bg-black text-white hover:bg-black/80 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/20 transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
          <Cancel01Icon size={24} className="relative z-10" />
        </button>

        {/* The Menu Interface */}
        <TalabatMenu menu={menu} />
      </div>
    </div>
  );
}
