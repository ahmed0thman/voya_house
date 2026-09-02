import type { Metadata } from "next";
// Global styles
import "../globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppToaster } from "@/components/app-toaster";

export const metadata: Metadata = {
  title: "Control Board — Voya House",
};

/**
 * A second root layout, deliberately outside `[locale]`.
 *
 * The control board is staff-only and English-only, so it must not sit under
 * the guest site's locale segment — that would put `/en/control` in front of
 * every bookmark and login redirect for no benefit. Being its own root means it
 * renders its own `<html>` and mounts its own providers, since there's no
 * longer a shared layout above it to inherit them from.
 *
 * Shared by both /control/login (unauthenticated) and the `(authenticated)`
 * route group — the actual login gate lives in that group's own layout via
 * `requireUser()`, plus the optimistic cookie check in `src/proxy.ts`.
 */
export default function ControlLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="antialiased">
        <QueryProvider>
          <div className="min-h-screen bg-background text-foreground">{children}</div>
          <AppToaster />
        </QueryProvider>
      </body>
    </html>
  );
}
