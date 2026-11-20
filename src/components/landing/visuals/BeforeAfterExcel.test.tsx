import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BeforeAfterExcel } from "@/components/landing/visuals/BeforeAfterExcel";
import { DEMO_ISSUERS } from "@/components/landing/visuals/demo-sheet-data";
import { renderWithIntl } from "@/test/render";

describe("BeforeAfterExcel", () => {
  it("shows blank before cells and distinct filled after values", () => {
    renderWithIntl(<BeforeAfterExcel />);

    const beforeLabel = screen.getByText("Your template, as you dropped it in");
    const afterLabel = screen.getByText("The same file, filled");
    const before = beforeLabel.parentElement!;
    const after = afterLabel.parentElement!;

    expect(within(before).queryByText("0.34%")).not.toBeInTheDocument();
    expect(within(before).queryByText("€4,218.00")).not.toBeInTheDocument();
    expect(within(before).queryByText("100%")).not.toBeInTheDocument();

    expect(within(after).getByText("0.34%")).toBeInTheDocument();
    expect(within(after).getByText("0.29%")).toBeInTheDocument();
    expect(within(after).getByText("€4,218.00")).toBeInTheDocument();
    expect(within(after).getByText("€3,640.00")).toBeInTheDocument();
    expect(within(after).getByText("100%")).toBeInTheDocument();
    expect(within(after).getByText("50%")).toBeInTheDocument();
  });

  it("uses the shared fictional issuers and states provenance", () => {
    renderWithIntl(<BeforeAfterExcel />);

    expect(screen.getAllByText(DEMO_ISSUERS[0]).length).toBeGreaterThan(0);
    expect(screen.getAllByText(DEMO_ISSUERS[1]).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(/Generali|April|MetLife|Malakoff/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Same illustrative sheet as the hero/i)
    ).toBeInTheDocument();
  });
});
