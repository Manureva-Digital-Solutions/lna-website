import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/landing/Hero";
import { FinalCta } from "@/components/landing/FinalCta";
import { ConfidenceGrid } from "@/components/landing/visuals/ConfidenceGrid";
import { Header } from "@/components/layout/header";
import { renderWithIntl } from "@/test/render";
import en from "../../../messages/en.json";

/**
 * LNAW-82 — lock responsive contracts from frozen ≤672 / ticket AC.
 */
describe("LNAW-82 responsive contracts", () => {
  it("makes the hero primary CTA full width below 672px", () => {
    renderWithIntl(<Hero />);
    const cta = screen.getByRole("button", {
      name: en.home.hero.ctaPrimary,
    });
    expect(cta).toHaveClass("w-full");
    expect(cta).toHaveClass("min-[672px]:w-auto");
  });

  it("makes the closing CTA full width below 672px", () => {
    renderWithIntl(<FinalCta />);
    const cta = screen.getByRole("button", { name: en.home.finalCta.cta });
    expect(cta).toHaveClass("w-full");
    expect(cta).toHaveClass("min-[672px]:w-auto");
  });

  it("hides the confidence index column below 672px", () => {
    renderWithIntl(<ConfidenceGrid />);
    expect(screen.getByRole("columnheader", { name: "#" })).toHaveClass(
      "max-[671px]:hidden"
    );
  });

  it("keeps [REVIEW] markers readable in the confidence grid", () => {
    renderWithIntl(<ConfidenceGrid />);
    expect(screen.getAllByText("[REVIEW]").length).toBeGreaterThanOrEqual(2);
  });

  it("keeps FR | EN visible in the header (including ≤671)", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    renderWithIntl(<Header />);
    const switcher = screen.getByRole("radiogroup", {
      name: en.languageSwitcher.label,
    });
    expect(switcher).toBeInTheDocument();
    expect(switcher.className).not.toMatch(/max-\[671px\]:hidden/);
    expect(
      screen.getByRole("radio", { name: en.languageSwitcher.fr })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: en.languageSwitcher.en })
    ).toBeInTheDocument();
  });
});
