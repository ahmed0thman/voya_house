"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import type { CategoryDTO } from "@/server/actions/categories";

const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  titleAr: z.string().trim().max(120, "Title is too long").optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

type CategoryFormDialogProps =
  | { mode: "create"; brandId: string }
  | { mode: "edit"; category: CategoryDTO };

/**
 * Owns the actual form state. Mounted fresh (via `key`) every time the
 * dialog opens, so `defaultValues` always reflect the current category — no
 * effect-driven reset needed.
 */
function CategoryFormFields({
  props,
  onClose,
}: {
  props: CategoryFormDialogProps;
  onClose: () => void;
}) {
  const isEdit = props.mode === "edit";
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          title: props.category.title,
          titleAr: props.category.titleAr ?? "",
          isActive: props.category.isActive,
        }
      : { title: "", titleAr: "", isActive: true },
  });

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      updateCategory.mutate(
        {
          id: props.category.id,
          title: values.title,
          titleAr: values.titleAr,
          isActive: values.isActive,
        },
        {
          onSuccess: () => {
            toast.success("Category updated");
            onClose();
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      createCategory.mutate(
        { brandId: props.brandId, title: values.title, titleAr: values.titleAr },
        {
          onSuccess: () => {
            toast.success("Category created");
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
        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="category-title">Title</FieldLabel>
          <Input
            id="category-title"
            placeholder="e.g. Signature Roasts"
            {...register("title")}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field data-invalid={!!errors.titleAr}>
          <FieldLabel htmlFor="category-title-ar">Title (Arabic)</FieldLabel>
          <Input
            id="category-title-ar"
            dir="rtl"
            placeholder="اختياري"
            {...register("titleAr")}
          />
          <FieldError errors={[errors.titleAr]} />
        </Field>

        {isEdit && (
          <Field orientation="horizontal">
            <FieldLabel htmlFor="category-active">Active</FieldLabel>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="category-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </Field>
        )}
      </FieldGroup>

      <DialogFooter className="mt-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : isEdit
              ? "Save changes"
              : "Create category"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function CategoryFormDialog(props: CategoryFormDialogProps) {
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
            <span className="sr-only">Edit category</span>
          </>
        ) : (
          <>
            <PlusIcon />
            <span>New category</span>
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>
        <CategoryFormFields
          key={formKey}
          props={props}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
