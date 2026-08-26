"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

/**
 * This app has two fixed, opposite surfaces rather than a user-chosen theme:
 * the guest landing page is always near-black, the control board is always
 * light. Without a ThemeProvider the toaster would fall back to `system` and
 * render a white card over the dark landing page, so the route decides instead.
 *
 * The wrapper carries `dark` because sonner marks itself with `data-theme`, not
 * a class — the token overrides in globals.css are `.dark`, so they only reach
 * the toast (and the `var(--popover)` it is styled from) through an ancestor.
 */
export function AppToaster() {
  const isControlBoard = usePathname()?.startsWith("/control") ?? false;

  return (
    <div className={isControlBoard ? undefined : "dark"}>
      <Toaster theme={isControlBoard ? "light" : "dark"} />
    </div>
  );
}
