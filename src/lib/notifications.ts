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

/** Adds anything this browser hasn't recorded yet, newest first. Existing read state is preserved. */
export function mergeNotifications(
  existing: OrderNotification[],
  incoming: Omit<OrderNotification, "read">[],
): { merged: OrderNotification[]; added: OrderNotification[] } {
  const known = new Set(existing.map((entry) => entry.id));
  const added = incoming
    .filter((entry) => !known.has(entry.id))
    .map((entry) => ({ ...entry, read: false }));
  return { merged: added.length ? [...added, ...existing] : existing, added };
}
