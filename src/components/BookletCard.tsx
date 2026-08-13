"use client";

import React, { forwardRef } from 'react';
import { menuData } from '@/data/mockMenu';
import TalabatMenu from './TalabatMenu';

interface BookletCardProps {
  brandId: 'coffee' | 'papa' | 'mama';
  isActive: boolean;
  isInitialActive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const BookletCard = forwardRef<HTMLDivElement, BookletCardProps>(
  ({ brandId, isActive, isInitialActive = false, style, className = '' }, ref) => {
    const menu = menuData[brandId];
    if (!menu) return null;

    return (
      <div 
        ref={ref}
        className={`absolute top-0 left-0 w-full h-full rounded-[2rem] overflow-hidden ${menu.colors.bg} transform-gpu ${className}`}
        style={{ 
          transformStyle: 'preserve-3d', 
          pointerEvents: isActive ? 'auto' : 'none',
          ...style 
        }}
      >
        {/* The Menu Interface */}
        <TalabatMenu menu={menu} autoHintFirstItem={isInitialActive} />
      </div>
    );
  }
);

BookletCard.displayName = 'BookletCard';

export default BookletCard;
