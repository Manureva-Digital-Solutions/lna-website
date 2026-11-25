"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExcelGrid } from "@/components/landing/visuals/ExcelGrid";
import {
  DEMO_USE_CASE_ADP,
  DEMO_USE_CASE_CONDO,
  DEMO_USE_CASE_HEALTH,
} from "@/components/landing/visuals/demo-use-case-data";

export type UseCaseKey = "adp" | "health" | "condo";

const CELL_COUNT = 3;
const FILL_MS = 700;

/**
 * LNAW-127 — compact document → filled-rows visual for use-case cards.
 * Optional one-shot fill on scroll-in; static under reduced motion.
 */
export function UseCaseBeforeAfter({ useCase }: { useCase: UseCaseKey }) {
  const t = useTranslations(`home.useCases.${useCase}`);
  const g = useTranslations("grid");
  const locale = useLocale();
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(CELL_COUNT);
  const [started, setStarted] = useState(false);
  const showFilled = !!reduceMotion || !started ? CELL_COUNT : revealed;

  useEffect(() => {
    if (reduceMotion) return;
    const el = rootRef.current;
    if (!el) return;

    const begin = () => setStarted(true);

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (rect.top < vh * 0.92 && rect.bottom > 0) {
      begin();
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      begin();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          begin();
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !started) return;
    let frame = 0;
    let startedAt = 0;
    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / FILL_MS);
      setRevealed(Math.max(1, Math.ceil(progress * CELL_COUNT)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    // Start empty on the first animation frame (avoids sync setState-in-effect).
    frame = requestAnimationFrame((now) => {
      setRevealed(0);
      startedAt = now;
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, started]);

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

  const sheet =
    useCase === "adp"
      ? buildAdpSheet(g, pct, eur)
      : useCase === "health"
        ? buildHealthSheet(t, eur)
        : buildCondoSheet(t, eur);

  return (
    <div
      ref={rootRef}
      data-use-case-visual={useCase}
      role="img"
      aria-label={t("visualLabel")}
      className="mt-5 grid min-h-[148px] min-w-0 grid-cols-2 items-stretch gap-2"
    >
      <DocExcerpt
        badge={t("docBadge")}
        title={t("docHeading")}
        file={sheet.docFile}
        fields={sheet.docFields}
      />
      <div className="border-border flex h-full min-h-0 min-w-0 flex-col border">
        <ExcelGrid
          columns={sheet.columns}
          rows={sheet.rows}
          caption={sheet.caption}
          hideCaption
          compact
          revealed={showFilled}
          rowLabelClassName="!text-[10px] font-normal"
          valueClassName="font-mono text-[10px]"
          headerClassName="bg-primary"
          className="h-full min-h-0 min-w-0 flex-1 overflow-hidden border-0 text-[10px] [&_table]:h-full [&_tbody_tr]:h-[28px] [&_td]:px-1 [&_th]:px-1"
        />
      </div>
    </div>
  );
}

function DocExcerpt({
  badge,
  title,
  file,
  fields,
}: {
  badge: string;
  title: string;
  file: string;
  fields: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <div className="border-border bg-background flex h-full min-h-0 min-w-0 flex-col border p-2">
      <div className="flex min-h-[28px] items-start justify-between gap-1.5">
        <p className="text-foreground min-w-0 flex-1 text-[10px] leading-tight font-semibold">
          {title}
        </p>
        <span className="bg-foreground text-background shrink-0 px-1.5 py-0.5 text-[8px] leading-none font-semibold whitespace-nowrap">
          {badge}
        </span>
      </div>
      <ul className="mt-2 grid min-h-0 flex-1 grid-rows-3 gap-1">
        {fields.map((field) => (
          <li
            key={field.label}
            className="border-primary/40 bg-primary/5 flex min-h-[28px] min-w-0 items-center justify-between gap-1.5 border px-1.5 py-1"
          >
            <span className="text-muted-foreground shrink-0 text-[9px] leading-none">
              {field.label}
            </span>
            <span
              title={field.value}
              className="text-foreground min-w-0 truncate text-right font-mono text-[10px] leading-none font-semibold tabular-nums"
            >
              {field.value}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground mt-2 truncate font-mono text-[8px] leading-none">
        {file}
      </p>
    </div>
  );
}

type Field = { label: string; value: string };

function toRows(fields: Field[]) {
  return fields.map((f) => ({ label: f.label, values: [f.value] as const }));
}

function buildAdpSheet(
  g: (key: string) => string,
  pct: (v: number, digits?: number) => string,
  eur: (v: number) => string
) {
  const d = DEMO_USE_CASE_ADP;
  const fields: Field[] = [
    { label: g("rowRate"), value: pct(d.rate) },
    { label: g("rowTotalCost"), value: eur(d.totalCost) },
    { label: g("rowQuota"), value: pct(d.quota, 0) },
  ];
  return {
    docFile: d.docFile,
    caption: "comparison.xlsx",
    columns: [g("colGuarantee"), d.issuer],
    docFields: fields,
    rows: toRows(fields),
  };
}

function buildHealthSheet(
  t: (key: string) => string,
  eur: (v: number) => string
) {
  const d = DEMO_USE_CASE_HEALTH;
  const fields: Field[] = [
    { label: t("rowHospital"), value: eur(d.hospital) },
    { label: t("rowOptical"), value: eur(d.optical) },
    { label: t("rowDental"), value: eur(d.dental) },
  ];
  return {
    docFile: d.docFile,
    caption: "suivi-sante.xlsx",
    columns: [t("colCover"), d.issuer],
    docFields: fields,
    rows: toRows(fields),
  };
}

function buildCondoSheet(
  t: (key: string) => string,
  eur: (v: number) => string
) {
  const d = DEMO_USE_CASE_CONDO;
  const fields: Field[] = [
    { label: t("rowItem"), value: d.item },
    { label: t("rowAmount"), value: eur(d.amount) },
    { label: t("rowKey"), value: d.allocationKey },
  ];
  return {
    docFile: d.docFile,
    caption: "charges.xlsx",
    columns: [t("colField"), d.building],
    docFields: fields,
    rows: toRows(fields),
  };
}
