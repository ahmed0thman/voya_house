"use client";

import { useEffect, useState } from "react";
import { PrinterIcon, QrCodeIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { generateQrWithLogo } from "@/lib/qr-with-logo";

const PRINT_AREA_ID = "table-qr-print-area";

export function TableQrDialog({ number }: { number: number }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const url = new URL("/", window.location.origin);
    url.searchParams.set("table", String(number));

    let cancelled = false;
    generateQrWithLogo(url.toString())
      .then((generated) => {
        if (!cancelled) setDataUrl(generated);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open, number]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setDataUrl(null);
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <QrCodeIcon />
        <span className="sr-only">Table {number} QR code</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Table {number} QR code</DialogTitle>
        </DialogHeader>

        <div
          id={PRINT_AREA_ID}
          className="flex flex-col items-center gap-3 rounded-lg border bg-white py-6"
        >
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image can't optimize it
            <img
              src={dataUrl}
              alt={`QR code linking to table ${number}`}
              className="size-56"
              width={512}
              height={512}
            />
          ) : (
            <div className="flex size-56 items-center justify-center text-sm text-muted-foreground">
              Generating…
            </div>
          )}
          <p className="text-lg font-semibold text-black">Table {number}</p>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            #${PRINT_AREA_ID}, #${PRINT_AREA_ID} * { visibility: visible; }
            #${PRINT_AREA_ID} {
              position: fixed;
              inset: 0;
              border: none;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
          }
        `}</style>

        <DialogFooter>
          <Button variant="outline" disabled={!dataUrl} onClick={() => window.print()}>
            <PrinterIcon />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
