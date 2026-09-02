import { z } from "zod";

const orderLinesSchema = z
  .array(
    z.object({
      itemId: z.uuid(),
      quantity: z.number().int().min(1).max(50),
    }),
  )
  .min(1, "Add at least one item");

/** Loose on formatting (landlines, +20, spaces all welcome) but insists on enough digits to actually call back. */
const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(25)
  .refine((value) => (value.match(/\d/g)?.length ?? 0) >= 7, "Enter a valid phone number");

const customerNameSchema = z.string().trim().min(2, "Enter your name").max(80);

/**
 * A calendar date, `YYYY-MM-DD`, with no time and no timezone — checked as a real
 * day (so 2000-02-31 is rejected, not silently rolled forward) and bounded to
 * something a living guest could plausibly have.
 */
const birthdaySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker for your birthday")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    const isRealDate =
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day;
    return isRealDate && year >= 1900 && parsed.getTime() <= Date.now();
  }, "Enter a valid birthday");

/** Asked of every guest now, whichever way they're ordering. */
const commonOrderFields = {
  customerName: customerNameSchema,
  customerPhone: phoneSchema,
  customerBirthday: birthdaySchema.optional().or(z.literal("")),
  specialNotes: z.string().trim().max(500).optional().or(z.literal("")),
  offerCode: z.string().trim().max(40).optional().or(z.literal("")),
  items: orderLinesSchema,
};

/**
 * All three types now collect the same contact details; what still differs is
 * where the order goes — a table number, nothing at all, or a street address.
 * The discriminated union keeps that structural rather than a pile of
 * conditional checks.
 */
export const createOrderSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ON_TABLE"),
    tableNumber: z.number().int().positive(),
    ...commonOrderFields,
  }),
  z.object({
    type: z.literal("TAKEAWAY"),
    ...commonOrderFields,
  }),
  z.object({
    type: z.literal("DELIVERY"),
    deliveryAddress: z.string().trim().min(10, "Enter a full delivery address").max(500),
    ...commonOrderFields,
  }),
]);
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Staff correcting a live takeaway/delivery ticket — a customer changed their
 * mind, or an item turned out to be 86'd and needs swapping or dropping. Items
 * are a full replacement set, not a diff, so the payload always describes the
 * ticket the staff member is actually looking at.
 */
export const editOrderSchema = z.object({
  id: z.uuid(),
  customerName: customerNameSchema,
  customerPhone: phoneSchema,
  customerBirthday: birthdaySchema.optional().or(z.literal("")),
  deliveryAddress: z.string().trim().max(500).optional().or(z.literal("")),
  specialNotes: z.string().trim().max(500).optional().or(z.literal("")),
  items: orderLinesSchema,
});
export type EditOrderInput = z.infer<typeof editOrderSchema>;

/** The guest tracks their own takeaway/delivery tickets by id — capped so a scraped list can't fan out. */
export const listGuestOrdersSchema = z.array(z.uuid()).max(20);

/**
 * A table's public-facing number, as scanned from a QR code. A number that's
 * well-formed but unknown is still a miss, not an error — see
 * `listSessionOrdersForTable`.
 */
export const tableNumberSchema = z.number().int().positive();

/**
 * A table session's own id, kept by the guest's browser so a refresh can rejoin
 * the visit. An id that's well-formed but unknown (or already settled) is a
 * miss, not an error — see `resumeTableSession`.
 */
export const tableSessionIdSchema = z.uuid();

/** The two order types the control board lists as standalone tickets. */
export const orderTypeFilterSchema = z.enum(["TAKEAWAY", "DELIVERY"]);

export const updateOrderStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["RECEIVED", "PREPARING", "READY", "SERVED"]),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const rejectOrderSchema = z.object({
  id: z.uuid(),
  /**
   * The board composes this from a quick-select preset plus the staff note, so
   * the bound has to cover both halves — the note itself is still capped at 300
   * in the UI, and the preset sentence is what pushes past it.
   */
  reason: z.string().trim().max(400).optional().or(z.literal("")),
});
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;

export const settleTableSessionSchema = z.object({
  id: z.uuid(),
});
export type SettleTableSessionInput = z.infer<typeof settleTableSessionSchema>;
