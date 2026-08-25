"use client";

import { toast } from "sonner";
import { LayoutGridIcon } from "lucide-react";
import { useTables, useDeleteTable, useUpdateTable } from "@/hooks/use-tables";
import { TableFormDialog } from "./table-form-dialog";
import { TableBulkAddDialog } from "./table-bulk-add-dialog";
import { TableQrDialog } from "./table-qr-dialog";
import { DeleteConfirmButton } from "./delete-confirm-button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TablesTable() {
  const { data: tables, isLoading, isError } = useTables();
  const deleteTable = useDeleteTable();
  const updateTable = useUpdateTable();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <TableBulkAddDialog />
        <TableFormDialog mode="create" />
      </div>

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : isError ? (
          <p className="p-6 text-center text-sm text-destructive">
            Couldn&apos;t load tables.
          </p>
        ) : !tables?.length ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <LayoutGridIcon className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">No tables yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">Table {table.number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {table.label || "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={table.isActive}
                      onCheckedChange={(checked) =>
                        updateTable.mutate(
                          {
                            id: table.id,
                            number: table.number,
                            label: table.label ?? "",
                            isActive: checked,
                          },
                          { onError: (error) => toast.error(error.message) },
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <TableQrDialog number={table.number} />
                      <TableFormDialog mode="edit" table={table} />
                      <DeleteConfirmButton
                        title="Delete this table?"
                        description={`Table ${table.number} will be permanently removed.`}
                        isPending={deleteTable.isPending}
                        onConfirm={() =>
                          deleteTable.mutate(
                            { id: table.id },
                            { onError: (error) => toast.error(error.message) },
                          )
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
