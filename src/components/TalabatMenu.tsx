"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BrandMenu, MenuItem } from '@/data/mockMenu';
import { useCartStore } from '@/store/useCartStore';
import { formatPrice } from '@/constants/config';
import MorphingCartButton from './MorphingCartButton';
import HoldImageDial from './HoldImageDial';

function MenuItemCartButton({
  item,
  brandId,
  brandColors,
}: {
  item: MenuItem;
  brandId: "coffee" | "papa" | "mama";
  brandColors: { bg: string; text: string; accent: string };
}) {
  const quantity = useCartStore((state) => state.getItemQuantity(item.id));
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  return (
    <MorphingCartButton
      initialQuantity={quantity}
      onQuantityChange={(qty) => {
        if (qty > 0 && quantity === 0) {
          addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            description: item.description,
            image: item.images?.[0],
            brandId,
          });
          if (qty > 1) {
            updateQuantity(item.id, qty);
          }
        } else {
          updateQuantity(item.id, qty);
        }
      }}
      brandColors={brandColors}
    />
  );
}

interface TalabatMenuProps {
  menu: BrandMenu;
  autoHintFirstItem?: boolean;
}

export default function TalabatMenu({ menu, autoHintFirstItem = false }: TalabatMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>(menu.categories[0].id);
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
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-32 px-6 relative touch-pan-y"
        style={{ 
          WebkitOverflowScrolling: 'touch',
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
                >
                  {/* Top: Image + Text */}
                  <div className="flex items-start gap-4">
                    {/* Simple Auto Image Gallery */}
                    <HoldImageDial 
                      images={item.images} 
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
                    <span className={`font-semibold text-base sm:text-lg font-mono ${menu.colors.text}`}>
                      {formatPrice(item.price)}
                    </span>
                    <MenuItemCartButton item={item} brandId={menu.brandId} brandColors={menu.colors} />
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
