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
  it("keeps hello@lnaflow.com out of company.p4 so the mailto link is the only display", () => {
    expect(en.about.company.p4).not.toMatch(/hello@lnaflow\.com/i);
    expect(fr.about.company.p4).not.toMatch(/hello@lnaflow\.com/i);
    expect(aboutPage).toMatch(/mailto:hello@lnaflow\.com/);
    expect(aboutPage.match(/hello@lnaflow\.com/g)?.length).toBe(2);
  });

  it("switches workflow diagram asset by locale", () => {
    expect(aboutPage).toMatch(/workflow-diagram-fr\.svg/);
    expect(aboutPage).toMatch(/workflow-diagram\.svg/);
    expect(aboutPage).toMatch(/locale === "fr"/);
    expect(
      existsSync(
        join(process.cwd(), "public/illustrations/workflow-diagram.svg")
      )
    ).toBe(true);
    expect(
      existsSync(
        join(process.cwd(), "public/illustrations/workflow-diagram-fr.svg")
      )
    ).toBe(true);

    const frSvg = readFileSync(
      join(process.cwd(), "public/illustrations/workflow-diagram-fr.svg"),
      "utf8"
    );
    expect(frSvg).toMatch(/Déposer/);
    expect(frSvg).toMatch(/Extraction IA/);
    expect(frSvg).not.toMatch(/>Upload</);
  });
});
