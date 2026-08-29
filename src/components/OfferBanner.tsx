"use client";

import { useFeaturedOfferBanner } from "@/hooks/use-offers";

/**
 * Promotional banner shown atop the public menu, sourced from whichever
 * offer the admin has marked "Feature on menu". Renders nothing while
 * loading, on error, or when no offer is currently featured — the design
 * (code, discount copy, etc.) is baked into the uploaded images themselves,
 * not drawn dynamically here.
 */
export function OfferBanner() {
  const { data: banner } = useFeaturedOfferBanner();
  if (!banner) return null;
  if (!banner.bannerImageMobileUrl && !banner.bannerImageDesktopUrl)
    return null;

  return (
    <div>
      {banner.bannerImageMobileUrl && (
        <img
          src={banner.bannerImageMobileUrl}
          alt={`${banner.code} offer`}
          className="block md:hidden w-full h-auto rounded-2xl object-cover object-center aspect-3/1"
        />
      )}
      {banner.bannerImageDesktopUrl && (
        <img
          src={banner.bannerImageDesktopUrl}
          alt={`${banner.code} offer`}
          className="hidden md:block w-full h-auto rounded-2xl object-cover aspect-[8/1]"
        />
      )}
    </div>
  );
}
