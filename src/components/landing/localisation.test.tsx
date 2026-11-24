import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { UseCases } from "@/components/landing/UseCases";
import { HeroLoopVisual } from "@/components/landing/visuals/HeroLoopVisual";
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

  it("uses Gilbert LNAW-124 step 3 and fields band wording in both locales", () => {
    expect(en.home.howItWorks.download.label).toBe("Download your Excel");
    expect(en.home.howItWorks.download.description).toBe(
      "Get your file, filled in and ready to use."
    );
    expect(fr.home.howItWorks.download.label).toBe("Téléchargez votre Excel");
    expect(fr.home.howItWorks.download.description).toBe(
      "Récupérez votre fichier, rempli, prêt à l'emploi."
    );
    expect(en.home.bands.fields.heading).toBe("Every field in its place");
    expect(fr.home.bands.fields.heading).toBe("Chaque champ à sa place");
    expect(en.home.bands.validation.heading).toBe("An Excel ready to share");
    expect(fr.home.bands.validation.heading).toBe("Un Excel prêt à partager");

    renderWithIntl(<HowItWorks />);
    expect(
      screen.getByRole("heading", { name: en.home.howItWorks.download.label })
    ).toBeInTheDocument();
  });

  it("formats hero Excel rates and costs for EN vs FR (LNA-252)", () => {
    const { unmount } = renderWithIntl(<HeroLoopVisual />);
    expect(screen.getAllByText("0.34%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("€4,218.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/0,34/)).not.toBeInTheDocument();
    unmount();

    renderWithIntl(<HeroLoopVisual />, { locale: "fr" });
    // Intl may use narrow NBSP between number and %
    expect(screen.getAllByText(/0,34\s*%/).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/4[\s\u00a0]218,00\s*€/).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("0.34%")).not.toBeInTheDocument();
    expect(screen.queryByText("€4,218.00")).not.toBeInTheDocument();
  });

  it("keeps FR ribbon chrome off the EN hero sheet", () => {
    renderWithIntl(<HeroLoopVisual />);
    expect(
      screen.getAllByText(en.home.hero.excel.tabFile).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByText(fr.home.hero.excel.tabFile)
    ).not.toBeInTheDocument();
    expect(screen.getByText(en.home.hero.excel.sheet)).toBeInTheDocument();
    expect(
      screen.queryByText(fr.home.hero.excel.sheet)
    ).not.toBeInTheDocument();
  });
});
