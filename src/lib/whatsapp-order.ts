import type { OrderDTO } from "@/server/actions/orders";
import { formatPrice } from "@/constants/config";

/**
 * Deliberately English, matching the kitchen ticket and the rest of the
 * control board — this message lands in the restaurant's own WhatsApp inbox,
 * read by staff, not the guest, so it stays in the one language the
 * back-of-house already operates in regardless of the guest's own locale.
 */
const ORDER_TYPE_LABEL: Record<OrderDTO["type"], string> = {
  ON_TABLE: "Dine-in",
  TAKEAWAY: "Pickup",
  DELIVERY: "Delivery",
};

/** Short, still-unique-enough tag — mirrors the one shown on the guest's own ticket. */
function formatTicketId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/** Builds the WhatsApp message body handed off to a guest after they place an order. */
export function buildWhatsappOrderMessage(order: OrderDTO): string {
  const lines: string[] = [
    "*New Order — Voya House*",
    `Ticket ${formatTicketId(order.id)} · ${ORDER_TYPE_LABEL[order.type]}`,
  ];

  if (order.type === "ON_TABLE" && order.tableNumber !== null) {
    lines.push(`Table: ${String(order.tableNumber).padStart(2, "0")}`);
  }
  if (order.type === "DELIVERY" && order.deliveryAddress) {
    lines.push(`Address: ${order.deliveryAddress}`);
  }

  lines.push("", "*Items*");
  for (const item of order.items) {
    lines.push(`${item.quantity}x ${item.name} — ${formatPrice(item.price * item.quantity)}`);
  }

  lines.push("", `Subtotal: ${formatPrice(order.subtotal)}`);
  if (order.discountAmount > 0) {
    const code = order.offerCode ? ` (${order.offerCode})` : "";
    lines.push(`Discount${code}: -${formatPrice(order.discountAmount)}`);
  }
  lines.push(`*Total: ${formatPrice(order.totalPrice)}*`);

  lines.push("", "*Customer*");
  if (order.customerName) lines.push(order.customerName);
  if (order.customerPhone) lines.push(order.customerPhone);

  if (order.specialNotes) {
    lines.push("", `Notes: ${order.specialNotes}`);
  }

  return lines.join("\n");
}

/** `phoneNumber` must already be digits-only international format (e.g. "201097073224"). */
export function buildWhatsappOrderUrl(phoneNumber: string, order: OrderDTO): string {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(buildWhatsappOrderMessage(order))}`;
}
