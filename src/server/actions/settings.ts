"use server";

import { prisma } from "@/lib/prisma";
import { defineAction } from "@/server/define-action";
import { updateAppSettingsSchema } from "@/lib/validations/settings";

/** There is only ever one settings row — this is its fixed id. */
const SETTINGS_ID = "singleton";

export type AppSettingsDTO = {
  whatsappOrderNumber: string | null;
};

/**
 * Unauthenticated on purpose — a guest's browser needs this the moment they
 * place an order, to build the wa.me handoff link. Never exposes anything
 * beyond the one number a guest's checkout flow actually needs.
 */
export const getWhatsappOrderNumber = defineAction({
  auth: "public",
  handler: async (): Promise<string | null> => {
    const settings = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
    return settings?.whatsappOrderNumber ?? null;
  },
});

export const getAppSettings = defineAction({
  auth: "admin",
  handler: async (): Promise<AppSettingsDTO> => {
    const settings = await prisma.appSettings.findUnique({ where: { id: SETTINGS_ID } });
    return { whatsappOrderNumber: settings?.whatsappOrderNumber ?? null };
  },
});

export const updateAppSettings = defineAction({
  auth: "admin",
  schema: updateAppSettingsSchema,
  handler: async (input): Promise<AppSettingsDTO> => {
    const settings = await prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, whatsappOrderNumber: input.whatsappOrderNumber ?? null },
      update: { whatsappOrderNumber: input.whatsappOrderNumber ?? null },
    });
    return { whatsappOrderNumber: settings.whatsappOrderNumber };
  },
});
