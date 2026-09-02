"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

/**
 * Switches language in place.
 *
 * The query string is carried across deliberately: a guest who arrived on
 * `/en?table=7` from the QR printed on their table must land on `/ar?table=7`,
 * not a bare `/ar` that quietly forgets which table they're sitting at.
 */
interface LocaleSwitcherProps {
  className?: string;
  /** "pill" shows both languages side by side (desktop header). "compact" is a
   * single icon-sized button that toggles straight to the other locale — for
   * the mobile header, where a two-option pill would crowd the cart button
   * and hamburger it sits between. */
  variant?: "pill" | "compact";
}

export default function LocaleSwitcher({ className = "", variant = "pill" }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("localeSwitcher");
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => {
      router.replace({ pathname, query }, { locale: next });
    });
  };

  if (variant === "compact") {
    const other = locales.find((option) => option !== locale) ?? locale;
    return (
      <button
        type="button"
        onClick={() => switchTo(other)}
        disabled={isPending}
        aria-label={t("label")}
        // Shows the language a tap switches to, written in that language, so a
        // guest who can't read the current one can still recognise the way out.
        lang={other}
        className={`flex items-center justify-center px-2.5 py-2.5 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md font-mono text-[10px] font-bold uppercase tracking-widest text-white/80 hover:text-white hover:bg-black/60 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 shadow-[0_2px_12px_rgba(0,0,0,0.25)] ${className}`}
      >
        {other}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`flex items-center rounded-full border border-white/15 bg-black/40 backdrop-blur-md p-0.5 ${className}`}
    >
      {locales.map((option) => {
        const isActive = option === locale;
        return (
          <button
            key={option}
            type="button"
            onClick={() => switchTo(option)}
            disabled={isPending}
            aria-current={isActive ? "true" : undefined}
            // The label for each option is written in its own language, so a guest
            // who can't read the current one can still recognise the way out.
            lang={option}
            className={`px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer disabled:opacity-50 ${
              isActive
                ? "bg-[#F1E6C3] text-black font-bold"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t(option)}
          </button>
        );
      })}
    </div>
  );
}
