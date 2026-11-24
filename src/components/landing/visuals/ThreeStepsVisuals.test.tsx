import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";
import {
  ThreeStepsVisuals,
  THREE_STEPS_HOLD_FINAL_MS,
  THREE_STEPS_LOOP_MS,
} from "@/components/landing/visuals/ThreeStepsVisuals";
import { DEMO_SOURCE_DOCS } from "@/components/landing/visuals/demo-sheet-data";

vi.mock("framer-motion", async () => {
  const actual =
    await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

describe("ThreeStepsVisuals (LNAW-123)", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("holds a ~10s loop with ≥1.5s final hold constants", () => {
    expect(THREE_STEPS_LOOP_MS).toBe(10000);
    expect(THREE_STEPS_HOLD_FINAL_MS).toBeGreaterThanOrEqual(1500);
  });

  it("renders Gilbert FR/EN microcopy and fictional demo files (reduced motion)", () => {
    expect(en.home.howItWorks.template.loaded).toBe("Template loaded");
    expect(fr.home.howItWorks.template.loaded).toBe("Modèle chargé");
    expect(en.home.howItWorks.documents.read).toBe("4 documents read");
    expect(fr.home.howItWorks.documents.read).toBe("4 documents lus");
    expect(en.home.howItWorks.documents.sorted).toBe(
      "Each document is sorted automatically."
    );
    expect(fr.home.howItWorks.documents.sorted).toBe(
      "Chaque document est classé automatiquement."
    );
    expect(en.home.howItWorks.download.label).toBe("Download your Excel");
    expect(fr.home.howItWorks.download.label).toBe("Téléchargez votre Excel");

    renderWithIntl(<ThreeStepsVisuals />);
    const root = screen.getByRole("img", {
      name: en.home.howItWorks.visual.description,
    });
    expect(
      within(root).getByText(en.home.howItWorks.template.loaded)
    ).toBeInTheDocument();
    expect(
      within(root).getByText(en.home.howItWorks.documents.read)
    ).toBeInTheDocument();
    expect(
      within(root).getByText(en.home.howItWorks.documents.sorted)
    ).toBeInTheDocument();
    expect(
      within(root).getByText(en.home.bands.validation.downloadButton)
    ).toBeInTheDocument();
    for (const doc of DEMO_SOURCE_DOCS) {
      expect(within(root).getByText(doc.file)).toBeInTheDocument();
    }
    expect(
      within(root).getAllByText(en.home.hero.excel.filename).length
    ).toBeGreaterThan(0);
  });

  it("localizes FR chrome and number formats in reduced-motion completed state", () => {
    renderWithIntl(<ThreeStepsVisuals />, { locale: "fr" });
    const root = screen.getByRole("img", {
      name: fr.home.howItWorks.visual.description,
    });
    expect(
      within(root).getByText(fr.home.howItWorks.template.loaded)
    ).toBeInTheDocument();
    expect(
      within(root).getByText(fr.home.howItWorks.documents.read)
    ).toBeInTheDocument();
    expect(within(root).getByText("0,34 %")).toBeInTheDocument();
    expect(within(root).getByText(/4\s?218/)).toBeInTheDocument();
    expect(
      within(root).getAllByText(fr.home.hero.excel.filename).length
    ).toBeGreaterThan(0);
  });

  it("marks all three steps present; only step 03 uses the navy top rule", () => {
    const { container } = renderWithIntl(<ThreeStepsVisuals />);
    const steps = container.querySelectorAll("[data-step]");
    expect(steps).toHaveLength(3);
    const template = container.querySelector('[data-step="template"]');
    const documents = container.querySelector('[data-step="documents"]');
    const download = container.querySelector('[data-step="download"]');
    expect(template?.className).toMatch(/border-\[#e5e7eb\]/);
    expect(documents?.className).toMatch(/border-\[#e5e7eb\]/);
    expect(download?.className).toMatch(/border-primary/);
    expect(download?.getAttribute("data-active")).toBe("true");
  });

  it("ships no review/confidence/warning cues in the visual copy", () => {
    const blob =
      JSON.stringify(en.home.howItWorks) + JSON.stringify(fr.home.howItWorks);
    expect(blob).not.toMatch(/confidence|fiabilité|review|à vérifier|warning/i);
    expect(blob).not.toMatch(/\b(red|orange|amber)\b/i);
  });
});
