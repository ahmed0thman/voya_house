import { z } from "zod";

export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** Per-file cap, checked client-side and server-side. */
export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const requestItemImageUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.enum(IMAGE_CONTENT_TYPES),
  fileSize: z
    .number()
    .positive()
    .max(MAX_IMAGE_FILE_SIZE_BYTES, "Image is too large (max 5 MB)"),
});
export type RequestItemImageUploadInput = z.infer<
  typeof requestItemImageUploadSchema
>;

export const deleteItemImageSchema = z.object({
  key: z.string().trim().min(1),
});
export type DeleteItemImageInput = z.infer<typeof deleteItemImageSchema>;

export const requestOfferBannerUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.enum(IMAGE_CONTENT_TYPES),
  fileSize: z
    .number()
    .positive()
    .max(MAX_IMAGE_FILE_SIZE_BYTES, "Image is too large (max 5 MB)"),
});
export type RequestOfferBannerUploadInput = z.infer<
  typeof requestOfferBannerUploadSchema
>;

export const deleteOfferBannerImageSchema = z.object({
  key: z.string().trim().min(1),
});
export type DeleteOfferBannerImageInput = z.infer<
  typeof deleteOfferBannerImageSchema
>;
