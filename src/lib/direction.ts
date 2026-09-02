"use client";

import { useLocale } from "next-intl";
import { isRtl, type Locale } from "@/i18n/routing";

/**
 * `1` in English, `-1` in Arabic.
 *
 * CSS logical properties handle layout on their own, but GSAP does not: an
 * `x: -100` or `xPercent: 100` is a raw pixel/percentage offset that keeps
 * pointing the same physical way no matter what `dir` says. Multiplying every
 * horizontal tween value by this factor makes "slides in from the side it
 * starts on" mean the same thing in both languages, instead of animating
 * backwards out of the viewport in Arabic.
 *
 *     const dx = useDirectionFactor();
 *     gsap.from(el, { xPercent: 100 * dx });
 */
export function useDirectionFactor(): 1 | -1 {
  const locale = useLocale() as Locale;
  return isRtl(locale) ? -1 : 1;
}

/** True while the active locale reads right-to-left. */
export function useIsRtl(): boolean {
  return isRtl(useLocale() as Locale);
}
