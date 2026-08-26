"use server";

import { prisma } from "@/lib/prisma";
import { Prisma, OrderStatus, OrderType } from "@/generated/prisma/client";
import { defineAction } from "@/server/define-action";
import { dashboardRangeSchema, ordersReportSchema } from "@/lib/validations/reports";

function startOfUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const TYPE_ORDER = [OrderType.ON_TABLE, OrderType.TAKEAWAY, OrderType.DELIVERY] as const;

type ResolvedRange = { start: Date | null; end: Date };

/** Maps a preset (or explicit custom bounds) to a `[start, end)` window. `end` is always exclusive. */
function resolveRange(input: {
  preset: "today" | "7d" | "30d" | "90d" | "all" | "custom";
  from?: string;
  to?: string;
}): ResolvedRange {
  const today = startOfUTCDay(new Date());
  const tomorrow = addDays(today, 1);

  switch (input.preset) {
    case "today":
      return { start: today, end: tomorrow };
    case "7d":
      return { start: addDays(today, -6), end: tomorrow };
    case "30d":
      return { start: addDays(today, -29), end: tomorrow };
    case "90d":
      return { start: addDays(today, -89), end: tomorrow };
    case "all":
      return { start: null, end: tomorrow };
    case "custom": {
      const start = input.from ? parseISODate(input.from) : addDays(today, -29);
      const inclusiveEnd = input.to ? parseISODate(input.to) : today;
      return { start, end: addDays(inclusiveEnd, 1) };
    }
  }
}

/** Same-length window immediately before `start`, for period-over-period deltas. Undefined for open-ended ranges. */
function previousRange(start: Date | null, end: Date): { start: Date; end: Date } | null {
  if (!start) return null;
  const lengthMs = end.getTime() - start.getTime();
  return { start: new Date(start.getTime() - lengthMs), end: start };
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

type Granularity = "day" | "week" | "month";

function pickGranularity(spanDays: number): Granularity {
  if (spanDays <= 35) return "day";
  if (spanDays <= 180) return "week";
  return "month";
}

function bucketKey(date: Date, granularity: Granularity): string {
  if (granularity === "month") return date.toISOString().slice(0, 7);
  if (granularity === "day") return toISODate(date);
  const dayOfWeek = date.getUTCDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  return toISODate(addDays(startOfUTCDay(date), -mondayOffset));
}

type BucketAgg = { revenue: number; orderCount: number };

/** Fills every calendar day in range with a zero entry so the trend chart never has gaps. Only used at "day" granularity, which is capped to a 35-day span. */
function fillDailyTrend(bucketAgg: Map<string, BucketAgg>, start: Date, end: Date) {
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return Array.from({ length: days }, (_, i) => {
    const key = toISODate(addDays(start, i));
    const entry = bucketAgg.get(key) ?? { revenue: 0, orderCount: 0 };
    return { bucket: key, ...entry };
  });
}

function sortedTrend(bucketAgg: Map<string, BucketAgg>) {
  return Array.from(bucketAgg.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, entry]) => ({ bucket, ...entry }));
}

export type BusinessDashboardDTO = {
  range: { from: string | null; to: string; preset: string };
  revenue: { total: number; orderCount: number; averageOrderValue: number };
  previousPeriod: {
    total: number;
    orderCount: number;
    revenueChangePct: number | null;
    orderCountChangePct: number | null;
  } | null;
  ordersByType: { type: OrderType; count: number; revenue: number }[];
  revenueByBrand: { brandSlug: string; brandName: string; revenue: number; itemsSold: number }[];
  revenueTrend: { bucket: string; revenue: number; orderCount: number }[];
  granularity: Granularity;
  ordersByHour: { hour: number; count: number }[];
  topItems: { name: string; brandSlug: string; quantitySold: number; revenue: number }[];
  rejections: { count: number; rate: number; topReasons: { reason: string; count: number }[] };
  offers: {
    ordersWithOffer: number;
    totalDiscount: number;
    topCodes: { code: string; uses: number; totalDiscount: number }[];
  };
  customers: { uniqueCustomers: number; repeatCustomers: number; repeatRate: number };
  tableSessions: { openCount: number; avgSessionMinutes: number | null };
};

/**
 * The single query behind the whole master dashboard. Deliberately one
 * `findMany` over the range plus a handful of cheap counts, aggregated in JS —
 * simpler and safer than a wall of raw SQL, and fine at this business's scale
 * (a single multi-house restaurant, not a chain-wide warehouse).
 */
export const getBusinessDashboard = defineAction({
  auth: "admin",
  schema: dashboardRangeSchema,
  handler: async (input): Promise<BusinessDashboardDTO> => {
    const { start, end } = resolveRange(input);
    const previous = previousRange(start, end);

    const [orders, brands, openSessionCount, settledSessions, previousOrders] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start ?? undefined, lt: end } },
        include: { items: { select: { brandSlug: true, name: true, price: true, quantity: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.brand.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true } }),
      prisma.tableSession.count({ where: { status: "OPEN" } }),
      prisma.tableSession.findMany({
        where: { status: "SETTLED", settledAt: { gte: start ?? undefined, lt: end } },
        select: { openedAt: true, settledAt: true },
      }),
      previous
        ? prisma.order.findMany({
            where: {
              createdAt: { gte: previous.start, lt: previous.end },
              status: { not: OrderStatus.REJECTED },
            },
            select: { totalPrice: true },
          })
        : Promise.resolve(null),
    ]);

    const typeAgg = new Map<OrderType, { count: number; revenue: number }>();
    const brandAgg = new Map<string, { revenue: number; itemsSold: number }>();
    const itemAgg = new Map<string, { name: string; brandSlug: string; quantitySold: number; revenue: number }>();
    const hourCounts = Array.from({ length: 24 }, () => 0);
    const bucketAgg = new Map<string, BucketAgg>();
    const rejectionReasons = new Map<string, number>();
    const offerCodeAgg = new Map<string, { uses: number; totalDiscount: number }>();
    const phoneOrderCounts = new Map<string, number>();

    let revenueTotal = 0;
    let revenueOrderCount = 0;
    let rejectedCount = 0;
    let ordersWithOffer = 0;
    let totalDiscount = 0;

    const spanDays = start
      ? Math.round((end.getTime() - start.getTime()) / 86_400_000)
      : orders.length
        ? Math.round((end.getTime() - orders[0].createdAt.getTime()) / 86_400_000)
        : 0;
    const granularity: Granularity = input.preset === "all" ? "month" : pickGranularity(spanDays);

    for (const order of orders) {
      hourCounts[order.createdAt.getUTCHours()]++;

      if (order.status === OrderStatus.REJECTED) {
        rejectedCount++;
        const reason = order.rejectionReason?.trim();
        if (reason) rejectionReasons.set(reason, (rejectionReasons.get(reason) ?? 0) + 1);
        continue; // rejected tickets never billed — excluded from every revenue-side metric below
      }

      const total = order.totalPrice.toNumber();
      revenueTotal += total;
      revenueOrderCount++;

      const typeEntry = typeAgg.get(order.type) ?? { count: 0, revenue: 0 };
      typeEntry.count++;
      typeEntry.revenue += total;
      typeAgg.set(order.type, typeEntry);

      const key = bucketKey(order.createdAt, granularity);
      const bucketEntry = bucketAgg.get(key) ?? { revenue: 0, orderCount: 0 };
      bucketEntry.revenue += total;
      bucketEntry.orderCount++;
      bucketAgg.set(key, bucketEntry);

      if (order.offerCode) {
        ordersWithOffer++;
        const discount = order.discountAmount.toNumber();
        totalDiscount += discount;
        const codeEntry = offerCodeAgg.get(order.offerCode) ?? { uses: 0, totalDiscount: 0 };
        codeEntry.uses++;
        codeEntry.totalDiscount += discount;
        offerCodeAgg.set(order.offerCode, codeEntry);
      }

      if (order.customerPhone) {
        phoneOrderCounts.set(order.customerPhone, (phoneOrderCounts.get(order.customerPhone) ?? 0) + 1);
      }

      // Per-order discount, prorated across its lines — so brand/item revenue
      // sums back to `total` (net) instead of the pre-discount subtotal, which
      // otherwise overstates revenue by-brand/by-item vs. the top-line KPI.
      const orderSubtotal = order.subtotal.toNumber();
      const discountRatio = orderSubtotal > 0 ? total / orderSubtotal : 1;

      for (const item of order.items) {
        const lineRevenue = item.price.toNumber() * item.quantity * discountRatio;

        const brandEntry = brandAgg.get(item.brandSlug) ?? { revenue: 0, itemsSold: 0 };
        brandEntry.revenue += lineRevenue;
        brandEntry.itemsSold += item.quantity;
        brandAgg.set(item.brandSlug, brandEntry);

        const itemKey = `${item.brandSlug}:${item.name}`;
        const itemEntry = itemAgg.get(itemKey) ?? {
          name: item.name,
          brandSlug: item.brandSlug,
          quantitySold: 0,
          revenue: 0,
        };
        itemEntry.quantitySold += item.quantity;
        itemEntry.revenue += lineRevenue;
        itemAgg.set(itemKey, itemEntry);
      }
    }

    const previousTotal = previousOrders?.reduce((sum, o) => sum + o.totalPrice.toNumber(), 0) ?? 0;
    const previousOrderCount = previousOrders?.length ?? 0;

    const avgSessionMinutes = settledSessions.length
      ? Math.round(
          settledSessions.reduce(
            (sum, s) => sum + ((s.settledAt as Date).getTime() - s.openedAt.getTime()) / 60_000,
            0,
          ) / settledSessions.length,
        )
      : null;

    const uniqueCustomers = phoneOrderCounts.size;
    const repeatCustomers = Array.from(phoneOrderCounts.values()).filter((count) => count > 1).length;

    return {
      range: { from: start ? toISODate(start) : null, to: toISODate(addDays(end, -1)), preset: input.preset },
      revenue: {
        total: revenueTotal,
        orderCount: revenueOrderCount,
        averageOrderValue: revenueOrderCount ? revenueTotal / revenueOrderCount : 0,
      },
      previousPeriod: previous
        ? {
            total: previousTotal,
            orderCount: previousOrderCount,
            revenueChangePct: percentChange(revenueTotal, previousTotal),
            orderCountChangePct: percentChange(revenueOrderCount, previousOrderCount),
          }
        : null,
      ordersByType: TYPE_ORDER.map((type) => ({
        type,
        count: typeAgg.get(type)?.count ?? 0,
        revenue: typeAgg.get(type)?.revenue ?? 0,
      })),
      revenueByBrand: brands.map((brand) => ({
        brandSlug: brand.slug,
        brandName: brand.name,
        revenue: brandAgg.get(brand.slug)?.revenue ?? 0,
        itemsSold: brandAgg.get(brand.slug)?.itemsSold ?? 0,
      })),
      revenueTrend:
        granularity === "day" && start ? fillDailyTrend(bucketAgg, start, end) : sortedTrend(bucketAgg),
      granularity,
      ordersByHour: hourCounts.map((count, hour) => ({ hour, count })),
      topItems: Array.from(itemAgg.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
      rejections: {
        count: rejectedCount,
        rate: orders.length ? rejectedCount / orders.length : 0,
        topReasons: Array.from(rejectionReasons.entries())
          .map(([reason, count]) => ({ reason, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      },
      offers: {
        ordersWithOffer,
        totalDiscount,
        topCodes: Array.from(offerCodeAgg.entries())
          .map(([code, agg]) => ({ code, ...agg }))
          .sort((a, b) => b.uses - a.uses)
          .slice(0, 5),
      },
      customers: {
        uniqueCustomers,
        repeatCustomers,
        repeatRate: uniqueCustomers ? repeatCustomers / uniqueCustomers : 0,
      },
      tableSessions: { openCount: openSessionCount, avgSessionMinutes },
    };
  },
});

export type OrdersReportRowDTO = {
  id: string;
  createdAt: string;
  type: OrderType;
  tableNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
  items: { name: string; quantity: number; brandSlug: string }[];
  brandSlugs: string[];
  specialNotes: string | null;
  rejectionReason: string | null;
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  offerCode: string | null;
};

export type OrdersReportDTO = {
  rows: OrdersReportRowDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: { totalRevenue: number; totalOrders: number };
};

/**
 * The reporting table behind the dashboard: full order history (unlike the
 * control board's live queues, nothing here ever drops off), with the
 * filter/sort/paginate combination a reporting view needs. Filtered
 * server-side rather than the fetch-all-then-`.filter()` pattern the rest of
 * the control board uses — order history is unbounded and only grows.
 */
export const getOrdersReport = defineAction({
  auth: "admin",
  schema: ordersReportSchema,
  handler: async (input): Promise<OrdersReportDTO> => {
    const where: Prisma.OrderWhereInput = {};

    if (input.type !== "ALL") where.type = input.type;
    if (input.brandSlug !== "ALL") where.items = { some: { brandSlug: input.brandSlug } };

    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (input.from) createdAtFilter.gte = parseISODate(input.from);
    if (input.to) createdAtFilter.lt = addDays(parseISODate(input.to), 1);
    if (Object.keys(createdAtFilter).length) where.createdAt = createdAtFilter;

    const totalPriceFilter: Prisma.DecimalFilter = {};
    if (input.minTotal !== undefined) totalPriceFilter.gte = input.minTotal;
    if (input.maxTotal !== undefined) totalPriceFilter.lte = input.maxTotal;
    if (Object.keys(totalPriceFilter).length) where.totalPrice = totalPriceFilter;

    const search = input.search?.trim();
    if (search) {
      const orConditions: Prisma.OrderWhereInput[] = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { offerCode: { contains: search, mode: "insensitive" } },
      ];
      if (/^[0-9a-f-]{4,36}$/i.test(search)) orConditions.push({ id: { startsWith: search } });
      where.OR = orConditions;
    }

    const [total, orders, revenueAgg] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: { select: { name: true, quantity: true, brandSlug: true } },
          tableSession: { select: { table: { select: { number: true } } } },
        },
        orderBy: { [input.sortBy]: input.sortDir },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      prisma.order.aggregate({ where, _sum: { totalPrice: true }, _count: { _all: true } }),
    ]);

    const rows: OrdersReportRowDTO[] = orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      type: order.type,
      tableNumber: order.tableSession?.table.number ?? null,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      items: order.items,
      brandSlugs: Array.from(new Set(order.items.map((item) => item.brandSlug))),
      specialNotes: order.specialNotes,
      rejectionReason: order.rejectionReason,
      subtotal: order.subtotal.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      totalPrice: order.totalPrice.toNumber(),
      offerCode: order.offerCode,
    }));

    return {
      rows,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
      summary: {
        totalRevenue: revenueAgg._sum.totalPrice?.toNumber() ?? 0,
        totalOrders: revenueAgg._count._all,
      },
    };
  },
});
