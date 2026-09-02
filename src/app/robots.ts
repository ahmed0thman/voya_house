import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo.config";

/**
 * Programmatic robots.txt.
 *
 * - Allows the public guest site (`/en`, `/ar`)
 * - Blocks the staff control board and API routes
 * - Points crawlers to the sitemap
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/control/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
