import { useTranslations } from "next-intl";
import { PdfStack } from "@/components/landing/visuals/PdfStack";
import { DEMO_SOURCE_DOCS } from "@/components/landing/visuals/demo-sheet-data";

/**
 * Tile 2 — source PDFs for the shared ADP comparison demo
 * (same fictional issuers as the hero / before-after / confidence sheet).
 */
export function RoleClassification() {
  const t = useTranslations("home.bands.mixed");

  const docs = DEMO_SOURCE_DOCS.map((doc) => ({
    name: doc.file,
    role: t(doc.roleKey),
  }));

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <PdfStack docs={docs} />
      <p className="text-muted-foreground text-[11px] leading-4">
        {t("provenance")}
      </p>
    </div>
  );
}
