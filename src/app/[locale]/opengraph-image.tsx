import { ImageResponse } from "next/og";
import { seoConfig, type SeoLocale } from "@/lib/seo.config";

// ── Image dimensions (OG standard) ──────────────────────────────────────────
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Dynamic Open Graph image for Voya House.
 *
 * Generates a branded 1200×630 social card per locale:
 * - Deep Black (#080907) background matching the cinematic brand aesthetic
 * - Brand name in elegant, high-contrast typography
 * - Localized tagline (English or Arabic)
 * - Warm Beige accent line matching the core palette
 *
 * This image is served at `/en/opengraph-image` and `/ar/opengraph-image`,
 * automatically referenced by the metadata in layout.tsx.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const seoLocale = (locale === "ar" ? "ar" : "en") as SeoLocale;
  const config = seoConfig[seoLocale];
  const isAr = seoLocale === "ar";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080907",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* ─── Warm Beige accent bar at top ─── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #E6DDCE 0%, #F1E6C3 50%, #E6DDCE 100%)",
          }}
        />

        {/* ─── "HOUSE" upper tag ─── */}
        <div
          style={{
            display: "flex",
            fontSize: 14,
            letterSpacing: "6px",
            color: "#E6DDCE",
            textTransform: "uppercase",
            marginBottom: "20px",
            fontFamily: "sans-serif",
          }}
        >
          {isAr ? "هاوس" : "HOUSE"}
        </div>

        {/* ─── Brand Name ─── */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            color: "#F4EFE9",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            direction: isAr ? "rtl" : "ltr",
            fontFamily: "sans-serif",
          }}
        >
          {isAr ? "فويا هاوس" : "VOYA HOUSE"}
        </div>

        {/* ─── Accent divider ─── */}
        <div
          style={{
            display: "flex",
            width: "80px",
            height: "2px",
            backgroundColor: "#E6DDCE",
            margin: "28px 0",
          }}
        />

        {/* ─── Tagline ─── */}
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#E6DDCE",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: "700px",
            direction: isAr ? "rtl" : "ltr",
            fontFamily: "sans-serif",
          }}
        >
          {config.openGraph.description}
        </div>

        {/* ─── Three-brand strip at bottom ─── */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: "40px",
            gap: "40px",
          }}
        >
          {[
            { name: isAr ? "فويا كوفي" : "VOYA", color: "#F1E6C3" },
            { name: isAr ? "بابا فويا" : "PAPA VOYA", color: "#B7D39A" },
            { name: isAr ? "ماما فويا" : "MAMA VOYA", color: "#D8A98F" },
          ].map((brand) => (
            <div
              key={brand.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: 13,
                letterSpacing: "3px",
                color: brand.color,
                fontFamily: "sans-serif",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: brand.color,
                }}
              />
              {brand.name}
            </div>
          ))}
        </div>

        {/* ─── Warm Beige accent bar at bottom ─── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #E6DDCE 0%, #F1E6C3 50%, #E6DDCE 100%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
