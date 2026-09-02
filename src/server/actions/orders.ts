"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus, OrderType, TableSessionStatus } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-error";
import { getTranslations } from "next-intl/server";
import { defineAction } from "@/server/define-action";
import { resolveImageUrl } from "@/lib/storage/r2";
import { findActiveOfferByCode } from "@/server/actions/offers";
import {
  createOrderSchema,
  editOrderSchema,
  listGuestOrdersSchema,
  updateOrderStatusSchema,
  rejectOrderSchema,
  settleTableSessionSchema,
  tableNumberSchema,
  tableSessionIdSchema,
  orderTypeFilterSchema,
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
  /**
   * The visit this ticket joined — ON_TABLE only. Handed to the guest so their
   * browser can rejoin the same tab after a refresh; see `resumeTableSession`.
   */
  tableSessionId: string | null;
  status: OrderStatus;
  /** Collected on every order type — who to call. */
  customerName: string | null;
  customerPhone: string | null;
  /** `YYYY-MM-DD`, or null. Date-only: never shifted by a timezone on the way out. */
  customerBirthday: string | null;
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
    tableSessionId: order.tableSessionId,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerBirthday: order.customerBirthday
      ? order.customerBirthday.toISOString().slice(0, 10)
      : null,
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
export const createOrder = defineAction({
  auth: "public",
  schema: createOrderSchema,
  handler: async (input): Promise<OrderDTO> => {
  // Every message below reaches a guest as a toast, so it has to speak their
  // language. There's no `[locale]` segment on a Server Action to read, so the
  // locale comes from the `NEXT_LOCALE` cookie — see `src/i18n/request.ts`.
  const t = await getTranslations("errors");

  // Only a dine-in ticket is tied to a physical table (and therefore to a session).
  const table =
    input.type === "ON_TABLE"
      ? await prisma.restaurantTable.findUnique({ where: { number: input.tableNumber } })
      : null;
  if (input.type === "ON_TABLE" && (!table || !table.isActive)) {
    throw new ActionError(t("tableUnavailable"), "NOT_FOUND");
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
    throw new ActionError(t("itemUnavailable"), "VALIDATION");
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
      throw new ActionError(t("offerInvalid"), "VALIDATION");
    }
    offerCode = offer.code;
    discountAmount =
      offer.discountType === "PERCENT"
        ? subtotal * (offer.discountValue.toNumber() / 100)
        : Math.min(offer.discountValue.toNumber(), subtotal);
  }
  const totalPrice = subtotal - discountAmount;

  const commonData = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    // Pinned to UTC midnight so the stored day is exactly the day the guest picked,
    // whatever timezone either of us happens to be in.
    customerBirthday: input.customerBirthday ? new Date(`${input.customerBirthday}T00:00:00Z`) : null,
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
        deliveryAddress: input.type === "DELIVERY" ? input.deliveryAddress : null,
      },
      include: { items: true },
    });
    return toOrderDTO(order, null);
  }

  const dineInTable = table!;
  const order = await prisma.$transaction(async (tx) => {
    // One open session per table, shared by every ticket every guest at that
    // table sends — whether they scanned its QR or picked it from the list,
    // and whichever order got here first opened it. A friend joining a table
    // that's already ordering lands on the same tab as the rest of the party.
    const existingSession = await tx.tableSession.findFirst({
      where: { tableId: dineInTable.id, status: TableSessionStatus.OPEN },
    });

    const session =
      existingSession ?? (await tx.tableSession.create({ data: { tableId: dineInTable.id } }));

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
  },
});

/**
 * Public on purpose — feeds the guest's own "Table Orders" status view.
 * Returns every ticket in the table's currently open session, any status —
 * a guest keeps seeing an already-served round until the table is settled.
 * An unknown table or one with no open session simply has no orders rather
 * than erroring, since a stale/garbled URL param shouldn't crash the page.
 */
export const listSessionOrdersForTable = defineAction({
  auth: "public",
  schema: tableNumberSchema,
  handler: async (tableNumber): Promise<OrderDTO[]> => {
    const table = await prisma.restaurantTable.findUnique({ where: { number: tableNumber } });
    if (!table) return [];

    const session = await prisma.tableSession.findFirst({
      where: { tableId: table.id, status: TableSessionStatus.OPEN },
      include: { orders: { include: { items: true }, orderBy: { createdAt: "desc" } } },
    });
    if (!session) return [];

    return session.orders.map((order) => toOrderDTO(order, table.number));
  },
});

/**
 * Public on purpose — lets a browser rejoin the visit it already ordered on
 * after a refresh, or a return trip that didn't come through the table's QR.
 *
 * The stored id is only good while the bill is still open: once staff settle
 * the table this answers null, the browser drops what it kept, and the guest
 * starts clean. That's what makes remembering a table safe at all — a number
 * on its own would happily hand a finished visit the next party's tab, since
 * the same table is reseated under a brand new session id.
 *
 * The id is the credential, exactly as it is for takeaway tickets in
 * `listGuestOrders`, and it reveals nothing `listSessionOrdersForTable`
 * doesn't already give anyone who can read a table number.
 */
export const resumeTableSession = defineAction({
  auth: "public",
  schema: tableSessionIdSchema,
  handler: async (sessionId): Promise<{ tableNumber: number } | null> => {
    const session = await prisma.tableSession.findUnique({
      where: { id: sessionId },
      include: { table: true },
    });
    if (!session || session.status !== TableSessionStatus.OPEN) return null;

    return { tableNumber: session.table.number };
  },
});

/**
 * Public on purpose — the takeaway/delivery counterpart to
 * `listSessionOrdersForTable`. Those guests have no table to key off, so their
 * browser keeps the ids of the tickets it created and asks for them back here.
 * The id *is* the credential: uuid v7's 74 random bits aren't enumerable, and
 * only someone who placed the order (or was shown it) ever holds one. Dine-in
 * tickets are excluded — they belong to a table session and are read through it.
 */
export const listGuestOrders = defineAction({
  auth: "public",
  schema: listGuestOrdersSchema,
  handler: async (ids): Promise<OrderDTO[]> => {
    if (ids.length === 0) return [];

    const orders = await prisma.order.findMany({
      where: { id: { in: ids }, type: { in: [OrderType.TAKEAWAY, OrderType.DELIVERY] } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => toOrderDTO(order, null));
  },
});

/**
 * Control-board view — every table currently mid-visit, with all of its
 * tickets (kitchen status per ticket) and a running total. Staff work
 * tickets here and settle the whole table once the bill's been paid.
 * Sorted by each table's most recent ticket, newest first — a table that
 * just sent a new round should jump to the top even if it's been seated a while.
 */
export const listOpenTableSessions = defineAction({
  auth: "user",
  handler: async (): Promise<TableSessionDTO[]> => {
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
  },
});

/**
 * Control-board view for the two order types that don't go through a table
 * session — each ticket stands alone, so once it's SERVED (picked up /
 * handed to the courier) or REJECTED it's simply done and drops off here.
 */
export const listOrdersByType = defineAction({
  auth: "user",
  schema: orderTypeFilterSchema,
  handler: async (type): Promise<OrderDTO[]> => {
    const orders = await prisma.order.findMany({
      where: {
        type: OrderType[type],
        status: { notIn: [OrderStatus.SERVED, OrderStatus.REJECTED] },
      },
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });

    return orders.map((order) => toOrderDTO(order, null));
  },
});

export const updateOrderStatus = defineAction({
  auth: "user",
  schema: updateOrderStatusSchema,
  handler: async (input): Promise<OrderDTO> => {
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
  },
});

/** Up to the moment it changes hands, a standalone ticket is still correctable. */
const EDITABLE_STATUSES: OrderStatus[] = [
  OrderStatus.RECEIVED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

/**
 * Staff amend a live takeaway/delivery ticket: the customer rang back to change
 * something, or an item was 86'd and has to be swapped or dropped. Dine-in is
 * excluded — a seated guest just sends another round, and their tickets are the
 * table's billing history.
 *
 * Money is re-derived here exactly as it is on create, so a tampered payload
 * can't rewrite prices. Two deliberate choices about that re-derivation:
 * lines already on the ticket keep the price they were quoted at, and a discount
 * whose offer has since expired is still honoured (capped at the new subtotal)
 * rather than yanked from under a customer who already agreed to it.
 */
export const editOrder = defineAction({
  auth: "user",
  schema: editOrderSchema,
  handler: async (input): Promise<OrderDTO> => {
  const existing = await prisma.order.findUnique({
    where: { id: input.id },
    include: { items: true },
  });
  if (!existing) throw new ActionError("Order not found.", "NOT_FOUND");
  if (existing.type === OrderType.ON_TABLE) {
    throw new ActionError(
      "Dine-in tickets can't be edited — the guest sends a new round instead.",
      "VALIDATION",
    );
  }
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    throw new ActionError(
      "This ticket has already been handed over — it can no longer be edited.",
      "CONFLICT",
    );
  }
  if (existing.type === OrderType.DELIVERY && !input.deliveryAddress) {
    throw new ActionError("A delivery order needs an address.", "VALIDATION", {
      deliveryAddress: ["A delivery order needs an address."],
    });
  }

  const items = await prisma.item.findMany({
    where: { id: { in: input.items.map((i) => i.itemId) } },
    include: { category: { include: { brand: true } } },
  });
  const itemsById = new Map(items.map((item) => [item.id, item]));

  // Whatever was already quoted stays quoted — only newly added lines have to be
  // currently available, since removing a sold-out one is the whole point here.
  const quotedPriceByItemId = new Map(
    existing.items.filter((line) => line.itemId).map((line) => [line.itemId!, line.price]),
  );

  const unusable = input.items.find((requested) => {
    const item = itemsById.get(requested.itemId);
    if (!item) return true;
    return !item.isAvailable && !quotedPriceByItemId.has(requested.itemId);
  });
  if (unusable) {
    throw new ActionError("That item isn't on the menu right now.", "VALIDATION");
  }

  const orderItemsData = input.items.map((requested) => {
    const item = itemsById.get(requested.itemId)!;
    return {
      itemId: item.id,
      name: item.name,
      price: quotedPriceByItemId.get(item.id) ?? item.price,
      quantity: requested.quantity,
      brandSlug: item.category.brand.slug,
      image: item.images[0] ?? null,
    };
  });

  const subtotal = orderItemsData.reduce(
    (sum, item) => sum + item.price.toNumber() * item.quantity,
    0,
  );

  let discountAmount = 0;
  if (existing.offerCode) {
    const offer = await findActiveOfferByCode(existing.offerCode);
    discountAmount = offer
      ? offer.discountType === "PERCENT"
        ? subtotal * (offer.discountValue.toNumber() / 100)
        : Math.min(offer.discountValue.toNumber(), subtotal)
      : // Offer has since expired or been deactivated. Honour what the guest was
        // promised, but never let it exceed what they now owe.
        Math.min(existing.discountAmount.toNumber(), subtotal);
  }

  const order = await prisma.$transaction(async (tx) => {
    // Every displayed field is snapshotted on the line, so replacing the set
    // wholesale is simpler than diffing and loses nothing.
    await tx.orderItem.deleteMany({ where: { orderId: input.id } });
    return tx.order.update({
      where: { id: input.id },
      data: {
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerBirthday: input.customerBirthday
          ? new Date(`${input.customerBirthday}T00:00:00Z`)
          : null,
        deliveryAddress: existing.type === OrderType.DELIVERY ? input.deliveryAddress : null,
        specialNotes: input.specialNotes || null,
        subtotal,
        discountAmount,
        totalPrice: subtotal - discountAmount,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });
  });

    return toOrderDTO(order, null);
  },
});

/**
 * Staff decline a ticket before the kitchen has started on it — a mistake or
 * a change of mind. Only allowed from RECEIVED; once preparing has started
 * it's too late to just cancel it. The guest's client watches for this
 * transition and moves the ticket's items back into their cart.
 */
export const rejectOrder = defineAction({
  auth: "user",
  schema: rejectOrderSchema,
  handler: async (input): Promise<OrderDTO> => {
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
  },
});

/**
 * Closes out a table's tab — the guest's ticket history for this visit
 * disappears once this runs. Every ticket must be resolved first (served or
 * rejected) so nothing still cooking gets silently written off.
 */
export const settleTableSession = defineAction({
  auth: "user",
  schema: settleTableSessionSchema,
  handler: async (input): Promise<{ id: string }> => {
    const session = await prisma.tableSession.findUnique({
      where: { id: input.id },
      include: { orders: true },
    });
    if (!session) throw new ActionError("Table session not found.", "NOT_FOUND");
    if (session.status === TableSessionStatus.SETTLED) {
      throw new ActionError("This table has already been settled.", "CONFLICT");
    }
    const UNFINISHED: OrderStatus[] = [
      OrderStatus.RECEIVED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ];
    const unresolved = session.orders.some((order) => UNFINISHED.includes(order.status));
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
  },
});
