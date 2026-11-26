import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import { legalPageWidth } from "@/components/legal/LegalDocument";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.legalNotice" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/legal-notice"),
  };
}

const sectionIds = [
  { id: "publisher", key: "publisher" },
  { id: "hosting", key: "hosting" },
  { id: "contact", key: "contact" },
] as const;

/**
 * LNAW-72 — Mentions légales / Legal notice.
 * Content sourced from Terms §13 (Lemon Tree SAS only). No invented legal text.
 * Chrome matches Privacy/Terms (LNAW-109 legal shell).
 */
export default async function LegalNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legalNotice" });

  return (
    <>
      <Section className="overflow-hidden pt-16 pb-8 md:pt-20 md:pb-10">
        <Container className={legalPageWidth}>
          <AnimateIn>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-hero text-foreground text-balance">
                {t("heading")}
              </h1>
              <p className="text-body mt-4">{t("updated")}</p>
            </div>
          </AnimateIn>
        </Container>
      </Section>

      <Section className="border-gray-20 border-t pt-10 md:pt-14">
        <Container className={legalPageWidth}>
          <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
            <AnimateIn>
              <nav className="lg:sticky lg:top-24">
                <p className="mb-3 text-xs font-semibold tracking-widest uppercase">
                  {t("onThisPage")}
                </p>
                <ul className="space-y-1.5 text-sm">
                  {sectionIds.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t(`sections.${s.key}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </AnimateIn>

            <AnimateIn delay={0.1}>
              <div className="prose prose-neutral dark:prose-invert prose-headings:font-normal prose-headings:text-foreground prose-a:text-primary text-body max-w-none">
                <p>{t("intro")}</p>

                <h2 id="publisher">{t("sections.publisher")}</h2>
                <p>
                  <strong>{t("seller")}</strong>
                </p>
                <ul>
                  <li>{t("company")}</li>
                  <li>{t("legalForm")}</li>
                  <li>{t("address")}</li>
                  <li>{t("registration")}</li>
                  <li>{t("capital")}</li>
                  <li>{t("vat")}</li>
                  <li>{t("publicationDirector")}</li>
                </ul>

                <h2 id="hosting">{t("sections.hosting")}</h2>
                <p>{t("hosting")}</p>

                <h2 id="contact">{t("sections.contact")}</h2>
                <ul>
                  <li>
                    {t("email")}{" "}
                    <a href="mailto:legal@lnaflow.com">legal@lnaflow.com</a>
                  </li>
                  <li>
                    {t("generalInquiries")}{" "}
                    <a href="mailto:support@lnaflow.com">support@lnaflow.com</a>
                  </li>
                  <li>
                    {t("orVisit")}{" "}
                    <Link
                      href="/contact"
                      className="text-primary hover:underline"
                    >
                      {t("contactPage")}
                    </Link>
                  </li>
                </ul>
              </div>
            </AnimateIn>
          </div>
        </Container>
      </Section>
    </>
  );
}
