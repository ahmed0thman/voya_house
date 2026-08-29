/**
 * Staff notification records, kept in the browser rather than the database.
 *
 * Read/unread is per person at a station, not a property of the order — one
 * server dismissing an alert must not clear it off everyone else's screen. That
 * makes localStorage the honest home for it, and keeps the whole feature out of
 * the schema.
 */

export type NotificationTab = "table" | "takeaway" | "delivery";

export type OrderNotification = {
  /** The order's own id — dedupes across polls and across reloads. */
  id: string;
  tab: NotificationTab;
  tableNumber: number | null;
  customerName: string | null;
  /** ISO timestamp of the order, so the list sorts by when it actually arrived. */
  createdAt: string;
  read: boolean;
};

const STORAGE_KEY = "voya_order_notifications";
/** A shift's worth of history; older alerts are noise, not context. */
const TTL_MS = 12 * 60 * 60 * 1000;
const MAX_RECORDS = 40;

/**
 * A separate, much longer-lived record of ids this browser has already
 * alerted on — distinct from `STORAGE_KEY`'s shift-length display history.
 * If dedup reused that trimmed/TTL'd list, any order still sitting in
 * RECEIVED past the 12h window (a slow table, a demo seed row) would drop out
 * of it on every write and then read back as "new" on the very next poll,
 * toasting the same stale order over and over, forever. Capped by count
 * instead of time so it never needs to forget an id just because it's old.
 */
const SEEN_KEY = "voya_order_notifications_seen";
const MAX_SEEN = 1000;

function isFresh(entry: OrderNotification): boolean {
  return Date.now() - new Date(entry.createdAt).getTime() < TTL_MS;
}

export function readNotifications(): OrderNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return (parsed as OrderNotification[]).filter((entry) => entry?.id && isFresh(entry));
  } catch {
    return [];
  }
}

export function writeNotifications(entries: OrderNotification[]): OrderNotification[] {
  const trimmed = entries
    .filter(isFresh)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_RECORDS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return trimmed;
}

export function readSeenOrderIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function writeSeenOrderIds(ids: string[]): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-MAX_SEEN)));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Adds anything this browser hasn't alerted on yet, newest first. Existing
 * read state on the display list is preserved. `seenIds` — not the display
 * list — is the dedup authority, so an alert already shown never resurfaces
 * just because it later aged out of the visible history.
 */
export function mergeNotifications(
  existing: OrderNotification[],
  seenIds: Set<string>,
  incoming: Omit<OrderNotification, "read">[],
): { merged: OrderNotification[]; added: OrderNotification[]; nextSeenIds: string[] } {
  const added = incoming
    .filter((entry) => !seenIds.has(entry.id))
    .map((entry) => ({ ...entry, read: false }));
  const nextSeenIds = added.length
    ? [...seenIds, ...added.map((entry) => entry.id)]
    : [...seenIds];
  return {
    merged: added.length ? [...added, ...existing] : existing,
    added,
    nextSeenIds,
  };
}
