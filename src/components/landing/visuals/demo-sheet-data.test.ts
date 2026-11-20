import { describe, expect, it } from "vitest";
import {
  DEMO_FILLED,
  DEMO_ISSUERS,
  DEMO_SOURCE_DOCS,
} from "@/components/landing/visuals/demo-sheet-data";

describe("demo-sheet-data", () => {
  it("keeps issuer columns distinct across rate, cost and quota", () => {
    expect(new Set(DEMO_FILLED.rate).size).toBe(DEMO_ISSUERS.length);
    expect(new Set(DEMO_FILLED.totalCost).size).toBe(DEMO_ISSUERS.length);
    expect(DEMO_FILLED.quota[0]).not.toBe(DEMO_FILLED.quota[1]);
  });

  it("aligns source PDF devis files with the three fictional issuers", () => {
    const devis = DEMO_SOURCE_DOCS.filter((d) => d.issuer !== null);
    expect(devis).toHaveLength(DEMO_ISSUERS.length);
    expect(devis.map((d) => d.issuer)).toEqual([...DEMO_ISSUERS]);
    expect(DEMO_SOURCE_DOCS.some((d) => d.file.includes("amortissement"))).toBe(
      true
    );
  });

  it("does not include real insurer brand names", () => {
    const blob = JSON.stringify({ DEMO_ISSUERS, DEMO_SOURCE_DOCS });
    expect(blob).not.toMatch(/Generali|April|MetLife|Malakoff/i);
  });
});
