"use client";

import { toast } from "sonner";
import { TicketPercentIcon } from "lucide-react";
import { useOffers, useDeleteOffer, useUpdateOffer } from "@/hooks/use-offers";
import { OfferFormDialog } from "./offer-form-dialog";
import { DeleteConfirmButton } from "./delete-confirm-button";
import { Badge } from "@/components/ui/badge";
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
import { formatPrice } from "@/constants/config";
import type { OfferDTO } from "@/server/actions/offers";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDiscount(offer: OfferDTO): string {
  return offer.discountType === "PERCENT"
    ? `${offer.discountValue}% off`
    : `${formatPrice(offer.discountValue)} off`;
}

function formatValidRange(offer: OfferDTO): string {
  return `${DATE_FORMAT.format(new Date(offer.validFrom))} – ${DATE_FORMAT.format(new Date(offer.validUntil))}`;
}

/** Only meaningful while the offer is toggled on — the switch itself covers the off case. */
function getStatus(
  offer: OfferDTO,
): { label: string; variant: "default" | "outline" | "destructive" } | null {
  if (!offer.isActive) return null;

  const now = Date.now();
  if (now < new Date(offer.validFrom).getTime()) return { label: "Scheduled", variant: "outline" };
  if (now > new Date(offer.validUntil).getTime()) return { label: "Expired", variant: "destructive" };
  return { label: "Active", variant: "default" };
}

export function OffersTable() {
  const { data: offers, isLoading, isError } = useOffers();
  const deleteOffer = useDeleteOffer();
  const updateOffer = useUpdateOffer();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <OfferFormDialog mode="create" />
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
            Couldn&apos;t load offers.
          </p>
        ) : !offers?.length ? (
          <div className="flex flex-col items-center gap-3 p-16 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <TicketPercentIcon className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">No offer codes yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Valid</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => {
                const status = getStatus(offer);
                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                        {offer.code}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      {offer.name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDiscount(offer)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatValidRange(offer)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={offer.isActive}
                        onCheckedChange={(checked) =>
                          updateOffer.mutate(
                            {
                              id: offer.id,
                              code: offer.code,
                              name: offer.name ?? "",
                              description: offer.description ?? "",
                              discountType: offer.discountType,
                              discountValue: offer.discountValue,
                              validFrom: new Date(offer.validFrom),
                              validUntil: new Date(offer.validUntil),
                              isActive: checked,
                            },
                            { onError: (error) => toast.error(error.message) },
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {status ? (
                        <Badge variant={status.variant}>{status.label}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <OfferFormDialog mode="edit" offer={offer} />
                        <DeleteConfirmButton
                          title="Delete this offer?"
                          description={`"${offer.code}" will be permanently removed.`}
                          isPending={deleteOffer.isPending}
                          onConfirm={() =>
                            deleteOffer.mutate(
                              { id: offer.id },
                              { onError: (error) => toast.error(error.message) },
                            )
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
