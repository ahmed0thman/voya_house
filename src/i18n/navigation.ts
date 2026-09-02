import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware replacements for `next/link` and the `next/navigation` hooks.
 * Use these anywhere the guest site navigates: they keep the active locale in
 * the path automatically, so no component has to remember to write `/ar/...`.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
