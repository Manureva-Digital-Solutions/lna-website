import { describe, expect, it } from "vitest";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

describe("about team copy", () => {
  it("has no Team Member / Membre de l'équipe placeholders in EN or FR", () => {
    const enBlob = JSON.stringify(en.about.team);
    const frBlob = JSON.stringify(fr.about.team);

    expect(enBlob).not.toMatch(/Team Member/i);
    expect(frBlob).not.toMatch(/Membre de l'équipe/i);
    expect(en.about.team).not.toHaveProperty("member1");
    expect(fr.about.team).not.toHaveProperty("member1");
  });

  it("describes disciplines instead of named placeholder people", () => {
    for (const key of ["ai", "product", "enterprise", "delivery"] as const) {
      expect(en.about.team[key].title.length).toBeGreaterThan(0);
      expect(en.about.team[key].description.length).toBeGreaterThan(0);
      expect(fr.about.team[key].title.length).toBeGreaterThan(0);
      expect(fr.about.team[key].description.length).toBeGreaterThan(0);
    }
  });
});
