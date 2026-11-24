import { act, screen, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  HeroLoopVisual,
  HERO_LOOP_PHASE_MS,
} from "@/components/landing/visuals/HeroLoopVisual";
import { DEMO_ISSUERS } from "@/components/landing/visuals/demo-sheet-data";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

const reducedMotionState = { current: true as boolean | null };

vi.mock("framer-motion", async () => {
  const actual =
    await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => reducedMotionState.current,
  };
});

function stubIntersectionObserver(intersecting = true) {
  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element) {
      this.callback(
        [
          {
            isIntersecting: intersecting,
            target,
            intersectionRatio: intersecting ? 1 : 0,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    root = null;
    rootMargin = "";
    thresholds = [0];
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

describe("HeroLoopVisual (LNAW-121)", () => {
  beforeEach(() => {
    reducedMotionState.current = true;
    stubIntersectionObserver(true);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("formats rates and costs for EN vs FR (LNA-252)", () => {
    const { unmount } = renderWithIntl(<HeroLoopVisual />);
    expect(screen.getAllByText("0.34%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("€4,218.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/0,34/)).not.toBeInTheDocument();
    unmount();

    renderWithIntl(<HeroLoopVisual />, { locale: "fr" });
    expect(screen.getAllByText(/0,34\s*%/).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/4[\s\u00a0]218,00\s*€/).length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("0.34%")).not.toBeInTheDocument();
    expect(screen.queryByText("€4,218.00")).not.toBeInTheDocument();
  });

  it("shows the final filled sheet without review/confidence cues when reduced-motion", () => {
    const { container } = renderWithIntl(<HeroLoopVisual />);
    const root = container.querySelector("[data-hero-loop]") as HTMLElement;
    expect(root).toBeTruthy();
    expect(root).toHaveAttribute("data-hero-phase", "5");

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

  it("advances through phases with timers when reduced-motion is off", () => {
    reducedMotionState.current = false;
    vi.useFakeTimers();

    const { container } = renderWithIntl(<HeroLoopVisual />);
    const root = () =>
      container.querySelector("[data-hero-loop]") as HTMLElement;
    const rateCell = () =>
      container.querySelector('[data-hero-cell="rate-0"] span');

    expect(root()).toHaveAttribute("data-hero-phase", "0");
    expect(rateCell()).toHaveClass("opacity-0");

    act(() => {
      vi.advanceTimersByTime(HERO_LOOP_PHASE_MS.rate);
    });
    expect(root()).toHaveAttribute("data-hero-phase", "1");
    expect(rateCell()).toHaveClass("opacity-100");

    act(() => {
      vi.advanceTimersByTime(HERO_LOOP_PHASE_MS.cost - HERO_LOOP_PHASE_MS.rate);
    });
    expect(root()).toHaveAttribute("data-hero-phase", "2");

    act(() => {
      vi.advanceTimersByTime(
        HERO_LOOP_PHASE_MS.quota - HERO_LOOP_PHASE_MS.cost
      );
    });
    expect(root()).toHaveAttribute("data-hero-phase", "3");

    act(() => {
      vi.advanceTimersByTime(
        HERO_LOOP_PHASE_MS.others - HERO_LOOP_PHASE_MS.quota
      );
    });
    expect(root()).toHaveAttribute("data-hero-phase", "4");
    expect(screen.getByText("4 / 4")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(
        HERO_LOOP_PHASE_MS.download - HERO_LOOP_PHASE_MS.others
      );
    });
    expect(root()).toHaveAttribute("data-hero-phase", "5");
    expect(
      screen.getByText(en.home.hero.loop.downloadButton)
    ).toBeInTheDocument();
  });
});
