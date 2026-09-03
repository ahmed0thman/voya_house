import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/dal";
import { ForgotPasswordForm } from "@/components/control/forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();
  if (session) redirect(session.user.role === "ADMIN" ? "/control" : "/control/orders");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Admin accounts only — we&apos;ll email a code to the address on file.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
