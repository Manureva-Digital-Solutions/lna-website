import { cn } from "@/lib/utils";

export interface PdfStackProps {
  docs: ReadonlyArray<{ name: string; role?: string }>;
  className?: string;
}

/** White list (lna-v4-fr.html `.docs`) — red PDF badge, mono name, type. */
export function PdfStack({ docs, className }: PdfStackProps) {
  return (
    <ul
      className={cn(
        "bg-background border-gray-20 flex w-full flex-col overflow-hidden rounded-none border shadow-none",
        className
      )}
    >
      {docs.map((doc, i) => (
        <li
          key={doc.name}
          className={cn(
            "grid grid-cols-[32px_1fr_auto] items-center gap-3 px-4 text-sm max-[672px]:grid-cols-[28px_1fr] max-[672px]:px-3 max-[672px]:py-2 md:h-11",
            i < docs.length - 1 && "border-gray-20 border-b"
          )}
        >
          <span
            className="bg-status-low text-primary-foreground inline-flex items-center justify-center rounded-none py-0.5 font-mono text-[9px] font-semibold tracking-wide uppercase"
            aria-hidden="true"
          >
            PDF
          </span>
          <span className="text-foreground min-w-0 truncate font-mono text-[13px]">
            {doc.name}
          </span>
          {doc.role ? (
            <span className="text-muted-foreground shrink-0 truncate text-[13px] whitespace-nowrap max-[672px]:col-start-2">
              {doc.role}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
