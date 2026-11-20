import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

/**
 * Launch-readiness: features must not ship the Rick Astley YouTube placeholder
 * (dQw4w9WgXcQ) or any third-party video request on first paint until a real
 * product video exists.
 */
describe("features page video placeholder", () => {
  const pageSource = readFileSync(resolve(__dirname, "page.tsx"), "utf8");

  it("does not embed the rickroll YouTube id or VideoEmbed", () => {
    expect(pageSource).not.toContain("dQw4w9WgXcQ");
    expect(pageSource).not.toContain("VideoEmbed");
    expect(pageSource).not.toContain("youtube.com");
  });

  it("drops unused videoTitle copy from EN/FR features messages", () => {
    expect(en.features).not.toHaveProperty("videoTitle");
    expect(fr.features).not.toHaveProperty("videoTitle");
    expect(Object.keys(en.features).sort()).toEqual(
      Object.keys(fr.features).sort()
    );
  });
});
