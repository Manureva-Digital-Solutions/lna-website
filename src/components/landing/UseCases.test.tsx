import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UseCases } from "@/components/landing/UseCases";
import { renderWithIntl } from "@/test/render";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

const CASES = ["adp", "health", "condo"] as const;

describe("UseCases", () => {
  it("renders three numbered tiles from EN i18n copy", () => {
    renderWithIntl(<UseCases />);

    const copy = en.home.useCases;
    expect(
      screen.getByRole("heading", { level: 2, name: copy.heading })
    ).toBeInTheDocument();

    const band = document.querySelector("[data-use-cases]");
    expect(band).not.toBeNull();

    const articles = within(band as HTMLElement).getAllByRole("article");
    expect(articles).toHaveLength(3);

    CASES.forEach((key, i) => {
      const article = articles[i];
      expect(
        within(article).getByText(String(i + 1).padStart(2, "0"))
      ).toBeInTheDocument();
      expect(
        within(article).getByRole("heading", { name: copy[key].title })
      ).toBeInTheDocument();
      expect(
        within(article).getByText(copy[key].description)
      ).toBeInTheDocument();
    });
  });

  it("renders matching FR i18n copy without a fourth case", () => {
    renderWithIntl(<UseCases />, { locale: "fr" });

    const copy = fr.home.useCases;
    expect(
      screen.getByRole("heading", { level: 2, name: copy.heading })
    ).toBeInTheDocument();

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(3);
    expect(screen.queryByText("04")).not.toBeInTheDocument();

    CASES.forEach((key) => {
      expect(
        screen.getByRole("heading", { name: copy[key].title })
      ).toBeInTheDocument();
      expect(screen.getByText(copy[key].description)).toBeInTheDocument();
    });
  });

  it("has no trailing arrows or link destinations on tiles", () => {
    renderWithIntl(<UseCases />);

    const band = document.querySelector("[data-use-cases]") as HTMLElement;
    expect(within(band).queryAllByRole("link")).toHaveLength(0);
    expect(within(band).queryByText(/→|⟶|➜/)).not.toBeInTheDocument();
  });
});
