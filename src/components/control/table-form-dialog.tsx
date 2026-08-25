"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PencilIcon, PlusIcon } from "lucide-react";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useCreateTable, useUpdateTable } from "@/hooks/use-tables";
import type { TableDTO } from "@/server/actions/tables";

const formSchema = z.object({
  number: z.number().int().positive("Must be a positive number").max(999),
  label: z.string().trim().max(60, "Label is too long").optional(),
});
type FormValues = z.infer<typeof formSchema>;

type TableFormDialogProps = { mode: "create" } | { mode: "edit"; table: TableDTO };

/**
 * Owns the actual form state. Mounted fresh (via `key`) every time the
 * dialog opens, so defaults always start clean — no effect-driven reset.
 */
function TableFormFields({
  props,
  onClose,
}: {
  props: TableFormDialogProps;
  onClose: () => void;
}) {
  const isEdit = props.mode === "edit";
  const createTable = useCreateTable();
  const updateTable = useUpdateTable();
  const isPending = createTable.isPending || updateTable.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? { number: props.table.number, label: props.table.label ?? "" }
      : { number: 1, label: "" },
  });

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      updateTable.mutate(
        { id: props.table.id, ...values, isActive: props.table.isActive },
        {
          onSuccess: () => {
            toast.success("Table updated");
            onClose();
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      createTable.mutate(
        { number: values.number, label: values.label },
        {
          onSuccess: () => {
            toast.success("Table created");
            onClose();
          },
          onError: (error) => toast.error(error.message),
        },
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-invalid={!!errors.number}>
          <FieldLabel htmlFor="table-number">Table number</FieldLabel>
          <Input
            id="table-number"
            type="number"
            min="1"
            step="1"
            {...register("number", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.number]} />
        </Field>

        <Field data-invalid={!!errors.label}>
          <FieldLabel htmlFor="table-label">Label</FieldLabel>
          <Input id="table-label" placeholder="e.g. Patio 3 (optional)" {...register("label")} />
          <FieldError errors={[errors.label]} />
        </Field>
      </FieldGroup>

      <DialogFooter className="mt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create table"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TableFormDialog(props: TableFormDialogProps) {
  const isEdit = props.mode === "edit";
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
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button size="sm" />
          )
        }
      >
        {isEdit ? (
          <>
            <PencilIcon />
            <span className="sr-only">Edit table</span>
          </>
        ) : (
          <>
            <PlusIcon />
            <span>New table</span>
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit table" : "New table"}</DialogTitle>
        </DialogHeader>
        <TableFormFields key={formKey} props={props} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
