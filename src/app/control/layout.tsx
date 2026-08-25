import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Control Board — Voya House",
};

// Shared by both /control/login (unauthenticated) and the `(authenticated)`
// route group — the actual login gate lives in that group's own layout via
// `requireUser()`, plus the optimistic cookie check in `src/proxy.ts`.
// QueryProvider and Toaster are mounted once at the root layout, shared with the public site.
export default function ControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
