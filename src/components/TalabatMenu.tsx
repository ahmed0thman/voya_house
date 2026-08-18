"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { BrandMenu } from '@/data/mockMenu';
import MorphingCartButton from './MorphingCartButton';
import HoldImageDial from './HoldImageDial';

interface TalabatMenuProps {
  menu: BrandMenu;
  autoHintFirstItem?: boolean;
}

export default function TalabatMenu({ menu, autoHintFirstItem = false }: TalabatMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>(menu.categories[0].id);
  const [activeDialItem, setActiveDialItem] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Create refs for each category section to track intersection
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the visible section with highest intersection ratio
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
            // Optionally, scroll the header pill into view
            const pill = document.getElementById(`pill-${entry.target.id}`);
            if (pill && headerRef.current) {
              const header = headerRef.current;
              const pillRect = pill.getBoundingClientRect();
              const headerRect = header.getBoundingClientRect();
              
              if (pillRect.left < headerRect.left || pillRect.right > headerRect.right) {
                const scrollLeft = pill.offsetLeft - header.clientWidth / 2 + pill.clientWidth / 2;
                header.scrollTo({ left: scrollLeft, behavior: 'smooth' });
              }
            }
          }
        });
      },
      {
        root,
        rootMargin: '-20% 0px -60% 0px', // Trigger when section is roughly near the top
        threshold: 0.1,
      }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [menu.categories]);

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    const element = document.getElementById(id);
    if (element && scrollRef.current) {
      const topPos = element.offsetTop - 80; // offset for sticky header
      scrollRef.current.scrollTo({
        top: topPos,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative text-black min-h-0 overflow-hidden">
      {/* Sticky Category Header */}
      <div 
        ref={headerRef}
        className="shrink-0 z-20 w-full overflow-x-auto whitespace-nowrap scrollbar-hide py-4 px-6 border-b border-black/10 backdrop-blur-xl bg-white/30"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <div className="flex space-x-3">
          {menu.categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                id={`pill-${category.id}`}
                onClick={() => scrollToCategory(category.id)}
                className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                  isActive
                    ? `${menu.colors.text} bg-white shadow-md`
                    : 'text-black/60 hover:text-black hover:bg-white/50'
                }`}
              >
                {category.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Scrollable Menu Content */}
      <div 
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-32 px-6 scrollbar-hide relative touch-pan-y"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none', 
          scrollbarWidth: 'none' 
        }}
      >
        {menu.categories.map((category, categoryIndex) => (
          <section
            key={category.id}
            id={category.id}
            ref={(el) => {
              sectionRefs.current[categoryIndex] = el;
            }}
            className="pt-8 pb-12 border-b border-black/10 last:border-b-0"
          >
            <h3 className={`text-2xl font-serif font-bold mb-6 ${menu.colors.text}`}>
              {category.title}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.items.map((item, itemIndex) => (
                <div 
                  key={item.id} 
                  className="bg-white/40 backdrop-blur-md rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border border-white/40 overflow-visible relative"
                  style={{ zIndex: activeDialItem === item.id ? 50 : 'auto' }}
                >
                  {/* Top: Image + Text */}
                  <div className="flex items-start gap-4">
                    {/* The Hold to Peek Image Dial */}
                    <HoldImageDial 
                      images={item.images} 
                      onHoldChange={(holding) => setActiveDialItem(holding ? item.id : null)}
                      autoHint={autoHintFirstItem && categoryIndex === 0 && itemIndex === 0}
                    />

                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-bold text-base text-black mb-1">{item.name}</h4>
                      <p className="text-sm text-black/60 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Price + Cart Button */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                    <span className={`font-semibold text-lg ${menu.colors.text}`}>
                      ${item.price.toFixed(2)}
                    </span>
                    <MorphingCartButton brandColors={menu.colors} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      ` }} />
    </div>
  );
}
