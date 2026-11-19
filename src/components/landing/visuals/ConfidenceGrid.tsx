import { useTranslations, useLocale } from "next-intl";

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

const COLUMNS = ["Generali", "April", "MetLife"] as const;

const ROWS: readonly Row[] = [
  {
    labelKey: "rowRate",
    format: "pct",
    confidence: 0.91,
    cells: [
      { value: 0.34, score: 0.93 },
      { value: 0.29, score: 0.71 },
      { value: 0.41, score: 0.42 },
    ],
  },
  {
    labelKey: "rowTotalCost",
    format: "eur",
    confidence: 0.86,
    cells: [
      { value: 4218, score: 0.91 },
      { value: 3640, score: 0.82 },
      { value: 5102, score: 0.88 },
    ],
  },
  {
    labelKey: "rowQuota",
    format: "pct",
    confidence: 0.64,
    cells: [
      { value: 100, score: 0.88 },
      { value: 50, score: 0.48 },
      { value: 100, score: 0.86 },
    ],
  },
];

/**
 * Carbon data table (lna-v4-fr.html `.dt`): white card on Gray 10 stage.
 * Header Gray 20 / 48px · rows Gray 10 / 64px · value stacked over status.
 * Legend footer white; `[REVIEW]` note right-aligned.
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

  return (
    <div
      data-confidence-grid
      className="bg-background max-w-full overflow-hidden rounded-none shadow-none"
    >
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm tabular-nums">
          <caption className="sr-only">{t("tableCaption")}</caption>
          <thead>
            <tr className="bg-gray-20 text-foreground">
              <th scope="col" className="h-12 px-4 align-middle font-semibold">
                {t("colIndex")}
              </th>
              <th scope="col" className="h-12 px-4 align-middle font-semibold">
                {t("colRowKey")}
              </th>
              <th
                scope="col"
                className="h-12 px-4 text-right align-middle font-semibold"
              >
                {t("colConf")}
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="h-12 px-4 align-middle font-semibold"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr key={row.labelKey}>
                <td className="border-gray-20 bg-gray-10 text-muted-foreground h-16 border-t px-4 align-middle font-mono text-[13px]">
                  {i + 1}
                </td>
                <th
                  scope="row"
                  className="border-gray-20 bg-gray-10 text-foreground h-16 border-t px-4 text-left align-middle font-semibold"
                >
                  {g(row.labelKey)}
                </th>
                <td className="border-gray-20 bg-gray-10 h-16 border-t px-4 text-right align-middle font-mono">
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
                      className="border-gray-20 bg-gray-10 h-16 border-t px-4 align-middle"
                    >
                      <span className="flex flex-col">
                        <span className="font-mono leading-5">
                          {fmt(cell.value, row.format)}
                        </span>
                        <span className="text-muted-foreground inline-flex flex-wrap items-center gap-1.5 text-xs leading-4">
                          <StatusShape level={level} />
                          {levelLabel[level]}
                          {cell.score < REVIEW_THRESHOLD ? (
                            <span className="text-status-low ml-0.5 font-mono text-[11.5px] font-semibold">
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
      <ul className="bg-background text-muted-foreground border-gray-20 flex flex-wrap items-center gap-x-6 gap-y-2 border-t px-4 py-3 text-xs">
        {(["high", "medium", "low"] as const).map((level) => (
          <li key={level} className="inline-flex items-center gap-1.5">
            <StatusShape level={level} />
            {levelLabel[level]}
          </li>
        ))}
        <li className="ml-auto font-mono">{t("reviewLegend")}</li>
      </ul>
    </div>
  );
}
