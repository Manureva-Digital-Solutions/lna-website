import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinalCta } from "@/components/landing/FinalCta";
import { renderWithIntl } from "@/test/render";
import { appUrls } from "@/lib/app-urls";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

describe("FinalCta", () => {
  it("renders EN final-block copy and navy CTA to the register URL", () => {
    renderWithIntl(<FinalCta />);

    const copy = en.home.finalCta;
    expect(
      screen.getByRole("heading", { level: 2, name: copy.heading })
    ).toBeInTheDocument();
    expect(screen.getByText(copy.reassurance)).toBeInTheDocument();

    const band = document.querySelector("[data-final-cta]");
    expect(band).not.toBeNull();
    expect(band).toHaveClass("bg-background");

    // LinkButton is an <a role="button"> (same pattern as the hero CTA).
    const cta = screen.getByRole("button", { name: copy.cta });
    expect(cta).toHaveAttribute("href", appUrls.register);
    expect(cta).toHaveClass("bg-primary");
    expect(cta).toHaveClass("rounded-none");
    // Frozen `.btn` type scale + min width; full width below 672 (LNAW-82).
    expect(cta).toHaveClass("min-w-[220px]");
    expect(cta).toHaveClass("w-full");
    expect(cta).toHaveClass("min-[672px]:w-auto");
    expect(cta).toHaveClass("text-base");
    expect(cta).toHaveClass("px-4");
  });

  it("renders matching FR copy", () => {
    renderWithIntl(<FinalCta />, { locale: "fr" });

    const copy = fr.home.finalCta;
    expect(
      screen.getByRole("heading", { level: 2, name: copy.heading })
    ).toBeInTheDocument();
    expect(screen.getByText(copy.reassurance)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.cta })).toHaveAttribute(
      "href",
      appUrls.register
    );
  });

  it("matches the hero primary CTA label and destination", () => {
    expect(en.home.finalCta.cta).toBe(en.home.hero.ctaPrimary);
    expect(fr.home.finalCta.cta).toBe(fr.home.hero.ctaPrimary);

    renderWithIntl(<FinalCta />);
    expect(
      screen.getByRole("button", { name: en.home.finalCta.cta })
    ).toHaveAttribute("href", appUrls.register);
  });

  it("has no extra logos or secondary marketing lines", () => {
    renderWithIntl(<FinalCta />);

    const band = document.querySelector("[data-final-cta]") as HTMLElement;
    expect(within(band).getAllByRole("heading")).toHaveLength(1);
    expect(within(band).getAllByRole("button")).toHaveLength(1);
    expect(within(band).queryByRole("img")).toBeNull();
  });
});
