import React from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  charClassName?: string;
}

export default function SplitText({ text, className = '', charClassName = '' }: SplitTextProps) {
  // Split text by spaces to preserve word groupings
  const words = text.split(' ');

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="word inline-block whitespace-nowrap">
          {word.split('').map((char, charIndex) => (
            <span 
              key={charIndex} 
              className={`char inline-block ${charClassName}`}
            >
              {char}
            </span>
          ))}
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
