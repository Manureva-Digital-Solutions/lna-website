import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BenefitBands } from "@/components/landing/BenefitBands";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { renderWithIntl } from "@/test/render";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

const FORBIDDEN =
  /\[REVIEW\]|RELECTURE|\brelire\b|\bRelisez\b|\bvérifier\b|\bVérifier\b|\breview\b|\bReview\b|\bconfidence\b|\bfiabilité\b|\bÉlevée\b|\bMoyenne\b|\bFaible\b|\bHigh\b|\bMedium\b|\bLow\b/i;

function assertNoForbiddenCopy(root: HTMLElement) {
  expect(root.textContent).not.toMatch(FORBIDDEN);
}

describe("LNAW-124 homepage review/confidence cue removal", () => {
  it("keeps Gilbert hero lead and step 3 copy in message catalogs", () => {
    expect(en.home.hero.description).toMatch(
      /straight into your Excel template/
    );
    expect(en.home.hero.description).not.toMatch(/confidence/i);
    expect(fr.home.hero.description).toMatch(
      /directement dans votre modèle Excel/
    );
    expect(fr.home.hero.description).not.toMatch(/fiabilité/i);
    expect(en.home.howItWorks.download.label).toBe("Download your Excel");
    expect(fr.home.howItWorks.download.label).toBe("Téléchargez votre Excel");
  });

  it("renders EN hero, bands and steps without review/confidence cues", () => {
    const { container } = renderWithIntl(
      <>
        <Hero />
        <BenefitBands />
        <HowItWorks />
      </>
    );
    assertNoForbiddenCopy(container);
    expect(
      screen.getByRole("heading", { name: "Every field in its place" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "An Excel ready to share" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Download your Excel" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/status-low|text-status/i)
    ).not.toBeInTheDocument();
  });

  it("renders FR hero, bands and steps without review/confidence cues", () => {
    const { container } = renderWithIntl(
      <>
        <Hero />
        <BenefitBands />
        <HowItWorks />
      </>,
      { locale: "fr" }
    );
    assertNoForbiddenCopy(container);
    expect(
      screen.getByRole("heading", { name: "Chaque champ à sa place" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Un Excel prêt à partager" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Téléchargez votre Excel" })
    ).toBeInTheDocument();
  });
});
