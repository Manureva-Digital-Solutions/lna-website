import { useTranslations, useLocale } from "next-intl";
import { ExcelGrid } from "@/components/landing/visuals/ExcelGrid";

/**
 * Tile 1 — same file empty then filled (lna-v4-fr.html `.tpl`).
 * Columns: Guarantee · Generali · April · gap 16px · caption mb 8px.
 */
export function BeforeAfterExcel() {
  const t = useTranslations("home.bands.template");
  const g = useTranslations("grid");
  const locale = useLocale();
  const filename = useTranslations("home.hero.excel")("filename");

  const pct = (v: number, fractionDigits = 2) =>
    new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(v / 100);
  const eur = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(v);

  const columns = [g("colGuarantee"), "Generali", "April"];
  const rows = [
    { label: g("rowRate"), values: [pct(0.34), pct(0.29)] },
    { label: g("rowTotalCost"), values: [eur(4218), eur(3640)] },
    // Frozen HTML mini sheets use whole percents for quotité (100 % / 50 %).
    { label: g("rowQuota"), values: [pct(100, 0), pct(50, 0)] },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 self-center sm:grid-cols-2">
      <div className="min-w-0">
        <p className="text-muted-foreground mb-2 text-xs leading-4">
          {t("before")}
        </p>
        <ExcelGrid columns={columns} rows={rows} empty caption={filename} />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground mb-2 text-xs leading-4">
          {t("after")}
        </p>
        <ExcelGrid columns={columns} rows={rows} caption={filename} />
      </div>
    </div>
  );
}
