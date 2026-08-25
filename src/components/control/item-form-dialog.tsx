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
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useCreateItem, useUpdateItem } from "@/hooks/use-items";
import { ItemImageUploader } from "./item-image-uploader";
import type { ItemDTO, ItemImageDTO } from "@/server/actions/items";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  description: z.string().trim().max(500, "Description is too long").optional(),
  price: z.number().positive("Price must be greater than 0"),
});
type FormValues = z.infer<typeof formSchema>;

type ItemFormDialogProps =
  | { mode: "create"; categoryId: string }
  | { mode: "edit"; item: ItemDTO };

/**
 * Owns the actual form state. Mounted fresh (via `key`) every time the
 * dialog opens, so `defaultValues` always reflect the current item — no
 * effect-driven reset needed.
 */
function ItemFormFields({
  props,
  onClose,
}: {
  props: ItemFormDialogProps;
  onClose: () => void;
}) {
  const isEdit = props.mode === "edit";
  const [images, setImages] = useState<ItemImageDTO[]>(
    isEdit ? props.item.images : [],
  );

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const isPending = createItem.isPending || updateItem.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: props.item.name,
          description: props.item.description ?? "",
          price: props.item.price,
        }
      : { name: "", description: "", price: 0 },
  });

  const onSubmit = (values: FormValues) => {
    const imageKeys = images.map((img) => img.key);

    if (isEdit) {
      updateItem.mutate(
        { id: props.item.id, ...values, images: imageKeys },
        {
          onSuccess: () => {
            toast.success("Item updated");
            onClose();
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      createItem.mutate(
        { categoryId: props.categoryId, ...values, images: imageKeys },
        {
          onSuccess: () => {
            toast.success("Item created");
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
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="item-name">Name</FieldLabel>
          <Input
            id="item-name"
            placeholder="e.g. Voya Espresso"
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.description}>
          <FieldLabel htmlFor="item-description">Description</FieldLabel>
          <Textarea
            id="item-description"
            rows={2}
            placeholder="Optional"
            {...register("description")}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <Field data-invalid={!!errors.price}>
          <FieldLabel htmlFor="item-price">Price (EGP)</FieldLabel>
          <Input
            id="item-price"
            type="number"
            step="0.01"
            min="0"
            {...register("price", { valueAsNumber: true })}
          />
          <FieldError errors={[errors.price]} />
        </Field>

        <Field>
          <FieldLabel>Images</FieldLabel>
          <ItemImageUploader images={images} onChange={setImages} />
        </Field>
      </FieldGroup>

      <DialogFooter className="mt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create item"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ItemFormDialog(props: ItemFormDialogProps) {
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
            <span className="sr-only">Edit item</span>
          </>
        ) : (
          <>
            <PlusIcon />
            <span>New item</span>
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "New item"}</DialogTitle>
        </DialogHeader>
        <ItemFormFields
          key={formKey}
          props={props}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
