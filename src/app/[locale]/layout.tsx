import type { Metadata } from "next";
import { Inter, Outfit, Cormorant_Garamond, Noto_Sans_Arabic, Amiri } from "next/font/google";
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
// SEO
import { SITE_URL, seoConfig, type SeoLocale } from "@/lib/seo.config";
import { VoyaHouseJsonLd } from "@/components/seo/VoyaHouseJsonLd";

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
 * Noto Sans Arabic is used for body copy, labels, controls, and smaller titles
 * because its open letterforms stay clear at compact sizes. Amiri remains the
 * Arabic display face, preserving the editorial voice of the main headings.
 * Arabic has no serif/sans split of its own, so this pairing maps fonts by role.
 */
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: "variable",
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

  const seoLocale = locale as SeoLocale;
  const config = seoConfig[seoLocale];
  const t = await getTranslations({ locale, namespace: "metadata" });
  const altLocale = seoLocale === "en" ? "ar" : "en";

  return {
    metadataBase: new URL(SITE_URL),

    title: {
      default: t("title"),
      template: `%s | ${t("siteName")}`,
    },
    description: t("description"),
    keywords: config.keywords,
    authors: [{ name: config.siteName }],
    creator: config.siteName,
    publisher: config.siteName,

    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
        "x-default": "/en",
      },
    },

    openGraph: {
      type: "website",
      locale: seoLocale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: seoLocale === "ar" ? "en_US" : "ar_EG",
      siteName: t("siteName"),
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: `/${locale}`,
      images: [
        {
          url: `/${locale}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: t("siteName"),
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [`/${locale}/opengraph-image`],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
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
    ...(dir === "rtl" ? [notoArabic.variable, amiri.variable] : []),
  ].join(" ");

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${fontVariables} font-sans antialiased bg-white text-black whitespace-break-spaces`}
      >
        {/* Structured data — rendered server-side so crawlers see it in the initial HTML */}
        <VoyaHouseJsonLd locale={locale as SeoLocale} />
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
