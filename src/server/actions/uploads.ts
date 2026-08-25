"use server";

import { requireUser } from "@/lib/dal";
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
  type RequestItemImageUploadInput,
  type DeleteItemImageInput,
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
export async function requestItemImageUpload(
  rawInput: RequestItemImageUploadInput,
): Promise<PresignedUploadDTO> {
  await requireUser();
  const input = requestItemImageUploadSchema.parse(rawInput);
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
}

export async function deleteItemImage(
  rawInput: DeleteItemImageInput,
): Promise<{ key: string }> {
  await requireUser();
  const input = deleteItemImageSchema.parse(rawInput);
  await deleteObject(input.key);
  return { key: input.key };
}
