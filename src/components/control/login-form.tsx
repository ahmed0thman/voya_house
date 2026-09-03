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
import { useLogin, useVerifyTwoFactor, useResendTwoFactorCode } from "@/hooks/use-auth";
import { loginSchema, verifyTwoFactorSchema, type LoginInput, type VerifyTwoFactorInput } from "@/lib/validations/auth";

type Step = { name: "credentials" } | { name: "2fa"; maskedEmail: string };

function CredentialsStep({
  redirectTo,
  onVerified,
}: {
  redirectTo: string;
  onVerified: (maskedEmail: string) => void;
}) {
  const router = useRouter();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (values: LoginInput) => {
    login.mutate(values, {
      onSuccess: (result) => {
        if (result.status === "2fa_required") {
          onVerified(result.maskedEmail);
        } else {
          router.push(redirectTo);
        }
      },
      onError: (error) => {
        setError("password", { message: error.message });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="login-username">Username</FieldLabel>
          <Input
            id="login-username"
            autoComplete="username"
            autoFocus
            {...register("username")}
          />
          <FieldError errors={[errors.username]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="login-password">Password</FieldLabel>
            <Link
              href="/control/forgot-password"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="mt-4 w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function TwoFactorStep({
  maskedEmail,
  redirectTo,
  onBack,
}: {
  maskedEmail: string;
  redirectTo: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const verify = useVerifyTwoFactor();
  const resend = useResendTwoFactorCode();

  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<VerifyTwoFactorInput>({
    resolver: zodResolver(verifyTwoFactorSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = (values: VerifyTwoFactorInput) => {
    verify.mutate(values, {
      onSuccess: () => router.push(redirectTo),
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
      <FieldGroup>
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="login-2fa-code">Verification code</FieldLabel>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <InputOTP
                id="login-2fa-code"
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
          <FieldDescription>We sent a 6-digit code to {maskedEmail}.</FieldDescription>
          <FieldError errors={[errors.code]} />
        </Field>
      </FieldGroup>

      <Button type="submit" className="mt-4 w-full" disabled={verify.isPending}>
        {verify.isPending ? "Verifying…" : "Verify"}
      </Button>

      <div className="mt-3 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
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

export function LoginForm({ redirectTo = "/control" }: { redirectTo?: string }) {
  const [step, setStep] = useState<Step>({ name: "credentials" });

  if (step.name === "2fa") {
    return (
      <TwoFactorStep
        maskedEmail={step.maskedEmail}
        redirectTo={redirectTo}
        onBack={() => setStep({ name: "credentials" })}
      />
    );
  }

  return (
    <CredentialsStep
      redirectTo={redirectTo}
      onVerified={(maskedEmail) => setStep({ name: "2fa", maskedEmail })}
    />
  );
}
