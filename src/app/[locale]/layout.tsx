import type { Metadata } from "next";
import { Inter, Outfit, Cormorant_Garamond, IBM_Plex_Sans_Arabic, Amiri } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
// Global styles
import "../globals.css";
import GlobalCursor from "@/components/GlobalCursor";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppToaster } from "@/components/app-toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { routing, directionOf } from "@/i18n/routing";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

/**
 * The Arabic side of the type system, chosen to carry the same voice rather
 * than merely to render the glyphs.
 *
 * IBM Plex Sans Arabic answers Inter: both are neutral, generously spaced
 * workhorses, so UI chrome reads identically in either language. Amiri answers
 * Cormorant — each is a revival of a classic book face (a Naskh and a Garamond),
 * which is what keeps the editorial headline voice intact across the switch.
 * Arabic has no serif/sans split of its own, so this pairing is a deliberate
 * mapping of *role*, not a search for a literal equivalent.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic-sans",
});
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-arabic-serif",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts this layout into static rendering — without it, every request would be
  // treated as dynamic the moment a translation is read.
  setRequestLocale(locale);

  const dir = directionOf(locale);
  // Latin faces load in both languages: the wordmark, prices and the odd Latin
  // proper noun appear on the Arabic pages too. The Arabic faces are only
  // attached when they're actually going to render, so an English visitor never
  // pays to preload them.
  const fontVariables = [
    inter.variable,
    outfit.variable,
    cormorant.variable,
    ...(dir === "rtl" ? [plexArabic.variable, amiri.variable] : []),
  ].join(" ");

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${fontVariables} font-sans antialiased bg-white text-black whitespace-break-spaces`}
      >
        <GlobalCursor />
        <NextIntlClientProvider>
          <QueryProvider>
            {children}
            <AppToaster />
          </QueryProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
