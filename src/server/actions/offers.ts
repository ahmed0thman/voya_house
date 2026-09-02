"use server";

import { prisma } from "@/lib/prisma";
import type { CodeOffer } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { getTranslations } from "next-intl/server";
import { defineAction } from "@/server/define-action";
import { resolveImageUrl, deleteObject } from "@/lib/storage/r2";
import {
  createOfferSchema,
  updateOfferSchema,
  deleteOfferSchema,
  codeSchema,
} from "@/lib/validations/offer";

export type OfferBannerImageDTO = { key: string; url: string };

export type OfferDTO = {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  showOnMenu: boolean;
  bannerImageMobile: OfferBannerImageDTO | null;
  bannerImageDesktop: OfferBannerImageDTO | null;
};

function toOfferDTO(offer: CodeOffer): OfferDTO {
  return {
    id: offer.id,
    code: offer.code,
    name: offer.name,
    description: offer.description,
    discountType: offer.discountType,
    discountValue: offer.discountValue.toNumber(),
    validFrom: offer.validFrom.toISOString(),
    validUntil: offer.validUntil.toISOString(),
    isActive: offer.isActive,
    showOnMenu: offer.showOnMenu,
    bannerImageMobile: offer.bannerImageMobile
      ? { key: offer.bannerImageMobile, url: resolveImageUrl(offer.bannerImageMobile) }
      : null,
    bannerImageDesktop: offer.bannerImageDesktop
      ? { key: offer.bannerImageDesktop, url: resolveImageUrl(offer.bannerImageDesktop) }
      : null,
  };
}

/** Best-effort — a failed cleanup shouldn't block the DB change that already succeeded. */
async function deleteBannerImagesBestEffort(keys: (string | null)[]): Promise<void> {
  const present = keys.filter((key): key is string => key !== null);
  if (present.length === 0) return;
  await Promise.allSettled(present.map((key) => deleteObject(key)));
}

export const listOffers = defineAction({
  auth: "admin",
  handler: async (): Promise<OfferDTO[]> => {
    const offers = await prisma.codeOffer.findMany({ orderBy: { createdAt: "desc" } });
    return offers.map(toOfferDTO);
  },
});

/** Shared by the guest's live "Apply" preview and the authoritative check inside `createOrder`. */
export async function findActiveOfferByCode(rawCode: string): Promise<CodeOffer | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  const offer = await prisma.codeOffer.findUnique({ where: { code } });
  if (!offer || !offer.isActive) return null;

  const now = new Date();
  if (now < offer.validFrom || now > offer.validUntil) return null;

  return offer;
}

export type OfferPreviewDTO = {
  code: string;
  name: string | null;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
};

/**
 * Public on purpose — a dining guest checks their code before placing an
 * order, without logging in. This is only a preview: `createOrder` re-runs
 * `findActiveOfferByCode` itself before computing the real discount, so a
 * tampered client can't apply an expired or fabricated code.
 */
export const validateOfferCode = defineAction({
  auth: "public",
  schema: codeSchema,
  handler: async (code): Promise<OfferPreviewDTO> => {
    // Reaches the guest as a toast under the offer field, so it follows their
    // language like every other public action's failures.
    const t = await getTranslations("errors");
    const offer = await findActiveOfferByCode(code);
    if (!offer) {
      throw new ActionError(t("offerInvalid"), "NOT_FOUND");
    }
    return {
      code: offer.code,
      name: offer.name,
      discountType: offer.discountType,
      discountValue: offer.discountValue.toNumber(),
    };
  },
});

export const createOffer = defineAction({
  auth: "admin",
  schema: createOfferSchema,
  handler: async (input): Promise<OfferDTO> => {
  const existing = await prisma.codeOffer.findUnique({ where: { code: input.code } });
  if (existing) {
    throw new ActionError(`Code "${input.code}" is already in use.`, "CONFLICT");
  }

  const showOnMenu = input.showOnMenu ?? false;

  const offer = await prisma.$transaction(async (tx) => {
    // Only one offer is ever featured on the menu at a time.
    if (showOnMenu) {
      await tx.codeOffer.updateMany({
        where: { showOnMenu: true },
        data: { showOnMenu: false },
      });
    }

    return tx.codeOffer.create({
      data: {
        code: input.code,
        name: input.name || null,
        description: input.description || null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        showOnMenu,
        bannerImageMobile: input.bannerImageMobileKey ?? null,
        bannerImageDesktop: input.bannerImageDesktopKey ?? null,
      },
    });
  });

  return toOfferDTO(offer);
  },
});

export const updateOffer = defineAction({
  auth: "admin",
  schema: updateOfferSchema,
  handler: async (input): Promise<OfferDTO> => {
  const existing = await prisma.codeOffer.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("Offer not found.", "NOT_FOUND");

  if (input.code !== existing.code) {
    const codeTaken = await prisma.codeOffer.findUnique({ where: { code: input.code } });
    if (codeTaken) {
      throw new ActionError(`Code "${input.code}" is already in use.`, "CONFLICT");
    }
  }

  const offer = await prisma.$transaction(async (tx) => {
    // Only one offer is ever featured on the menu at a time.
    if (input.showOnMenu) {
      await tx.codeOffer.updateMany({
        where: { showOnMenu: true, NOT: { id: input.id } },
        data: { showOnMenu: false },
      });
    }

    return tx.codeOffer.update({
      where: { id: input.id },
      data: {
        code: input.code,
        name: input.name,
        description: input.description || null,
        discountType: input.discountType,
        discountValue: input.discountValue,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        isActive: input.isActive,
        showOnMenu: input.showOnMenu,
        bannerImageMobile: input.bannerImageMobileKey,
        bannerImageDesktop: input.bannerImageDesktopKey,
      },
    });
  });

  const droppedKeys = [
    existing.bannerImageMobile !== offer.bannerImageMobile ? existing.bannerImageMobile : null,
    existing.bannerImageDesktop !== offer.bannerImageDesktop ? existing.bannerImageDesktop : null,
  ];
  // Awaited (not fire-and-forget) since serverless runtimes don't guarantee
  // background work continues after the response is sent.
  await deleteBannerImagesBestEffort(droppedKeys);

  return toOfferDTO(offer);
  },
});

export const deleteOffer = defineAction({
  auth: "admin",
  schema: deleteOfferSchema,
  handler: async (input): Promise<{ id: string }> => {
    const existing = await prisma.codeOffer.findUnique({ where: { id: input.id } });
    if (!existing) throw new ActionError("Offer not found.", "NOT_FOUND");

    await prisma.codeOffer.delete({ where: { id: input.id } });
    await deleteBannerImagesBestEffort([
      existing.bannerImageMobile,
      existing.bannerImageDesktop,
    ]);
    return { id: input.id };
  },
});

export type FeaturedOfferBannerDTO = {
  code: string;
  bannerImageMobileUrl: string | null;
  bannerImageDesktopUrl: string | null;
} | null;

/**
 * Public on purpose — feeds the promotional banner atop the guest-facing menu.
 * Only returns a banner when the featured offer is currently valid (active,
 * within its date range) and has at least one breakpoint image set. Mobile
 * and desktop images are independent — a banner uploaded for only one
 * breakpoint still shows there, without waiting on the other to be filled in.
 */
export const getFeaturedOfferBanner = defineAction({
  auth: "public",
  handler: async (): Promise<FeaturedOfferBannerDTO> => {
    const now = new Date();
    const offer = await prisma.codeOffer.findFirst({
      where: {
        showOnMenu: true,
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
        OR: [
          { bannerImageMobile: { not: null } },
          { bannerImageDesktop: { not: null } },
        ],
      },
    });
    if (!offer) return null;

    return {
      code: offer.code,
      bannerImageMobileUrl: offer.bannerImageMobile
        ? resolveImageUrl(offer.bannerImageMobile)
        : null,
      bannerImageDesktopUrl: offer.bannerImageDesktop
        ? resolveImageUrl(offer.bannerImageDesktop)
        : null,
    };
  },
});
