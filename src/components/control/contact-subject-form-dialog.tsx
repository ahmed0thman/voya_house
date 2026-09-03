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
import { useCreateContactSubject, useUpdateContactSubject } from "@/hooks/use-contact";
import type { ContactSubjectDTO } from "@/server/actions/contact";

const formSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(120),
  labelAr: z.string().trim().max(120, "Label is too long").optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

type ContactSubjectFormDialogProps =
  | { mode: "create" }
  | { mode: "edit"; subject: ContactSubjectDTO };

/**
 * Owns the actual form state. Mounted fresh (via `key`) every time the
 * dialog opens, so `defaultValues` always reflect the current subject — no
 * effect-driven reset needed.
 */
function ContactSubjectFormFields({
  props,
  onClose,
}: {
  props: ContactSubjectFormDialogProps;
  onClose: () => void;
}) {
  const isEdit = props.mode === "edit";
  const createSubject = useCreateContactSubject();
  const updateSubject = useUpdateContactSubject();
  const isPending = createSubject.isPending || updateSubject.isPending;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          label: props.subject.label,
          labelAr: props.subject.labelAr ?? "",
          isActive: props.subject.isActive,
        }
      : { label: "", labelAr: "", isActive: true },
  });

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      updateSubject.mutate(
        {
          id: props.subject.id,
          label: values.label,
          labelAr: values.labelAr,
          isActive: values.isActive,
        },
        {
          onSuccess: () => {
            toast.success("Subject updated");
            onClose();
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      createSubject.mutate(
        { label: values.label, labelAr: values.labelAr },
        {
          onSuccess: () => {
            toast.success("Subject created");
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
        <Field data-invalid={!!errors.label}>
          <FieldLabel htmlFor="subject-label">Label</FieldLabel>
          <Input
            id="subject-label"
            placeholder="e.g. General Hello"
            {...register("label")}
          />
          <FieldError errors={[errors.label]} />
        </Field>

        <Field data-invalid={!!errors.labelAr}>
          <FieldLabel htmlFor="subject-label-ar">Label (Arabic)</FieldLabel>
          <Input
            id="subject-label-ar"
            dir="rtl"
            placeholder="اختياري"
            {...register("labelAr")}
          />
          <FieldError errors={[errors.labelAr]} />
        </Field>

        {isEdit && (
          <Field orientation="horizontal">
            <FieldLabel htmlFor="subject-active">Active</FieldLabel>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Switch
                  id="subject-active"
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
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create subject"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ContactSubjectFormDialog(props: ContactSubjectFormDialogProps) {
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
            <span className="sr-only">Edit subject</span>
          </>
        ) : (
          <>
            <PlusIcon />
            <span>New subject</span>
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit subject" : "New subject"}</DialogTitle>
        </DialogHeader>
        <ContactSubjectFormFields
          key={formKey}
          props={props}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
