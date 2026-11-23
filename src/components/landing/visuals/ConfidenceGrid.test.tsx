import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfidenceGrid } from "@/components/landing/visuals/ConfidenceGrid";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

describe("ConfidenceGrid", () => {
  it("flags Rive Prévoyance rate and Atelier Protect cover-ratio cells with [REVIEW]", () => {
    renderWithIntl(<ConfidenceGrid />);

    const table = screen.getByRole("table");
    const markers = within(table).getAllByText(en.home.hero.excel.reviewMarker);
    expect(markers).toHaveLength(2);

    const rows = within(table).getAllByRole("row");
    // header + 3 data rows
    expect(rows).toHaveLength(4);

    const rateRow = rows[1];
    const quotaRow = rows[3];
    expect(
      within(rateRow).getByText(en.home.hero.excel.reviewMarker)
    ).toBeInTheDocument();
    expect(
      within(quotaRow).getByText(en.home.hero.excel.reviewMarker)
    ).toBeInTheDocument();
    expect(
      within(rows[2]).queryByText(en.home.hero.excel.reviewMarker)
    ).not.toBeInTheDocument();
  });

  it("keeps [REVIEW] in both locales for the legend", () => {
    const { unmount } = renderWithIntl(<ConfidenceGrid />, { locale: "en" });
    expect(
      screen.getByText(en.home.bands.confidence.reviewLegend)
    ).toBeInTheDocument();
    unmount();

    renderWithIntl(<ConfidenceGrid />, { locale: "fr" });
    expect(
      screen.getByText(fr.home.bands.confidence.reviewLegend)
    ).toBeInTheDocument();
    expect(screen.queryByText(/RELECTURE/)).not.toBeInTheDocument();
  });

  it("exposes status with shape + word so colour is not the only cue (EN)", () => {
    const { container } = renderWithIntl(<ConfidenceGrid />);
    expect(
      container.querySelectorAll('[data-status-shape="circle"]').length
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('[data-status-shape="diamond"]').length
    ).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('[data-status-shape="triangle"]').length
    ).toBeGreaterThan(0);

    // Legend + cell words remain when colour is ignored (from messages).
    expect(
      screen.getAllByText(en.home.bands.confidence.levelHigh).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(en.home.bands.confidence.levelMedium).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(en.home.bands.confidence.levelLow).length
    ).toBeGreaterThan(0);

    for (const shape of container.querySelectorAll("[data-status-shape]")) {
      expect(shape).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("localizes status words in FR from messages", () => {
    renderWithIntl(<ConfidenceGrid />, { locale: "fr" });
    expect(
      screen.getAllByText(fr.home.bands.confidence.levelHigh).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(fr.home.bands.confidence.levelMedium).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(fr.home.bands.confidence.levelLow).length
    ).toBeGreaterThan(0);
  });
});
