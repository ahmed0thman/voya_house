import { formatTicketId } from "@/components/control/order-ticket";
import type { OrderDTO } from "@/server/actions/orders";

/**
 * The control board's live orders search. Mirrors the field set the orders
 * *report* already searches server-side (customer name, phone, offer code, id
 * prefix) — see `search` handling in `src/server/actions/reports.ts` — plus a
 * few fields specific to a live ticket a staff member might type: the table
 * number, the delivery address, and item names ("who ordered a Cortado?").
 */
export function matchesOrderSearch(order: OrderDTO, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const needleNoHash = needle.replace(/^#/, "");

  if (formatTicketId(order.id).toLowerCase().includes(needle)) return true;
  if (needleNoHash.length >= 2 && order.id.toLowerCase().startsWith(needleNoHash)) return true;
  if (order.customerName?.toLowerCase().includes(needle)) return true;
  if (order.customerPhone?.toLowerCase().includes(needle)) return true;

  // Robust to formatting differences (spaces, +20, a leading 0) between what a
  // staff member pastes from caller ID and what's stored.
  const needleDigits = needle.replace(/\D/g, "");
  if (needleDigits && order.customerPhone?.replace(/\D/g, "").includes(needleDigits)) return true;

  if (order.offerCode?.toLowerCase().includes(needle)) return true;
  if (order.deliveryAddress?.toLowerCase().includes(needle)) return true;
  if (order.specialNotes?.toLowerCase().includes(needle)) return true;

  if (order.tableNumber !== null) {
    if (String(order.tableNumber) === needleNoHash) return true;
    if (`table ${order.tableNumber}`.includes(needle)) return true;
  }

  if (order.items.some((item) => item.name.toLowerCase().includes(needle))) return true;

  return false;
}
