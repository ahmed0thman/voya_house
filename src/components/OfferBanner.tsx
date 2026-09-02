"use client";

import Image from "next/image";
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
        <div className="relative block md:hidden w-full rounded-2xl overflow-hidden aspect-[3/1]">
          <Image
            src={banner.bannerImageMobileUrl}
            alt={`${banner.code} offer`}
            fill
            sizes="100vw"
            quality={80}
            className="object-cover object-center"
          />
        </div>
      )}
      {banner.bannerImageDesktopUrl && (
        <div className="relative hidden md:block w-full rounded-2xl overflow-hidden aspect-[8/1]">
          <Image
            src={banner.bannerImageDesktopUrl}
            alt={`${banner.code} offer`}
            fill
            sizes="100vw"
            quality={80}
            className="object-cover"
          />
        </div>
      )}
    </div>
  );
}
