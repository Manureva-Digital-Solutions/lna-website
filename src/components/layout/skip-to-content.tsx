"use client";

import { useTranslations } from "next-intl";

export function SkipToContent() {
  const t = useTranslations("common");

  return (
    <a
      href="#main"
      className="bg-primary text-primary-foreground focus-visible:outline-primary fixed top-0 left-1/2 z-[100] -translate-x-1/2 -translate-y-full rounded-none px-4 py-2 text-sm font-normal transition-transform focus:translate-y-0 focus-visible:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {t("skipToContent")}
    </a>
  );
}
