"use client";

import { useLocale, useTranslations } from "next-intl";
import { DEMO_EXPORT_HISTORY } from "@/components/landing/visuals/export-history-data";

/**
 * LNAW-128 — cropped-style export history / audit log for the security band.
 * Coded visual (staging WebP captures can replace later). Fictional data only.
 * No review / confidence / warning states.
 */
export function ExportHistoryVisual() {
  const t = useTranslations("home.trust.history");
  const locale = useLocale();

  const when = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  return (
    <div
      data-export-history
      role="img"
      aria-label={t("alt")}
      className="border-border bg-card w-full min-w-0 overflow-hidden rounded-none border shadow-none"
    >
      <div className="border-border bg-gray-10 text-foreground flex items-center justify-between border-b px-3 py-2">
        <span className="text-[12px] leading-none font-semibold tracking-tight sm:text-[13px]">
          {t("title")}
        </span>
        <span className="text-muted-foreground font-mono text-[10px] leading-none">
          {t("badge")}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-left text-[11px] tabular-nums sm:text-[12px]">
          <thead>
            <tr className="bg-sheet-header text-white">
              <th className="border-r border-b border-white/15 px-2.5 py-2 font-semibold">
                {t("colUser")}
              </th>
              <th className="border-r border-b border-white/15 px-2.5 py-2 font-semibold">
                {t("colFile")}
              </th>
              <th className="border-b border-white/15 px-2.5 py-2 font-semibold">
                {t("colWhen")}
              </th>
            </tr>
          </thead>
          <tbody>
            {DEMO_EXPORT_HISTORY.map((row) => (
              <tr key={`${row.userKey}-${row.at}`} className="bg-card">
                <td className="border-border text-foreground border-r border-b px-2.5 py-2.5 whitespace-nowrap">
                  {t(row.userKey)}
                </td>
                <td className="border-border text-foreground border-r border-b px-2.5 py-2.5 font-mono whitespace-nowrap">
                  {row.file}
                </td>
                <td className="border-border text-muted-foreground border-b px-2.5 py-2.5 whitespace-nowrap">
                  {when(row.at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted-foreground border-border border-t px-3 py-2 text-[10px] leading-4">
        {t("provenance")}
      </p>
    </div>
  );
}
