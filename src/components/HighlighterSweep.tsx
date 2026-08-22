"use client";

import React, { useEffect, useState } from "react";

interface HighlighterSweepProps {
  text: string;
  highlightBg?: string;
  highlightText?: string;
  baseText?: string;
  className?: string;
  highlightLayerClassName?: string;
  roundedClassName?: string;
}

export default function HighlighterSweep({
  text,
  highlightBg = "#F1E6C3",
  highlightText = "#080907",
  baseText = "#FFFFFF",
  className = "",
  highlightLayerClassName = "",
  roundedClassName = "rounded-md",
}: HighlighterSweepProps) {
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsRTL(document.documentElement.dir === "rtl");
    }
  }, []);

  const initialClip = isRTL
    ? "inset(0% 0% 0% 100%)"
    : "inset(0% 100% 0% 0%)";

  return (
    <span
      className={`highlighter-sweep-wrap relative inline-block ${className}`}
      style={
        {
          "--highlight-bg": highlightBg,
          "--highlight-text": highlightText,
          "--base-text": baseText,
        } as React.CSSProperties
      }
    >
      {/* Base Layer */}
      <span
        className="text-base-layer inline-block px-2 py-0.5"
        style={{ color: "var(--base-text, #ffffff)" }}
      >
        {text}
      </span>

      {/* Highlight Layer (Solid marker background with inverted text color, swept via clip-path) */}
      <span
        className={`text-highlight-layer absolute inset-0 inline-block px-2 py-0.5 ${roundedClassName} overflow-hidden ${highlightLayerClassName}`}
        style={{
          backgroundColor: "var(--highlight-bg)",
          color: "var(--highlight-text)",
          clipPath: initialClip,
          willChange: "clip-path",
        }}
        aria-hidden="true"
      >
        {text}
      </span>
    </span>
  );
}
