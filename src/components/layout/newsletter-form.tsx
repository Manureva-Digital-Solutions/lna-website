"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/toast";

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="absolute top-4 right-4"
    >
      <path
        d="M9.3 3.3l-.7.7 3.5 3.5H2v1h10.1l-3.5 3.5.7.7L14 8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast(t("invalidEmail"), "error");
      return;
    }

    setStatus("submitting");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" && data.error ? data.error : t("error")
        );
      }

      showToast(t("success"), "success");
      window.gtag?.("event", "newsletter_signup", { method: "footer" });
      form.reset();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("invalidEmail"),
        "error"
      );
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form
      className="flex w-full max-w-[420px] max-[671px]:max-w-none"
      onSubmit={handleSubmit}
      noValidate
      data-newsletter
    >
      <input
        type="email"
        name="email"
        id="footer-newsletter-email"
        placeholder={t("emailPlaceholder")}
        className="border-gray-60 bg-gray-90 h-12 min-w-0 flex-1 border-0 border-b px-4 text-sm text-white placeholder:text-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
        aria-label={t("emailLabel")}
        required
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="bg-primary text-primary-foreground relative h-12 shrink-0 cursor-pointer px-4 pr-12 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "submitting" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {t("subscribe")}
            <ArrowIcon />
          </>
        )}
      </button>
    </form>
  );
}
