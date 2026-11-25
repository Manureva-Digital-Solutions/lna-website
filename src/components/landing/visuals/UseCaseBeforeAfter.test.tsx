import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";
import { UseCaseBeforeAfter } from "@/components/landing/visuals/UseCaseBeforeAfter";
import { UseCases } from "@/components/landing/UseCases";

vi.mock("framer-motion", async () => {
  const actual =
    await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

describe("UseCaseBeforeAfter (LNAW-127)", () => {
  beforeEach(() => {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("renders FR/EN aria-labels and locale-aware ADP formats", () => {
    const { unmount } = renderWithIntl(<UseCaseBeforeAfter useCase="adp" />);
    expect(
      screen.getByRole("img", { name: en.home.useCases.adp.visualLabel })
    ).toBeInTheDocument();
    expect(screen.getAllByText("0.34%").length).toBeGreaterThanOrEqual(2);
    unmount();

    renderWithIntl(<UseCaseBeforeAfter useCase="adp" />, { locale: "fr" });
    expect(
      screen.getByRole("img", { name: fr.home.useCases.adp.visualLabel })
    ).toBeInTheDocument();
    expect(screen.getAllByText("0,34 %").length).toBeGreaterThanOrEqual(2);
  });

  it("renders health and condo fictional fields without review cues", () => {
    const { unmount } = renderWithIntl(<UseCaseBeforeAfter useCase="health" />);
    expect(
      screen.getAllByText(en.home.useCases.health.rowHospital).length
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Clarté Santé").length).toBeGreaterThanOrEqual(
      1
    );
    unmount();

    renderWithIntl(<UseCaseBeforeAfter useCase="condo" />, { locale: "fr" });
    expect(
      screen.getAllByText(fr.home.useCases.condo.rowKey).length
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("120/1000").length).toBeGreaterThanOrEqual(2);
  });

  it("keeps card titles/descriptions and mounts three visuals in UseCases", () => {
    renderWithIntl(<UseCases />);
    const band = document.querySelector("[data-use-cases]") as HTMLElement;
    expect(within(band).getAllByRole("article")).toHaveLength(3);
    expect(band.querySelectorAll("[data-use-case-visual]")).toHaveLength(3);
    expect(
      within(band).getByRole("heading", { name: en.home.useCases.adp.title })
    ).toBeInTheDocument();
    expect(
      within(band).getByText(en.home.useCases.adp.description)
    ).toBeInTheDocument();
    expect(
      band.className + within(band).getAllByRole("article")[0].className
    ).toMatch(/max-h-\[520px\]/);
  });

  it("ships no confidence/review wording in use-case visual copy", () => {
    const blob =
      JSON.stringify(en.home.useCases) + JSON.stringify(fr.home.useCases);
    expect(blob).not.toMatch(/confidence|fiabilité|\[REVIEW\]|à vérifier/i);
  });
});
