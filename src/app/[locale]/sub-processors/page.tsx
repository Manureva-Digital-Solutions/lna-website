import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { getLegalPage } from "@/lib/legal";
import { pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = getLegalPage("sub-processors", locale);
  if (!page) return {};
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: pageAlternates(locale, "/sub-processors"),
  };
}

export default async function SubProcessorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = getLegalPage("sub-processors", locale);
  if (!page) notFound();
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <LegalDocument
      page={page}
      onThisPage={t("onThisPage")}
      downloadPdfEn={t("downloadPdfEn")}
      downloadPdfFr={t("downloadPdfFr")}
    />
  );
}
