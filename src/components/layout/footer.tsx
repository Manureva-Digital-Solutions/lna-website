"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { FooterLanguageSwitcher } from "@/components/layout/language-switcher";
import { openCookiePreferences } from "@/components/integrations/CookieConsent";
import { useTranslations } from "next-intl";
import { appUrls } from "@/lib/app-urls";

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

/**
 * LNAW-94 — frozen v4 footer (lna-v4-fr.html `.foot`):
 * Gray 100 · ftop brand+langsel · fcols newsletter+link cols · fbot legal strip
 * with Cookie settings wired to openCookiePreferences.
 *
 * Link columns: 1-col <768 · 2-col ≥768 · 3-col ≥1024 (desktop keeps 3 beside newsletter).
 */
export function Footer() {
  const t = useTranslations("footer");

  const productLinks: FooterLink[] = [
    { href: "/features", label: t("features") },
    { href: "/pricing", label: t("pricing") },
    { href: "/blog", label: t("blog") },
    { href: appUrls.login, label: t("signIn"), external: true },
  ];

  const companyLinks: FooterLink[] = [
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  const legalLinks: FooterLink[] = [
    { href: "/privacy", label: t("privacyPolicy") },
    { href: "/terms", label: t("termsOfService") },
  ];

  return (
    <footer className="text-gray-30 bg-gray-100 text-sm leading-5" data-footer>
      {/* Top: brand + tagline + language selector */}
      <div className="border-gray-80 border-b py-8">
        <Container grid className="items-center gap-y-6">
          <div className="col-span-full min-[1056px]:col-span-8">
            <Link href="/" className="inline-block p-0 text-white">
              <Image
                src="/brand/logo-white.svg"
                alt="LNA"
                width={100}
                height={32}
              />
            </Link>
            <p className="text-gray-30 mt-3 max-w-[420px] text-sm">
              {t("description")}
            </p>
          </div>
          <div className="col-span-full flex min-[1056px]:col-span-4 min-[1056px]:col-start-13 min-[1056px]:justify-end">
            <FooterLanguageSwitcher />
          </div>
        </Container>
      </div>

      {/* Columns: newsletter + Product / Company / Legal */}
      <div className="pt-10 pb-12">
        <Container grid className="gap-y-10">
          <div className="col-span-full min-[1056px]:col-span-6">
            <label
              htmlFor="footer-newsletter-email"
              className="mb-4 block font-semibold text-white"
            >
              {t("stayUpdated")}
            </label>
            <NewsletterForm />
          </div>

          <nav
            data-footer-link-cols
            className="col-span-full grid grid-cols-1 gap-x-8 gap-y-10 min-[768px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1056px]:col-span-8 min-[1056px]:col-start-9"
          >
            <FooterColumn title={t("product")} links={productLinks} />
            <FooterColumn title={t("company")} links={companyLinks} />
            <FooterColumn
              title={t("legal")}
              links={legalLinks}
              className="min-[768px]:max-[1023px]:col-span-2"
            />
          </nav>
        </Container>
      </div>

      {/* Bottom legal strip */}
      <div className="bg-legal text-gray-30 text-xs leading-4">
        <Container className="flex min-h-12 flex-wrap items-center gap-x-6 gap-y-2 py-4">
          <Link href="/privacy" className="hover:text-white hover:underline">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-white hover:underline">
            {t("terms")}
          </Link>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="hover:text-white hover:underline"
            data-cookie-settings
          >
            {t("cookieSettings")}
          </button>
          <span className="w-full min-[768px]:ml-auto min-[768px]:w-auto">
            {t("copyright")}
          </span>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  className,
}: {
  title: string;
  links: FooterLink[];
  className?: string;
}) {
  return (
    <div className={className}>
      <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
      <ul className="grid gap-3">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                className="text-gray-30 hover:text-white hover:underline"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-gray-30 hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
