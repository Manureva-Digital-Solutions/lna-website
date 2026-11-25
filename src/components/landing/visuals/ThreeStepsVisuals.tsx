"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExcelGrid } from "@/components/landing/visuals/ExcelGrid";
import {
  DEMO_FILLED,
  DEMO_ISSUERS,
  DEMO_SOURCE_DOCS,
} from "@/components/landing/visuals/demo-sheet-data";

/** Total loop length (ms). Final filled + download state held ≥ 1.5s. */
export const THREE_STEPS_LOOP_MS = 10000;
export const THREE_STEPS_HOLD_FINAL_MS = 1800;

const STEPS = ["template", "documents", "download"] as const;

type StepKey = (typeof STEPS)[number];

/** Preview card fill from design markup (near Carbon gray-10). */
const PREVIEW_BG = "bg-[#f5f5f5]";
/** Steps 01–02 top rule from design markup. */
const STEP_RULE_MUTED = "border-[#e5e7eb]";
/** Deep navy for how-it-works table headers + download CTA (matches step-02 pills). */
const DEEP_NAVY_BG = "bg-[#19376d]";
const DEEP_NAVY_BORDER = "border-[#19376d]";

function subscribeNarrow(cb: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia("(max-width: 390px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getNarrowSnapshot() {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(max-width: 390px)").matches;
}

function getNarrowServerSnapshot() {
  return false;
}

function useIsNarrow390() {
  return useSyncExternalStore(
    subscribeNarrow,
    getNarrowSnapshot,
    getNarrowServerSnapshot
  );
}

function ExcelFileGlyph({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-excel-green inline-flex size-5 shrink-0 items-center justify-center font-mono text-[10px] font-semibold text-white",
        className
      )}
      aria-hidden="true"
    >
      X
    </span>
  );
}

function PdfGlyph({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-gray-70 inline-flex size-6 shrink-0 items-center justify-center font-mono text-[8px] font-semibold text-white",
        className
      )}
      aria-hidden="true"
    >
      PDF
    </span>
  );
}

type ThreeStepsVisualsProps = {
  /** Force the completed end-state (About page). Still used when reduced-motion / narrow. */
  staticComplete?: boolean;
  /** Override the default howItWorks visual aria-label (e.g. About imageAlt). */
  ariaLabel?: string;
};

/**
 * LNAW-123 — animated product visuals for the three-steps section.
 * LNAW-131 — optional static completed state for About (Excel-only product story).
 * Reuses demo-sheet-data; no review/confidence cues.
 */
export function ThreeStepsVisuals({
  staticComplete: staticCompleteProp = false,
  ariaLabel,
}: ThreeStepsVisualsProps = {}) {
  const t = useTranslations("home.howItWorks");
  const tHero = useTranslations("home.hero");
  const tBands = useTranslations("home.bands");
  const g = useTranslations("grid");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const isNarrow = useIsNarrow390();
  const staticComplete = staticCompleteProp || !!reduceMotion || isNarrow;

  const filename = tHero("excel.filename");
  /** null = not ticking yet; derived elapsed stays at final frame when static. */
  const [tickMs, setTickMs] = useState<number | null>(null);

  useEffect(() => {
    if (staticComplete) return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setTickMs((now - started) % THREE_STEPS_LOOP_MS);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [staticComplete]);

  const elapsed = staticComplete
    ? THREE_STEPS_LOOP_MS
    : (tickMs ?? THREE_STEPS_LOOP_MS);

  const pct = (v: number, digits = 2) =>
    new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(v / 100);
  const eur = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(v);

  const columns = [g("colGuarantee"), ...DEMO_ISSUERS];
  const emptyRows = [
    { label: g("rowRate"), values: ["", "", ""] as const },
    { label: g("rowTotalCost"), values: ["", "", ""] as const },
    { label: g("rowQuota"), values: ["", "", ""] as const },
  ];
  const filledRows = [
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

  // —— Timeline (10s) ——
  const step1File = staticComplete || elapsed >= 400;
  const step1Loaded = staticComplete || elapsed >= 900;
  const step1Grid = staticComplete || elapsed >= 1200;

  const docsVisible = staticComplete
    ? 4
    : elapsed < 3200
      ? 0
      : Math.min(4, 1 + Math.floor((elapsed - 3200) / 450));
  const docsProgress = staticComplete
    ? 1
    : elapsed < 3200
      ? 0
      : Math.min(1, (elapsed - 3200) / 2200);
  const docsDone = staticComplete || elapsed >= 5400;

  const fillStart = 6500;
  const cellCount = 9;
  const revealed = staticComplete
    ? cellCount
    : elapsed < fillStart
      ? 0
      : Math.min(
          cellCount,
          Math.floor(((elapsed - fillStart) / 1400) * cellCount)
        );
  const showDownloadFile = staticComplete || elapsed >= 7900;
  const downloadPressed =
    staticComplete ||
    elapsed >= THREE_STEPS_LOOP_MS - THREE_STEPS_HOLD_FINAL_MS;

  const activeStep: StepKey = staticComplete
    ? "download"
    : elapsed < 3000
      ? "template"
      : elapsed < 6500
        ? "documents"
        : "download";

  const fadeOut =
    !staticComplete &&
    elapsed > THREE_STEPS_LOOP_MS - 350 &&
    elapsed < THREE_STEPS_LOOP_MS;

  return (
    <div
      data-three-steps-visuals
      data-static-complete={staticComplete ? "true" : "false"}
      role="img"
      aria-label={ariaLabel ?? t("visual.description")}
      className={cn(
        "flex flex-col gap-6 transition-opacity duration-300",
        fadeOut && "opacity-40"
      )}
    >
      <ol className="grid grid-cols-1 items-stretch gap-8 min-[1056px]:grid-cols-3 min-[1056px]:gap-12">
        {STEPS.map((step, i) => {
          const isDownload = step === "download";
          const active = staticComplete || activeStep === step;
          return (
            <li
              key={step}
              data-step={step}
              data-active={active ? "true" : "false"}
              className={cn(
                "flex h-full flex-col border-t pt-4",
                isDownload
                  ? "border-primary border-t-2"
                  : cn("border-t", STEP_RULE_MUTED)
              )}
            >
              {/* Fixed header band so grey cards share the same top edge */}
              <div className="flex min-h-[7.5rem] flex-col gap-2 sm:min-h-[8.25rem]">
                <span
                  className={cn(
                    "font-mono text-xs",
                    isDownload ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-tile text-foreground">
                  {t(`${step}.label`)}
                </h3>
                <p className="text-body text-muted-foreground max-w-[46ch] text-pretty">
                  {t(`${step}.description`)}
                </p>
              </div>

              <div
                className={cn(
                  PREVIEW_BG,
                  "mt-3 flex min-h-[280px] flex-1 flex-col gap-3 p-3 sm:min-h-[300px] sm:p-4"
                )}
                aria-hidden="true"
              >
                {step === "template" && (
                  <StepTemplateVisual
                    filename={filename}
                    dropHint={t("visual.dropHint")}
                    loadedLabel={t("template.loaded")}
                    beforeCaption={tBands("template.before")}
                    columns={columns}
                    emptyRows={emptyRows}
                    showFile={step1File}
                    showLoaded={step1Loaded}
                    showGrid={step1Grid}
                  />
                )}
                {step === "documents" && (
                  <StepDocumentsVisual
                    docsVisible={docsVisible}
                    progress={docsProgress}
                    done={docsDone}
                    sortedLabel={t("documents.sorted")}
                    readLabel={t("documents.read")}
                    roleAdp={tBands("mixed.roleAdp")}
                    roleAmortization={tBands("mixed.roleAmortization")}
                  />
                )}
                {step === "download" && (
                  <StepDownloadVisual
                    filename={filename}
                    afterCaption={tBands("template.after")}
                    downloadLabel={tBands("validation.downloadButton")}
                    columns={columns}
                    filledRows={filledRows}
                    revealed={revealed}
                    showFile={showDownloadFile}
                    pressed={downloadPressed}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground w-full text-[11px] leading-4 whitespace-nowrap">
        {tHero("visual.provenance")}
      </p>
    </div>
  );
}

function StepTemplateVisual({
  filename,
  dropHint,
  loadedLabel,
  beforeCaption,
  columns,
  emptyRows,
  showFile,
  showLoaded,
  showGrid,
}: {
  filename: string;
  dropHint: string;
  loadedLabel: string;
  beforeCaption: string;
  columns: string[];
  emptyRows: ReadonlyArray<{ label: string; values: readonly string[] }>;
  showFile: boolean;
  showLoaded: boolean;
  showGrid: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          "bg-background flex min-h-[88px] items-center justify-center border-2 px-3 py-4 transition-opacity duration-300",
          showFile ? DEEP_NAVY_BORDER : "border-gray-30 border-dashed"
        )}
      >
        {showFile ? (
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="border-gray-30 bg-background inline-flex items-center gap-1.5 border px-2 py-1">
              <ExcelFileGlyph />
              <span className="text-foreground font-mono text-[12px]">
                {filename}
              </span>
            </span>
            <span
              className={cn(
                "text-primary inline-flex items-center gap-1 text-[11px] font-semibold transition-opacity duration-300",
                showLoaded ? "opacity-100" : "opacity-0"
              )}
            >
              <Check className="size-3.5" aria-hidden="true" />
              {loadedLabel}
            </span>
          </div>
        ) : (
          <span className="sr-only">{dropHint}</span>
        )}
      </div>
      <div
        className={cn(
          "flex flex-col gap-1.5 transition-opacity duration-300",
          showGrid ? "opacity-100" : "opacity-0"
        )}
      >
        <p className="text-muted-foreground text-[11px] leading-4">
          {beforeCaption}
        </p>
        <ExcelGrid
          columns={columns}
          rows={emptyRows}
          caption={filename}
          hideCaption
          rowLabelClassName="font-normal"
          headerClassName={DEEP_NAVY_BG}
          className="w-full"
        />
      </div>
    </>
  );
}

function StepDocumentsVisual({
  docsVisible,
  progress,
  done,
  sortedLabel,
  readLabel,
  roleAdp,
  roleAmortization,
}: {
  docsVisible: number;
  progress: number;
  done: boolean;
  sortedLabel: string;
  readLabel: string;
  roleAdp: string;
  roleAmortization: string;
}) {
  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {DEMO_SOURCE_DOCS.map((doc, i) => {
          const role = doc.roleKey === "roleAdp" ? roleAdp : roleAmortization;
          const visible = i < docsVisible;
          return (
            <li
              key={doc.file}
              className={cn(
                "border-gray-20 bg-background flex items-center gap-2 border px-2.5 py-2 text-[11px] transition-[opacity,transform] duration-300",
                visible
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              )}
            >
              <PdfGlyph />
              <span className="text-foreground min-w-0 flex-1 truncate font-mono text-[11px]">
                {doc.file}
              </span>
              <span
                className={cn(
                  "shrink-0 px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap text-white",
                  doc.roleKey === "roleAdp" ? DEEP_NAVY_BG : "bg-gray-70"
                )}
              >
                {role}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground text-[11px] leading-4">
        {sortedLabel}
      </p>
      <div className="bg-gray-20 h-1.5 w-full overflow-hidden">
        <div
          className="bg-primary h-full transition-[width] duration-300 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p
        className={cn(
          "text-foreground text-[11px] font-medium transition-opacity duration-300",
          done ? "opacity-100" : "opacity-0"
        )}
      >
        {readLabel}
      </p>
    </>
  );
}

function StepDownloadVisual({
  filename,
  afterCaption,
  downloadLabel,
  columns,
  filledRows,
  revealed,
  showFile,
  pressed,
}: {
  filename: string;
  afterCaption: string;
  downloadLabel: string;
  columns: string[];
  filledRows: ReadonlyArray<{ label: string; values: readonly string[] }>;
  revealed: number;
  showFile: boolean;
  pressed: boolean;
}) {
  return (
    <>
      <p className="text-muted-foreground text-[11px] leading-4">
        {afterCaption}
      </p>
      <ExcelGrid
        columns={columns}
        rows={filledRows}
        revealed={revealed}
        caption={filename}
        hideCaption
        rowLabelClassName="font-normal"
        headerClassName={DEEP_NAVY_BG}
        valueClassName="font-mono"
        className="w-full"
      />
      <div
        className={cn(
          "border-gray-20 bg-background flex items-center gap-2 border px-3 py-2 transition-opacity duration-300",
          showFile ? "opacity-100" : "opacity-0"
        )}
      >
        <ExcelFileGlyph />
        <span className="text-foreground min-w-0 flex-1 truncate font-mono text-[12px]">
          {filename}
        </span>
      </div>
      <div
        className={cn(
          "bg-primary text-primary-foreground mt-auto flex items-center justify-between gap-3 px-3 py-2.5 text-[13px] leading-none font-medium transition-[opacity,transform] duration-300",
          revealed >= 6 ? "opacity-100" : "opacity-0",
          pressed && "translate-y-px opacity-90"
        )}
      >
        <span>{downloadLabel}</span>
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </div>
    </>
  );
}
