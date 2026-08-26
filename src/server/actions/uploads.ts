"use server";

import { defineAction } from "@/server/define-action";
import {
  generateItemImageKey,
  createPresignedUploadUrl,
  deleteObject,
  resolveImageUrl,
  assertStorageBudget,
} from "@/lib/storage/r2";
import {
  requestItemImageUploadSchema,
  deleteItemImageSchema,
} from "@/lib/validations/upload";

export type PresignedUploadDTO = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  contentType: string;
};

/**
 * Returns a short-lived presigned PUT URL for a direct browser -> R2 upload.
 * The client must PUT the file to `uploadUrl` with a `Content-Type` header
 * that exactly matches `contentType` (it's part of the signed request).
 */
export const requestItemImageUpload = defineAction({
  auth: "user",
  schema: requestItemImageUploadSchema,
  handler: async (input): Promise<PresignedUploadDTO> => {
  await assertStorageBudget(input.fileSize);
  const key = generateItemImageKey(input.fileName);
  const uploadUrl = await createPresignedUploadUrl({
    key,
    contentType: input.contentType,
  });

  return {
    uploadUrl,
    key,
    publicUrl: resolveImageUrl(key),
    contentType: input.contentType,
  };
  },
});

export const deleteItemImage = defineAction({
  auth: "user",
  schema: deleteItemImageSchema,
  handler: async (input): Promise<{ key: string }> => {
    await deleteObject(input.key);
    return { key: input.key };
  },
});
