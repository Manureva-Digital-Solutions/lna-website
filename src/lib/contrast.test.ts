import { describe, expect, it } from "vitest";
import { contrastRatio, LNA_A11Y_COLORS, meetsWcagAa } from "@/lib/contrast";

describe("LNAW-84 contrast tokens", () => {
  const { body, navy, white, gray10, muted, primaryForeground } =
    LNA_A11Y_COLORS;

  it("body ink on white meets WCAG AA (normal text)", () => {
    expect(contrastRatio(body, white)).toBeGreaterThanOrEqual(4.5);
    expect(meetsWcagAa(body, white)).toBe(true);
  });

  it("navy on white meets AA and reaches AAA for normal text", () => {
    const ratio = contrastRatio(navy, white);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThanOrEqual(7);
    expect(meetsWcagAa(navy, white)).toBe(true);
  });

  it("navy on Gray 10 meets WCAG AA", () => {
    expect(contrastRatio(navy, gray10)).toBeGreaterThanOrEqual(4.5);
    expect(meetsWcagAa(navy, gray10)).toBe(true);
  });

  it("secondary/muted text on white meets WCAG AA", () => {
    expect(contrastRatio(muted, white)).toBeGreaterThanOrEqual(4.5);
    expect(meetsWcagAa(muted, white)).toBe(true);
  });

  it("navy button label (white on navy) meets WCAG AA", () => {
    expect(contrastRatio(primaryForeground, navy)).toBeGreaterThanOrEqual(4.5);
    expect(meetsWcagAa(primaryForeground, navy)).toBe(true);
  });

  it("ghost/text links (navy on light) stay AA on white and Gray 10", () => {
    expect(meetsWcagAa(navy, white)).toBe(true);
    expect(meetsWcagAa(navy, gray10)).toBe(true);
  });
});
