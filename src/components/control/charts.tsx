"use client";

/**
 * Tiny dependency-free chart primitives (div/CSS based, not SVG or a charting
 * library) — this app carries no chart package, and these two shapes cover
 * everything the dashboard needs: a trend over time, and a ranked breakdown.
 */

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export function BarTrendChart({
  data,
  formatValue = (value) => String(value),
  labelEvery = 1,
  color = "var(--chart-1)",
}: {
  data: { label: string; value: number }[];
  formatValue?: (value: number) => string;
  labelEvery?: number;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No data for this range.
      </p>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-36 items-end gap-1">
        {data.map((point, i) => (
          <div
            key={i}
            className="group relative flex h-full flex-1 items-end justify-center"
            title={`${point.label}: ${formatValue(point.value)}`}
          >
            <div
              className="w-full rounded-t-sm transition-[height]"
              style={{
                height: point.value > 0 ? `${Math.max((point.value / max) * 100, 2)}%` : "1px",
                backgroundColor: point.value > 0 ? color : "var(--border)",
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        {data.map((point, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
            {i % labelEvery === 0 ? point.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RankedBarList({
  items,
  formatValue = (value) => String(value),
  emptyLabel = "No data yet.",
}: {
  items: { label: string; sublabel?: string; value: number; color?: string }[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">
              {item.label}
              {item.sublabel && (
                <span className="ml-1.5 font-normal text-muted-foreground">{item.sublabel}</span>
              )}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width]"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color ?? chartColor(i),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
