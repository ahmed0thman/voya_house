"use server";

import { prisma } from "@/lib/prisma";
import type { CodeOffer } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/dal";
import {
  createOfferSchema,
  updateOfferSchema,
  deleteOfferSchema,
  type CreateOfferInput,
  type UpdateOfferInput,
  type DeleteOfferInput,
} from "@/lib/validations/offer";

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
  };
}

export async function listOffers(): Promise<OfferDTO[]> {
  await requireAdmin();
  const offers = await prisma.codeOffer.findMany({ orderBy: { createdAt: "desc" } });
  return offers.map(toOfferDTO);
}

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
export async function validateOfferCode(rawCode: string): Promise<OfferPreviewDTO> {
  const offer = await findActiveOfferByCode(rawCode);
  if (!offer) {
    throw new ActionError("This code isn't valid or has expired.", "NOT_FOUND");
  }
  return {
    code: offer.code,
    name: offer.name,
    discountType: offer.discountType,
    discountValue: offer.discountValue.toNumber(),
  };
}

export async function createOffer(rawInput: CreateOfferInput): Promise<OfferDTO> {
  await requireAdmin();
  const input = createOfferSchema.parse(rawInput);

  const existing = await prisma.codeOffer.findUnique({ where: { code: input.code } });
  if (existing) {
    throw new ActionError(`Code "${input.code}" is already in use.`, "CONFLICT");
  }

  const offer = await prisma.codeOffer.create({
    data: {
      code: input.code,
      name: input.name || null,
      description: input.description || null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      validFrom: input.validFrom,
      validUntil: input.validUntil,
    },
  });

  return toOfferDTO(offer);
}

export async function updateOffer(rawInput: UpdateOfferInput): Promise<OfferDTO> {
  await requireAdmin();
  const input = updateOfferSchema.parse(rawInput);

  const existing = await prisma.codeOffer.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("Offer not found.", "NOT_FOUND");

  if (input.code !== existing.code) {
    const codeTaken = await prisma.codeOffer.findUnique({ where: { code: input.code } });
    if (codeTaken) {
      throw new ActionError(`Code "${input.code}" is already in use.`, "CONFLICT");
    }
  }

  const offer = await prisma.codeOffer.update({
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
    },
  });

  return toOfferDTO(offer);
}

export async function deleteOffer(rawInput: DeleteOfferInput): Promise<{ id: string }> {
  await requireAdmin();
  const input = deleteOfferSchema.parse(rawInput);

  const existing = await prisma.codeOffer.findUnique({ where: { id: input.id } });
  if (!existing) throw new ActionError("Offer not found.", "NOT_FOUND");

  await prisma.codeOffer.delete({ where: { id: input.id } });
  return { id: input.id };
}
