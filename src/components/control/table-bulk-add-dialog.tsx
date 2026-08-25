"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ListPlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useCreateTablesRange } from "@/hooks/use-tables";

const formSchema = z
  .object({
    start: z.number().int().positive("Must be a positive number").max(999),
    end: z.number().int().positive("Must be a positive number").max(999),
  })
  .refine((data) => data.end >= data.start, {
    message: "End must be greater than or equal to start",
    path: ["end"],
  })
  .refine((data) => data.end - data.start + 1 <= 200, {
    message: "Range is too large — 200 tables max at once",
    path: ["end"],
  });
type FormValues = z.infer<typeof formSchema>;

/**
 * Owns the actual form state. Mounted fresh (via `key`) every time the
 * dialog opens, so defaults always start clean — no effect-driven reset.
 */
function BulkAddTablesFields({ onClose }: { onClose: () => void }) {
  const createTablesRange = useCreateTablesRange();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { start: 1, end: 10 },
  });

  const onSubmit = (values: FormValues) => {
    createTablesRange.mutate(values, {
      onSuccess: ({ created, skipped }) => {
        if (created.length > 0) {
          toast.success(
            skipped.length > 0
              ? `Created ${created.length} table(s) — ${skipped.length} already existed and were skipped.`
              : `Created ${created.length} table(s).`,
          );
        } else {
          toast.info("All tables in that range already exist — nothing to create.");
        }
        onClose();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!errors.start}>
            <FieldLabel htmlFor="table-range-start">Start</FieldLabel>
            <Input
              id="table-range-start"
              type="number"
              min="1"
              step="1"
              {...register("start", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.start]} />
          </Field>

          <Field data-invalid={!!errors.end}>
            <FieldLabel htmlFor="table-range-end">End</FieldLabel>
            <Input
              id="table-range-end"
              type="number"
              min="1"
              step="1"
              {...register("end", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.end]} />
          </Field>
        </div>
        <FieldDescription>
          Creates every table number in this range. Numbers that already exist are skipped, not
          overwritten.
        </FieldDescription>
      </FieldGroup>

      <DialogFooter className="mt-4">
        <Button type="submit" disabled={createTablesRange.isPending}>
          {createTablesRange.isPending ? "Creating…" : "Create tables"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TableBulkAddDialog() {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <ListPlusIcon />
        <span>Add range</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a range of tables</DialogTitle>
        </DialogHeader>
        <BulkAddTablesFields key={formKey} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
