import { useTranslations, useLocale } from "next-intl";
import {
  DEMO_CONFIDENCE,
  DEMO_FILLED,
  DEMO_ISSUERS,
} from "@/components/landing/visuals/demo-sheet-data";

/** Bandes visuelles de la grille d'étape 3 de l'app. */
const HIGH = 0.8;
const MEDIUM = 0.5;
/** Seuil de relecture de l'export : sous ce score, la cellule part en [REVIEW]. */
const REVIEW_THRESHOLD = 0.6;

type Level = "high" | "medium" | "low";

function levelOf(score: number): Level {
  if (score >= HIGH) return "high";
  if (score >= MEDIUM) return "medium";
  return "low";
}

/** Shape + colour — never colour alone (frozen v4 / a11y). */
function StatusShape({ level }: { level: Level }) {
  if (level === "high") {
    return (
      <span
        className="bg-status-high size-2.5 shrink-0 rounded-full"
        aria-hidden="true"
      />
    );
  }
  if (level === "medium") {
    return (
      <span
        className="bg-status-medium size-2 shrink-0 rotate-45"
        aria-hidden="true"
      />
    );
  }
  return (
    <span
      className="inline-block size-0 shrink-0 border-x-[5px] border-b-[9px] border-x-transparent border-b-[var(--status-low)]"
      aria-hidden="true"
    />
  );
}

interface Cell {
  value: number;
  score: number;
}

type RowLabelKey = "rowRate" | "rowTotalCost" | "rowQuota";

interface Row {
  labelKey: RowLabelKey;
  format: "pct" | "eur";
  confidence: number;
  cells: readonly Cell[];
}

const ROWS: readonly Row[] = [
  {
    labelKey: "rowRate",
    format: "pct",
    confidence: DEMO_CONFIDENCE.row[0],
    cells: DEMO_ISSUERS.map((_, i) => ({
      value: DEMO_FILLED.rate[i],
      score: DEMO_CONFIDENCE.rate[i],
    })),
  },
  {
    labelKey: "rowTotalCost",
    format: "eur",
    confidence: DEMO_CONFIDENCE.row[1],
    cells: DEMO_ISSUERS.map((_, i) => ({
      value: DEMO_FILLED.totalCost[i],
      score: DEMO_CONFIDENCE.totalCost[i],
    })),
  },
  {
    labelKey: "rowQuota",
    format: "pct",
    confidence: DEMO_CONFIDENCE.row[2],
    cells: DEMO_ISSUERS.map((_, i) => ({
      value: DEMO_FILLED.quota[i],
      score: DEMO_CONFIDENCE.quota[i],
    })),
  },
];

/**
 * Carbon data table (lna-v4-fr.html `.dt`): white card on Gray 10 stage.
 * Header Gray 20 / 48px · rows Gray 10 / 64px · value stacked over status.
 * Legend footer white; `[REVIEW]` note right-aligned.
 * Columns match the shared fictional ADP demo set.
 */
export function ConfidenceGrid() {
  const t = useTranslations("home.bands.confidence");
  const g = useTranslations("grid");
  const locale = useLocale();
  const reviewMarker = useTranslations("home.hero.excel")("reviewMarker");
  const fmt = (v: number, kind: "pct" | "eur") =>
    kind === "eur"
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "EUR",
        }).format(v)
      : new Intl.NumberFormat(locale, {
          style: "percent",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(v / 100);
  const levelLabel: Record<Level, string> = {
    high: t("levelHigh"),
    medium: t("levelMedium"),
    low: t("levelLow"),
  };

  // Cell chrome — frozen `.dt` densifies ≤672 (6px pad, 11.5px type, hide #).
  const cellPad =
    "h-16 px-4 align-middle max-[671px]:h-[60px] max-[671px]:px-1.5";
  const headPad = "h-12 px-4 align-middle font-semibold max-[671px]:px-1.5";

  return (
    <div
      data-confidence-grid
      className="bg-background max-w-full overflow-hidden rounded-none shadow-none"
    >
      <div className="max-w-full overflow-x-auto max-[671px]:overflow-x-hidden">
        <table className="w-full min-w-0 border-collapse text-left text-sm tabular-nums max-[671px]:table-fixed max-[671px]:text-[11.5px] min-[672px]:min-w-[36rem]">
          <caption className="sr-only">{t("tableCaption")}</caption>
          <thead>
            <tr className="bg-gray-20 text-foreground">
              <th scope="col" className={`${headPad} max-[671px]:hidden`}>
                {t("colIndex")}
              </th>
              <th scope="col" className={headPad}>
                {t("colRowKey")}
              </th>
              <th scope="col" className={`${headPad} text-right`}>
                {t("colConf")}
              </th>
              {DEMO_ISSUERS.map((col) => (
                <th key={col} scope="col" className={headPad}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.labelKey}>
                <td
                  className={`border-gray-20 bg-gray-10 text-muted-foreground border-t font-mono text-[13px] max-[671px]:hidden ${cellPad}`}
                >
                  {i + 1}
                </td>
                <th
                  scope="row"
                  className={`border-gray-20 bg-gray-10 text-foreground border-t text-left font-semibold ${cellPad}`}
                >
                  {g(row.labelKey)}
                </th>
                <td
                  className={`border-gray-20 bg-gray-10 border-t text-right font-mono ${cellPad}`}
                >
                  {new Intl.NumberFormat(locale, {
                    style: "percent",
                    maximumFractionDigits: 0,
                  }).format(row.confidence)}
                </td>
                {row.cells.map((cell, j) => {
                  const level = levelOf(cell.score);
                  return (
                    <td
                      key={row.labelKey + "-" + j}
                      className={`border-gray-20 bg-gray-10 border-t ${cellPad}`}
                    >
                      <span className="flex flex-col">
                        <span className="font-mono leading-5">
                          {fmt(cell.value, row.format)}
                        </span>
                        <span className="text-muted-foreground inline-flex flex-wrap items-center gap-1.5 text-xs leading-4 max-[671px]:gap-1 max-[671px]:text-[10.5px]">
                          <StatusShape level={level} />
                          {levelLabel[level]}
                          {cell.score < REVIEW_THRESHOLD ? (
                            <span className="text-status-low ml-0.5 font-mono text-[11.5px] font-semibold max-[671px]:mt-0.5 max-[671px]:ml-0 max-[671px]:block max-[671px]:text-[10px]">
                              {reviewMarker}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="bg-background text-muted-foreground border-gray-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-t px-4 py-3 text-xs max-[671px]:gap-x-3">
        {(["high", "medium", "low"] as const).map((level) => (
          <li key={level} className="inline-flex items-center gap-1.5">
            <StatusShape level={level} />
            {levelLabel[level]}
          </li>
        ))}
        <li className="ml-auto font-mono max-[671px]:ml-0">
          {t("reviewLegend")}
        </li>
      </ul>
      <p className="text-muted-foreground border-gray-20 border-t px-4 py-2 text-[11px] leading-4">
        {t("provenance")}
      </p>
    </div>
  );
}
