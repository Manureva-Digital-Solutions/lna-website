import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustSection } from "@/components/landing/TrustSection";
import { renderWithIntl } from "@/test/render";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

const POINTS = ["isolation", "audit", "deletion"] as const;

describe("TrustSection", () => {
  it("renders EN heading, three factual statements, and legal links", () => {
    renderWithIntl(<TrustSection />);

    const copy = en.home.trust;
    const footer = en.footer;
    expect(
      screen.getByRole("heading", { level: 2, name: copy.heading })
    ).toBeInTheDocument();

    const band = document.querySelector("[data-trust-band]");
    expect(band).not.toBeNull();
    expect(band).toHaveClass("bg-gray-10");
    // Frozen `.secb { margin-top: 96px }` (LNAW-82 / lna-v4-fr.html).
    expect(band).toHaveClass("mt-24");

    const list = within(band as HTMLElement).getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    POINTS.forEach((key, i) => {
      expect(within(items[i]).getByText(copy[key])).toBeInTheDocument();
    });

    const privacy = screen.getByRole("link", { name: footer.privacyPolicy });
    const terms = screen.getByRole("link", { name: footer.termsOfService });
    expect(privacy).toHaveAttribute("href", "/privacy");
    expect(terms).toHaveAttribute("href", "/terms");
  });

  it("renders matching FR copy and legal link labels", () => {
    renderWithIntl(<TrustSection />, { locale: "fr" });

    const copy = fr.home.trust;
    const footer = fr.footer;
    expect(
      screen.getByRole("heading", { level: 2, name: copy.heading })
    ).toBeInTheDocument();

    POINTS.forEach((key) => {
      expect(screen.getByText(copy[key])).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: footer.privacyPolicy })
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: footer.termsOfService })
    ).toHaveAttribute("href", "/terms");
  });

  it("shows the export-history visual beside the three points (LNAW-128)", () => {
    renderWithIntl(<TrustSection />);

    const band = document.querySelector("[data-trust-band]") as HTMLElement;
    expect(
      within(band).getByRole("img", { name: en.home.trust.history.alt })
    ).toBeInTheDocument();
    expect(band.querySelector("[data-export-history]")).not.toBeNull();
    expect(
      within(band).getByText(en.home.trust.history.title)
    ).toBeInTheDocument();
  });

  it("does not show certifications, stats, or customer logos", () => {
    renderWithIntl(<TrustSection />);

    const band = document.querySelector("[data-trust-band]") as HTMLElement;
    expect(
      within(band).queryByText(
        /\b(ISO|SOC 2|certification|badge|logo strip)\b/i
      )
    ).toBeNull();
  });
});
