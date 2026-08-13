"use client";

import React, { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';

interface HoldImageDialProps {
  images: string[];
  onHoldChange?: (holding: boolean) => void;
  autoHint?: boolean;
}

export default function HoldImageDial({ images, onHoldChange, autoHint = false }: HoldImageDialProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const interactedRef = useRef(false);

  // Auto Hint Tutorial Logic
  useEffect(() => {
    if (autoHint && images.length > 1) {
      const openTimer = setTimeout(() => {
        if (!interactedRef.current) {
          setIsHolding(true);
          onHoldChange?.(true);

          const closeTimer = setTimeout(() => {
            if (!interactedRef.current) {
              setIsHolding(false);
              onHoldChange?.(false);
            }
          }, 1200);

          return () => clearTimeout(closeTimer);
        }
      }, 1200);

      return () => clearTimeout(openTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoHint, images.length]);

  const ITEM_SIZE = 100; // base size of the image
  const GAP = 12; // gap between images in the dial
  const STEP = ITEM_SIZE + GAP; // total distance per item including gap
  const DIAL_HEIGHT = ITEM_SIZE * 2.5;
  const CENTER_OFFSET = (DIAL_HEIGHT - ITEM_SIZE) / 2; // offset to center the active image

  const getTrackY = (idx: number) => -idx * STEP + CENTER_OFFSET;

  // Virtualized rendering: only render a window of items around the active index
  const VISIBLE_COUNT = 5;
  const half = Math.floor(VISIBLE_COUNT / 2);
  const renderIndices = [];
  for (let i = activeIdx - half; i <= activeIdx + half; i++) {
    renderIndices.push(i);
  }

  useEffect(() => {
    if (isHolding) {
      // Pulse and expand into a dial
      gsap.to(dialRef.current, {
        height: DIAL_HEIGHT,
        scale: 1.15,
        boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
        borderRadius: 24,
        duration: 0.5,
        ease: 'elastic.out(1, 0.7)'
      });

      // Animate track to center the active image
      gsap.to(trackRef.current, {
        y: getTrackY(activeIdx),
        duration: 0.4,
        ease: 'power3.out'
      });
      
      // Add a pulsing glow behind it
      gsap.to(containerRef.current, {
        boxShadow: '0 0 30px rgba(255,255,255,0.4)',
        duration: 0.8,
        repeat: -1,
        yoyo: true
      });

    } else {
      // Snap back to the single image view
      gsap.killTweensOf(containerRef.current);
      gsap.to(containerRef.current, { boxShadow: '0 0 0px rgba(255,255,255,0)', duration: 0.3 });

      gsap.to(dialRef.current, {
        height: ITEM_SIZE,
        scale: 1,
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        borderRadius: 16,
        duration: 0.4,
        ease: 'power3.out'
      });

      // Snap the track back (no centering offset when collapsed)
      gsap.to(trackRef.current, {
        y: -activeIdx * STEP,
        duration: 0.4,
        ease: 'power3.out'
      });
    }
  }, [isHolding, activeIdx]);

  useEffect(() => {
    if (!isHolding) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaY = e.clientY - startYRef.current;
      let newY = currentYRef.current + deltaY;
      gsap.set(trackRef.current, { y: newY });
      
      const newIdx = Math.round((CENTER_OFFSET - newY) / STEP);
      if (newIdx !== activeIdx) setActiveIdx(newIdx);
    };

    const handlePointerUp = () => {
      setIsHolding(false);
      onHoldChange?.(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isHolding, activeIdx, onHoldChange, STEP, CENTER_OFFSET]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (images.length <= 1) return;
    
    interactedRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setIsHolding(true);
    onHoldChange?.(true);
    startYRef.current = e.clientY;
    currentYRef.current = getTrackY(activeIdx);
  };

  return (
    <div 
      ref={containerRef}
      className="relative shrink-0 rounded-2xl" 
      style={{ width: ITEM_SIZE, height: ITEM_SIZE, touchAction: 'none', zIndex: isHolding ? 100 : 'auto' }}
    >
      <div 
        ref={dialRef}
        onPointerDown={handlePointerDown}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden cursor-grab active:cursor-grabbing bg-white/70 backdrop-blur-2xl border border-white/30"
        style={{ 
          width: ITEM_SIZE, 
          height: ITEM_SIZE, 
          borderRadius: 16,
          zIndex: isHolding ? 60 : 10,
          transformOrigin: 'center center'
        }}
      >
        <div ref={trackRef} className="absolute top-0 left-0 w-full h-full">
          {renderIndices.map((absIdx) => {
            const isActive = absIdx === activeIdx;
            const srcIdx = ((absIdx % images.length) + images.length) % images.length;
            const src = images[srcIdx];
            return (
              <img 
                key={absIdx} 
                src={src} 
                alt={`Item image ${absIdx}`}
                className="absolute left-0 object-cover shrink-0 select-none pointer-events-none rounded-xl"
                style={{ 
                  top: absIdx * STEP,
                  width: ITEM_SIZE, 
                  height: ITEM_SIZE,
                  transform: isHolding && !isActive ? 'scale(0.75)' : 'scale(1)',
                  transition: 'transform 0.3s ease',
                }}
                draggable={false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
