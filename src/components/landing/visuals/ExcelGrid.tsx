import { cn } from "@/lib/utils";

export interface ExcelGridProps {
  /** En-têtes de colonnes. La première est la colonne des garanties. */
  columns: readonly string[];
  rows: ReadonlyArray<{ label: string; values: readonly string[] }>;
  /** Masque toutes les valeurs : état « avant remplissage ». */
  empty?: boolean;
  /** Nombre de cellules déjà révélées, pour le remplissage progressif. */
  revealed?: number;
  className?: string;
  /** Nom de fichier affiché dans la barre de titre (pass i18n `home.hero.excel.filename`). */
  caption: string;
  /** Hide the green Excel filename chrome (LNAW-123 how-it-works cards). */
  hideCaption?: boolean;
  /** Row-label weight; default semibold. */
  rowLabelClassName?: string;
  /** Override thead row background (default sheet-header). */
  headerClassName?: string;
  /** Extra classes on numeric cell values. */
  valueClassName?: string;
  /**
   * Fit table to container with no horizontal scrollbar (LNAW-127 mini cards).
   * Uses table-fixed + truncated cells instead of overflow-x-auto.
   */
  compact?: boolean;
}

/**
 * Mini sheet (lna-v4-fr.html `.file` / `.ms`):
 * gray-30 border · Excel green filename · header navy · 30px rows.
 */
export function ExcelGrid({
  columns,
  rows,
  empty = false,
  revealed,
  className,
  caption,
  hideCaption = false,
  rowLabelClassName,
  headerClassName,
  valueClassName,
  compact = false,
}: ExcelGridProps) {
  return (
    <div
      className={cn(
        "bg-background border-gray-30 max-w-full overflow-hidden rounded-none border shadow-none",
        className
      )}
    >
      {!hideCaption ? (
        <div className="bg-excel-green truncate px-2 py-1 font-mono text-[11.5px] text-white">
          {caption}
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-full",
          compact ? "overflow-hidden" : "overflow-x-auto"
        )}
      >
        <table
          className={cn(
            "w-full min-w-0 border-collapse text-left text-[12.5px] tabular-nums",
            compact && "table-fixed"
          )}
        >
          {compact ? (
            <colgroup>
              <col style={{ width: "38%" }} />
              {columns.slice(1).map((col) => (
                <col key={col} />
              ))}
            </colgroup>
          ) : null}
          <thead>
            <tr className={cn("bg-sheet-header", headerClassName)}>
              {columns.map((col, i) => (
                <th
                  key={col}
                  scope="col"
                  title={col}
                  className={cn(
                    "border-gray-30 border px-2 font-semibold text-white",
                    compact
                      ? "h-auto max-w-0 py-1 break-words whitespace-normal"
                      : "h-[30px] whitespace-nowrap",
                    i > 0 && "text-right"
                  )}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  title={row.label}
                  className={cn(
                    "border-gray-30 text-foreground border px-2 text-left font-semibold",
                    compact
                      ? "h-auto max-w-0 py-1 break-words whitespace-normal"
                      : "h-[30px] whitespace-nowrap",
                    rowLabelClassName
                  )}
                >
                  {row.label}
                </th>
                {row.values.map((value, i) => {
                  const cellIndex = rowIdx * row.values.length + i;
                  const hidden =
                    empty ||
                    (typeof revealed === "number" && cellIndex >= revealed);
                  return (
                    <td
                      key={row.label + "-" + i}
                      title={value}
                      className={cn(
                        "border-gray-30 border px-2 text-right",
                        compact
                          ? "h-auto max-w-0 py-1 break-words whitespace-normal"
                          : "h-[30px] whitespace-nowrap"
                      )}
                    >
                      <span
                        className={cn(
                          "inline transition-opacity duration-200",
                          valueClassName,
                          hidden ? "opacity-0" : "opacity-100"
                        )}
                      >
                        {value}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
