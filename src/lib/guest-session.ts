/**
 * Everything the guest's own browser remembers between visits. All of it is
 * convenience state, never authority — the server re-derives prices, discounts
 * and table validity on every order regardless of what's stored here.
 */

/** How the guest is ordering, decided by the URL they arrived on. */
export type OrderMode = "ON_TABLE" | "TAKEAWAY" | "DELIVERY";

/** The two modes a guest picks for themselves — the only kind worth remembering. */
export type OffPremiseMode = Exclude<OrderMode, "ON_TABLE">;

const CONTEXT_KEY = "voya_order_context";
const ORDERS_KEY = "voya_guest_orders";
const CONTACT_KEY = "voya_guest_contact";

/**
 * Dine-in is deliberately never remembered. A table guest is, by definition,
 * sitting in front of the QR code that puts them there, so the scan itself is
 * the state — persisting it only means a settled, closed visit follows them
 * around on later refreshes. Re-scanning is trivial and always correct.
 *
 * The off-premise choice is remembered, but only for about as long as one
 * outing: past that, we'd rather ask again than assume.
 */
const CONTEXT_TTL_MS = 4 * 60 * 60 * 1000;
/** Long enough to still be tracking yesterday's late delivery, short enough not to hoard. */
const GUEST_ORDER_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_ORDERS = 20;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors in restricted contexts (private mode, blocked site data)
  }
}

function forgetOrderMode(): null {
  try {
    localStorage.removeItem(CONTEXT_KEY);
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return null;
}

/**
 * Returns null for anything expired, malformed, or dine-in — the last of which
 * covers browsers still holding a table context written by an older build.
 */
export function readRememberedMode(): OffPremiseMode | null {
  const stored = readJson<{ mode?: string; savedAt?: number }>(CONTEXT_KEY);
  if (!stored) return null;
  if (typeof stored.savedAt !== "number" || Date.now() - stored.savedAt > CONTEXT_TTL_MS) {
    return forgetOrderMode();
  }
  if (stored.mode !== "TAKEAWAY" && stored.mode !== "DELIVERY") return forgetOrderMode();
  return stored.mode;
}

export function rememberOrderMode(mode: OffPremiseMode): void {
  writeJson(CONTEXT_KEY, { mode, savedAt: Date.now() });
}

type TrackedOrder = { id: string; savedAt: number };

function readTrackedOrders(): TrackedOrder[] {
  const stored = readJson<TrackedOrder[]>(ORDERS_KEY);
  if (!Array.isArray(stored)) return [];
  const cutoff = Date.now() - GUEST_ORDER_TTL_MS;
  return stored.filter((entry) => entry?.id && entry.savedAt > cutoff);
}

/** Ids of the takeaway/delivery tickets this browser placed — the guest's only handle on them. */
export function readGuestOrderIds(): string[] {
  return readTrackedOrders().map((entry) => entry.id);
}

export function rememberGuestOrder(id: string): string[] {
  const next = [{ id, savedAt: Date.now() }, ...readTrackedOrders().filter((e) => e.id !== id)].slice(
    0,
    MAX_TRACKED_ORDERS,
  );
  writeJson(ORDERS_KEY, next);
  return next.map((entry) => entry.id);
}

export type GuestContact = { name: string; phone: string; birthday: string; address: string };

export const EMPTY_CONTACT: GuestContact = { name: "", phone: "", birthday: "", address: "" };

/** Pre-fills checkout so a regular doesn't retype their details every order. */
export function readGuestContact(): GuestContact {
  const stored = readJson<Partial<GuestContact>>(CONTACT_KEY);
  if (!stored) return EMPTY_CONTACT;
  const field = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    name: field(stored.name),
    phone: field(stored.phone),
    birthday: field(stored.birthday),
    address: field(stored.address),
  };
}

export function saveGuestContact(contact: GuestContact): void {
  writeJson(CONTACT_KEY, contact);
}
