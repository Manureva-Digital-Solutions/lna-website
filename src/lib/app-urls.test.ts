import { describe, expect, it } from "vitest";
import { appUrls, registerUrl } from "@/lib/app-urls";

describe("registerUrl", () => {
  it("returns the bare register URL when no plan or billing is set", () => {
    expect(registerUrl()).toBe(appUrls.register);
    expect(registerUrl({})).toBe(appUrls.register);
  });

  it("preselects the product PlanTier and billing period", () => {
    expect(registerUrl({ plan: "starter", billing: "annual" })).toBe(
      `${appUrls.register}?plan=STARTER&billing=annual`
    );
    expect(registerUrl({ plan: "professional", billing: "monthly" })).toBe(
      `${appUrls.register}?plan=PROFESSIONAL&billing=monthly`
    );
    expect(registerUrl({ plan: "high", billing: "annual" })).toBe(
      `${appUrls.register}?plan=HIGH&billing=annual`
    );
  });

  it("allows billing-only handoff for the generic trial CTA", () => {
    expect(registerUrl({ billing: "annual" })).toBe(
      `${appUrls.register}?billing=annual`
    );
  });
});
