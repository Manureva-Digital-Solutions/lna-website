import { act, screen, within } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
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

/** Same provider renderWithIntl uses, exposed for SSR/hydration assertions. */
function withIntl(ui: ReactElement) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {ui}
    </NextIntlClientProvider>
  );
}

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

/** jsdom has no matchMedia: the hero only measures connectors on wide screens. */
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => {
    const list = {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
    return list as unknown as MediaQueryList;
  });
}

const REDUCED_MOTION_TRANSITION = "motion-reduce:transition-none";

/**
 * Nodes that used to keep a 300ms transition after the reduced-motion jump:
 * PDF field rows + their values, Excel cells + their values, the connector
 * paths and the download CTA.
 */
function transitionTargets(root: ParentNode) {
  return Array.from(
    root.querySelectorAll(
      [
        "[data-pdf-field]",
        "[data-pdf-field] > span:last-child",
        "[data-hero-cell]",
        "[data-hero-cell] > span",
        "[data-hero-loop] svg > g",
      ].join(", ")
    )
  );
}

function transitionClasses(node: Element) {
  return (node.getAttribute("class") ?? "")
    .split(/\s+/)
    .filter(
      (token) => token.includes("transition") || token.includes("duration")
    )
    .sort()
    .join(" ");
}

function transitionSignature(root: ParentNode) {
  return transitionTargets(root).map(
    (node) => `${node.tagName}|${transitionClasses(node)}`
  );
}

describe("HeroLoopVisual (LNAW-121)", () => {
  let hydrationRoot: Root | undefined;
  let hydrationContainer: HTMLDivElement | undefined;

  beforeEach(() => {
    reducedMotionState.current = true;
    stubIntersectionObserver(true);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  afterEach(async () => {
    if (hydrationRoot) {
      const root = hydrationRoot;
      hydrationRoot = undefined;
      await act(async () => root.unmount());
    }
    hydrationContainer?.remove();
    hydrationContainer = undefined;
    vi.restoreAllMocks();
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

  it("renders the motion-allowed opening frame on the server, even with reduced motion (LNAW-119)", () => {
    reducedMotionState.current = true;

    const html = renderToString(withIntl(<HeroLoopVisual />));
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(
      doc.querySelector("[data-hero-loop]")!.getAttribute("data-hero-phase")
    ).toBe("0");

    const rateCell = doc.querySelector('[data-hero-cell="rate-0"] span');
    expect(rateCell).not.toBeNull();
    expect(rateCell!.className).toContain("opacity-0");
    expect(rateCell!.className).not.toContain("opacity-100");

    expect(doc.querySelector("[data-hero-loop-status]")!.textContent).toContain(
      "0 / 4"
    );
  });

  it("hydrates without a mismatch, then jumps to the final frame with reduced motion (LNAW-119)", async () => {
    reducedMotionState.current = true;

    const element = withIntl(<HeroLoopVisual />);
    const container = document.createElement("div");
    hydrationContainer = container;
    container.innerHTML = renderToString(element);
    document.body.appendChild(container);

    // Server markup is the opening frame, whatever the motion preference.
    expect(container.querySelector("[data-hero-loop]")).toHaveAttribute(
      "data-hero-phase",
      "0"
    );

    const errors: string[] = [];
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args: unknown[]) => {
        errors.push(args.map((arg) => String(arg)).join(" "));
      });

    await act(async () => {
      hydrationRoot = hydrateRoot(container, element);
    });

    const hero = () =>
      container.querySelector("[data-hero-loop]") as HTMLElement;

    expect(errors.filter((msg) => /hydrat|did not match/i.test(msg))).toEqual(
      []
    );
    // After mount the reduced-motion branch applies: final filled sheet.
    expect(hero()).toHaveAttribute("data-hero-phase", "5");
    expect(screen.getByText("4 / 4")).toBeInTheDocument();
    expect(
      screen.getByText(en.home.hero.loop.downloadButton)
    ).toBeInTheDocument();

    errorSpy.mockRestore();
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

  it("drops the 300ms cell transitions when the user prefers reduced motion (LNAW-134)", () => {
    reducedMotionState.current = true;
    stubMatchMedia(true);

    const { container } = renderWithIntl(<HeroLoopVisual />);
    const downloadCta = screen
      .getByText(en.home.hero.loop.downloadButton)
      .closest("div") as HTMLElement;

    const targets = [...transitionTargets(container), downloadCta];
    // 3 PDF rows + 3 values + 9 Excel cells + 9 values + 3 connectors + CTA
    expect(targets.length).toBe(28);

    for (const node of targets) {
      expect(node.getAttribute("class")).toContain(REDUCED_MOTION_TRANSITION);
    }

    // The connector paths are rendered and covered too.
    expect(container.querySelectorAll("[data-hero-loop] svg > g").length).toBe(
      3
    );

    // The motion-on animation is untouched: the 300ms transitions stay declared.
    expect(container.querySelector('[data-hero-cell="rate-0"]')).toHaveClass(
      "transition-colors",
      "duration-300"
    );
    expect(
      container.querySelector('[data-hero-cell="rate-0"] span')
    ).toHaveClass("transition-opacity", "duration-300");
    expect(container.querySelector("[data-pdf-field]")).toHaveClass(
      "transition-[background-color,opacity]",
      "duration-300"
    );
    expect(downloadCta).toHaveClass("transition-opacity", "duration-300");
    expect(container.querySelector("[data-hero-loop] svg > g")).toHaveClass(
      "transition-opacity",
      "duration-300"
    );
  });

  it("keeps identical transition classes with reduced motion on or off (LNAW-134)", () => {
    stubMatchMedia(true);

    reducedMotionState.current = true;
    const reduced = renderWithIntl(<HeroLoopVisual />);
    const reducedSignature = transitionSignature(reduced.container);
    reduced.unmount();

    reducedMotionState.current = false;
    const animated = renderWithIntl(<HeroLoopVisual />);
    const animatedSignature = transitionSignature(animated.container);

    // The utility is CSS-only, so both motion modes declare the same transitions
    // and only `prefers-reduced-motion` decides whether they run.
    expect(animatedSignature).toEqual(reducedSignature);
    expect(reducedSignature.length).toBe(27);
    expect(
      reducedSignature.every((entry) =>
        entry.includes(REDUCED_MOTION_TRANSITION)
      )
    ).toBe(true);
  });

  it("keeps the transition classes stable across hydration with reduced motion (LNAW-134)", async () => {
    reducedMotionState.current = true;
    // Narrow viewport: the connectors are desktop-only, so both the server
    // markup and the hydrated tree render the same set of transition nodes.
    stubMatchMedia(false);

    const element = withIntl(<HeroLoopVisual />);
    const container = document.createElement("div");
    hydrationContainer = container;
    container.innerHTML = renderToString(element);
    document.body.appendChild(container);

    const serverSignature = transitionSignature(container);
    expect(serverSignature.length).toBe(24);

    const errors: string[] = [];
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation((...args: unknown[]) => {
        errors.push(args.map((arg) => String(arg)).join(" "));
      });

    await act(async () => {
      hydrationRoot = hydrateRoot(container, element);
    });

    expect(errors.filter((msg) => /hydrat|did not match/i.test(msg))).toEqual(
      []
    );
    // The CSS-only `motion-reduce` utility never flips a class after mount, so
    // the hydrated frame matches the server markup.
    expect(transitionSignature(container)).toEqual(serverSignature);

    errorSpy.mockRestore();
  });
});
