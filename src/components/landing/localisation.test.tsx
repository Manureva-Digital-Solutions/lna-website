import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { UseCases } from "@/components/landing/UseCases";
import { ConfidenceGrid } from "@/components/landing/visuals/ConfidenceGrid";
import { HeroExcelWindow } from "@/components/landing/visuals/HeroExcelWindow";
import { Footer } from "@/components/layout/footer";
import { renderWithIntl } from "@/test/render";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

vi.mock("next/image", () => ({
  default: ({
    alt,
    ...props
  }: {
    alt: string;
    src: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

/**
 * LNAW-95 — lock frozen copy, Gilbert labels, and LNA-252 locale formats.
 */
describe("LNAW-95 localisation", () => {
  it("uses locale-specific Excel filenames from i18n (no cross-locale chrome)", () => {
    // EN must not show the FR mockup name; ExcelGrid requires caption from callers.
    expect(en.home.hero.excel.filename).toBe("comparison-adp.xlsx");
    expect(fr.home.hero.excel.filename).toBe("comparatif-adp.xlsx");
  });

  it("reuses the steps heading as the hero ghost CTA (Gilbert)", () => {
    expect(en.home.howItWorks.heading).toBe(
      "Three steps, the same as in the app"
    );
    expect(fr.home.howItWorks.heading).toBe(
      "Trois étapes, les mêmes que dans l'application"
    );

    renderWithIntl(<Hero />);
    // Ghost CTA is a Button render=<a> (role=button), same label as steps H2.
    expect(
      screen.getByRole("button", { name: en.home.howItWorks.heading })
    ).toHaveAttribute("href", "#steps");
  });

  it("renders mono 01–03 on steps and use cases (Gilbert)", () => {
    renderWithIntl(
      <>
        <HowItWorks />
        <UseCases />
      </>
    );

    const steps = document.querySelector("#steps") as HTMLElement;
    const cases = document.querySelector("[data-use-cases]") as HTMLElement;
    for (const n of ["01", "02", "03"]) {
      expect(within(steps).getByText(n)).toBeInTheDocument();
      expect(within(cases).getByText(n)).toBeInTheDocument();
    }
  });

  it("keeps Cookie settings / Gérer les cookies footer labels (Gilbert)", () => {
    expect(en.footer.cookieSettings).toBe("Cookie settings");
    expect(fr.footer.cookieSettings).toBe("Gérer les cookies");

    const { unmount } = renderWithIntl(<Footer />);
    expect(
      screen.getByRole("button", { name: en.footer.cookieSettings })
    ).toBeInTheDocument();
    unmount();

    renderWithIntl(<Footer />, { locale: "fr" });
    expect(
      screen.getByRole("button", { name: fr.footer.cookieSettings })
    ).toBeInTheDocument();
  });

  it("keeps English Row Key / Conf. headers on both locales (Gilbert / product)", () => {
    expect(en.home.bands.confidence.colRowKey).toBe("Row Key");
    expect(en.home.bands.confidence.colConf).toBe("Conf.");
    expect(fr.home.bands.confidence.colRowKey).toBe("Row Key");
    expect(fr.home.bands.confidence.colConf).toBe("Conf.");

    const { unmount } = renderWithIntl(<ConfidenceGrid />);
    expect(screen.getByRole("columnheader", { name: "Row Key" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Conf." })).toBeTruthy();
    unmount();

    renderWithIntl(<ConfidenceGrid />, { locale: "fr" });
    expect(screen.getByRole("columnheader", { name: "Row Key" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Conf." })).toBeTruthy();
  });

  it("formats hero Excel rates and costs for EN vs FR (LNA-252)", () => {
    const { unmount } = renderWithIntl(<HeroExcelWindow />);
    expect(screen.getByText("0.34%")).toBeInTheDocument();
    expect(screen.getByText("€4,218.00")).toBeInTheDocument();
    expect(screen.queryByText(/0,34/)).not.toBeInTheDocument();
    unmount();

    renderWithIntl(<HeroExcelWindow />, { locale: "fr" });
    // Intl may use narrow NBSP between number and %
    expect(screen.getByText(/0,34\s*%/)).toBeInTheDocument();
    expect(screen.getByText(/4[\s\u00a0]218,00\s*€/)).toBeInTheDocument();
    expect(screen.queryByText("0.34%")).not.toBeInTheDocument();
    expect(screen.queryByText("€4,218.00")).not.toBeInTheDocument();
  });

  it("keeps FR ribbon chrome off the EN hero sheet", () => {
    renderWithIntl(<HeroExcelWindow />);
    expect(screen.getByText(en.home.hero.excel.tabFile)).toBeInTheDocument();
    expect(
      screen.queryByText(fr.home.hero.excel.tabFile)
    ).not.toBeInTheDocument();
    expect(screen.getByText(en.home.hero.excel.sheet)).toBeInTheDocument();
    expect(
      screen.queryByText(fr.home.hero.excel.sheet)
    ).not.toBeInTheDocument();
  });
});
