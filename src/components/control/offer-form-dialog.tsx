"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useCreateOffer, useUpdateOffer } from "@/hooks/use-offers";
import { discountTypeSchema } from "@/lib/validations/offer";
import type { OfferDTO } from "@/server/actions/offers";

const DISCOUNT_TYPE_OPTIONS: { value: z.infer<typeof discountTypeSchema>; label: string }[] = [
  { value: "PERCENT", label: "Percent off" },
  { value: "FIXED", label: "Fixed amount off" },
];

const DISCOUNT_TYPE_LABEL = Object.fromEntries(
  DISCOUNT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<z.infer<typeof discountTypeSchema>, string>;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Local form schema — the date input gives a string; converted to Date at submit time. */
const formSchema = z
  .object({
    code: z.string().trim().min(3, "Code must be at least 3 characters").max(30),
    name: z.string().trim().max(120, "Name is too long").optional(),
    description: z.string().trim().max(500, "Description is too long").optional(),
    discountType: discountTypeSchema,
    discountValue: z.number().positive("Must be greater than 0"),
    validFrom: z.string().min(1, "Required"),
    validDays: z.number().int().positive("Must be at least 1 day"),
  })
  .refine((data) => data.discountType !== "PERCENT" || data.discountValue <= 100, {
    message: "A percent discount can't exceed 100",
    path: ["discountValue"],
  });
type FormValues = z.infer<typeof formSchema>;

type OfferFormDialogProps = { mode: "create" } | { mode: "edit"; offer: OfferDTO };

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

function daysBetween(fromIso: string, untilIso: string): number {
  const days = Math.round((new Date(untilIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY);
  return Math.max(1, days);
}

/**
 * Owns the actual form state. Mounted fresh (via `key`) every time the
 * dialog opens, so defaults always start clean — no effect-driven reset.
 */
function OfferFormFields({
  props,
  onClose,
}: {
  props: OfferFormDialogProps;
  onClose: () => void;
}) {
  const isEdit = props.mode === "edit";
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const isPending = createOffer.isPending || updateOffer.isPending;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          code: props.offer.code,
          name: props.offer.name ?? "",
          description: props.offer.description ?? "",
          discountType: props.offer.discountType,
          discountValue: props.offer.discountValue,
          validFrom: toDateInputValue(props.offer.validFrom),
          validDays: daysBetween(props.offer.validFrom, props.offer.validUntil),
        }
      : {
          code: "",
          name: "",
          description: "",
          discountType: "PERCENT",
          discountValue: 10,
          validFrom: toDateInputValue(new Date().toISOString()),
          validDays: 30,
        },
  });

  const discountType = useWatch({ control, name: "discountType" });

  const onSubmit = (values: FormValues) => {
    const validFrom = new Date(values.validFrom);
    const validUntil = new Date(validFrom.getTime() + values.validDays * MS_PER_DAY);

    const shared = {
      code: values.code,
      name: values.name,
      description: values.description,
      discountType: values.discountType,
      discountValue: values.discountValue,
      validFrom,
      validUntil,
    };

    if (isEdit) {
      updateOffer.mutate(
        { id: props.offer.id, ...shared, isActive: props.offer.isActive },
        {
          onSuccess: () => {
            toast.success("Offer updated");
            onClose();
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      createOffer.mutate(shared, {
        onSuccess: () => {
          toast.success("Offer created");
          onClose();
        },
        onError: (error) => toast.error(error.message),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="offer-code">Code</FieldLabel>
          <Input
            id="offer-code"
            placeholder="e.g. WELCOME10"
            className="uppercase placeholder:normal-case"
            {...register("code")}
          />
          <FieldError errors={[errors.code]} />
        </Field>

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="offer-name">Name</FieldLabel>
          <Input
            id="offer-name"
            placeholder="e.g. Welcome discount (optional)"
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="offer-description">Description</FieldLabel>
          <Textarea
            id="offer-description"
            rows={2}
            placeholder="Optional"
            {...register("description")}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <Field data-invalid={!!errors.discountType}>
          <FieldLabel htmlFor="offer-discount-type">Discount type</FieldLabel>
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="offer-discount-type" className="w-full">
                  <SelectValue placeholder="Select a type">
                    {(value: z.infer<typeof discountTypeSchema> | null) =>
                      value ? DISCOUNT_TYPE_LABEL[value] : "Select a type"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.discountType]} />
        </Field>

        <Field data-invalid={!!errors.discountValue}>
          <FieldLabel htmlFor="offer-discount-value">
            Discount value ({discountType === "PERCENT" ? "%" : "EGP"})
          </FieldLabel>
          <Input
            id="offer-discount-value"
            type="number"
            step="0.01"
            min="0"
            {...register("discountValue", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.discountValue]} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!errors.validFrom}>
            <FieldLabel htmlFor="offer-valid-from">Valid from</FieldLabel>
            <Input id="offer-valid-from" type="date" {...register("validFrom")} />
            <FieldError errors={[errors.validFrom]} />
          </Field>

          <Field data-invalid={!!errors.validDays}>
            <FieldLabel htmlFor="offer-valid-days">Valid for (days)</FieldLabel>
            <Input
              id="offer-valid-days"
              type="number"
              min="1"
              step="1"
              {...register("validDays", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.validDays]} />
          </Field>
        </div>
      </FieldGroup>

      <DialogFooter className="mt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create offer"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function OfferFormDialog(props: OfferFormDialogProps) {
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
            <span className="sr-only">Edit offer</span>
          </>
        ) : (
          <>
            <PlusIcon />
            <span>New offer</span>
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit offer" : "New offer"}</DialogTitle>
        </DialogHeader>
        <OfferFormFields key={formKey} props={props} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
