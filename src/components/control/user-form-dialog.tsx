"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CopyIcon, PencilIcon, PlusIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { userRoleSchema, type CreateUserInput } from "@/lib/validations/user";
import type { UserDTO } from "@/server/actions/users";

const ROLE_OPTIONS: { value: CreateUserInput["role"]; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Staff" },
];

const ROLE_LABEL = Object.fromEntries(
  ROLE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<CreateUserInput["role"], string>;

const USERNAME_SCHEMA = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(50)
  .regex(/^[a-z0-9._-]+$/i, "Only letters, numbers, dots, underscores and hyphens");

const createFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    username: USERNAME_SCHEMA,
    role: userRoleSchema,
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

const editFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    username: USERNAME_SCHEMA,
    role: userRoleSchema,
    // Blank means "keep the current password".
    password: z.string().max(72),
    passwordConfirmation: z.string(),
  })
  .refine((data) => !data.password || data.password.length >= 8, {
    message: "Password must be at least 8 characters",
    path: ["password"],
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

type FormValues = {
  name: string;
  username: string;
  role: CreateUserInput["role"];
  password: string;
  passwordConfirmation: string;
};

type UserFormDialogProps = { mode: "create" } | { mode: "edit"; user: UserDTO };

/**
 * Shown once, right after a password is set (create, or an edit that
 * includes a reset) — the plaintext here is just what the admin typed
 * moments ago, never anything decrypted or re-read from storage. Closing
 * the dialog discards it for good; it can't be reopened.
 */
function PasswordRevealPanel({
  password,
  onDone,
}: {
  password: string;
  onDone: () => void;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied");
    } catch {
      toast.error("Couldn't copy — select and copy it manually.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Share this password with them now — it won&apos;t be shown again.
      </p>
      <div className="flex items-center gap-2">
        <Input readOnly value={password} className="font-mono" onFocus={(e) => e.target.select()} />
        <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
          <CopyIcon />
          <span className="sr-only">Copy password</span>
        </Button>
      </div>
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </DialogFooter>
    </div>
  );
}

/**
 * Owns the actual form state. Mounted fresh (via `key`) every time the
 * dialog opens, so defaults always start clean — no effect-driven reset.
 */
function UserFormFields({
  props,
  onClose,
}: {
  props: UserFormDialogProps;
  onClose: () => void;
}) {
  const isEdit = props.mode === "edit";
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isPending = createUser.isPending || updateUser.isPending;
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editFormSchema : createFormSchema),
    defaultValues: isEdit
      ? {
          name: props.user.name,
          username: props.user.username,
          role: props.user.role,
          password: "",
          passwordConfirmation: "",
        }
      : { name: "", username: "", role: "STAFF", password: "", passwordConfirmation: "" },
  });

  const onSubmit = (values: FormValues) => {
    if (isEdit) {
      updateUser.mutate(
        {
          id: props.user.id,
          name: values.name,
          username: values.username,
          role: values.role,
          password: values.password || undefined,
          passwordConfirmation: values.passwordConfirmation || undefined,
        },
        {
          onSuccess: () => {
            toast.success("User updated");
            if (values.password) {
              setRevealedPassword(values.password);
            } else {
              onClose();
            }
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else {
      createUser.mutate(values, {
        onSuccess: () => {
          toast.success("User created");
          setRevealedPassword(values.password);
        },
        onError: (error) => toast.error(error.message),
      });
    }
  };

  if (revealedPassword) {
    return <PasswordRevealPanel password={revealedPassword} onDone={onClose} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="user-name">Name</FieldLabel>
          <Input id="user-name" placeholder="e.g. Amira Hassan" {...register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="user-username">Username</FieldLabel>
          <Input
            id="user-username"
            placeholder="e.g. amira"
            autoComplete="username"
            {...register("username")}
          />
          <FieldError errors={[errors.username]} />
        </Field>

        <Field data-invalid={!!errors.role}>
          <FieldLabel htmlFor="user-role">Role</FieldLabel>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue placeholder="Select a role">
                    {(value: CreateUserInput["role"] | null) =>
                      value ? ROLE_LABEL[value] : "Select a role"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.role]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="user-password">
            {isEdit ? "New password" : "Password"}
          </FieldLabel>
          <Input
            id="user-password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {isEdit && (
            <FieldDescription>Leave blank to keep the current password.</FieldDescription>
          )}
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={!!errors.passwordConfirmation}>
          <FieldLabel htmlFor="user-password-confirmation">
            {isEdit ? "Confirm new password" : "Confirm password"}
          </FieldLabel>
          <Input
            id="user-password-confirmation"
            type="password"
            autoComplete="new-password"
            {...register("passwordConfirmation")}
          />
          <FieldError errors={[errors.passwordConfirmation]} />
        </Field>
      </FieldGroup>

      <DialogFooter className="mt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Create user"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UserFormDialog(props: UserFormDialogProps) {
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
            <span className="sr-only">Edit user</span>
          </>
        ) : (
          <>
            <PlusIcon />
            <span>New user</span>
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle>
        </DialogHeader>
        <UserFormFields key={formKey} props={props} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
