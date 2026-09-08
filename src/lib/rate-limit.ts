import "server-only";
import { headers } from "next/headers";

export type RateLimitConfig = {
  /** Maximum requests allowed in one fixed window. */
  limit: number;
  /** Fixed-window duration in milliseconds. */
  windowMs: number;
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterMs: number };

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = {
  buckets: Map<string, RateLimitBucket>;
  lastCleanupAt: number;
};

const stores = new WeakMap<object, RateLimitStore>();
const CLEANUP_INTERVAL_MS = 60_000;

function pruneExpiredBuckets(store: RateLimitStore, now: number): void {
  if (now - store.lastCleanupAt < CLEANUP_INTERVAL_MS) return;

  store.lastCleanupAt = now;
  for (const [identifier, bucket] of store.buckets) {
    if (bucket.resetAt <= now) store.buckets.delete(identifier);
  }
}

/**
 * Returns the client IP forwarded by the hosting proxy. Malformed or absent
 * forwarding headers deliberately share one fallback bucket rather than
 * creating arbitrary, attacker-controlled Map keys.
 */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const candidate = forwardedFor || realIp;

  // IPv4 and IPv6 address characters only. Exact address validation is not
  // needed for rate limiting; this bounds keys while supporting both families.
  return candidate && candidate.length <= 45 && /^[a-fA-F0-9:.]+$/.test(candidate)
    ? candidate
    : "unknown";
}

/** A small in-memory fixed-window limiter for Server Actions. */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  actionScope: object,
): RateLimitResult {
  const now = Date.now();
  let store = stores.get(actionScope);
  if (!store) {
    store = { buckets: new Map(), lastCleanupAt: now };
    stores.set(actionScope, store);
  }
  pruneExpiredBuckets(store, now);

  const bucket = store.buckets.get(identifier);
  if (!bucket || bucket.resetAt <= now) {
    store.buckets.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (bucket.count >= config.limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true };
}
