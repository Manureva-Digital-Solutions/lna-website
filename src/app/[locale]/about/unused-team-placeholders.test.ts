import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("LNAW-37 follow-up: unused team placeholder SVGs", () => {
  it("removes the four About team placeholder illustrations", () => {
    const dir = join(process.cwd(), "public/illustrations/team");
    for (const file of [
      "placeholder-1.svg",
      "placeholder-2.svg",
      "placeholder-3.svg",
      "placeholder-4.svg",
    ]) {
      expect(existsSync(join(dir, file))).toBe(false);
    }
  });
});
