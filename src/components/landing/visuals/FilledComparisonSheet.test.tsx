import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilledComparisonSheet } from "@/components/landing/visuals/FilledComparisonSheet";
import { DEMO_ISSUERS } from "@/components/landing/visuals/demo-sheet-data";
import { renderWithIntl } from "@/test/render";

describe("FilledComparisonSheet (LNAW-124)", () => {
  it("renders the filled issuer columns without confidence or review cues", () => {
    renderWithIntl(<FilledComparisonSheet />);

    for (const issuer of DEMO_ISSUERS) {
      expect(screen.getByText(issuer)).toBeInTheDocument();
    }
    expect(screen.getByText("0.34%")).toBeInTheDocument();
    expect(screen.getByText("€4,218.00")).toBeInTheDocument();
    expect(screen.queryByText(/\[REVIEW\]/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/^(High|Medium|Low|Conf\.)$/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("93%")).not.toBeInTheDocument();
    expect(screen.queryByText("42%")).not.toBeInTheDocument();
  });

  it("keeps FR formatting without review legend copy", () => {
    renderWithIntl(<FilledComparisonSheet />, { locale: "fr" });
    expect(screen.getByText(/0,34\s*%/)).toBeInTheDocument();
    expect(
      screen.queryByText(/Élevée|Moyenne|Faible|\[REVIEW\]|fiabilité/i)
    ).not.toBeInTheDocument();
  });
});
