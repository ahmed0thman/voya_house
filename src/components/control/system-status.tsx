"use client";

import { useSystemStatus } from "@/hooks/use-stats";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatGiB(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}

export function SystemStatus() {
  const { data, isLoading, isError } = useSystemStatus();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Couldn&apos;t load system status.
      </p>
    );
  }

  const { storage } = data;
  const usedFraction = storage.usedBytes != null ? storage.usedBytes / storage.maxBytes : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Database</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant={data.database.connected ? "secondary" : "destructive"}>
              {data.database.connected ? "Connected" : "Unreachable"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {data.database.brandCount} brand(s) configured
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Object storage (Cloudflare R2)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={storage.configured ? "secondary" : "outline"}>
                {storage.configured ? "Configured" : "Not configured"}
              </Badge>
              {storage.bucket && (
                <span className="font-mono text-xs text-muted-foreground">{storage.bucket}</span>
              )}
              {storage.configured && !storage.publicUrlConfigured && (
                <Badge variant="destructive">Public URL missing</Badge>
              )}
            </div>

            {storage.error && (
              <span className="text-xs text-destructive">{storage.error}</span>
            )}

            {usedFraction != null && storage.usedBytes != null && (
              <div className="flex flex-col gap-1.5">
                <Progress value={Math.min(100, usedFraction * 100)} />
                <span className="text-xs text-muted-foreground">
                  {formatGiB(storage.usedBytes)} / {formatGiB(storage.maxBytes)} used
                </span>
              </div>
            )}

            {!storage.configured && (
              <span className="text-xs text-muted-foreground">
                See README-BACKEND.md for setup steps.
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border">
        <div className="border-b p-4">
          <h2 className="font-medium">Houses</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.brands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {brand.slug}
                </TableCell>
                <TableCell>{brand.categoryCount}</TableCell>
                <TableCell>{brand.itemCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
