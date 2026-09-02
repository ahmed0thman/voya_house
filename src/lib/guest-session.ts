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
const TABLE_SESSION_KEY = "voya_table_session";

/**
 * A bare "this browser was dining in" is deliberately never remembered: it
 * would send the next param-less visit to a table nobody is sitting at. What's
 * remembered instead is the one specific visit the guest actually ordered on
 * (see `readTableSession`), which the server can invalidate the moment the
 * bill is settled.
 *
 * The off-premise choice is remembered, but only for about as long as one
 * outing: past that, we'd rather ask again than assume.
 */
const CONTEXT_TTL_MS = 4 * 60 * 60 * 1000;
/** Long enough to still be tracking yesterday's late delivery, short enough not to hoard. */
const GUEST_ORDER_TTL_MS = 24 * 60 * 60 * 1000;
/**
 * Comfortably longer than a meal, because it isn't what actually ends a visit —
 * `resumeTableSession` is, on every single restore. This is only the backstop
 * for the visit nobody ever settled: past it we stop asking and left over.
 */
const TABLE_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
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

/**
 * The dine-in visit this browser last sent an order to. The session id is the
 * part that matters: a table number alone can't tell "still my visit" from
 * "same table, next party", and the number is only kept alongside it so a
 * scanned QR for a different table can spot the mismatch without a round trip.
 */
export type StoredTableSession = { sessionId: string; tableNumber: number };

export function forgetTableSession(): null {
  try {
    localStorage.removeItem(TABLE_SESSION_KEY);
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return null;
}

/**
 * Whatever's on disk, still within its backstop TTL. Says nothing about the
 * visit being open — only `resumeTableSession` on the server can, and every
 * caller here is expected to ask it before trusting what comes back.
 */
export function readTableSession(): StoredTableSession | null {
  const stored = readJson<Partial<StoredTableSession> & { savedAt?: number }>(TABLE_SESSION_KEY);
  if (!stored) return null;
  if (typeof stored.savedAt !== "number" || Date.now() - stored.savedAt > TABLE_SESSION_TTL_MS) {
    return forgetTableSession();
  }
  if (typeof stored.sessionId !== "string" || typeof stored.tableNumber !== "number") {
    return forgetTableSession();
  }
  return { sessionId: stored.sessionId, tableNumber: stored.tableNumber };
}

/** Written once a dine-in order lands, which is the first moment there's a visit worth rejoining. */
export function rememberTableSession(sessionId: string, tableNumber: number): void {
  writeJson(TABLE_SESSION_KEY, { sessionId, tableNumber, savedAt: Date.now() });
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
