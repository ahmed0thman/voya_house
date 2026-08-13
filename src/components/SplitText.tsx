import React from 'react';

interface SplitTextProps {
  text: string;
  className?: string;
  charClassName?: string;
}

export default function SplitText({ text, className = '', charClassName = '' }: SplitTextProps) {
  return (
    <span className={`inline-block ${className}`}>
      {text.split('').map((char, index) => (
        <span 
          key={index} 
          className={`char inline-block ${charClassName}`}
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
