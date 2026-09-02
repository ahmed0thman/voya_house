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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { OfferBannerUploader } from "@/components/control/offer-banner-uploader";
import { useCreateOffer, useUpdateOffer } from "@/hooks/use-offers";
import { discountTypeSchema } from "@/lib/validations/offer";
import type { OfferBannerImageDTO, OfferDTO } from "@/server/actions/offers";

const DISCOUNT_TYPE_OPTIONS: {
  value: z.infer<typeof discountTypeSchema>;
  label: string;
}[] = [
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
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(30),
    name: z.string().trim().max(120, "Name is too long").optional(),
    description: z
      .string()
      .trim()
      .max(500, "Description is too long")
      .optional(),
    discountType: discountTypeSchema,
    discountValue: z.number().positive("Must be greater than 0"),
    validFrom: z.string().min(1, "Required"),
    validDays: z.number().int().positive("Must be at least 1 day"),
    showOnMenu: z.boolean(),
  })
  .refine(
    (data) => data.discountType !== "PERCENT" || data.discountValue <= 100,
    {
      message: "A percent discount can't exceed 100",
      path: ["discountValue"],
    },
  );
type FormValues = z.infer<typeof formSchema>;

type OfferFormDialogProps =
  | { mode: "create" }
  | { mode: "edit"; offer: OfferDTO };

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

function daysBetween(fromIso: string, untilIso: string): number {
  const days = Math.round(
    (new Date(untilIso).getTime() - new Date(fromIso).getTime()) / MS_PER_DAY,
  );
  return Math.max(1, days);
}

/**
 * Owns the actual form state. Mounted fresh (via `key`) every time the
 * dialog opens, so defaults always left clean — no effect-driven reset.
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

  const [bannerMobile, setBannerMobile] = useState<OfferBannerImageDTO | null>(
    isEdit ? props.offer.bannerImageMobile : null,
  );
  const [bannerDesktop, setBannerDesktop] =
    useState<OfferBannerImageDTO | null>(
      isEdit ? props.offer.bannerImageDesktop : null,
    );

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
          showOnMenu: props.offer.showOnMenu,
        }
      : {
          code: "",
          name: "",
          description: "",
          discountType: "PERCENT",
          discountValue: 10,
          validFrom: toDateInputValue(new Date().toISOString()),
          validDays: 30,
          showOnMenu: false,
        },
  });

  const discountType = useWatch({ control, name: "discountType" });

  const onSubmit = (values: FormValues) => {
    const validFrom = new Date(values.validFrom);
    const validUntil = new Date(
      validFrom.getTime() + values.validDays * MS_PER_DAY,
    );

    const shared = {
      code: values.code,
      name: values.name,
      description: values.description,
      discountType: values.discountType,
      discountValue: values.discountValue,
      validFrom,
      validUntil,
      showOnMenu: values.showOnMenu,
      bannerImageMobileKey: bannerMobile?.key ?? null,
      bannerImageDesktopKey: bannerDesktop?.key ?? null,
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
      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        <Field data-invalid={!!errors.description} className="col-span-full">
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

        <Field orientation="horizontal" className="col-span-full">
          <FieldLabel htmlFor="offer-show-on-menu">Feature on menu</FieldLabel>
          <Controller
            control={control}
            name="showOnMenu"
            render={({ field }) => (
              <Switch
                id="offer-show-on-menu"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </Field>
        <p className="-mt-2 text-xs text-muted-foreground col-span-full">
          Shows this offer&apos;s banner at the top of the public menu. Only one
          offer can be featured at a time — turning this on unfeatures any other
          offer.
        </p>

        <div className="col-span-full">
          <OfferBannerUploader
            label="Mobile banner"
            hint="Short, wide banner for the mobile menu — roughly 3:1 (e.g. 900×300px)."
            image={bannerMobile}
            onChange={setBannerMobile}
            aspectClassName="aspect-3/1"
          />
        </div>
        <div className="col-span-full">
          <OfferBannerUploader
            label="Desktop banner"
            hint="Even wider, shorter banner for the desktop menu — roughly 8:1 (e.g. 1600×200px)."
            image={bannerDesktop}
            onChange={setBannerDesktop}
            aspectClassName="aspect-[8/1]"
          />
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit offer" : "New offer"}</DialogTitle>
        </DialogHeader>
        <OfferFormFields
          key={formKey}
          props={props}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
