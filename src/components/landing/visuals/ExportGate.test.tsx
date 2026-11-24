import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExportGate } from "@/components/landing/visuals/ExportGate";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

describe("ExportGate (LNAW-124)", () => {
  it("renders the download action without review checkboxes", () => {
    renderWithIntl(<ExportGate />);

    expect(en.home.bands.validation.stepLabel).toBe("Download your Excel");
    expect(
      screen.getByText(en.home.bands.validation.stepLabel)
    ).toBeInTheDocument();
    expect(
      screen.getByText(en.home.bands.validation.downloadButton)
    ).toBeInTheDocument();
    expect(
      screen.getByText(en.home.bands.validation.auditNote)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/flagged|\[REVIEW\]|reviewed/i)
    ).not.toBeInTheDocument();
  });

  it("uses white for the audit-note background", () => {
    renderWithIntl(<ExportGate />);

    expect(screen.getByText(en.home.bands.validation.auditNote)).toHaveClass(
      "bg-background"
    );
  });

  it("shows Gilbert FR download label without review markers", () => {
    renderWithIntl(<ExportGate />, { locale: "fr" });

    expect(fr.home.bands.validation.stepLabel).toBe("Téléchargez votre Excel");
    expect(
      screen.getByText(fr.home.bands.validation.stepLabel)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/\[REVIEW\]|RELECTURE|Relisez/i)
    ).not.toBeInTheDocument();
  });
});
