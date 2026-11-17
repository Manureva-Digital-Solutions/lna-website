"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Cell =
  | { kind: "text"; value: string }
  | { kind: "review"; value: string }
  | { kind: "empty" };

/**
 * Sober HTML Excel window for the homepage hero (LNAW-87).
 * Values match existing site illustrations (Generali / April / MetLife).
 * Chrome labels follow the page locale (LNA-252).
 */
export function HeroExcelWindow() {
  const t = useTranslations("home.hero");
  const g = useTranslations("grid");
  const x = useTranslations("home.hero.excel");
  const locale = useLocale();
  const reviewMarker = x("reviewMarker");

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

  const tabs = [
    x("tabFile"),
    x("tabHome"),
    x("tabInsert"),
    x("tabLayout"),
    x("tabFormulas"),
    x("tabData"),
    x("tabReview"),
    x("tabView"),
  ] as const;

  const colLetters = ["A", "B", "C", "D", "E", "F"] as const;

  // Row 1 = header; rows 2–4 = data; 5–12 empty. E/F stay empty (hide on small screens).
  const headerCells: Cell[] = [
    { kind: "text", value: g("colGuarantee") },
    { kind: "text", value: "Generali" },
    { kind: "text", value: "April" },
    { kind: "text", value: "MetLife" },
    { kind: "empty" },
    { kind: "empty" },
  ];

  const dataRows: { label: string; cells: Cell[] }[] = [
    {
      label: g("rowRate"),
      cells: [
        { kind: "text", value: pct(0.34) },
        { kind: "text", value: pct(0.29) },
        { kind: "review", value: pct(0.41) },
        { kind: "empty" },
        { kind: "empty" },
      ],
    },
    {
      label: g("rowTotalCost"),
      cells: [
        { kind: "text", value: eur(4218) },
        { kind: "text", value: eur(3640) },
        { kind: "text", value: eur(5102) },
        { kind: "empty" },
        { kind: "empty" },
      ],
    },
    {
      label: g("rowQuota"),
      cells: [
        { kind: "text", value: pct(100, 0) },
        { kind: "review", value: pct(50, 0) },
        { kind: "text", value: pct(100, 0) },
        { kind: "empty" },
        { kind: "empty" },
      ],
    },
  ];

  const formulaReview = pct(0.41);

  return (
    <div
      role="img"
      aria-label={t("visual.description")}
      className="border-border bg-card overflow-hidden rounded-none border shadow-none"
    >
      {/* Title bar */}
      <div className="bg-excel-green flex items-center gap-1.5 px-2 py-1 text-white">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 shrink-0">
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
          className="ml-auto flex shrink-0 items-center gap-1 opacity-80"
          aria-hidden="true"
        >
          <span className="size-1.5 rounded-none bg-white/40" />
          <span className="size-1.5 rounded-none bg-white/40" />
          <span className="size-1.5 rounded-none bg-white/70" />
        </span>
      </div>

      {/* Ribbon tabs — wrap on narrow screens so every locale label stays visible without hiding or scrolling */}
      <div className="border-border bg-gray-10 flex flex-wrap gap-x-0.5 gap-y-0 border-b px-1.5 pt-0.5 text-[9px] sm:flex-nowrap sm:overflow-hidden sm:text-[10px]">
        {tabs.map((tab, i) => (
          <span
            key={tab}
            className={cn(
              "shrink-0 px-1 py-1 whitespace-nowrap sm:px-1.5",
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
      <div className="border-border flex items-center gap-1.5 border-b px-1.5 py-0.5 text-[9px] sm:text-[10px]">
        <span className="border-border bg-background text-foreground inline-flex h-5 min-w-7 items-center justify-center border px-1 font-mono">
          D2
        </span>
        <span className="border-border bg-background text-foreground flex h-5 min-w-0 flex-1 items-center overflow-hidden border px-1.5 font-mono">
          <span className="text-status-low shrink-0">{reviewMarker}</span>
          <span className="text-foreground ml-1 truncate">{formulaReview}</span>
        </span>
      </div>

      {/* Sheet grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-left text-[9px] tabular-nums sm:text-[10px]">
          <thead>
            <tr className="bg-gray-10 text-muted-foreground">
              <th className="border-border w-6 border-r border-b px-0.5 py-0.5 text-center font-normal">
                {" "}
              </th>
              {colLetters.map((letter, i) => (
                <th
                  key={letter}
                  className={cn(
                    "border-border border-r border-b px-1 py-0.5 text-center font-normal",
                    i >= 4 && "hidden sm:table-cell"
                  )}
                >
                  {letter}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Header row 1 */}
            <tr>
              <th className="border-border text-muted-foreground bg-gray-10 w-6 border-r border-b px-0.5 py-0.5 text-center font-normal">
                1
              </th>
              {headerCells.map((cell, i) => (
                <td
                  key={`h-${i}`}
                  className={cn(
                    "bg-sheet-header border-r border-b border-white/15 px-1 py-0.5 font-semibold text-white",
                    i === 0 ? "text-left" : "text-right",
                    i >= 4 && "hidden sm:table-cell"
                  )}
                >
                  {cell.kind === "empty" ? null : cell.value}
                </td>
              ))}
            </tr>

            {dataRows.map((row, rowIdx) => {
              const excelRow = rowIdx + 2;
              return (
                <tr key={row.label}>
                  <th className="border-border text-muted-foreground bg-gray-10 border-r border-b px-0.5 py-0.5 text-center font-normal">
                    {excelRow}
                  </th>
                  <td className="border-border text-foreground border-r border-b px-1 py-0.5 font-semibold">
                    {row.label}
                  </td>
                  {row.cells.map((cell, i) => {
                    const isSelected = excelRow === 2 && i === 2; // D2
                    return (
                      <td
                        key={`${row.label}-${i}`}
                        className={cn(
                          "border-border border-r border-b px-1 py-0.5 text-right",
                          i >= 3 && "hidden sm:table-cell",
                          isSelected &&
                            "outline-excel-green outline outline-2 -outline-offset-2"
                        )}
                      >
                        <CellContent cell={cell} reviewMarker={reviewMarker} />
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Empty rows 5–12 for the sober window height */}
            {Array.from({ length: 8 }, (_, i) => {
              const excelRow = i + 5;
              return (
                <tr key={`empty-${excelRow}`}>
                  <th className="border-border text-muted-foreground bg-gray-10 border-r border-b px-0.5 py-0.5 text-center font-normal">
                    {excelRow}
                  </th>
                  {colLetters.map((_, colIdx) => (
                    <td
                      key={`e-${excelRow}-${colIdx}`}
                      className={cn(
                        "border-border border-r border-b px-1 py-0.5",
                        colIdx >= 4 && "hidden sm:table-cell"
                      )}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Status bar */}
      <div className="border-border bg-gray-10 text-muted-foreground flex items-center justify-between border-t px-1.5 py-0.5 text-[9px] sm:text-[10px]">
        <span className="bg-card text-foreground border-border border px-1.5 py-0.5">
          {x("sheet")}
        </span>
        <span>{x("ready")}</span>
      </div>
    </div>
  );
}

function CellContent({
  cell,
  reviewMarker,
}: {
  cell: Cell;
  reviewMarker: string;
}) {
  if (cell.kind === "empty") return null;
  if (cell.kind === "text") {
    return <span className="text-foreground">{cell.value}</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-baseline justify-end gap-x-1">
      <span className="text-status-low font-mono">{reviewMarker}</span>
      <span className="text-foreground">{cell.value}</span>
    </span>
  );
}
