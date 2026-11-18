import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfidenceGrid } from "@/components/landing/visuals/ConfidenceGrid";
import { renderWithIntl } from "@/test/render";

describe("ConfidenceGrid", () => {
  it("flags MetLife rate and April cover-ratio cells with [REVIEW]", () => {
    renderWithIntl(<ConfidenceGrid />);

    const table = screen.getByRole("table");
    const markers = within(table).getAllByText("[REVIEW]");
    expect(markers).toHaveLength(2);

    const rows = within(table).getAllByRole("row");
    // header + 3 data rows
    expect(rows).toHaveLength(4);

    const rateRow = rows[1];
    const quotaRow = rows[3];
    expect(within(rateRow).getByText("[REVIEW]")).toBeInTheDocument();
    expect(within(quotaRow).getByText("[REVIEW]")).toBeInTheDocument();
    expect(within(rows[2]).queryByText("[REVIEW]")).not.toBeInTheDocument();
  });

  it("keeps [REVIEW] in both locales for the legend", () => {
    const { unmount } = renderWithIntl(<ConfidenceGrid />, { locale: "en" });
    expect(
      screen.getByText("[REVIEW] — written into the exported cell below 0.6")
    ).toBeInTheDocument();
    unmount();

    renderWithIntl(<ConfidenceGrid />, { locale: "fr" });
    expect(
      screen.getByText("[REVIEW] — écrit dans la cellule exportée sous 0,6")
    ).toBeInTheDocument();
    expect(screen.queryByText(/RELECTURE/)).not.toBeInTheDocument();
  });
});
