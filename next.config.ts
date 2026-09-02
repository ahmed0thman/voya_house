import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * Extract the hostname from the R2 public URL so next/image can optimise
 * remote images stored in Cloudflare R2 (menu items, offer banners).
 */
const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "";
const r2Hostname = r2PublicUrl
  ? new URL(r2PublicUrl).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    ...(r2Hostname && {
      remotePatterns: [
        {
          protocol: "https",
          hostname: r2Hostname,
        },
      ],
    }),
  },
};

/** Points next-intl at `src/i18n/request.ts` for per-request locale + messages. */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
