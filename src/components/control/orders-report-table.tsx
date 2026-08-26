"use client";

import { useEffect, useState } from "react";
import {
  SearchIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ReceiptTextIcon,
} from "lucide-react";
import { useOrdersReport } from "@/hooks/use-reports";
import { useBrands } from "@/hooks/use-brands";
import type { OrdersReportInput } from "@/lib/validations/reports";
import type { OrdersReportRowDTO } from "@/server/actions/reports";
import { formatPrice } from "@/constants/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Status = OrdersReportRowDTO["status"];
type OrderType = OrdersReportRowDTO["type"];

const STATUS_LABEL: Record<Status, string> = {
  RECEIVED: "Received",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
  REJECTED: "Rejected",
};

const STATUS_BADGE_VARIANT: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  RECEIVED: "secondary",
  PREPARING: "default",
  READY: "default",
  SERVED: "outline",
  REJECTED: "destructive",
};

const TYPE_LABEL: Record<OrderType, string> = {
  ON_TABLE: "Dine-in",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};

const DEFAULT_FILTERS: OrdersReportInput = {
  page: 1,
  pageSize: 25,
  search: "",
  status: "ALL",
  type: "ALL",
  brandSlug: "ALL",
  sortBy: "createdAt",
  sortDir: "desc",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return null;
  return dir === "asc" ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />;
}

export function OrdersReportTable() {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<OrdersReportInput>(DEFAULT_FILTERS);
  const [selectedOrder, setSelectedOrder] = useState<OrdersReportRowDTO | null>(null);
  const { data: brands } = useBrands();

  // Debounced so free typing doesn't fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => (prev.search === searchInput ? prev : { ...prev, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const { data, isLoading, isError, isFetching } = useOrdersReport(filters);

  function updateFilter<K extends keyof OrdersReportInput>(key: K, value: OrdersReportInput[K]) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

  function toggleSort(column: "createdAt" | "totalPrice") {
    setFilters((prev) =>
      prev.sortBy === column
        ? { ...prev, sortDir: prev.sortDir === "asc" ? "desc" : "asc", page: 1 }
        : { ...prev, sortBy: column, sortDir: "desc", page: 1 },
    );
  }

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status !== "ALL" ||
      filters.type !== "ALL" ||
      filters.brandSlug !== "ALL" ||
      filters.from ||
      filters.to ||
      filters.minTotal !== undefined ||
      filters.maxTotal !== undefined,
  );

  function clearFilters() {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, order # or code…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) => updateFilter("status", value as OrdersReportInput["status"])}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {(Object.entries(STATUS_LABEL) as [Status, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(value) => updateFilter("type", value as OrdersReportInput["type"])}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {(Object.entries(TYPE_LABEL) as [OrderType, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.brandSlug}
          onValueChange={(value) => value && updateFilter("brandSlug", value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="House" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All houses</SelectItem>
            {brands?.map((brand) => (
              <SelectItem key={brand.id} value={brand.slug}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={filters.from ?? ""}
            onChange={(event) => updateFilter("from", event.target.value)}
            className="w-36"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={filters.to ?? ""}
            onChange={(event) => updateFilter("to", event.target.value)}
            className="w-36"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.minTotal ?? ""}
            onChange={(event) =>
              updateFilter("minTotal", event.target.value ? Number(event.target.value) : undefined)
            }
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.maxTotal ?? ""}
            onChange={(event) =>
              updateFilter("maxTotal", event.target.value ? Number(event.target.value) : undefined)
            }
            className="w-20"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <XIcon /> Clear filters
          </Button>
        )}
      </div>

      {data && (
        <p className="text-sm text-muted-foreground">
          {data.total} order{data.total === 1 ? "" : "s"}
          {hasActiveFilters ? " match your filters" : " total"} · Revenue{" "}
          {formatPrice(data.summary.totalRevenue)}
        </p>
      )}

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <p className="p-6 text-center text-sm text-destructive">Couldn&apos;t load the report.</p>
        ) : data.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <ReceiptTextIcon className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">No orders match these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                    <span className="inline-flex items-center gap-1">
                      Date <SortIcon active={filters.sortBy === "createdAt"} dir={filters.sortDir} />
                    </span>
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Houses</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead
                    className="cursor-pointer text-right select-none"
                    onClick={() => toggleSort("totalPrice")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Total <SortIcon active={filters.sortBy === "totalPrice"} dir={filters.sortDir} />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customerName ?? "—"}</span>
                        {order.customerPhone && (
                          <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {TYPE_LABEL[order.type]}
                      {order.tableNumber != null && (
                        <span className="text-muted-foreground"> · #{order.tableNumber}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.brandSlugs.map((slug) => (
                          <Badge key={slug} variant="outline">
                            {slug}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{order.items.length}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatPrice(order.totalPrice)}
                      {order.discountAmount > 0 && (
                        <div className="text-xs font-normal text-muted-foreground">
                          −{formatPrice(order.discountAmount)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {data.page} of {data.totalPages}
            {isFetching ? " · updating…" : ""}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={data.page <= 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order details</DialogTitle>
                <DialogDescription>
                  {formatDateTime(selectedOrder.createdAt)} · {TYPE_LABEL[selectedOrder.type]}
                  {selectedOrder.tableNumber != null ? ` · Table ${selectedOrder.tableNumber}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>
                    {selectedOrder.customerName ?? "—"}
                    {selectedOrder.customerPhone ? ` · ${selectedOrder.customerPhone}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={STATUS_BADGE_VARIANT[selectedOrder.status]}>
                    {STATUS_LABEL[selectedOrder.status]}
                  </Badge>
                </div>
                {selectedOrder.rejectionReason && (
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0 text-muted-foreground">Rejection reason</span>
                    <span className="text-right">{selectedOrder.rejectionReason}</span>
                  </div>
                )}
                <div className="rounded-lg border">
                  <Table>
                    <TableBody>
                      {selectedOrder.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {item.quantity}× {item.name}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.brandSlug}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount{selectedOrder.offerCode ? ` (${selectedOrder.offerCode})` : ""}</span>
                    <span>−{formatPrice(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(selectedOrder.totalPrice)}</span>
                </div>
                {selectedOrder.specialNotes && (
                  <div className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                    {selectedOrder.specialNotes}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
