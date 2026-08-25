import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/dal";
import { LoginForm } from "@/components/control/login-form";

function isSafeRedirectTarget(value: string | string[] | undefined): value is string {
  return typeof value === "string" && value.startsWith("/control") && !value.startsWith("//");
}

export default async function ControlLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getCurrentSession();
  if (session) redirect(session.user.role === "ADMIN" ? "/control" : "/control/orders");

  const { from } = await searchParams;
  const redirectTo = isSafeRedirectTarget(from) ? from : "/control";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Voya Control Board</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue.</p>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
