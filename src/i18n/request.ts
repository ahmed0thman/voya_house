import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Resolves the request's locale and loads its message catalogue.
 *
 * Two paths, deliberately in this order:
 *
 * 1. The `[locale]` segment, when there is one. This is the whole of the guest
 *    site's page rendering, and reading it costs nothing dynamic — which is
 *    what keeps `/en` and `/ar` statically prerenderable.
 * 2. The `NEXT_LOCALE` cookie, only when there isn't. A Server Action has no
 *    route segment to read (and `next/root-params` is unavailable there), so
 *    without this every error message a guest gets back from `createOrder`
 *    would arrive in English no matter which language they're browsing in.
 *    The proxy writes that cookie on every guest response, so it's reliably
 *    there. `cookies()` forces dynamic rendering, hence the narrow fallback:
 *    actions are dynamic anyway, pages must not become so.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  let locale = routing.defaultLocale;
  if (hasLocale(routing.locales, requested)) {
    locale = requested;
  } else {
    const fromCookie = (await cookies()).get("NEXT_LOCALE")?.value;
    if (hasLocale(routing.locales, fromCookie)) locale = fromCookie;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
