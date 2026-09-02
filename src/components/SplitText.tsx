"use client";

import React from 'react';
import { useIsRtl } from '@/lib/direction';

interface SplitTextProps {
  text: string;
  className?: string;
  charClassName?: string;
}

/**
 * Splits copy into `.char` spans for GSAP to stagger.
 *
 * The unit of the split changes with the script, and it has to. Latin letters
 * are discrete shapes, so one span per character animates beautifully. Arabic
 * is cursive: letters join to their neighbours and take a different form
 * depending on where in the word they sit. Putting each letter in its own
 * element breaks that shaping — every glyph falls back to its isolated form and
 * the word renders as a row of disconnected letters, which is what made the
 * Arabic side look broken rather than merely different.
 *
 * So in RTL the split stops at the word. GSAP still gets `.char` targets and
 * still staggers; it just staggers whole words, which is the right reading
 * rhythm for Arabic anyway.
 */
export default function SplitText({ text, className = '', charClassName = '' }: SplitTextProps) {
  const isRtl = useIsRtl();
  // Split text by spaces to preserve word groupings
  const words = text.split(' ');

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="word inline-block whitespace-nowrap">
          {isRtl ? (
            // One span for the whole word: the letters inside stay a single
            // shaping run and keep their joins.
            <span className={`char inline-block ${charClassName}`}>{word}</span>
          ) : (
            word.split('').map((char, charIndex) => (
              <span
                key={charIndex}
                className={`char inline-block ${charClassName}`}
              >
                {char}
              </span>
            ))
          )}
          {/* Re-insert the space as a character so GSAP staggers correctly */}
          {wordIndex < words.length - 1 && (
            <span className={`char inline-block ${charClassName}`} style={{ whiteSpace: 'pre' }}>
              {' '}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
