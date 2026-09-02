import type { MetadataRoute } from "next";

/**
 * PWA-ready Web App Manifest with Voya House branding.
 *
 * - `background_color` and `theme_color` use the brand's Deep Black (#080907)
 *   to match the cinematic dark aesthetic of the guest experience.
 * - `start_url` defaults to `/en` since English is the default locale.
 * - `display: standalone` gives the installed PWA a native-app feel.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voya House — Specialty Coffee, Healthy Food & Comfort Kitchen",
    short_name: "Voya House",
    description:
      "Where specialty coffee rituals, mindful healthy meals, and generous comfort food come together under one roof.",
    start_url: "/en",
    display: "standalone",
    background_color: "#080907",
    theme_color: "#080907",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
