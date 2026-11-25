import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExportHistoryVisual } from "@/components/landing/visuals/ExportHistoryVisual";
import { DEMO_EXPORT_HISTORY } from "@/components/landing/visuals/export-history-data";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

describe("ExportHistoryVisual (LNAW-128)", () => {
  it("exposes role=img with EN alt and fictional audit rows", () => {
    const { container } = renderWithIntl(<ExportHistoryVisual />);
    const root = container.querySelector(
      "[data-export-history]"
    ) as HTMLElement;
    expect(root).toBeTruthy();
    expect(
      screen.getByRole("img", { name: en.home.trust.history.alt })
    ).toBeInTheDocument();
    expect(screen.getByText(en.home.trust.history.title)).toBeInTheDocument();
    expect(screen.getByText(en.home.trust.history.colUser)).toBeInTheDocument();
    expect(screen.getByText(en.home.trust.history.colFile)).toBeInTheDocument();
    expect(screen.getByText(en.home.trust.history.colWhen)).toBeInTheDocument();

    for (const row of DEMO_EXPORT_HISTORY) {
      expect(
        within(root).getByText(
          en.home.trust.history[
            row.userKey as keyof typeof en.home.trust.history
          ]
        )
      ).toBeInTheDocument();
      expect(within(root).getAllByText(row.file).length).toBeGreaterThanOrEqual(
        1
      );
    }

    expect(root.textContent).not.toMatch(
      /\[REVIEW\]|confidence|fiabilité|@|\.com/i
    );
  });

  it("localizes FR chrome and keeps fictional users only", () => {
    renderWithIntl(<ExportHistoryVisual />, { locale: "fr" });
    expect(
      screen.getByRole("img", { name: fr.home.trust.history.alt })
    ).toBeInTheDocument();
    expect(screen.getByText(fr.home.trust.history.title)).toBeInTheDocument();
    expect(
      screen.getByText(fr.home.trust.history.userCamille)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Generali|MetLife|Malakoff|gmail|outlook/i)
    ).not.toBeInTheDocument();
  });
});
