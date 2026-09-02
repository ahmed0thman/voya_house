/**
 * Central SEO configuration for Voya House.
 *
 * All metadata values — titles, descriptions, keywords, structured data — flow
 * from this file. There are zero magic strings scattered across layouts or
 * components; everything resolves here.
 *
 * The Arabic copy is written natively in Egyptian colloquial Arabic (the same
 * register the rest of the guest-facing UI uses). It is NOT a machine
 * translation of the English — keyword research and phrasing are independent.
 */

/** The canonical origin, used to build absolute URLs for OG, sitemap, hreflang. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://voyahouse.com";

/** Supported locales — mirrors `src/i18n/routing.ts`. */
export type SeoLocale = "en" | "ar";

// ---------------------------------------------------------------------------
// Per-locale SEO metadata
// ---------------------------------------------------------------------------

export interface LocaleSeoConfig {
  siteName: string;
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
  };
}

export const seoConfig: Record<SeoLocale, LocaleSeoConfig> = {
  en: {
    siteName: "Voya House",
    title:
      "Voya House — Specialty Coffee, Healthy Food & Comfort Kitchen",
    description:
      "Where specialty coffee rituals, mindful healthy meals, and generous comfort food come together under one roof. A premium hospitality experience in New Cairo crafted around quality, warmth, and togetherness.",
    keywords: [
      "specialty coffee",
      "healthy food",
      "comfort food",
      "premium cafe",
      "Voya House",
      "Voya Coffee",
      "Papa Voya",
      "Mama Voya",
      "New Cairo cafe",
      "artisan bakery",
      "pour over coffee",
      "healthy bowls",
      "family restaurant",
      "coffee house Egypt",
      "all-day dining",
    ],
    openGraph: {
      title: "Voya House — Three Experiences, One Home",
      description:
        "Specialty coffee by VOYA. Healthy kitchen by Papa Voya. Comfort food by Mama Voya. A premium dining experience crafted around quality, warmth, and togetherness.",
    },
  },
  ar: {
    siteName: "فويا هاوس",
    title:
      "فويا هاوس — قهوة مختصة، أكل صحي ومطبخ بيتي",
    description:
      "المكان اللي بيجمع طقوس القهوة المختصة والأكل الصحي المتوازن وأكل البيت الدافي تحت سقف واحد. تجربة ضيافة راقية في القاهرة الجديدة مبنية على الجودة والدفء والعيلة.",
    keywords: [
      "قهوة مختصة",
      "أكل صحي",
      "أكل بيتي",
      "كافيه راقي",
      "فويا هاوس",
      "فويا كوفي",
      "بابا فويا",
      "ماما فويا",
      "كافيه القاهرة الجديدة",
      "مخبز حرفي",
      "بور أوفر",
      "بولز صحية",
      "مطعم عائلي",
      "كوفي شوب مصر",
      "أكل طول اليوم",
    ],
    openGraph: {
      title: "فويا هاوس — ثلاث تجارب، بيت واحد",
      description:
        "قهوة مختصة من فويا. مطبخ صحي من بابا فويا. أكل بيتي من ماما فويا. تجربة ضيافة راقية مبنية على الجودة والدفء.",
    },
  },
};

// ---------------------------------------------------------------------------
// Structured data constants (shared across JSON-LD generators)
// ---------------------------------------------------------------------------

export const structuredData = {
  /** Schema.org Organization — the parent brand. */
  organization: {
    name: "Voya House",
    nameAr: "فويا هاوس",
    legalName: "Voya House",
    foundingDate: "2026",
    logo: `${SITE_URL}/assets/logos/Asset 11.svg`,
    sameAs: [
      // TODO: Replace with real social URLs when available
      "https://instagram.com/voyahouse",
      "https://x.com/voyahouse",
    ],
  },

  /** Schema.org CafeOrCoffeeShop — the physical business. */
  business: {
    name: "Voya House",
    nameAr: "فويا هاوس",
    servesCuisine: {
      en: ["Specialty Coffee", "Healthy Food", "Comfort Food"],
      ar: ["قهوة مختصة", "أكل صحي", "أكل بيتي"],
    },
    priceRange: "$$",
    telephone: "+20-XXX-XXX-XXXX", // TODO: Replace with real phone
    address: {
      streetAddress: "123 Voyage Street",
      streetAddressAr: "123 شارع فوياج",
      addressLocality: "New Cairo",
      addressLocalityAr: "القاهرة الجديدة",
      addressRegion: "Cairo Governorate",
      addressRegionAr: "محافظة القاهرة",
      postalCode: "11835",
      addressCountry: "EG",
    },
    openingHours: "Mo-Su 07:00-23:00",
    geo: {
      latitude: 30.0131, // TODO: Replace with exact coordinates
      longitude: 31.4966,
    },
  },
} as const;
