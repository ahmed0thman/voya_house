import {
  SITE_URL,
  structuredData,
  type SeoLocale,
} from "@/lib/seo.config";
import { JsonLd } from "./JsonLd";

/**
 * Locale-aware JSON-LD structured data for Voya House.
 *
 * Renders a `@graph` array with three connected entities:
 *
 * 1. **WebSite** — site-level schema with name, URL, and inLanguage
 * 2. **Organization** — Voya House as the parent brand with logo and social links
 * 3. **CafeOrCoffeeShop** — one entity per physical branch (El Gazira, Nasr
 *    City), each with its own address/phone/geo and nested department
 *    entries for Papa Voya and Mama Voya
 *
 * This component is a Server Component and must be rendered in a layout or
 * server-rendered page — never inside a `"use client"` boundary.
 */
export function VoyaHouseJsonLd({ locale }: { locale: SeoLocale }) {
  const { organization, business, branches } = structuredData;
  const isAr = locale === "ar";

  const name = isAr ? business.nameAr : business.name;
  const orgName = isAr ? organization.nameAr : organization.name;
  const inLanguage = isAr ? "ar" : "en";
  const cuisines = isAr
    ? business.servesCuisine.ar
    : business.servesCuisine.en;

  const descriptionEn =
    "A premium hospitality experience bringing together specialty coffee, healthy food, and comfort dining under one roof.";
  const descriptionAr =
    "تجربة ضيافة راقية بتجمع القهوة المختصة والأكل الصحي والأكل البيتي تحت سقف واحد.";

  // Both branches serve the same three experiences.
  const departments = [
    {
      "@type": "Restaurant",
      name: isAr ? "بابا فويا" : "Papa Voya",
      description: isAr
        ? "أكل صحي متوازن وتغذية واعية"
        : "Healthy, balanced meals and mindful nourishment",
      servesCuisine: isAr ? "أكل صحي" : "Healthy Food",
    },
    {
      "@type": "Restaurant",
      name: isAr ? "ماما فويا" : "Mama Voya",
      description: isAr
        ? "أكل بيتي دافي وضيافة سخية"
        : "Warm comfort food and generous hospitality",
      servesCuisine: isAr ? "أكل بيتي" : "Comfort Food",
    },
  ];

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      // ─── WebSite ──────────────────────────────────────────────────
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/${locale}`,
        name,
        inLanguage,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },

      // ─── Organization ─────────────────────────────────────────────
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: orgName,
        legalName: organization.legalName,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: organization.logo,
          width: 512,
          height: 512,
        },
        foundingDate: organization.foundingDate,
        sameAs: organization.sameAs,
      },

      // ─── CafeOrCoffeeShop — one per physical branch ────────────────
      ...branches.map((branch) => ({
        "@type": "CafeOrCoffeeShop",
        "@id": `${SITE_URL}/#business-${branch.id}`,
        name: `${name} — ${isAr ? branch.nameSuffixAr : branch.nameSuffix}`,
        description: isAr ? descriptionAr : descriptionEn,
        url: `${SITE_URL}/${locale}`,
        telephone: branch.telephone,
        priceRange: business.priceRange,
        servesCuisine: cuisines,
        openingHours: business.openingHours,
        address: {
          "@type": "PostalAddress",
          streetAddress: isAr
            ? branch.address.streetAddressAr
            : branch.address.streetAddress,
          addressLocality: isAr
            ? branch.address.addressLocalityAr
            : branch.address.addressLocality,
          addressRegion: isAr
            ? branch.address.addressRegionAr
            : branch.address.addressRegion,
          addressCountry: branch.address.addressCountry,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: branch.geo.latitude,
          longitude: branch.geo.longitude,
        },
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
        image: organization.logo,
        department: departments,
      })),
    ],
  };

  return <JsonLd data={data} />;
}
