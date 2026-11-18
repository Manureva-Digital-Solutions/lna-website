import { useTranslations } from "next-intl";
import { PdfStack } from "@/components/landing/visuals/PdfStack";

/**
 * Tile 2 — six example PDFs from the frozen crop (product-style FR filenames)
 * with locale type labels.
 */
export function RoleClassification() {
  const t = useTranslations("home.bands.mixed");

  const docs = [
    { name: "devis-generali-2026.pdf", role: t("roleAdp") },
    { name: "devis-april-2026.pdf", role: t("roleAdp") },
    { name: "amortissement-pret.pdf", role: t("roleAmortization") },
    { name: "devis-sante-malakoff.pdf", role: t("roleHealth") },
    { name: "conditions-generales.pdf", role: t("roleContract") },
    { name: "releve-bancaire.pdf", role: t("roleOther") },
  ];

  return <PdfStack docs={docs} />;
}
