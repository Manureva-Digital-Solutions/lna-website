import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UseCases } from "@/components/landing/UseCases";
import { renderWithIntl } from "@/test/render";

describe("UseCases", () => {
  it("renders three numbered tiles with EN titles and bodies", () => {
    renderWithIntl(<UseCases />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Three situations LNA handles today",
      })
    ).toBeInTheDocument();

    const band = document.querySelector("[data-use-cases]");
    expect(band).not.toBeNull();

    const articles = within(band as HTMLElement).getAllByRole("article");
    expect(articles).toHaveLength(3);

    expect(within(articles[0]).getByText("01")).toBeInTheDocument();
    expect(
      within(articles[0]).getByRole("heading", {
        name: "Compare loan insurance quotes",
      })
    ).toBeInTheDocument();
    expect(
      within(articles[0]).getByText(
        /Rates, total costs and coverage shares from each quote/
      )
    ).toBeInTheDocument();

    expect(within(articles[1]).getByText("02")).toBeInTheDocument();
    expect(
      within(articles[1]).getByRole("heading", { name: "Track health cover" })
    ).toBeInTheDocument();

    expect(within(articles[2]).getByText("03")).toBeInTheDocument();
    expect(
      within(articles[2]).getByRole("heading", {
        name: "Transfer a condo service-charge statement",
      })
    ).toBeInTheDocument();
  });

  it("renders matching FR copy without inventing a fourth case", () => {
    renderWithIntl(<UseCases />, { locale: "fr" });

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Trois situations que LNA traite aujourd'hui",
      })
    ).toBeInTheDocument();

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(3);
    expect(screen.queryByText("04")).not.toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Comparer des devis d'assurance emprunteur",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Suivre une complémentaire santé" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Reprendre un décompte de charges de copropriété",
      })
    ).toBeInTheDocument();
  });

  it("has no trailing arrows or link destinations on tiles", () => {
    renderWithIntl(<UseCases />);

    const band = document.querySelector("[data-use-cases]") as HTMLElement;
    expect(within(band).queryAllByRole("link")).toHaveLength(0);
    expect(within(band).queryByText(/→|⟶|➜/)).not.toBeInTheDocument();
  });
});
