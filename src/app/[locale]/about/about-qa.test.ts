import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

const aboutPage = readFileSync(
  join(process.cwd(), "src/app/[locale]/about/page.tsx"),
  "utf8"
);

describe("LNAW-89 / LNAW-90 About QA", () => {
  it("keeps support@lnaflow.com out of company.p4 so the mailto link is the only display", () => {
    expect(en.about.company.p4).not.toMatch(/support@lnaflow\.com/i);
    expect(fr.about.company.p4).not.toMatch(/support@lnaflow\.com/i);
    expect(aboutPage).toMatch(/mailto:support@lnaflow\.com/);
    expect(aboutPage.match(/support@lnaflow\.com/g)?.length).toBe(2);
  });
});

/** LNAW-131 — About uses the three-steps product visual, not the old diagrams. */
describe("LNAW-131 About three-steps visual", () => {
  it("renders ThreeStepsVisuals in static completed state with locale alt text", () => {
    expect(aboutPage).toMatch(/ThreeStepsVisuals/);
    expect(aboutPage).toMatch(/staticComplete/);
    expect(aboutPage).toMatch(/problem\.imageAlt/);
    expect(aboutPage).not.toMatch(/workflow-diagram/);
    expect(en.about.problem.imageAlt).toMatch(/Excel/i);
    expect(fr.about.problem.imageAlt).toMatch(/Excel/i);
    expect(en.about.problem.imageAlt).not.toMatch(/CSV|JSON|API/i);
    expect(fr.about.problem.imageAlt).not.toMatch(/CSV|JSON|API/i);
  });

  it("removes the unused workflow diagram assets", () => {
    expect(
      existsSync(
        join(process.cwd(), "public/illustrations/workflow-diagram.svg")
      )
    ).toBe(false);
    expect(
      existsSync(
        join(process.cwd(), "public/illustrations/workflow-diagram-fr.svg")
      )
    ).toBe(false);
  });
});
