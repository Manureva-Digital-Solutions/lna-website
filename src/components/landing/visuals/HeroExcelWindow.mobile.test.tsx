import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroExcelWindow } from "@/components/landing/visuals/HeroExcelWindow";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";

describe("LNAW-115 HeroExcelWindow mobile contracts", () => {
  it("renders formula bar ref + fx from i18n (no hardcoded D2/fx outside messages)", () => {
    renderWithIntl(<HeroExcelWindow />);
    expect(screen.getByText(en.home.hero.excel.formulaRef)).toBeInTheDocument();
    expect(screen.getByText(en.home.hero.excel.formulaFx)).toBeInTheDocument();
    expect(en.home.hero.excel.formulaRef).toBe("D2");
    expect(en.home.hero.excel.formulaFx).toBe("fx");
  });

  it("keeps formula-bar [REVIEW] black (not status-low red)", () => {
    const { container } = renderWithIntl(<HeroExcelWindow />);
    const formulaBar = container.querySelector(".h-\\[30px\\]");
    expect(formulaBar).not.toBeNull();
    const marker = [...formulaBar!.querySelectorAll("span")].find(
      (el) => el.textContent === en.home.hero.excel.reviewMarker
    );
    expect(marker).toBeTruthy();
    expect(marker!.className).toMatch(/text-foreground/);
    expect(marker!.className).not.toMatch(/text-status-low/);
  });

  it("hides empty excel rows 9–12 below the sm breakpoint", () => {
    const { container } = renderWithIntl(<HeroExcelWindow />);
    const hiddenRows = [...container.querySelectorAll("tr.max-sm\\:hidden")];
    // rows 9,10,11,12
    expect(hiddenRows).toHaveLength(4);
    expect(hiddenRows.map((r) => r.querySelector("th")?.textContent)).toEqual([
      "9",
      "10",
      "11",
      "12",
    ]);
  });
});
