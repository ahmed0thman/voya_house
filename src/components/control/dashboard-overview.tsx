"use client";

import { useState } from "react";
import {
  WalletIcon,
  ReceiptIcon,
  TicketPercentIcon,
  CircleSlashIcon,
  UsersRoundIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArmchairIcon,
} from "lucide-react";
import { useBusinessDashboard } from "@/hooks/use-reports";
import type { DashboardRangeInput } from "@/lib/validations/reports";
import { OrdersReportTable } from "./orders-report-table";
import { TrendAreaChart, CategoryBarChart, RankedBarChart, RankedPieChart } from "./charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatPrice } from "@/constants/config";
import type { LucideIcon } from "lucide-react";

const RANGE_PRESETS: { value: DashboardRangeInput["preset"]; label: string }[] =
  [
    { value: "today", label: "Today" },
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
    { value: "all", label: "All time" },
    { value: "custom", label: "Custom" },
  ];

const TYPE_LABEL: Record<string, string> = {
  ON_TABLE: "Dine-in",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};
/** Each house's own identity color — same values as the public-facing brand badges (see CartSheet's BRAND_CONFIG). */
const BRAND_COLOR: Record<string, string> = {
  coffee: "#F1E6C3",
  papa: "#B7D39A",
  mama: "#D8A98F",
};
function formatCompact(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPct(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function bucketLabel(
  bucket: string,
  granularity: "day" | "week" | "month",
): string {
  if (granularity === "month") {
    const [year, month] = bucket.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
      undefined,
      { month: "short" },
    );
  }
  const date = new Date(`${bucket}T00:00:00.000Z`);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function TrendTile({
  label,
  value,
  icon: Icon,
  changePct,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  changePct?: number | null;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {changePct != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                changePct >= 0
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-destructive"
              }`}
            >
              {changePct >= 0 ? (
                <TrendingUpIcon className="size-3" />
              ) : (
                <TrendingDownIcon className="size-3" />
              )}
              {formatPct(changePct)} vs prior period
            </span>
          )}
        </div>
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}

function BusinessOverview() {
  const [preset, setPreset] = useState<DashboardRangeInput["preset"]>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range: DashboardRangeInput =
    preset === "custom"
      ? { preset, from: customFrom || undefined, to: customTo || undefined }
      : { preset };

  const { data, isLoading, isError } = useBusinessDashboard(range);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_PRESETS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={preset === option.value ? "default" : "outline"}
            onClick={() => setPreset(option.value)}
          >
            {option.label}
          </Button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="w-36"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="w-36"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-21.5 rounded-xl" />
          ))}
        </div>
      ) : isError || !data ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Couldn&apos;t load dashboard stats.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 ">
            <TrendTile
              label="Revenue"
              value={formatPrice(data.revenue.total)}
              icon={WalletIcon}
              changePct={data.previousPeriod?.revenueChangePct}
            />
            <TrendTile
              label="Orders"
              value={String(data.revenue.orderCount)}
              icon={ReceiptIcon}
              changePct={data.previousPeriod?.orderCountChangePct}
            />
            <TrendTile
              label="Avg. order value"
              value={formatPrice(data.revenue.averageOrderValue)}
              icon={TrendingUpIcon}
            />
            <TrendTile
              label="Discounts given"
              value={formatPrice(data.offers.totalDiscount)}
              icon={TicketPercentIcon}
            />
            <TrendTile
              label="Rejection rate"
              value={`${(data.rejections.rate * 100).toFixed(1)}%`}
              icon={CircleSlashIcon}
            />
            <TrendTile
              label="Repeat customers"
              value={`${data.customers.repeatCustomers} / ${data.customers.uniqueCustomers}`}
              icon={UsersRoundIcon}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue trend</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendAreaChart
                data={data.revenueTrend.map((point) => ({
                  label: bucketLabel(point.bucket, data.granularity),
                  value: point.revenue,
                }))}
                formatValue={formatPrice}
                seriesLabel="Revenue"
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by house</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedPieChart
                  data={data.revenueByBrand.map((brand) => ({
                    label: brand.brandName,
                    sublabel: `${brand.itemsSold} sold`,
                    value: brand.revenue,
                    color: BRAND_COLOR[brand.brandSlug],
                  }))}
                  formatValue={formatPrice}
                  centerLabel={{
                    value: formatCompact(data.revenueByBrand.reduce((sum, b) => sum + b.revenue, 0)),
                    caption: "Revenue",
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders by type</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedPieChart
                  data={data.ordersByType.map((entry) => ({
                    label: TYPE_LABEL[entry.type] ?? entry.type,
                    sublabel: formatPrice(entry.revenue),
                    value: entry.count,
                  }))}
                  formatValue={(v) => `${v} orders`}
                  centerLabel={{
                    value: String(data.ordersByType.reduce((sum, t) => sum + t.count, 0)),
                    caption: "Orders",
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders by hour</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBarChart
                  data={data.ordersByHour.map((entry) => ({
                    label: `${entry.hour}h`,
                    value: entry.count,
                  }))}
                  formatValue={(v) => `${v} orders`}
                  seriesLabel="Orders"
                  color="var(--chart-2)"
                  tickInterval={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top selling items</CardTitle>
              </CardHeader>
              <CardContent>
                <RankedBarChart
                  data={data.topItems.map((item) => ({
                    label: item.name,
                    sublabel: `${item.quantitySold}× · ${item.brandSlug}`,
                    value: item.revenue,
                  }))}
                  formatValue={formatPrice}
                  seriesLabel="Revenue"
                  emptyLabel="No items sold in this range."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rejections &amp; offers</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Top rejection reasons
                  </p>
                  <RankedBarChart
                    data={data.rejections.topReasons.map((reason) => ({
                      label: reason.reason,
                      value: reason.count,
                    }))}
                    formatValue={(v) => String(v)}
                    seriesLabel="Rejections"
                    emptyLabel="No rejections in this range."
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Top offer codes
                  </p>
                  <RankedBarChart
                    data={data.offers.topCodes.map((code) => ({
                      label: code.code,
                      sublabel: formatPrice(code.totalDiscount),
                      value: code.uses,
                    }))}
                    formatValue={(v) => `${v} uses`}
                    seriesLabel="Uses"
                    emptyLabel="No offer codes used in this range."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <ArmchairIcon className="size-4 text-muted-foreground" />
                <span className="font-medium">
                  {data.tableSessions.openCount}
                </span>
                <span className="text-muted-foreground">
                  tables open right now
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Avg. visit length:
                </span>
                <span className="font-medium">
                  {data.tableSessions.avgSessionMinutes != null
                    ? `${data.tableSessions.avgSessionMinutes} min`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Unique customers:</span>
                <span className="font-medium">
                  {formatCompact(data.customers.uniqueCustomers)}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export function DashboardOverview() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="reports">Order reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-6">
        <BusinessOverview />
      </TabsContent>
      <TabsContent value="reports" className="mt-6">
        <OrdersReportTable />
      </TabsContent>
    </Tabs>
  );
}
