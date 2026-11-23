"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Globe } from "lucide-react";

function GlobeMark({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8 1a7 7 0 100 14A7 7 0 008 1zm5.9 6.5h-2.9a11 11 0 00-1.5-5.3 6 6 0 014.4 5.3zM8 14c-.9 0-2-2.4-2-5.5h4C10 11.6 8.9 14 8 14zM6 7.5C6 4.4 7.1 2 8 2s2 2.4 2 5.5zm.5-5.3A11 11 0 005 7.5H2.1a6 6 0 014.4-5.3zM2.1 8.5H5a11 11 0 001.5 5.3 6 6 0 01-4.4-5.3zm7.4 5.3a11 11 0 001.5-5.3h2.9a6 6 0 01-4.4 5.3z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronMark({ open }: { open?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("transition-transform", open && "rotate-180")}
    >
      <path d="M8 11L3 6l.7-.7L8 9.6l4.3-4.3.7.7z" fill="currentColor" />
    </svg>
  );
}

/** Header language toggle: FR | EN with globe. */
export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Fixed order FR | EN — only weight/colour marks the active locale.
  const orderedLocales = ["fr", "en"].filter((loc) =>
    (routing.locales as readonly string[]).includes(loc)
  );
  const localeLabels: Record<string, string> = {
    fr: t("fr"),
    en: t("en"),
  };

  function switchLocale(nextLocale: string) {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div
      className={cn(
        "text-muted-foreground inline-flex h-8 shrink-0 items-center gap-1.5 text-sm leading-none whitespace-nowrap",
        isPending && "pointer-events-none opacity-60"
      )}
      role="radiogroup"
      aria-label={t("label")}
    >
      <Globe
        className="size-4 shrink-0"
        aria-hidden="true"
        strokeWidth={1.75}
      />
      <div className="inline-flex h-full items-center gap-1">
        {orderedLocales.map((loc, index) => (
          <span key={loc} className="inline-flex items-center gap-1">
            {index > 0 && (
              <span className="text-gray-30 leading-none" aria-hidden="true">
                |
              </span>
            )}
            <button
              type="button"
              role="radio"
              aria-checked={loc === locale}
              onClick={() => switchLocale(loc)}
              className={cn(
                "hover:text-foreground focus-visible:outline-primary inline-flex h-8 items-center rounded-none px-0.5 leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
                loc === locale
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground font-normal"
              )}
            >
              {localeLabels[loc]}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Frozen footer language control (`.langsel`): globe + current locale,
 * chevron opens a menu listing English and Français (link to other locale).
 */
export function FooterLanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const currentLabel = locale === "fr" ? t("francais") : t("english");
  const options = [
    { locale: "en" as const, label: t("english") },
    { locale: "fr" as const, label: t("francais") },
  ];

  function switchLocale(nextLocale: string) {
    setOpen(false);
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative" data-footer-langsel>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isPending}
        aria-label={t("label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          "border-gray-60 bg-gray-90 focus-visible:outline-primary inline-flex h-10 min-w-[200px] items-center gap-2 border-b px-4 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
          isPending && "pointer-events-none opacity-60"
        )}
      >
        <GlobeMark className="shrink-0" />
        <span>{currentLabel}</span>
        <span className="ml-auto">
          <ChevronMark open={open} />
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("label")}
          className="border-gray-60 bg-gray-90 absolute top-full right-0 left-0 z-20 border border-t-0"
        >
          {options.map((option) => {
            const selected = option.locale === locale;
            return (
              <li key={option.locale} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => switchLocale(option.locale)}
                  className={cn(
                    "hover:bg-gray-80 focus-visible:outline-primary w-full px-4 py-2.5 text-left text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
                    selected && "bg-gray-80 font-semibold"
                  )}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
