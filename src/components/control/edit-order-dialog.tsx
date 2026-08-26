"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MinusIcon, PencilIcon, PlusIcon, SearchIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useEditOrder, useOrderableItems } from "@/hooks/use-orders";
import { formatPrice } from "@/constants/config";
import type { OrderDTO } from "@/server/actions/orders";
import type { OrderableItemDTO } from "@/server/actions/items";

/** A line being edited. `price` is what the guest will actually be charged for it. */
type DraftLine = { itemId: string; name: string; price: number; quantity: number };

function toDraftLines(order: OrderDTO): DraftLine[] {
  return order.items
    .filter((item) => item.catalogItemId)
    .map((item) => ({
      itemId: item.catalogItemId!,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));
}

function EditOrderForm({ order, onDone }: { order: OrderDTO; onDone: () => void }) {
  const edit = useEditOrder();
  const { data: menu = [], isLoading: menuLoading } = useOrderableItems(true);

  const [lines, setLines] = useState<DraftLine[]>(() => toDraftLines(order));
  const [name, setName] = useState(order.customerName ?? "");
  const [phone, setPhone] = useState(order.customerPhone ?? "");
  const [birthday, setBirthday] = useState(order.customerBirthday ?? "");
  const [address, setAddress] = useState(order.deliveryAddress ?? "");
  const [notes, setNotes] = useState(order.specialNotes ?? "");
  const [search, setSearch] = useState("");

  // A line whose menu item has since been deleted can't be re-linked on save.
  const orphanCount = order.items.length - toDraftLines(order).length;

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return menu.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 8);
  }, [menu, search]);

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  // Mirrors the server: a percentage rescales with the bill, a fixed amount is
  // capped by it. Indicative only — the server recomputes from the offer itself.
  const discount = order.discountAmount
    ? order.subtotal > 0
      ? Math.min((order.discountAmount / order.subtotal) * subtotal, subtotal)
      : 0
    : 0;

  function setQuantity(itemId: string, quantity: number) {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.itemId !== itemId)
        : current.map((line) => (line.itemId === itemId ? { ...line, quantity } : line)),
    );
  }

  function addItem(item: OrderableItemDTO) {
    setLines((current) => {
      const existing = current.find((line) => line.itemId === item.id);
      if (existing) {
        return current.map((line) =>
          line.itemId === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...current, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
    setSearch("");
  }

  function save() {
    if (lines.length === 0) {
      toast.error("An order needs at least one item — reject the ticket instead.");
      return;
    }
    edit.mutate(
      {
        id: order.id,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerBirthday: birthday || undefined,
        deliveryAddress: order.type === "DELIVERY" ? address.trim() : undefined,
        specialNotes: notes.trim(),
        items: lines.map((line) => ({ itemId: line.itemId, quantity: line.quantity })),
      },
      {
        onSuccess: () => {
          toast.success("Ticket updated — the guest will see the change.");
          onDone();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Items</span>

          {orphanCount > 0 && (
            <p className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
              <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
              {orphanCount} line{orphanCount === 1 ? "" : "s"} reference a menu item that no longer
              exists and will be removed when you save.
            </p>
          )}

          {lines.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
              No items left — add one below, or cancel and reject the ticket instead.
            </p>
          ) : (
            <div className="divide-y rounded-md border">
              {lines.map((line) => (
                <div key={line.itemId} className="flex items-center gap-2 px-2.5 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm">{line.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatPrice(line.price * line.quantity)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      aria-label={`Decrease ${line.name}`}
                      onClick={() => setQuantity(line.itemId, line.quantity - 1)}
                    >
                      <MinusIcon />
                    </Button>
                    <span className="w-5 text-center font-mono text-xs">{line.quantity}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-7"
                      aria-label={`Increase ${line.name}`}
                      onClick={() => setQuantity(line.itemId, line.quantity + 1)}
                    >
                      <PlusIcon />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive hover:text-destructive"
                      aria-label={`Remove ${line.name}`}
                      onClick={() => setQuantity(line.itemId, 0)}
                    >
                      <XIcon />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={menuLoading ? "Loading menu…" : "Add an item — start typing"}
              className="pl-8"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{item.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.categoryTitle}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatPrice(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-0.5 rounded-md bg-muted/60 px-2.5 py-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount{order.offerCode ? ` (${order.offerCode})` : ""}</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>New total</span>
              <span>{formatPrice(subtotal - discount)}</span>
            </div>
          </div>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="edit-name">Customer name</FieldLabel>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-phone">Phone</FieldLabel>
            <Input id="edit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-birthday">Birthday (optional)</FieldLabel>
            <Input
              id="edit-birthday"
              type="date"
              value={birthday}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </Field>
          {order.type === "DELIVERY" && (
            <Field>
              <FieldLabel htmlFor="edit-address">Delivery address</FieldLabel>
              <Textarea
                id="edit-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="edit-notes">Kitchen notes</FieldLabel>
            <Textarea
              id="edit-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </FieldGroup>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="button" onClick={save} disabled={edit.isPending}>
          {edit.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function EditOrderDialog({ order }: { order: OrderDTO }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <PencilIcon />
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit ticket</DialogTitle>
          <DialogDescription>
            Change items or details after the customer called back, or when something is out of
            stock. The guest sees the update on their own order screen.
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so reopening always starts from the ticket as it stands now. */}
        {open && <EditOrderForm key={order.id} order={order} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
