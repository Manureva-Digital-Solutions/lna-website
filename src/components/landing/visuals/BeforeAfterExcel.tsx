import { useTranslations, useLocale } from "next-intl";
import { ExcelGrid } from "@/components/landing/visuals/ExcelGrid";
import {
  DEMO_FILLED,
  DEMO_ISSUERS,
} from "@/components/landing/visuals/demo-sheet-data";

/**
 * Tile 1 — same template empty then filled (lna-v4-fr.html `.tpl`).
 * Before uses blank cells (not opacity-hidden filled values).
 * Columns match the first two fictional issuers from the shared demo set.
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

  // Mini sheets show two issuers for space; same names as hero/PDF stack.
  const columns = [g("colGuarantee"), DEMO_ISSUERS[0], DEMO_ISSUERS[1]];
  const afterRows = [
    {
      label: g("rowRate"),
      values: [pct(DEMO_FILLED.rate[0]), pct(DEMO_FILLED.rate[1])],
    },
    {
      label: g("rowTotalCost"),
      values: [eur(DEMO_FILLED.totalCost[0]), eur(DEMO_FILLED.totalCost[1])],
    },
    {
      label: g("rowQuota"),
      values: [pct(DEMO_FILLED.quota[0], 0), pct(DEMO_FILLED.quota[1], 0)],
    },
  ];
  const beforeRows = afterRows.map((row) => ({
    label: row.label,
    values: row.values.map(() => ""),
  }));

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 self-center sm:grid-cols-2">
      <div className="min-w-0">
        <p className="text-muted-foreground mb-2 text-xs leading-4">
          {t("before")}
        </p>
        <ExcelGrid columns={columns} rows={beforeRows} caption={filename} />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground mb-2 text-xs leading-4">
          {t("after")}
        </p>
        <ExcelGrid columns={columns} rows={afterRows} caption={filename} />
      </div>
      <p className="text-muted-foreground col-span-full text-[11px] leading-4">
        {t("provenance")}
      </p>
    </div>
  );
}
