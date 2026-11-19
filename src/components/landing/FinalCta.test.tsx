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

    // Real link — frozen `.btn` padding 13/64/13/16 + absolute icon (LNAW-82).
    const cta = screen.getByRole("link", { name: copy.cta });
    expect(cta).toHaveAttribute("href", appUrls.register);
    expect(cta).not.toHaveAttribute("role", "button");
    expect(cta).toHaveAttribute("data-icon", "inline-end");
    expect(cta).toHaveClass("bg-primary");
    expect(cta).toHaveClass("rounded-none");
    expect(cta).toHaveClass("h-12");
    expect(cta).toHaveClass("min-w-[220px]");
    expect(cta).toHaveClass("w-full");
    expect(cta).toHaveClass("min-[672px]:w-auto");
    expect(cta).toHaveClass("text-base");
    expect(cta).toHaveClass("py-[13px]");
    expect(cta).toHaveClass("pl-4");
    expect(cta).toHaveClass("pr-16");
    expect(cta).toHaveClass("relative");
    const icon = cta.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass("absolute");
    expect(icon).toHaveClass("right-4");
  });

  it("renders matching FR copy", () => {
    renderWithIntl(<FinalCta />, { locale: "fr" });

    const copy = fr.home.finalCta;
    expect(
      screen.getByRole("heading", { level: 2, name: copy.heading })
    ).toBeInTheDocument();
    expect(screen.getByText(copy.reassurance)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.cta })).toHaveAttribute(
      "href",
      appUrls.register
    );
  });

  it("matches the hero primary CTA label and destination", () => {
    expect(en.home.finalCta.cta).toBe(en.home.hero.ctaPrimary);
    expect(fr.home.finalCta.cta).toBe(fr.home.hero.ctaPrimary);

    renderWithIntl(<FinalCta />);
    expect(
      screen.getByRole("link", { name: en.home.finalCta.cta })
    ).toHaveAttribute("href", appUrls.register);
  });

  it("has no extra logos or secondary marketing lines", () => {
    renderWithIntl(<FinalCta />);

    const band = document.querySelector("[data-final-cta]") as HTMLElement;
    expect(within(band).getAllByRole("heading")).toHaveLength(1);
    expect(within(band).getAllByRole("link")).toHaveLength(1);
    expect(within(band).queryByRole("img")).toBeNull();
  });
});
