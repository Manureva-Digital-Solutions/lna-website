import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { CrispChat } from "@/components/integrations/CrispChat";
import { CookieConsent } from "@/components/integrations/CookieConsent";
import { ToastProvider } from "@/components/ui/toast";
import { DemoRequestModal } from "@/components/forms/DemoRequestModal";
import { routing } from "@/i18n/routing";
import { SITE_URL, PRELAUNCH } from "@/lib/site";
import { localeOgImagePath } from "@/lib/og";
import { ibmPlexMono, ibmPlexSans } from "@/lib/fonts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  const tHero = await getTranslations({ locale, namespace: "home.hero" });
  const ogImage = {
    url: localeOgImagePath(locale),
    width: 1200,
    height: 630,
    alt: `${tHero("heading")} ${tHero("headingHighlight")}`,
  };

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: "/favicon.svg",
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogImage],
    },
    metadataBase: new URL(SITE_URL),
    // Pre-launch: keep the site out of search indexes until launch day.
    robots: PRELAUNCH ? { index: false, follow: false } : undefined,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        fr: `${SITE_URL}/fr`,
        en: `${SITE_URL}/en`,
        "x-default": `${SITE_URL}/fr`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    /* Font CSS variables must live on <html>: @layer base applies font-sans there. */
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
    >
      <body>
        <NextIntlClientProvider>
          <SkipToContent />
          <Header />
          <main
            id="main"
            tabIndex={-1}
            className="min-h-screen pt-12 outline-none"
          >
            {children}
          </main>
          <Footer />
          <CrispChat />
          <CookieConsent />
          <ToastProvider />
          <DemoRequestModal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
