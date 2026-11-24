import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import en from "../../../messages/en.json";
import { HowItWorks } from "@/components/landing/HowItWorks";

vi.mock("framer-motion", async () => {
  const actual =
    await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

describe("HowItWorks LNAW-123 wiring", () => {
  it("renders the section heading and three-steps visuals", () => {
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

    renderWithIntl(<HowItWorks />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: en.home.howItWorks.heading,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: en.home.howItWorks.visual.description })
    ).toBeInTheDocument();
    expect(
      document.querySelector("#steps [data-three-steps-visuals]")
    ).not.toBeNull();
  });
});
