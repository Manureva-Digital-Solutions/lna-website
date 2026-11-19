"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "lna-cookie-consent";
/** Dispatched when the user asks to reopen cookie preferences (footer link). */
export const COOKIE_CONSENT_OPEN_EVENT = "cookie-consent-open";

export type ConsentValue = "all" | "essential" | null;

export function getConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CONSENT_KEY) as ConsentValue;
}

export function hasFullConsent(): boolean {
  return getConsent() === "all";
}

/**
 * Clears stored consent and opens the cookie banner again.
 * Wired from the footer "Cookie settings" / "Gérer les cookies" link (LNAW-94).
 */
export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_OPEN_EVENT));
  window.dispatchEvent(
    new CustomEvent("cookie-consent-change", { detail: null })
  );
}

function subscribeConsent(cb: () => void) {
  const onChange = () => cb();
  window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onChange);
  window.addEventListener("cookie-consent-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onChange);
    window.removeEventListener("cookie-consent-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getConsentSnapshot() {
  return localStorage.getItem(CONSENT_KEY);
}

function getServerSnapshot() {
  return "unknown";
}

export function CookieConsent() {
  const t = useTranslations("common");
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerSnapshot
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onOpen() {
      setDismissed(false);
    }
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
  }, []);

  const visible = !consent && !dismissed;

  function accept(value: "all" | "essential") {
    localStorage.setItem(CONSENT_KEY, value);
    setDismissed(true);
    window.dispatchEvent(
      new CustomEvent("cookie-consent-change", { detail: value })
    );
  }

  if (!visible) return null;

  return (
    <div className="bg-card border-border fixed right-0 bottom-0 left-0 z-50 border-t p-4 shadow-none sm:right-auto sm:bottom-4 sm:left-4 sm:max-w-sm sm:rounded-none sm:border">
      <p className="text-sm font-semibold">{t("cookieConsent.heading")}</p>
      <p className="text-muted-foreground mt-1 text-xs">
        {t("cookieConsent.description")}
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => accept("all")}>
          {t("cookieConsent.acceptAll")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => accept("essential")}>
          {t("cookieConsent.essentialOnly")}
        </Button>
      </div>
    </div>
  );
}
