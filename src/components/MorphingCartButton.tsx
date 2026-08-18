"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCartAdd01Icon } from 'hugeicons-react';

interface MorphingCartButtonProps {
  initialQuantity?: number;
  onQuantityChange?: (quantity: number) => void;
  brandColors?: { bg: string; text: string; accent: string };
}

export default function MorphingCartButton({
  initialQuantity = 0,
  onQuantityChange,
  brandColors,
}: MorphingCartButtonProps) {
  const [prevInitialQuantity, setPrevInitialQuantity] = useState(initialQuantity);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isOpen, setIsOpen] = useState(initialQuantity > 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isInitializingRef = useRef(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (initialQuantity !== prevInitialQuantity) {
    setPrevInitialQuantity(initialQuantity);
    setQuantity(initialQuantity);
    setIsOpen(initialQuantity > 0);
  }

  // Array of quantities to show in the wheel
  const maxQuantity = 10;
  const quantities = Array.from({ length: maxQuantity + 1 }, (_, i) => i);

  useEffect(() => {
    if (isOpen && scrollerRef.current) {
      isInitializingRef.current = true;
      // Temporarily remove smooth scroll and snapping so it snaps instantly to the right value 
      // without triggering intermediate scroll events or layout-shift snapping
      scrollerRef.current.style.scrollBehavior = 'auto';
      scrollerRef.current.style.scrollSnapType = 'none';
      scrollerRef.current.scrollTop = quantity * 40;
      
      setTimeout(() => {
        if (scrollerRef.current) {
          scrollerRef.current.scrollTop = quantity * 40; // Enforce it one last time after expansion
          scrollerRef.current.style.scrollBehavior = 'smooth';
          scrollerRef.current.style.scrollSnapType = 'y mandatory';
        }
        // Wait for the full 400ms CSS transition to finish before accepting user scrolls,
        // otherwise layout shifts during expansion can trigger phantom scroll events.
        setTimeout(() => {
          isInitializingRef.current = false;
        }, 50);
      }, 400);
    }
  }, [isOpen]);

  const handleAddClick = () => {
    setIsOpen(true);
    const newQty = 1;
    setQuantity(newQty);
    if (onQuantityChange) onQuantityChange(newQty);
  };

  const handleScroll = () => {
    if (!scrollerRef.current || !isOpen || isInitializingRef.current) return;
    const scrollTop = scrollerRef.current.scrollTop;
    // Each item is 40px tall. Snap to closest.
    const activeIndex = Math.round(scrollTop / 40);
    
    if (activeIndex !== quantity) {
      setQuantity(activeIndex);
      if (onQuantityChange) onQuantityChange(activeIndex);
    }

    if (activeIndex === 0) {
      // Morph back to button only after it settles on 0 for a moment,
      // avoiding violent mid-swipe unmounts.
      if (!closeTimeoutRef.current) {
        closeTimeoutRef.current = setTimeout(() => {
          setIsOpen(false);
          closeTimeoutRef.current = null;
        }, 400);
      }
    } else {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
      <div
        ref={containerRef}
        className={`overflow-hidden flex flex-col items-center shadow-lg ${
          isOpen ? 'bg-white text-black border border-black/10 absolute bottom-0 right-0 z-50 w-[60px] h-[120px] rounded-[30px]' : `${brandColors?.accent || 'bg-black'} ${brandColors ? 'text-black' : 'text-white'} w-[48px] h-[48px] rounded-[24px]`
        }`}
        style={{
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {!isOpen ? (
          <button
            onClick={handleAddClick}
            className="w-full h-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <ShoppingCartAdd01Icon size={24} />
          </button>
        ) : (
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="w-full h-full overflow-y-scroll overflow-x-hidden touch-pan-y snap-y snap-mandatory scrollbar-hide flex flex-col items-center pointer-events-auto"
            style={{
              scrollBehavior: 'smooth',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {/* Spacer to allow first item to be centered */}
            <div className="shrink-0 h-[40px] w-full" />
            
            {quantities.map((q) => {
              const isActive = q === quantity;
              const isAdjacent = Math.abs(q - quantity) === 1;
              
              return (
                <div
                  key={q}
                  className={`shrink-0 w-full h-[40px] flex items-center justify-center snap-center transition-all duration-200 select-none ${
                    isActive ? 'opacity-100 scale-110 font-bold text-lg' : isAdjacent ? 'opacity-40 scale-90 text-sm' : 'opacity-10 scale-75 text-xs'
                  }`}
                >
                  {q === 0 ? '0' : q}
                </div>
              );
            })}
            
            {/* Spacer to allow last item to be centered */}
            <div className="shrink-0 h-[40px] w-full" />
          </div>
        )}
      </div>

      {/* Hide scrollbar CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      ` }} />
    </div>
  );
}
