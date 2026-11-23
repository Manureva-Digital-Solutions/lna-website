import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { renderWithIntl } from "@/test/render";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

describe("SkipToContent (LNAW-84)", () => {
  it("points at #main with localized label (EN)", () => {
    renderWithIntl(<SkipToContent />);
    const link = screen.getByRole("link", { name: en.common.skipToContent });
    expect(link).toHaveAttribute("href", "#main");
  });

  it("keeps FR label from messages (no hardcoded copy)", () => {
    renderWithIntl(<SkipToContent />, { locale: "fr" });
    expect(
      screen.getByRole("link", { name: fr.common.skipToContent })
    ).toHaveAttribute("href", "#main");
  });
});
