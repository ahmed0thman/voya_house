"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, MailQuestionIcon } from "lucide-react";
import { useContactMessages } from "@/hooks/use-contact";
import type { ContactMessageRowDTO } from "@/server/actions/contact";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

const PAGE_SIZE = 20;

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ContactMessagesTable() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ContactMessageRowDTO | null>(null);
  const { data, isLoading, isError, isFetching } = useContactMessages({
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-medium">Messages</h2>
        <p className="text-sm text-muted-foreground">
          Everything submitted through the landing page&apos;s contact form.
        </p>
      </div>

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : isError || !data ? (
          <p className="p-6 text-center text-sm text-destructive">
            Couldn&apos;t load messages.
          </p>
        ) : data.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <MailQuestionIcon className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="w-px" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(row.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email}</TableCell>
                    <TableCell>
                      {row.subjectLabel ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {row.message}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelected(row)}
                      >
                        <EyeIcon />
                        <span className="sr-only">View message</span>
                      </Button>
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
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Message from {selected.name}</DialogTitle>
                <DialogDescription>{formatDateTime(selected.createdAt)}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">Email</span>
                  <span className="text-end">{selected.email}</span>
                </div>
                {selected.subjectLabel && (
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0 text-muted-foreground">Subject</span>
                    <span className="text-end">
                      {selected.subjectLabel}
                      {selected.subjectLabelAr ? ` · ${selected.subjectLabelAr}` : ""}
                    </span>
                  </div>
                )}
                <div className="rounded-lg bg-muted p-3 whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
