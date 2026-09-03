"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/use-settings";

const formSchema = z.object({
  whatsappOrderNumber: z.string().trim(),
});
type FormValues = z.infer<typeof formSchema>;

function WhatsappSettingsForm({ defaultNumber }: { defaultNumber: string }) {
  const updateSettings = useUpdateAppSettings();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { whatsappOrderNumber: defaultNumber },
  });

  const onSubmit = (values: FormValues) => {
    updateSettings.mutate(
      { whatsappOrderNumber: values.whatsappOrderNumber },
      {
        onSuccess: () => toast.success("Settings saved"),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CardContent>
        <FieldGroup>
          <Field data-invalid={!!errors.whatsappOrderNumber}>
            <FieldLabel htmlFor="whatsapp-order-number">Order number</FieldLabel>
            <Input
              id="whatsapp-order-number"
              placeholder="e.g. 201097073224"
              {...register("whatsappOrderNumber")}
            />
            <FieldError errors={[errors.whatsappOrderNumber]} />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving…" : "Save"}
        </Button>
      </CardFooter>
    </form>
  );
}

export function WhatsappSettingsCard() {
  const { data, isLoading, isError } = useAppSettings();

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp orders</CardTitle>
        <CardDescription>
          International format, digits only — no leading &quot;+&quot; (e.g. 201097073224 for an
          Egyptian number). When a guest places an order, this is where they&apos;re handed off
          to send it. Leave blank to turn the handoff off.
        </CardDescription>
      </CardHeader>
      {isLoading ? (
        <CardContent>
          <Skeleton className="h-9 w-full max-w-sm" />
        </CardContent>
      ) : isError ? (
        <CardContent>
          <p className="text-sm text-destructive">Couldn&apos;t load settings.</p>
        </CardContent>
      ) : (
        <WhatsappSettingsForm
          key={data?.whatsappOrderNumber ?? ""}
          defaultNumber={data?.whatsappOrderNumber ?? ""}
        />
      )}
    </Card>
  );
}
