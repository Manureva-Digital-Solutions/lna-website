import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BenefitBands } from "@/components/landing/BenefitBands";
import { renderWithIntl } from "@/test/render";

describe("BenefitBands", () => {
  it("renders both feature tiles with template and mixed-batch visuals", () => {
    renderWithIntl(<BenefitBands />);

    expect(
      screen.getByRole("heading", { name: "Your Excel template, not ours" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Drop in the whole mixed batch" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your template, as you dropped it in")
    ).toBeInTheDocument();
    expect(screen.getByText("The same file, filled")).toBeInTheDocument();
    expect(screen.getByText("devis-lumina-2026.pdf")).toBeInTheDocument();
    expect(screen.getByText("devis-atelier-2026.pdf")).toBeInTheDocument();
    expect(screen.getByText("devis-rive-2026.pdf")).toBeInTheDocument();
    expect(
      screen.queryByText(/generali|metlife|malakoff/i)
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Loan insurance quote").length).toBeGreaterThan(
      0
    );
  });

  it("exposes Try it as a text link, not a ghost button", () => {
    renderWithIntl(<BenefitBands />);

    const link = screen.getByRole("link", { name: /Try it on my documents/i });
    expect(link.tagName).toBe("A");
    expect(link).not.toHaveAttribute("data-slot", "button");
    expect(link.className).toMatch(/hover:underline/);
  });

  it("formats filled mini-sheet quotité as whole percents (before stays blank)", () => {
    renderWithIntl(<BenefitBands />);

    const beforeCaption = screen.getByText(
      "Your template, as you dropped it in"
    );
    const beforeSheet = beforeCaption.parentElement;
    expect(beforeSheet).not.toBeNull();
    expect(within(beforeSheet!).queryByText("100%")).not.toBeInTheDocument();
    expect(within(beforeSheet!).queryByText("50%")).not.toBeInTheDocument();

    const afterCaption = screen.getByText("The same file, filled");
    const afterSheet = afterCaption.parentElement;
    expect(afterSheet).not.toBeNull();
    expect(within(afterSheet!).getAllByText("100%").length).toBeGreaterThan(0);
    expect(within(afterSheet!).getAllByText("50%").length).toBeGreaterThan(0);
    expect(within(afterSheet!).queryByText("100.00%")).not.toBeInTheDocument();
    expect(within(afterSheet!).queryByText("50.00%")).not.toBeInTheDocument();
  });
});
