"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExcelGrid } from "@/components/landing/visuals/ExcelGrid";
import {
  DEMO_FILLED,
  DEMO_ISSUERS,
} from "@/components/landing/visuals/demo-sheet-data";

/**
 * LNAW-124 — filled comparison sheet for the "Every field in its place" band.
 * Replaces the former ConfidenceGrid (no percentages, High/Medium/Low, or [REVIEW]).
 */
export function FilledComparisonSheet() {
  const t = useTranslations("home.bands.fields");
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

  const columns = [g("colGuarantee"), ...DEMO_ISSUERS];
  const rows = [
    {
      label: g("rowRate"),
      values: DEMO_FILLED.rate.map((v) => pct(v)),
    },
    {
      label: g("rowTotalCost"),
      values: DEMO_FILLED.totalCost.map((v) => eur(v)),
    },
    {
      label: g("rowQuota"),
      values: DEMO_FILLED.quota.map((v) => pct(v, 0)),
    },
  ];

  return (
    <div data-filled-comparison-sheet className="flex w-full flex-col gap-3">
      <ExcelGrid
        columns={columns}
        rows={rows}
        caption={filename}
        className="w-full"
      />
      <p className="sr-only">{t("tableCaption")}</p>
      <p className="text-muted-foreground text-[11px] leading-4">
        {t("provenance")}
      </p>
    </div>
  );
}
