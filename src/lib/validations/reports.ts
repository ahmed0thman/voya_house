import { z } from "zod";

/** `YYYY-MM-DD`, parsed as a UTC calendar day — same convention as the guest birthday field. */
const isoDateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");

/**
 * Quick presets cover the ranges a manager actually reaches for; "custom" opens
 * up `from`/`to` for anything else. Kept as a preset rather than always
 * requiring explicit dates so the dashboard has a sane default on first load.
 */
export const dashboardRangeSchema = z.object({
  preset: z.enum(["today", "7d", "30d", "90d", "all", "custom"]).default("30d"),
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
});
export type DashboardRangeInput = z.infer<typeof dashboardRangeSchema>;

const orderTypeSchema = z.enum(["ON_TABLE", "TAKEAWAY", "DELIVERY"]);

export const ordersReportSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  /** Matches against customer name, phone, order id, or offer code. */
  search: z.string().trim().max(100).optional().or(z.literal("")),
  type: orderTypeSchema.or(z.literal("ALL")).default("ALL"),
  brandSlug: z.string().or(z.literal("ALL")).default("ALL"),
  from: isoDateSchema.optional().or(z.literal("")),
  to: isoDateSchema.optional().or(z.literal("")),
  minTotal: z.number().min(0).optional(),
  maxTotal: z.number().min(0).optional(),
  sortBy: z.enum(["createdAt", "totalPrice"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});
export type OrdersReportInput = z.infer<typeof ordersReportSchema>;
