"use client";

import React, { useState } from "react";
import { Add01Icon, Remove01Icon, Delete02Icon } from "hugeicons-react";

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

  if (initialQuantity !== prevInitialQuantity) {
    setPrevInitialQuantity(initialQuantity);
    setQuantity(initialQuantity);
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextQty = quantity + 1;
    setQuantity(nextQty);
    if (onQuantityChange) {
      onQuantityChange(nextQty);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextQty = Math.max(0, quantity - 1);
    setQuantity(nextQty);
    if (onQuantityChange) {
      onQuantityChange(nextQty);
    }
  };

  if (quantity <= 0) {
    return (
      <button
        onClick={handleIncrement}
        aria-label="Add to order"
        className={`h-9 sm:h-10 px-4 sm:px-5 rounded-full flex items-center gap-1.5 ${
          brandColors?.accent || "bg-black"
        } ${
          brandColors ? "text-black" : "text-white"
        } font-mono text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer select-none`}
      >
        <Add01Icon size={15} strokeWidth={2.5} />
        <span>Add</span>
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="h-9 sm:h-10 px-1.5 py-1 rounded-full flex items-center gap-1.5 sm:gap-2 bg-black/[0.08] border border-black/10 backdrop-blur-md shadow-xs transition-all select-none"
    >
      <button
        onClick={handleDecrement}
        aria-label={quantity === 1 ? "Remove item" : "Decrease quantity"}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-white text-black flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs"
      >
        {quantity === 1 ? (
          <Delete02Icon size={14} className="text-red-500" />
        ) : (
          <Remove01Icon size={14} strokeWidth={2.5} />
        )}
      </button>

      <span className="min-w-[22px] sm:min-w-[26px] text-center font-mono font-bold text-sm text-black select-none">
        {quantity}
      </span>

      <button
        onClick={handleIncrement}
        aria-label="Increase quantity"
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white hover:bg-white text-black flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs"
      >
        <Add01Icon size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
