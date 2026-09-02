import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo.config";

/**
 * Bilingual sitemap with hreflang alternates.
 *
 * Each URL entry includes `alternates.languages` so the generated XML
 * contains `<xhtml:link rel="alternate" hreflang="...">` elements, which
 * is the primary mechanism for telling Google how `/en` and `/ar` relate.
 *
 * As the site grows beyond a single-page experience (e.g. `/en/menu`,
 * `/en/about`), add entries here with their Arabic counterparts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${SITE_URL}/en`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${SITE_URL}/en`,
          ar: `${SITE_URL}/ar`,
        },
      },
    },
    {
      url: `${SITE_URL}/ar`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${SITE_URL}/en`,
          ar: `${SITE_URL}/ar`,
        },
      },
    },
  ];
}
