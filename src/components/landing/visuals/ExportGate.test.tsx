import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExportGate } from "@/components/landing/visuals/ExportGate";
import { renderWithIntl } from "@/test/render";

describe("ExportGate", () => {
  it("renders the Step 3 review dialog copy and controls", () => {
    renderWithIntl(<ExportGate />);

    expect(screen.getByText("Step 3 — Review & Download")).toBeInTheDocument();
    expect(
      screen.getByText("I have reviewed the flagged fields")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Keep the [REVIEW] marker in the exported file")
    ).toBeInTheDocument();
    expect(screen.getByText("Download Excel")).toBeInTheDocument();
    expect(
      screen.getByText("The export is recorded in the audit trail.")
    ).toBeInTheDocument();
  });

  it("uses white for the audit-note background", () => {
    renderWithIntl(<ExportGate />);

    expect(
      screen.getByText("The export is recorded in the audit trail.")
    ).toHaveClass("bg-background");
  });

  it("keeps [REVIEW] on the French keep-marker checkbox", () => {
    renderWithIntl(<ExportGate />, { locale: "fr" });

    expect(
      screen.getByText("Conserver le marqueur [REVIEW] dans le fichier exporté")
    ).toBeInTheDocument();
    expect(screen.queryByText(/RELECTURE/)).not.toBeInTheDocument();
  });
});
