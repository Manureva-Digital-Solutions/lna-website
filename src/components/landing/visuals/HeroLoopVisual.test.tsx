import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { HeroLoopVisual } from "@/components/landing/visuals/HeroLoopVisual";
import { DEMO_ISSUERS } from "@/components/landing/visuals/demo-sheet-data";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

vi.mock("framer-motion", async () => {
  const actual =
    await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

describe("HeroLoopVisual (LNAW-121)", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      return window.setTimeout(
        () => cb(performance.now()),
        16
      ) as unknown as number;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      window.clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes role=img with the transformation aria-label", () => {
    renderWithIntl(<HeroLoopVisual />);
    expect(
      screen.getByRole("img", { name: en.home.hero.visual.description })
    ).toBeInTheDocument();
  });

  it("localizes FR chrome, PDF badge and download CTA", () => {
    renderWithIntl(<HeroLoopVisual />, { locale: "fr" });
    expect(
      screen.getByRole("img", { name: fr.home.hero.visual.description })
    ).toBeInTheDocument();
    expect(screen.getByText(fr.home.hero.loop.pdfBadge)).toBeInTheDocument();
    expect(
      screen.getAllByText(fr.home.hero.loop.pdfIssuer).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(fr.home.hero.loop.downloadButton)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(fr.home.hero.excel.filename).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(fr.home.hero.loop.documentsReadLabel)
    ).toBeInTheDocument();
    expect(
      screen.getByText(fr.home.hero.loop.fieldsFilledLabel)
    ).toBeInTheDocument();
    expect(screen.getByText(fr.home.hero.excel.formulaRef)).toBeInTheDocument();
    expect(screen.getByText(fr.home.hero.excel.formulaFx)).toBeInTheDocument();
    expect(screen.getByText(fr.home.hero.loop.pdfQuoteRef)).toBeInTheDocument();
    expect(screen.getByText(fr.home.hero.excel.sheet)).toBeInTheDocument();
    expect(screen.getByText(fr.home.hero.excel.ready)).toBeInTheDocument();
    expect(screen.getByText(fr.home.hero.loop.pdfDocNote)).toBeInTheDocument();
    expect(screen.getByText("devis-lumina-2026.pdf")).toBeInTheDocument();
  });

  it("shows the final filled sheet without review/confidence cues when reduced-motion", () => {
    const { container } = renderWithIntl(<HeroLoopVisual />);
    const root = container.querySelector("[data-hero-loop]") as HTMLElement;
    expect(root).toBeTruthy();

    for (const issuer of DEMO_ISSUERS) {
      expect(within(root).getAllByText(issuer).length).toBeGreaterThanOrEqual(
        1
      );
    }
    expect(screen.getAllByText("0.34%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("€4,218.00").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByText(en.home.hero.loop.downloadButton)
    ).toBeInTheDocument();
    expect(screen.getByText("4 / 4")).toBeInTheDocument();
    expect(
      within(container.querySelector("[data-hero-loop-status]")!).getByText("9")
    ).toBeInTheDocument();

    expect(root.textContent).not.toMatch(/\[REVIEW\]|confidence|fiabilité/i);
    expect(container.querySelector(".bg-status-low")).toBeNull();
    expect(container.querySelector(".text-status-low")).toBeNull();
  });

  it("keeps provenance-compatible fictional issuers only", () => {
    renderWithIntl(<HeroLoopVisual />);
    expect(
      screen.queryByText(/Generali|MetLife|Malakoff/i)
    ).not.toBeInTheDocument();
  });
});
