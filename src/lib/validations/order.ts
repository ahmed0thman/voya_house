import { z } from "zod";

const orderLinesSchema = z
  .array(
    z.object({
      itemId: z.uuid(),
      quantity: z.number().int().min(1).max(50),
    }),
  )
  .min(1, "Add at least one item");

const commonOrderFields = {
  specialNotes: z.string().trim().max(500).optional().or(z.literal("")),
  offerCode: z.string().trim().max(40).optional().or(z.literal("")),
  items: orderLinesSchema,
};

/** Loose on formatting (landlines, +20, spaces all welcome) but insists on enough digits to actually call back. */
const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(25)
  .refine((value) => (value.match(/\d/g)?.length ?? 0) >= 7, "Enter a valid phone number");

const customerNameSchema = z.string().trim().min(2, "Enter your name").max(80);

/**
 * The three order types carry genuinely different required fields — a table
 * ticket needs a table, a takeaway needs someone to call when it's ready, and a
 * delivery needs somewhere to take it. A discriminated union makes those
 * requirements structural rather than a pile of conditional checks.
 */
export const createOrderSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ON_TABLE"),
    tableNumber: z.number().int().positive(),
    ...commonOrderFields,
  }),
  z.object({
    type: z.literal("TAKEAWAY"),
    customerName: customerNameSchema,
    customerPhone: phoneSchema,
    ...commonOrderFields,
  }),
  z.object({
    type: z.literal("DELIVERY"),
    customerName: customerNameSchema,
    customerPhone: phoneSchema,
    deliveryAddress: z.string().trim().min(10, "Enter a full delivery address").max(500),
    ...commonOrderFields,
  }),
]);
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** The guest tracks their own takeaway/delivery tickets by id — capped so a scraped list can't fan out. */
export const listGuestOrdersSchema = z.array(z.uuid()).max(20);

export const updateOrderStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["RECEIVED", "PREPARING", "SERVED"]),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const rejectOrderSchema = z.object({
  id: z.uuid(),
  reason: z.string().trim().max(300).optional().or(z.literal("")),
});
export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;

export const settleTableSessionSchema = z.object({
  id: z.uuid(),
});
export type SettleTableSessionInput = z.infer<typeof settleTableSessionSchema>;
