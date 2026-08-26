"use client";

/**
 * Dashboard chart building blocks — shadcn's chart primitive (`ui/chart.tsx`)
 * over Recharts, picked per data shape: a value trending over time gets an
 * area chart, a fixed set of categories (hour of day) gets a vertical bar
 * chart, and a ranked breakdown of a handful of named items (brands, top
 * items, rejection reasons…) gets a horizontal bar chart.
 */

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function ChartEmptyState({ label = "No data for this range." }: { label?: string }) {
  return <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">{label}</p>;
}

/** Renders a tooltip row as "name — formatted value", matching the app's own number formatting (currency, counts, …). */
function valueFormatter(formatValue: (value: number) => string) {
  return function TooltipValueRow(value: unknown, name: unknown) {
    return (
      <div className="flex w-full items-center justify-between gap-4">
        <span className="text-muted-foreground">{String(name)}</span>
        <span className="shrink-0 font-mono font-medium tabular-nums text-foreground">
          {formatValue(Number(value))}
        </span>
      </div>
    );
  };
}

/** A single value trending over time — e.g. revenue per day/week/month. */
export function TrendAreaChart({
  data,
  formatValue = (value) => String(value),
  color = "var(--chart-1)",
  seriesLabel = "Value",
}: {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  color?: string;
  seriesLabel?: string;
}) {
  if (data.length === 0) return <ChartEmptyState />;

  const config = { value: { label: seriesLabel, color } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12 }}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.7} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" formatter={valueFormatter(formatValue)} />}
        />
        <Area dataKey="value" type="monotone" fill="url(#trend-fill)" stroke="var(--color-value)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  );
}

/**
 * A value across a fixed, ordered set of categories — e.g. orders by hour of day.
 *
 * `data[].label` must be unique per entry (it's the axis's categorical domain key) —
 * blanking it out to thin the tick labels collapses same-labeled bars onto one
 * x-position in Recharts' band scale, so the visible bar stops matching the
 * hovered tooltip. Use `tickInterval` to thin the *displayed* ticks instead.
 */
export function CategoryBarChart({
  data,
  formatValue = (value) => String(value),
  color = "var(--chart-2)",
  seriesLabel = "Value",
  tickInterval = 0,
}: {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  color?: string;
  seriesLabel?: string;
  /** Recharts XAxis `interval`: 0 shows every tick, N shows one tick every N+1. */
  tickInterval?: number;
}) {
  if (data.length === 0) return <ChartEmptyState />;

  const config = { value: { label: seriesLabel, color } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: 0, right: 12, top: 16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={tickInterval} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={valueFormatter(formatValue)} />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4}>
          <LabelList
            dataKey="value"
            position="top"
            className="fill-foreground text-[10px]"
            formatter={(value) => (Number(value) > 0 ? String(value) : "")}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/** A ranked breakdown across a handful of named items — e.g. revenue by house, top-selling items. */
export function RankedBarChart({
  data,
  formatValue = (value) => String(value),
  color = "var(--chart-1)",
  seriesLabel = "Value",
  emptyLabel = "No data yet.",
}: {
  data: { label: string; value: number; sublabel?: string }[];
  formatValue?: (value: number) => string;
  color?: string;
  seriesLabel?: string;
  emptyLabel?: string;
}) {
  if (data.length === 0) return <ChartEmptyState label={emptyLabel} />;

  const config = { value: { label: seriesLabel, color } } satisfies ChartConfig;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(90, data.length * 38) }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 32, top: 4, bottom: 4 }}>
        <XAxis type="number" hide domain={[0, max]} />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={128}
          tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 17)}…` : value)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, _item, _index, payload) => {
                const row = payload as unknown as { label: string; sublabel?: string };
                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="truncate text-muted-foreground">
                      {row.label}
                      {row.sublabel ? ` · ${row.sublabel}` : ""}
                    </span>
                    <span className="shrink-0 font-mono font-medium tabular-nums text-foreground">
                      {formatValue(Number(value))}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4}>
          <LabelList
            dataKey="value"
            position="right"
            className="fill-foreground text-xs"
            formatter={(value) => formatValue(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/** A composition of a whole across a handful of named categories — e.g. revenue by house, orders by type. */
export function RankedPieChart({
  data,
  formatValue = (value) => String(value),
  centerLabel,
  emptyLabel = "No data yet.",
}: {
  data: { label: string; value: number; sublabel?: string; color?: string }[];
  formatValue?: (value: number) => string;
  centerLabel?: { value: string; caption: string };
  emptyLabel?: string;
}) {
  if (data.length === 0) return <ChartEmptyState label={emptyLabel} />;

  const chartData = data.map((item, i) => ({ ...item, fill: item.color ?? PIE_COLORS[i % PIE_COLORS.length] }));
  const config = data.reduce<ChartConfig>((acc, item, i) => {
    acc[item.label] = { label: item.label, color: item.color ?? PIE_COLORS[i % PIE_COLORS.length] };
    return acc;
  }, {});

  return (
    <ChartContainer config={config} className="mx-auto aspect-square max-h-64">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, _item, _index, payload) => {
                const row = payload as unknown as { label: string; sublabel?: string };
                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {row.label}
                      {row.sublabel ? ` · ${row.sublabel}` : ""}
                    </span>
                    <span className="shrink-0 font-mono font-medium tabular-nums text-foreground">
                      {formatValue(Number(value))}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={56} strokeWidth={4}>
          {centerLabel && (
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-lg font-semibold">
                      {centerLabel.value}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                      {centerLabel.caption}
                    </tspan>
                  </text>
                );
              }}
            />
          )}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="label" className="flex-wrap" />} />
      </PieChart>
    </ChartContainer>
  );
}
