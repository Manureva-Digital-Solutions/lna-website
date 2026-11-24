"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHasMounted } from "@/lib/use-has-mounted";
import {
  DEMO_FILLED,
  DEMO_ISSUERS,
  DEMO_SOURCE_DOCS,
} from "@/components/landing/visuals/demo-sheet-data";

/** Total loop length (ms). Final filled + download state held ≥ 2s. */
export const HERO_LOOP_MS = 9000;
const HOLD_FINAL_MS = 2500;

/** Phase unlock times (ms from loop start). Exported for tests. */
export const HERO_LOOP_PHASE_MS = {
  rate: 700,
  cost: 2000,
  quota: 3300,
  others: 4800,
  download: HERO_LOOP_MS - HOLD_FINAL_MS,
} as const;

/** Discrete animation steps — state updates only on these boundaries. */
const PHASE_STEPS = [
  { at: 0, phase: 0 },
  { at: HERO_LOOP_PHASE_MS.rate, phase: 1 },
  { at: HERO_LOOP_PHASE_MS.cost, phase: 2 },
  { at: HERO_LOOP_PHASE_MS.quota, phase: 3 },
  { at: HERO_LOOP_PHASE_MS.others, phase: 4 },
  { at: HERO_LOOP_PHASE_MS.download, phase: 5 },
] as const;

const FINAL_PHASE = 5;

type FieldKey = "rate" | "cost" | "quota";

type ConnectorPath = {
  key: FieldKey;
  d: string;
  on: boolean;
  x1: number;
  y1: number;
};

/**
 * LNAW-121 — animated homepage hero matching the FR final-frame mockup:
 * PDF stack → field highlights → navy connectors → Excel fills → status + download.
 * Built in code (GIF/MP4 are reference only). No review/confidence cues.
 */
export function HeroLoopVisual() {
  const t = useTranslations("home.hero");
  const loop = useTranslations("home.hero.loop");
  const g = useTranslations("grid");
  const x = useTranslations("home.hero.excel");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const mounted = useHasMounted();
  // LNAW-119 — prefers-reduced-motion is client-only knowledge, so honour it
  // only once hydrated: SSR and the first client paint must render the same
  // opening frame (phase 0) whatever the user's motion preference.
  const motionReduced = mounted && reduceMotion === true;

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

  const values = useMemo(
    () => ({
      rate: DEMO_FILLED.rate.map((v) => pct(v)),
      cost: DEMO_FILLED.totalCost.map((v) => eur(v)),
      quota: DEMO_FILLED.quota.map((v) => pct(v, 0)),
    }),
    // locale drives formatters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale]
  );

  // Start empty to avoid a completed-frame flash before the loop begins.
  const [phase, setPhase] = useState(0);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(
    () =>
      typeof document === "undefined" || document.visibilityState !== "hidden"
  );

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onVisibility = () => {
      setPageVisible(document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (motionReduced) {
      setPhase(FINAL_PHASE);
      return;
    }

    if (!inView || !pageVisible) {
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const clearTimers = () => {
      for (const id of timers) window.clearTimeout(id);
      timers.length = 0;
    };

    const runLoop = () => {
      if (cancelled) return;
      clearTimers();
      setPhase(0);
      for (const step of PHASE_STEPS) {
        if (step.at === 0) continue;
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) setPhase(step.phase);
          }, step.at)
        );
      }
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) runLoop();
        }, HERO_LOOP_MS)
      );
    };

    runLoop();

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [motionReduced, inView, pageVisible]);

  // After mount, reduced motion jumps straight to the final frame so the loop
  // never plays; before mount `motionReduced` is false and we render phase 0,
  // which is exactly what the server rendered.
  const activePhase = motionReduced ? FINAL_PHASE : phase;
  const showRate = activePhase >= 1;
  const showCost = activePhase >= 2;
  const showQuota = activePhase >= 3;
  const showOthers = activePhase >= 4;
  const showDownload = activePhase >= 5;

  const fieldsFilled =
    Number(showRate) +
    Number(showCost) +
    Number(showQuota) +
    (showOthers ? 6 : 0);
  const docsRead = showOthers
    ? 4
    : showQuota
      ? 2
      : showCost || showRate
        ? 1
        : 0;

  const activeField: FieldKey | null =
    motionReduced || activePhase >= 4
      ? null
      : activePhase === 1
        ? "rate"
        : activePhase === 2
          ? "cost"
          : activePhase === 3
            ? "quota"
            : null;

  const cellVisible = (issuerIdx: number, field: FieldKey) => {
    if (motionReduced || showOthers) return true;
    if (issuerIdx > 0) return false;
    if (field === "rate") return showRate;
    if (field === "cost") return showCost;
    return showQuota;
  };

  const cellHighlight = (issuerIdx: number, field: FieldKey) =>
    !motionReduced && issuerIdx === 0 && activeField === field;

  const pdfFields = [
    {
      key: "rate" as const,
      label: loop("fieldRate"),
      value: values.rate[0],
      show: showRate,
    },
    {
      key: "cost" as const,
      label: loop("fieldCost"),
      value: values.cost[0],
      show: showCost,
    },
    {
      key: "quota" as const,
      label: loop("fieldQuota"),
      value: values.quota[0],
      show: showQuota,
    },
  ];

  const tabs = [
    x("tabFile"),
    x("tabHome"),
    x("tabInsert"),
    x("tabLayout"),
    x("tabFormulas"),
    x("tabData"),
    x("tabView"),
  ] as const;

  const colLetters = ["A", "B", "C", "D"] as const;

  const rows = [
    { key: "rate" as const, label: g("rowRate"), vals: values.rate },
    { key: "cost" as const, label: g("rowTotalCost"), vals: values.cost },
    { key: "quota" as const, label: g("rowQuota"), vals: values.quota },
  ];

  const formulaValue = values.rate[2];
  const anyFieldShown = showRate || showCost || showQuota;

  const excelWindowRef = useRef<HTMLDivElement>(null);
  const pdfFieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>(
    {}
  );
  const excelRowRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>(
    {}
  );
  const [connectors, setConnectors] = useState<ConnectorPath[]>([]);
  const [showConnectors, setShowConnectors] = useState(false);

  const fieldOn: Record<FieldKey, boolean> = {
    rate: showRate,
    cost: showCost,
    quota: showQuota,
  };

  useLayoutEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      const excel = excelWindowRef.current;
      if (!root || !excel) return;
      const wide =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(min-width: 1056px)").matches
          : root.clientWidth >= 640;
      setShowConnectors(wide);
      if (!wide) {
        setConnectors([]);
        return;
      }

      const rootBox = root.getBoundingClientRect();
      const excelBox = excel.getBoundingClientRect();
      // Land just left of the sheet edge, vertically on rows 2 / 3 / 4.
      const x1Base = excelBox.left - rootBox.left - 6;
      const next: ConnectorPath[] = [];

      (["rate", "cost", "quota"] as const).forEach((key) => {
        const from = pdfFieldRefs.current[key]?.getBoundingClientRect();
        const row = excelRowRefs.current[key]?.getBoundingClientRect();
        if (!from || !row) return;

        const x0 = from.right - rootBox.left;
        const y0 = from.top + from.height / 2 - rootBox.top;
        const x1 = x1Base;
        const y1 = row.top + row.height / 2 - rootBox.top;
        const span = Math.max(32, x1 - x0);

        next.push({
          key,
          on: fieldOn[key],
          x1,
          y1,
          d: `M ${x0} ${y0} C ${x0 + span * 0.55} ${y0}, ${x1 - span * 0.35} ${y1}, ${x1} ${y1}`,
        });
      });

      setConnectors(next);
    };

    measure();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    if (ro && rootRef.current) ro.observe(rootRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
    // Re-measure when fields/cells appear so paths stay aligned.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRate, showCost, showQuota, locale, motionReduced]);

  return (
    <div
      ref={rootRef}
      data-hero-loop
      data-hero-phase={activePhase}
      role="img"
      aria-label={t("visual.description")}
      className="relative w-full min-w-0"
    >
      <div className="grid min-w-0 grid-cols-1 gap-6 min-[1056px]:grid-cols-[minmax(200px,0.78fr)_minmax(0,1.22fr)] min-[1056px]:items-start min-[1056px]:gap-16 xl:gap-20">
        {/* —— PDF stack —— */}
        <div className="relative min-w-0 overflow-visible pt-3 pr-3">
          {/* Back pages — fully inside padding so ADP tabs are never clipped */}
          <div
            className="border-border bg-card absolute top-0 right-0 h-[calc(100%-1.75rem)] w-[calc(100%-0.75rem)] border"
            aria-hidden="true"
          >
            <span className="text-background absolute top-0 right-0 z-[1] bg-gray-100 px-1.5 py-0.5 font-mono text-[8px] leading-none font-semibold tracking-wide uppercase">
              ADP
            </span>
          </div>
          <div
            className="border-border bg-card absolute top-2.5 right-2 h-[calc(100%-2rem)] w-[calc(100%-0.85rem)] border"
            aria-hidden="true"
          >
            <span className="text-background absolute top-0 right-0 z-[1] bg-gray-100 px-1.5 py-0.5 font-mono text-[8px] leading-none font-semibold tracking-wide uppercase">
              ADP
            </span>
          </div>

          {/* Front PDF — mt keeps badge clear of ADP tabs */}
          <div className="border-border bg-card relative mt-4 flex min-h-[26rem] flex-col border pb-3 shadow-none sm:min-h-[28rem] sm:pb-3.5">
            {/* Badge flush with top-right card edge (inside card, not clipped) */}
            <span className="bg-foreground text-background absolute top-0 right-0 z-10 px-2 py-1.5 text-[9px] leading-none font-semibold whitespace-nowrap sm:text-[10px]">
              {loop("pdfBadge")}
            </span>

            <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5 pr-[7.5rem] sm:px-4 sm:pt-4 sm:pr-[8.5rem]">
              <div className="min-w-0">
                <p className="text-foreground text-[13px] leading-tight font-bold tracking-tight sm:text-[14px]">
                  {loop("pdfIssuer")}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
                  {loop("pdfProduct")}
                </p>
              </div>
              <div className="mt-6 flex shrink-0 flex-col items-end gap-0.5 sm:mt-7">
                <span className="text-muted-foreground text-[9px] leading-tight whitespace-nowrap">
                  {loop("pdfQuoteRef")}
                </span>
                <span className="text-muted-foreground text-[9px] leading-tight whitespace-nowrap">
                  {loop("pdfLoanMeta")}
                </span>
              </div>
            </div>

            <div className="mx-3.5 mt-3 h-0.5 bg-[#111827] sm:mx-4" />

            <div className="flex flex-1 flex-col px-3.5 sm:px-4">
              <p className="text-foreground mt-3 text-[12px] leading-snug font-semibold sm:text-[13px]">
                {loop("pdfHeading")}
              </p>

              <div className="mt-3 flex flex-col gap-1.5" aria-hidden="true">
                <span className="bg-gray-20 h-1.5 w-full" />
                <span className="bg-gray-20 h-1.5 w-[92%]" />
                <span className="bg-gray-20 h-1.5 w-[78%]" />
              </div>

              {/* Unified 3-row block: shared outer border, 0 gap, internal dividers only */}
              <div
                className={cn(
                  "mt-4 border border-solid",
                  anyFieldShown ? "border-primary" : "border-border/70"
                )}
              >
                {pdfFields.map((field, i) => (
                  <div
                    key={field.key}
                    ref={(el) => {
                      pdfFieldRefs.current[field.key] = el;
                    }}
                    data-pdf-field={field.key}
                    className={cn(
                      "m-0 flex items-center justify-between gap-3 px-2.5 py-2.5 text-[11px] leading-snug transition-[background-color,opacity] duration-300 motion-reduce:transition-none sm:text-[12px]",
                      i > 0 && "border-t border-solid",
                      i > 0 &&
                        (anyFieldShown ? "border-primary" : "border-border/70"),
                      field.show
                        ? "text-foreground bg-[#e8eef7]"
                        : "bg-card text-muted-foreground"
                    )}
                  >
                    <span className="text-muted-foreground min-w-0 font-normal">
                      {field.label}
                    </span>
                    <span
                      className={cn(
                        "text-foreground shrink-0 font-mono text-[12px] font-semibold tabular-nums transition-opacity duration-300 motion-reduce:transition-none sm:text-[13px]",
                        field.show ? "opacity-100" : "opacity-35"
                      )}
                    >
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-foreground mt-3.5 flex items-baseline justify-between gap-2 text-[11px]">
                <span className="font-semibold">
                  {loop("pdfGuaranteesLabel")}
                </span>
                <span className="text-muted-foreground font-mono tracking-wide">
                  {loop("pdfGuaranteesValue")}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-1.5" aria-hidden="true">
                <span className="bg-gray-20 h-1.5 w-full" />
                <span className="bg-gray-20 h-1.5 w-[94%]" />
                <span className="bg-gray-20 h-1.5 w-[86%]" />
                <span className="bg-gray-20 h-1.5 w-[72%]" />
                <span className="bg-gray-20 h-1.5 w-[58%]" />
              </div>

              <p className="text-muted-foreground mt-auto pt-4 text-[9px] leading-tight">
                {loop("pdfDocNote")}
              </p>
            </div>
          </div>

          <p className="text-muted-foreground mt-2 font-mono text-[10px]">
            {DEMO_SOURCE_DOCS[0].file}
          </p>
        </div>

        {/* —— Excel + status —— */}
        <div className="flex min-w-0 flex-col">
          <div
            ref={excelWindowRef}
            className="border-border bg-card overflow-hidden rounded-none border shadow-none"
          >
            {/* Title bar */}
            <div className="bg-excel-green flex items-center gap-1.5 px-2 py-1 text-white">
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="size-3 shrink-0"
              >
                <rect width="16" height="16" fill="#185C37" />
                <path
                  fill="#fff"
                  d="M4.1 3.2h2.2l1.7 3.05L9.7 3.2h2.2L9.4 8l2.6 4.8H9.7L7.95 9.7 6.2 12.8H4l2.55-4.8z"
                />
              </svg>
              <span className="truncate font-mono text-[10px] tracking-tight sm:text-[11px]">
                {x("filename")}
              </span>
              <span
                className="ml-auto flex shrink-0 items-center gap-1.5 opacity-90"
                aria-hidden="true"
              >
                <span className="size-1.5 rounded-full bg-white/55" />
                <span className="size-1.5 rounded-full bg-white/55" />
                <span className="size-1.5 rounded-full bg-white/90" />
              </span>
            </div>

            {/* Ribbon */}
            <div className="border-border bg-gray-10 flex flex-wrap gap-x-0.5 overflow-hidden border-b px-1 pt-0.5 text-[9px] sm:flex-nowrap sm:px-1.5 sm:text-[10px]">
              {tabs.map((tab, i) => (
                <span
                  key={tab}
                  className={cn(
                    "shrink-0 px-0.5 py-1 whitespace-nowrap sm:px-1.5",
                    i >= 4 && "max-sm:hidden",
                    i === 1
                      ? "text-foreground border-excel-green border-b-2 font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {tab}
                </span>
              ))}
            </div>

            {/* Formula bar */}
            <div className="border-border flex h-[28px] items-center border-b text-[9px] sm:h-[30px] sm:text-[12px]">
              <span className="border-border text-foreground inline-flex h-full w-10 shrink-0 items-center border-r px-1.5 font-mono sm:w-[56px] sm:px-2">
                {x("formulaRef")}
              </span>
              <span className="border-border text-muted-foreground inline-flex h-full shrink-0 items-center border-r px-1.5 italic sm:px-2.5">
                {x("formulaFx")}
              </span>
              <span className="text-foreground flex h-full min-w-0 flex-1 items-center overflow-hidden px-1.5 font-mono sm:px-2.5">
                <span className="truncate">{formulaValue}</span>
              </span>
            </div>

            {/* Sheet grid */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[17.5rem] border-collapse text-left text-[9px] tabular-nums sm:text-[10px]">
                <thead>
                  <tr className="bg-gray-10 text-muted-foreground">
                    <th className="border-border w-5 border-r border-b px-0.5 py-0.5 text-center font-normal sm:w-6">
                      {" "}
                    </th>
                    {colLetters.map((letter) => (
                      <th
                        key={letter}
                        className="border-border border-r border-b px-1 py-0.5 text-center font-normal"
                      >
                        {letter}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th className="border-border text-muted-foreground bg-gray-10 w-5 border-r border-b px-0.5 py-0.5 text-center font-normal sm:w-6">
                      1
                    </th>
                    <td className="bg-sheet-header border-r border-b border-white/15 px-1 py-0.5 text-left font-semibold text-white">
                      {g("colGuarantee")}
                    </td>
                    {DEMO_ISSUERS.map((issuer) => (
                      <td
                        key={issuer}
                        className="bg-sheet-header border-r border-b border-white/15 px-1 py-0.5 text-right font-semibold text-white"
                      >
                        <span className="line-clamp-1">{issuer}</span>
                      </td>
                    ))}
                  </tr>

                  {rows.map((row, rowIdx) => {
                    const excelRow = rowIdx + 2;
                    return (
                      <tr key={row.key}>
                        <th
                          ref={(el) => {
                            excelRowRefs.current[row.key] = el;
                          }}
                          className="border-border text-muted-foreground bg-gray-10 border-r border-b px-0.5 py-0.5 text-center font-normal"
                        >
                          {excelRow}
                        </th>
                        <td className="border-border text-foreground border-r border-b px-1 py-0.5 font-semibold">
                          {row.label}
                        </td>
                        {row.vals.map((val, issuerIdx) => {
                          const visible = cellVisible(issuerIdx, row.key);
                          const highlight = cellHighlight(issuerIdx, row.key);
                          return (
                            <td
                              key={`${row.key}-${issuerIdx}`}
                              data-hero-cell={`${row.key}-${issuerIdx}`}
                              className={cn(
                                "border-border border-r border-b px-1 py-0.5 text-right transition-colors duration-300 motion-reduce:transition-none",
                                highlight &&
                                  "outline-primary bg-[#e8eef7] outline-2 -outline-offset-2"
                              )}
                            >
                              <span
                                className={cn(
                                  "text-foreground font-mono transition-opacity duration-300 motion-reduce:transition-none",
                                  visible ? "opacity-100" : "opacity-0"
                                )}
                              >
                                {val}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {Array.from({ length: 4 }, (_, i) => {
                    const excelRow = i + 5;
                    return (
                      <tr key={`empty-${excelRow}`}>
                        <th className="border-border text-muted-foreground bg-gray-10 h-[26px] border-r border-b px-0.5 py-0.5 text-center font-normal sm:h-[28px]">
                          {excelRow}
                        </th>
                        {colLetters.map((_, colIdx) => (
                          <td
                            key={`e-${excelRow}-${colIdx}`}
                            className="border-border h-[26px] border-r border-b px-1 py-0.5 sm:h-[28px]"
                          />
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Excel status bar — white, Feuil1 left / Prêt right */}
            <div className="border-border bg-card text-muted-foreground flex items-center justify-between border-t px-2 py-1 text-[9px] sm:text-[10px]">
              <span className="bg-card text-foreground border-border border px-2 py-0.5">
                {x("sheet")}
              </span>
              <span className="pr-1">{x("ready")}</span>
            </div>
          </div>

          {/* Summary / download bar — 24px+ gap below Excel */}
          <div
            data-hero-loop-status
            className="border-border bg-card mt-6 grid grid-cols-2 border sm:mt-8 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.6fr)_auto]"
          >
            <div className="border-border flex flex-col justify-center border-b px-3 py-2.5 sm:border-r sm:border-b-0">
              <span className="text-muted-foreground text-[10px] leading-none">
                {loop("documentsReadLabel")}
              </span>
              <span className="text-foreground mt-1.5 text-[13px] leading-none font-bold tabular-nums">
                {docsRead} / 4
              </span>
            </div>
            <div className="border-border flex flex-col justify-center border-b px-3 py-2.5 sm:border-r sm:border-b-0">
              <span className="text-muted-foreground text-[10px] leading-none">
                {loop("fieldsFilledLabel")}
              </span>
              <span className="text-foreground mt-1.5 text-[13px] leading-none font-bold tabular-nums">
                {fieldsFilled}
              </span>
            </div>
            <div className="border-border flex min-w-0 flex-col justify-center px-3 py-2.5 max-sm:border-r sm:border-r">
              <span className="text-muted-foreground text-[10px] leading-none">
                {loop("fileLabel")}
              </span>
              <span className="text-foreground mt-1.5 font-mono text-[12px] leading-none whitespace-nowrap">
                {x("filename")}
              </span>
            </div>
            <div
              className={cn(
                "bg-primary text-primary-foreground flex items-center justify-between gap-6 px-5 py-3 text-[13px] leading-none font-medium transition-opacity duration-300 motion-reduce:transition-none",
                showDownload ? "opacity-100" : "opacity-0"
              )}
            >
              <span className="whitespace-nowrap">
                {loop("downloadButton")}
              </span>
              <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Measured connectors — desktop only; end left of Excel with endpoint dots */}
      {showConnectors && (
        <svg
          className="pointer-events-none absolute inset-0 z-10 hidden h-full w-full overflow-visible min-[1056px]:block"
          aria-hidden="true"
        >
          {connectors.map((line) => (
            <g
              key={line.key}
              style={{ opacity: line.on ? 1 : 0 }}
              className="transition-opacity duration-300 motion-reduce:transition-none"
            >
              <path
                d={line.d}
                fill="none"
                stroke="#14366F"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
              <circle cx={line.x1} cy={line.y1} r="4.5" fill="#14366F" />
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
