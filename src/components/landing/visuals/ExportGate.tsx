import { Check, Download } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Carbon modal (lna-v4-fr.html `.modal` in `.stage`):
 * white · max 560 · mx-auto · border-top
 * .modal-h 16/16/0 · 20/28 · .modal-b 24/16/32 · .modal-f 64px
 * audit white (override) | navy Download
 */
export function ExportGate() {
  const t = useTranslations("home.bands.validation");
  return (
    <div
      data-export-gate
      className="bg-background border-gray-20 mx-auto flex w-full max-w-[560px] flex-col overflow-hidden rounded-none border-t shadow-none"
    >
      <div className="text-tile text-foreground px-4 pt-4 leading-7">
        {t("stepLabel")}
      </div>
      <div className="flex flex-col px-4 pt-6 pb-8">
        <label className="flex items-center gap-2 py-1.5 text-sm leading-[18px]">
          <span
            className="bg-gray-100 inline-flex size-4 shrink-0 items-center justify-center rounded-none text-white"
            aria-hidden="true"
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
          <span>{t("checkbox")}</span>
        </label>
        <label className="flex items-center gap-2 py-1.5 text-sm leading-[18px]">
          <span
            className="border-foreground inline-flex size-4 shrink-0 rounded-none border bg-transparent"
            aria-hidden="true"
          />
          <span>{t("checkboxReview")}</span>
        </label>
      </div>
      <div className="grid grid-cols-1 max-[672px]:h-auto sm:grid-cols-2 sm:h-16">
        <div className="bg-background text-muted-foreground border-gray-20 flex items-start border-t px-4 py-3 text-xs leading-4">
          {t("auditNote")}
        </div>
        <div className="bg-primary text-primary-foreground relative flex h-12 items-start px-4 pt-3.5 pr-16 text-base leading-[22px] sm:h-16">
          <span>{t("downloadButton")}</span>
          <Download
            className="absolute top-3.5 right-4 size-4 shrink-0"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
