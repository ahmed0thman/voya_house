import "server-only";
import { AwsClient } from "aws4fetch";
import { ActionError } from "@/lib/action-error";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ActionError(
      `Object storage is not configured (missing ${name}). See README-BACKEND.md.`,
      "VALIDATION",
    );
  }
  return value;
}

function getR2Client(): AwsClient {
  return new AwsClient({
    accessKeyId: getEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
    secretAccessKey: getEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    service: "s3",
    region: "auto",
  });
}

function getObjectUrl(key: string): string {
  const accountId = getEnv("CLOUDFLARE_R2_ACCOUNT_ID");
  const bucket = getEnv("CLOUDFLARE_R2_BUCKET_NAME");
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(key)}`;
}

// Cloudflare R2's free tier is 10 GiB/month of storage. R2 requires a card on
// file even to stay within the free tier, and Cloudflare has no built-in hard
// cutoff for it — only usage *alerts*. This cap is our own enforcement so the
// app refuses uploads before ever risking a charge, independent of anything
// configured in the Cloudflare dashboard.
const DEFAULT_MAX_STORAGE_GB = 9;

function getMaxStorageBytes(): number {
  const raw = process.env.CLOUDFLARE_R2_MAX_STORAGE_GB;
  const gb = raw ? Number(raw) : DEFAULT_MAX_STORAGE_GB;
  return (Number.isFinite(gb) && gb > 0 ? gb : DEFAULT_MAX_STORAGE_GB) * 1024 ** 3;
}

/** Sums `Size` across every object in the bucket via ListObjectsV2 (S3 API). */
async function getBucketTotalBytes(
  client: AwsClient,
  accountId: string,
  bucket: string,
): Promise<number> {
  let totalBytes = 0;
  let continuationToken: string | undefined;

  do {
    const url = new URL(`https://${accountId}.r2.cloudflarestorage.com/${bucket}`);
    url.searchParams.set("list-type", "2");
    url.searchParams.set("max-keys", "1000");
    if (continuationToken) {
      url.searchParams.set("continuation-token", continuationToken);
    }

    const response = await client.fetch(url);
    if (!response.ok) {
      throw new ActionError(
        `Couldn't check object storage usage (${response.status}).`,
        "CONFLICT",
      );
    }
    const xml = await response.text();

    for (const match of xml.matchAll(/<Size>(\d+)<\/Size>/g)) {
      totalBytes += Number(match[1]);
    }

    const isTruncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
    continuationToken = isTruncated
      ? (xml.match(/<NextContinuationToken>([^<]*)<\/NextContinuationToken>/)?.[1] ??
        undefined)
      : undefined;
  } while (continuationToken);

  return totalBytes;
}

/**
 * Throws if adding `incomingBytes` would cross the configured storage cap.
 * Call this before issuing any presigned upload URL.
 */
export async function assertStorageBudget(incomingBytes: number): Promise<void> {
  const client = getR2Client();
  const accountId = getEnv("CLOUDFLARE_R2_ACCOUNT_ID");
  const bucket = getEnv("CLOUDFLARE_R2_BUCKET_NAME");
  const currentBytes = await getBucketTotalBytes(client, accountId, bucket);
  const maxBytes = getMaxStorageBytes();

  if (currentBytes + incomingBytes > maxBytes) {
    const usedGiB = (currentBytes / 1024 ** 3).toFixed(2);
    const maxGiB = (maxBytes / 1024 ** 3).toFixed(2);
    throw new ActionError(
      `Storage limit reached (${usedGiB} / ${maxGiB} GiB) — uploads are blocked to stay on Cloudflare R2's free tier. Delete some images to free up space, or raise CLOUDFLARE_R2_MAX_STORAGE_GB.`,
      "CONFLICT",
    );
  }
}

export type StorageStatusDTO = {
  configured: boolean;
  publicUrlConfigured: boolean;
  bucket?: string;
  usedBytes?: number;
  maxBytes: number;
  error?: string;
};

/** Non-throwing status check for display — used by the Settings page. */
export async function getStorageStatus(): Promise<StorageStatusDTO> {
  const maxBytes = getMaxStorageBytes();
  const publicUrlConfigured = Boolean(process.env.CLOUDFLARE_R2_PUBLIC_URL);
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return { configured: false, publicUrlConfigured, maxBytes };
  }

  try {
    const client = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
    const usedBytes = await getBucketTotalBytes(client, accountId, bucket);
    return { configured: true, publicUrlConfigured, bucket, usedBytes, maxBytes };
  } catch (error) {
    return {
      configured: true,
      publicUrlConfigured,
      bucket,
      maxBytes,
      error: error instanceof Error ? error.message : "Failed to reach R2",
    };
  }
}

function sanitizeFileName(fileName: string): string {
  return (
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image"
  );
}

/** Generates a stable, collision-free object key for an uploaded item image. */
export function generateItemImageKey(fileName: string): string {
  return `items/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

/** Generates a stable, collision-free object key for an offer's banner image. */
export function generateOfferBannerImageKey(fileName: string): string {
  return `offers/banners/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
}

/**
 * Presigned PUT URL for a direct browser -> R2 upload. The uploader MUST send
 * a `Content-Type` header matching `contentType` exactly, since it's part of
 * the signed request — a mismatch fails signature verification.
 */
export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getR2Client();
  const url = new URL(getObjectUrl(params.key));
  url.searchParams.set("X-Amz-Expires", String(params.expiresInSeconds ?? 300));

  const signed = await client.sign(url, {
    method: "PUT",
    aws: { signQuery: true },
    headers: { "Content-Type": params.contentType },
  });

  return signed.url;
}

export async function deleteObject(key: string): Promise<void> {
  const client = getR2Client();
  const response = await client.fetch(getObjectUrl(key), { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new ActionError(
      `Failed to delete "${key}" from object storage (${response.status}).`,
      "CONFLICT",
    );
  }
}

/** Resolves a stored object key to a publicly readable URL. */
export function resolveImageUrl(key: string): string {
  const publicBase = getEnv("CLOUDFLARE_R2_PUBLIC_URL").replace(/\/$/, "");
  return `${publicBase}/${key}`;
}
