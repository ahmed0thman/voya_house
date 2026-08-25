/**
 * Everything the guest's own browser remembers between visits. All of it is
 * convenience state, never authority — the server re-derives prices, discounts
 * and table validity on every order regardless of what's stored here.
 */

/** How the guest is ordering, decided by the URL they arrived on. */
export type OrderMode = "ON_TABLE" | "TAKEAWAY" | "DELIVERY";

const CONTEXT_KEY = "voya_order_context";
const ORDERS_KEY = "voya_guest_orders";
const CONTACT_KEY = "voya_guest_contact";

/**
 * A dine-in guest who taps an internal link and loses `?table=N` should still be
 * at their table — but a table scanned days ago must not follow them home when
 * they later order delivery, so the remembered context goes stale after a
 * plausible visit's length.
 */
const CONTEXT_TTL_MS = 4 * 60 * 60 * 1000;
/** Long enough to still be tracking yesterday's late delivery, short enough not to hoard. */
const GUEST_ORDER_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_TRACKED_ORDERS = 20;

export type OrderContext = { mode: OrderMode; tableNumber: number | null };

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

export function readOrderContext(): OrderContext | null {
  const stored = readJson<OrderContext & { savedAt: number }>(CONTEXT_KEY);
  if (!stored || Date.now() - stored.savedAt > CONTEXT_TTL_MS) return null;
  if (stored.mode !== "ON_TABLE" && stored.mode !== "TAKEAWAY" && stored.mode !== "DELIVERY") {
    return null;
  }
  return { mode: stored.mode, tableNumber: stored.tableNumber ?? null };
}

export function saveOrderContext(context: OrderContext): void {
  writeJson(CONTEXT_KEY, { ...context, savedAt: Date.now() });
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

export type GuestContact = { name: string; phone: string; address: string };

const EMPTY_CONTACT: GuestContact = { name: "", phone: "", address: "" };

/** Pre-fills checkout so a regular doesn't retype their address every order. */
export function readGuestContact(): GuestContact {
  const stored = readJson<Partial<GuestContact>>(CONTACT_KEY);
  if (!stored) return EMPTY_CONTACT;
  return {
    name: typeof stored.name === "string" ? stored.name : "",
    phone: typeof stored.phone === "string" ? stored.phone : "",
    address: typeof stored.address === "string" ? stored.address : "",
  };
}

export function saveGuestContact(contact: GuestContact): void {
  writeJson(CONTACT_KEY, contact);
}
