import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Download action for the "An Excel ready to share" band (LNAW-124).
 * No review checkboxes, [REVIEW] keep-option, or flagged-field copy.
 */
export function ExportGate() {
  const t = useTranslations("home.bands.validation");
  return (
    <div
      data-export-gate
      className="bg-background border-gray-20 mx-auto flex w-full max-w-[560px] flex-col overflow-hidden rounded-none border-t shadow-none"
    >
      <div className="text-tile text-foreground px-4 pt-4 pb-6 leading-7">
        {t("stepLabel")}
      </div>
      <div className="grid grid-cols-1 max-[672px]:h-auto sm:h-16 sm:grid-cols-2">
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
