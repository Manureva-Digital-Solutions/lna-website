"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { usePathname } from "@/i18n/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, User, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { appUrls } from "@/lib/app-urls";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [role="radio"]:not([disabled])';

export function Header() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const navLinks = [
    { href: "/features", label: t("features") },
    { href: "/pricing", label: t("pricing") },
    { href: "/about", label: t("about") },
    { href: "/blog", label: t("blog") },
  ];
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close the panel if the viewport grows into the desktop masthead (≥1056px).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1056px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Escape + keyboard focus trap while the mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return;

    const getFocusable = () => {
      const scopes = [headerRef.current, panelRef.current].filter(
        Boolean
      ) as HTMLElement[];
      return scopes.flatMap((scope) =>
        Array.from(
          scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== "none" && style.visibility !== "hidden";
        })
      );
    };

    const previouslyFocused = document.activeElement as HTMLElement | null;
    menuButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const items = getFocusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (active instanceof HTMLElement && !items.includes(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        ref={headerRef}
        className="border-gray-20 fixed top-0 right-0 left-0 z-50 h-12 border-b bg-white"
      >
        <Container className="flex h-full items-center gap-2 px-4 min-[1056px]:gap-3 min-[1056px]:px-8">
          {/* Mobile (<1056): hamburger on the left */}
          <button
            ref={menuButtonRef}
            type="button"
            className="text-foreground hidden shrink-0 max-[1055px]:inline-flex"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            {mobileOpen ? (
              <X className="size-6" aria-hidden="true" />
            ) : (
              <Menu className="size-6" aria-hidden="true" />
            )}
          </button>

          <Link
            href="/"
            className="flex shrink-0 items-center"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/brand/logo.svg"
              alt="LNA"
              width={88}
              height={28}
              className="h-7 w-auto max-[1055px]:h-6 dark:hidden"
              priority
            />
            <Image
              src="/brand/logo-white.svg"
              alt="LNA"
              width={88}
              height={28}
              className="hidden h-7 w-auto max-[1055px]:h-6 dark:block"
              priority
            />
          </Link>

          {/* Desktop (≥1056): divider + text nav beside the mark */}
          <div
            className="bg-gray-20 hidden h-5 w-px shrink-0 min-[1056px]:block"
            aria-hidden="true"
          />

          <nav
            className="hidden items-center gap-1 min-[1056px]:flex"
            aria-label={t("mainNavigation")}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-none px-3 py-1.5 text-sm leading-none transition-colors",
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "text-foreground bg-gray-10 font-normal"
                    : "text-muted-foreground hover:bg-gray-10 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 min-[1056px]:gap-4">
            {/* Frozen ≤672: hide lang + Sign in label (LNA-260 / LNAW-82). */}
            <div className="flex items-center max-[671px]:hidden">
              <LanguageSwitcher />
            </div>
            <a
              href={appUrls.login}
              aria-label={t("signIn")}
              className="text-muted-foreground hover:text-foreground inline-flex h-8 shrink-0 items-center gap-1.5 text-sm leading-none whitespace-nowrap transition-colors"
            >
              <User
                className="size-4 shrink-0"
                aria-hidden="true"
                strokeWidth={1.75}
              />
              <span className="max-[671px]:hidden">{t("signIn")}</span>
            </a>
          </div>
        </Container>
      </header>

      {/*
        Mobile nav panel lives outside <header> so fixed inset-0 covers the
        viewport (LNA-255). Opaque background — never transparent over the hero.
      */}
      <div
        ref={panelRef}
        id="mobile-nav-panel"
        role="dialog"
        aria-modal={mobileOpen}
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-40 hidden flex-col overflow-y-auto bg-white transition-opacity duration-200 max-[1055px]:flex",
          mobileOpen
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        )}
      >
        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto px-8 pt-16 pb-8"
          aria-label={t("mobileNavigation")}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-none px-4 py-3 text-base font-normal transition-colors",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-foreground bg-gray-10"
                  : "text-muted-foreground hover:bg-gray-10 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
