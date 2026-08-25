"use client";

import {
  LayoutGridIcon,
  PackageIcon,
  CircleCheckIcon,
  CircleOffIcon,
  ImageOffIcon,
  WalletIcon,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-stats";
import { StatTile } from "./stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/constants/config";

export function DashboardOverview() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[74px] rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Couldn&apos;t load dashboard stats.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Categories" value={String(stats.totalCategories)} icon={LayoutGridIcon} />
        <StatTile label="Items" value={String(stats.totalItems)} icon={PackageIcon} />
        <StatTile label="Available" value={String(stats.availableItems)} icon={CircleCheckIcon} />
        <StatTile label="Unavailable" value={String(stats.unavailableItems)} icon={CircleOffIcon} />
        <StatTile
          label="Missing photos"
          value={String(stats.itemsWithoutImages)}
          icon={ImageOffIcon}
        />
        <StatTile label="Avg. price" value={formatPrice(stats.averagePrice)} icon={WalletIcon} />
      </div>

      <div className="rounded-xl border">
        <div className="border-b p-4">
          <h2 className="font-medium">By house</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>House</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.perBrand.map((brand) => (
              <TableRow key={brand.brandId}>
                <TableCell className="font-medium">{brand.brandName}</TableCell>
                <TableCell>{brand.categoryCount}</TableCell>
                <TableCell>{brand.itemCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Total catalog value (sum of all item prices): {formatPrice(stats.totalCatalogValue)}
      </p>
    </div>
  );
}
