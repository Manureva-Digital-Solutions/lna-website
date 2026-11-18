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
  /** Nom de fichier affiché dans la barre de titre. */
  caption?: string;
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
}: ExcelGridProps) {
  return (
    <div
      className={cn(
        "bg-background border-gray-30 max-w-full overflow-hidden rounded-none border shadow-none",
        className
      )}
    >
      <div className="bg-excel-green truncate px-2 py-1 font-mono text-[11.5px] text-white">
        {caption ?? "comparatif-adp.xlsx"}
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-0 border-collapse text-left text-[12.5px] tabular-nums">
          <thead>
            <tr className="bg-sheet-header">
              {columns.map((col, i) => (
                <th
                  key={col}
                  scope="col"
                  className={cn(
                    "border-gray-30 h-[30px] border px-2 font-semibold whitespace-nowrap text-white",
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
                  className="border-gray-30 text-foreground h-[30px] border px-2 text-left font-semibold whitespace-nowrap"
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
                      className="border-gray-30 h-[30px] border px-2 text-right whitespace-nowrap"
                    >
                      <span
                        className={cn(
                          "inline-block transition-opacity duration-200",
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
