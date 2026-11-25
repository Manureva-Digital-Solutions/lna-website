import { describe, expect, it } from "vitest";
import {
  DEMO_USE_CASE_ADP,
  DEMO_USE_CASE_CONDO,
  DEMO_USE_CASE_HEALTH,
} from "@/components/landing/visuals/demo-use-case-data";
import {
  DEMO_FILLED,
  DEMO_ISSUERS,
} from "@/components/landing/visuals/demo-sheet-data";

describe("demo-use-case-data (LNAW-127)", () => {
  it("reuses shared ADP demo values for the loan-insurance card", () => {
    expect(DEMO_USE_CASE_ADP.issuer).toBe(DEMO_ISSUERS[0]);
    expect(DEMO_USE_CASE_ADP.rate).toBe(DEMO_FILLED.rate[0]);
    expect(DEMO_USE_CASE_ADP.totalCost).toBe(DEMO_FILLED.totalCost[0]);
  });

  it("ships distinct fictional health and condo demo values", () => {
    expect(DEMO_USE_CASE_HEALTH.issuer).toBe("Clarté Santé");
    expect(DEMO_USE_CASE_HEALTH.hospital).toBeGreaterThan(0);
    expect(DEMO_USE_CASE_CONDO.building).toBe("Résidence des Pins");
    expect(DEMO_USE_CASE_CONDO.allocationKey).toMatch(/\d+\/\d+/);
  });

  it("avoids real insurer or property-manager brand names", () => {
    const blob = JSON.stringify({
      DEMO_USE_CASE_ADP,
      DEMO_USE_CASE_HEALTH,
      DEMO_USE_CASE_CONDO,
    });
    expect(blob).not.toMatch(/Generali|April|Malakoff|Foncia|Nexity/i);
  });
});
