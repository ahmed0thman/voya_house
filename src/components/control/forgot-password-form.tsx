"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  useRequestPasswordReset,
  useVerifyPasswordResetCode,
  useResendPasswordResetCode,
  useResetPassword,
} from "@/hooks/use-password-reset";
import {
  requestPasswordResetSchema,
  verifyPasswordResetCodeSchema,
  setNewPasswordSchema,
  type RequestPasswordResetInput,
  type VerifyPasswordResetCodeInput,
  type SetNewPasswordInput,
} from "@/lib/validations/auth";

type Step = { name: "request" } | { name: "code" } | { name: "new-password" };

function RequestStep({ onSent }: { onSent: () => void }) {
  const requestReset = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { username: "" },
  });

  const onSubmit = (values: RequestPasswordResetInput) => {
    requestReset.mutate(values, {
      onSuccess: onSent,
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="reset-username">Username</FieldLabel>
          <Input id="reset-username" autoComplete="username" autoFocus {...register("username")} />
          <FieldError errors={[errors.username]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="mt-4 w-full" disabled={requestReset.isPending}>
        {requestReset.isPending ? "Sending…" : "Send reset code"}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/control/login" className="hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

function CodeStep({ onVerified, onBack }: { onVerified: () => void; onBack: () => void }) {
  const verify = useVerifyPasswordResetCode();
  const resend = useResendPasswordResetCode();

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<VerifyPasswordResetCodeInput>({
    resolver: zodResolver(verifyPasswordResetCodeSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = (values: VerifyPasswordResetCodeInput) => {
    verify.mutate(values, {
      onSuccess: onVerified,
      onError: (error) => {
        reset({ code: "" });
        setError("code", { message: error.message });
      },
    });
  };

  const handleResend = () => {
    resend.mutate(undefined, {
      onSuccess: () => toast.success("A new code is on its way."),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p className="mb-4 text-sm text-muted-foreground">
        If that account exists, we&apos;ve emailed a 6-digit code to the address on file.
      </p>
      <FieldGroup>
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="reset-code">Verification code</FieldLabel>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <InputOTP
                id="reset-code"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                containerClassName="justify-center"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onComplete={() => handleSubmit(onSubmit)()}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="size-10 text-base" />
                  <InputOTPSlot index={1} className="size-10 text-base" />
                  <InputOTPSlot index={2} className="size-10 text-base" />
                  <InputOTPSlot index={3} className="size-10 text-base" />
                  <InputOTPSlot index={4} className="size-10 text-base" />
                  <InputOTPSlot index={5} className="size-10 text-base" />
                </InputOTPGroup>
              </InputOTP>
            )}
          />
          <FieldError errors={[errors.code]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="mt-4 w-full" disabled={verify.isPending}>
        {verify.isPending ? "Verifying…" : "Verify"}
      </Button>

      <div className="mt-3 flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          Back
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resend.isPending}
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {resend.isPending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}

function NewPasswordStep({ onExpired }: { onExpired: () => void }) {
  const router = useRouter();
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SetNewPasswordInput>({
    resolver: zodResolver(setNewPasswordSchema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  const onSubmit = (values: SetNewPasswordInput) => {
    resetPassword.mutate(values, {
      onSuccess: () => {
        toast.success("Password updated — sign in with your new password.");
        router.push("/control/login");
      },
      onError: (error) => {
        if (error.code === "UNAUTHORIZED") {
          toast.error(error.message);
          onExpired();
          return;
        }
        setError("password", { message: error.message });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="reset-password">New password</FieldLabel>
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            autoFocus
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={!!errors.passwordConfirmation}>
          <FieldLabel htmlFor="reset-password-confirmation">Confirm new password</FieldLabel>
          <Input
            id="reset-password-confirmation"
            type="password"
            autoComplete="new-password"
            {...register("passwordConfirmation")}
          />
          <FieldDescription>
            Signs you out on every other device — you&apos;ll need to sign back in here too.
          </FieldDescription>
          <FieldError errors={[errors.passwordConfirmation]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="mt-4 w-full" disabled={resetPassword.isPending}>
        {resetPassword.isPending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>({ name: "request" });

  if (step.name === "code") {
    return (
      <CodeStep
        onVerified={() => setStep({ name: "new-password" })}
        onBack={() => setStep({ name: "request" })}
      />
    );
  }

  if (step.name === "new-password") {
    return <NewPasswordStep onExpired={() => setStep({ name: "request" })} />;
  }

  return <RequestStep onSent={() => setStep({ name: "code" })} />;
}
