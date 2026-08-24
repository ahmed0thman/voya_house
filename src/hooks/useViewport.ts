"use client";

import { useState, useEffect } from "react";

export type Viewport = "mobile" | "desktop";

/**
 * Returns the current viewport category based on window width.
 * Returns `null` during SSR / before hydration so neither view
 * renders until we know which one to mount.
 *
 * Breakpoint: 768px (matches Tailwind `md:`)
 */
export function useViewport(): Viewport | null {
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useEffect(() => {
    const check = () => {
      setViewport(window.innerWidth >= 768 ? "desktop" : "mobile");
    };
    check();

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(check, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewport;
}
