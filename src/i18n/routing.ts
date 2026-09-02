import { defineRouting } from "next-intl/routing";

/**
 * The two languages the house speaks. English stays the default because it's
 * what every existing link, QR code and marketing asset already points at —
 * Arabic is added alongside it, not layered over it.
 */
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

/** Right-to-left locales. Drives `dir` on <html> and the direction-aware helpers. */
const RTL_LOCALES = new Set<Locale>(["ar"]);

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}

export function directionOf(locale: Locale): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}

/**
 * `always` prefixes both locales, so `/en` and `/ar` are each a real, shareable,
 * separately-indexable URL and neither language is the silent default that
 * search engines have to guess at. The cost is that bare `/` always redirects —
 * which is exactly what keeps the printed table QR codes (`/?table=N`) working,
 * since the proxy carries their query string across the redirect.
 */
export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});
