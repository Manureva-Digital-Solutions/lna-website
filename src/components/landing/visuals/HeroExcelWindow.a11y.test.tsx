import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroExcelWindow } from "@/components/landing/visuals/HeroExcelWindow";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

describe("HeroExcelWindow a11y (LNAW-84)", () => {
  it("exposes role=img with the EN descriptive aria-label", () => {
    renderWithIntl(<HeroExcelWindow />);
    expect(
      screen.getByRole("img", { name: en.home.hero.visual.description })
    ).toBeInTheDocument();
  });

  it("localizes the aria-label in FR from messages", () => {
    renderWithIntl(<HeroExcelWindow />, { locale: "fr" });
    expect(
      screen.getByRole("img", { name: fr.home.hero.visual.description })
    ).toBeInTheDocument();
  });
});
