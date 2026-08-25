"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus, OrderType, TableSessionStatus } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { requireUser } from "@/lib/dal";
import { resolveImageUrl } from "@/lib/storage/r2";
import { findActiveOfferByCode } from "@/server/actions/offers";
import {
  createOrderSchema,
  listGuestOrdersSchema,
  updateOrderStatusSchema,
  rejectOrderSchema,
  settleTableSessionSchema,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
  type RejectOrderInput,
  type SettleTableSessionInput,
} from "@/lib/validations/order";

export type OrderItemDTO = {
  id: string;
  /** The catalog Item this was ordered from, if it still exists — used to re-add it to a cart (e.g. after a rejection). */
  catalogItemId: string | null;
  name: string;
  price: number;
  quantity: number;
  brandSlug: string;
  image: string | null;
};

export type OrderDTO = {
  id: string;
  type: OrderType;
  /** Only set for ON_TABLE orders. */
  tableNumber: number | null;
  status: OrderStatus;
  /** Set for TAKEAWAY/DELIVERY — who to call. */
  customerName: string | null;
  customerPhone: string | null;
  /** DELIVERY only. */
  deliveryAddress: string | null;
  specialNotes: string | null;
  rejectionReason: string | null;
  subtotal: number;
  offerCode: string | null;
  discountAmount: number;
  /** subtotal - discountAmount, the amount actually owed. */
  totalPrice: number;
  createdAt: string;
  items: OrderItemDTO[];
};

export type TableSessionDTO = {
  id: string;
  tableNumber: number;
  status: TableSessionStatus;
  openedAt: string;
  /** Sum of non-rejected tickets — what the table currently owes. */
  totalPrice: number;
  orders: OrderDTO[];
};

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

function toOrderItemDTO(item: OrderWithItems["items"][number]): OrderItemDTO {
  return {
    id: item.id,
    catalogItemId: item.itemId,
    name: item.name,
    price: item.price.toNumber(),
    quantity: item.quantity,
    brandSlug: item.brandSlug,
    image: item.image ? resolveImageUrl(item.image) : null,
  };
}

function toOrderDTO(order: OrderWithItems, tableNumber: number | null): OrderDTO {
  return {
    id: order.id,
    type: order.type,
    tableNumber,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    specialNotes: order.specialNotes,
    rejectionReason: order.rejectionReason,
    subtotal: order.subtotal.toNumber(),
    offerCode: order.offerCode,
    discountAmount: order.discountAmount.toNumber(),
    totalPrice: order.totalPrice.toNumber(),
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(toOrderItemDTO),
  };
}

/**
 * Public on purpose — a guest places this from their own phone, never having
 * logged in, whether they're sitting at a table, collecting at the counter, or
 * ordering delivery. The client only ever sends item ids, quantities, contact
 * details, and an optional offer code; every price, name, brand, and discount is
 * re-read/recomputed from the DB here so a tampered request can't undercharge
 * the order, order a non-existent item, or apply a fake/expired code.
 */
export async function createOrder(rawInput: CreateOrderInput): Promise<OrderDTO> {
  const input = createOrderSchema.parse(rawInput);

  // Only a dine-in ticket is tied to a physical table (and therefore to a session).
  const table =
    input.type === "ON_TABLE"
      ? await prisma.restaurantTable.findUnique({ where: { number: input.tableNumber } })
      : null;
  if (input.type === "ON_TABLE" && (!table || !table.isActive)) {
    throw new ActionError("This table isn't available. Please rescan the table QR code.", "NOT_FOUND");
  }

  const itemIds = input.items.map((i) => i.itemId);
  const items = await prisma.item.findMany({
    where: { id: { in: itemIds } },
    include: { category: { include: { brand: true } } },
  });
  const itemsById = new Map(items.map((item) => [item.id, item]));

  const missingOrUnavailable = input.items.find((requested) => {
    const item = itemsById.get(requested.itemId);
    return !item || !item.isAvailable;
  });
  if (missingOrUnavailable) {
    throw new ActionError(
      "One of the items in your order is no longer available. Please review your cart.",
      "VALIDATION",
    );
  }

  const orderItemsData = input.items.map((requested) => {
    const item = itemsById.get(requested.itemId)!;
    return {
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: requested.quantity,
      brandSlug: item.category.brand.slug,
      image: item.images[0] ?? null,
    };
  });

  const subtotal = orderItemsData.reduce(
    (sum, item) => sum + item.price.toNumber() * item.quantity,
    0,
  );

  let offerCode: string | null = null;
  let discountAmount = 0;
  if (input.offerCode) {
    const offer = await findActiveOfferByCode(input.offerCode);
    if (!offer) {
      throw new ActionError("This code isn't valid or has expired.", "VALIDATION");
    }
    offerCode = offer.code;
    discountAmount =
      offer.discountType === "PERCENT"
        ? subtotal * (offer.discountValue.toNumber() / 100)
        : Math.min(offer.discountValue.toNumber(), subtotal);
  }
  const totalPrice = subtotal - discountAmount;

  const commonData = {
    specialNotes: input.specialNotes || null,
    subtotal,
    offerCode,
    discountAmount,
    totalPrice,
    items: { create: orderItemsData },
  };

  if (input.type !== "ON_TABLE") {
    // Takeaway and delivery tickets stand alone — no session to join, so the
    // customer's own contact details are what identifies the order instead.
    const order = await prisma.order.create({
      data: {
        ...commonData,
        type: OrderType[input.type],
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.type === "DELIVERY" ? input.deliveryAddress : null,
      },
      include: { items: true },
    });
    return toOrderDTO(order, null);
  }

  const dineInTable = table!;
  const order = await prisma.$transaction(async (tx) => {
    // One open session per table, shared by every ticket the guest sends
    // during this visit — opened by whichever order gets here first.
    const session =
      (await tx.tableSession.findFirst({
        where: { tableId: dineInTable.id, status: TableSessionStatus.OPEN },
      })) ?? (await tx.tableSession.create({ data: { tableId: dineInTable.id } }));

    return tx.order.create({
      data: {
        ...commonData,
        type: OrderType.ON_TABLE,
        tableSessionId: session.id,
      },
      include: { items: true },
    });
  });

  return toOrderDTO(order, dineInTable.number);
}

/**
 * Public on purpose — feeds the guest's own "Table Orders" status view.
 * Returns every ticket in the table's currently open session, any status —
 * a guest keeps seeing an already-served round until the table is settled.
 * An unknown table or one with no open session simply has no orders rather
 * than erroring, since a stale/garbled URL param shouldn't crash the page.
 */
export async function listSessionOrdersForTable(tableNumber: number): Promise<OrderDTO[]> {
  const table = await prisma.restaurantTable.findUnique({ where: { number: tableNumber } });
  if (!table) return [];

  const session = await prisma.tableSession.findFirst({
    where: { tableId: table.id, status: TableSessionStatus.OPEN },
    include: { orders: { include: { items: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!session) return [];

  return session.orders.map((order) => toOrderDTO(order, table.number));
}

/**
 * Public on purpose — the takeaway/delivery counterpart to
 * `listSessionOrdersForTable`. Those guests have no table to key off, so their
 * browser keeps the ids of the tickets it created and asks for them back here.
 * The id *is* the credential: uuid v7's 74 random bits aren't enumerable, and
 * only someone who placed the order (or was shown it) ever holds one. Dine-in
 * tickets are excluded — they belong to a table session and are read through it.
 */
export async function listGuestOrders(rawIds: string[]): Promise<OrderDTO[]> {
  const ids = listGuestOrdersSchema.parse(rawIds);
  if (ids.length === 0) return [];

  const orders = await prisma.order.findMany({
    where: { id: { in: ids }, type: { in: [OrderType.TAKEAWAY, OrderType.DELIVERY] } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order) => toOrderDTO(order, null));
}

/**
 * Control-board view — every table currently mid-visit, with all of its
 * tickets (kitchen status per ticket) and a running total. Staff work
 * tickets here and settle the whole table once the bill's been paid.
 * Sorted by each table's most recent ticket, newest first — a table that
 * just sent a new round should jump to the top even if it's been seated a while.
 */
export async function listOpenTableSessions(): Promise<TableSessionDTO[]> {
  await requireUser();

  const sessions = await prisma.tableSession.findMany({
    where: { status: TableSessionStatus.OPEN },
    include: {
      table: true,
      orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
    },
  });

  const dtos = sessions.map((session) => {
    const orders = session.orders.map((order) => toOrderDTO(order, session.table.number));
    return {
      id: session.id,
      tableNumber: session.table.number,
      status: session.status,
      openedAt: session.openedAt.toISOString(),
      totalPrice: orders
        .filter((order) => order.status !== OrderStatus.REJECTED)
        .reduce((sum, order) => sum + order.totalPrice, 0),
      orders,
    };
  });

  return dtos.sort((a, b) => {
    const aLatest = a.orders[0]?.createdAt ?? a.openedAt;
    const bLatest = b.orders[0]?.createdAt ?? b.openedAt;
    return bLatest.localeCompare(aLatest);
  });
}

/**
 * Control-board view for the two order types that don't go through a table
 * session — each ticket stands alone, so once it's SERVED (picked up /
 * handed to the courier) or REJECTED it's simply done and drops off here.
 */
export async function listOrdersByType(type: "TAKEAWAY" | "DELIVERY"): Promise<OrderDTO[]> {
  await requireUser();

  const orders = await prisma.order.findMany({
    where: { type: OrderType[type], status: { notIn: [OrderStatus.SERVED, OrderStatus.REJECTED] } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  return orders.map((order) => toOrderDTO(order, null));
}

export async function updateOrderStatus(rawInput: UpdateOrderStatusInput): Promise<OrderDTO> {
  await requireUser();
  const input = updateOrderStatusSchema.parse(rawInput);

  const existing = await prisma.order.findUnique({
    where: { id: input.id },
    include: { tableSession: { include: { table: true } } },
  });
  if (!existing) throw new ActionError("Order not found.", "NOT_FOUND");

  const order = await prisma.order.update({
    where: { id: input.id },
    data: { status: input.status },
    include: { items: true },
  });

  return toOrderDTO(order, existing.tableSession?.table.number ?? null);
}

/**
 * Staff decline a ticket before the kitchen has started on it — a mistake or
 * a change of mind. Only allowed from RECEIVED; once preparing has started
 * it's too late to just cancel it. The guest's client watches for this
 * transition and moves the ticket's items back into their cart.
 */
export async function rejectOrder(rawInput: RejectOrderInput): Promise<OrderDTO> {
  await requireUser();
  const input = rejectOrderSchema.parse(rawInput);

  const existing = await prisma.order.findUnique({
    where: { id: input.id },
    include: { tableSession: { include: { table: true } } },
  });
  if (!existing) throw new ActionError("Order not found.", "NOT_FOUND");
  if (existing.status !== OrderStatus.RECEIVED) {
    throw new ActionError(
      "Only tickets that haven't started preparing yet can be rejected.",
      "CONFLICT",
    );
  }

  const order = await prisma.order.update({
    where: { id: input.id },
    data: { status: OrderStatus.REJECTED, rejectionReason: input.reason || null },
    include: { items: true },
  });

  return toOrderDTO(order, existing.tableSession?.table.number ?? null);
}

/**
 * Closes out a table's tab — the guest's ticket history for this visit
 * disappears once this runs. Every ticket must be resolved first (served or
 * rejected) so nothing still cooking gets silently written off.
 */
export async function settleTableSession(rawInput: SettleTableSessionInput): Promise<{ id: string }> {
  await requireUser();
  const input = settleTableSessionSchema.parse(rawInput);

  const session = await prisma.tableSession.findUnique({
    where: { id: input.id },
    include: { orders: true },
  });
  if (!session) throw new ActionError("Table session not found.", "NOT_FOUND");
  if (session.status === TableSessionStatus.SETTLED) {
    throw new ActionError("This table has already been settled.", "CONFLICT");
  }
  const unresolved = session.orders.some(
    (order) => order.status === OrderStatus.RECEIVED || order.status === OrderStatus.PREPARING,
  );
  if (unresolved) {
    throw new ActionError(
      "Every ticket must be served or rejected before this table can be settled.",
      "CONFLICT",
    );
  }

  await prisma.tableSession.update({
    where: { id: input.id },
    data: { status: TableSessionStatus.SETTLED, settledAt: new Date() },
  });

  return { id: input.id };
}
