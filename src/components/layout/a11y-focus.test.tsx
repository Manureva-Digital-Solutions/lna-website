import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../..");

describe("LNAW-84 focus + skip wiring", () => {
  it("defines a global 2px navy :focus-visible outline", () => {
    const css = readFileSync(join(root, "src/app/globals.css"), "utf8");
    expect(css).toMatch(
      /:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--primary\)/
    );
    expect(css).toMatch(/outline-offset:\s*-2px/);
  });

  it("targets skip link and main landmark at #main with tabindex=-1", () => {
    const skip = readFileSync(
      join(root, "src/components/layout/skip-to-content.tsx"),
      "utf8"
    );
    const layout = readFileSync(
      join(root, "src/app/[locale]/layout.tsx"),
      "utf8"
    );
    expect(skip).toContain('href="#main"');
    expect(layout).toMatch(/id="main"/);
    expect(layout).toMatch(/tabIndex=\{-1\}/);
  });

  it("keeps Button/Input focus-visible on the navy outline (not outline-none only)", () => {
    const button = readFileSync(
      join(root, "src/components/ui/button.tsx"),
      "utf8"
    );
    const input = readFileSync(
      join(root, "src/components/ui/input.tsx"),
      "utf8"
    );
    expect(button).toMatch(/focus-visible:outline-2/);
    expect(button).toMatch(/focus-visible:outline-primary/);
    expect(input).toMatch(/focus-visible:outline-2/);
    expect(input).toMatch(/focus-visible:outline-primary/);
  });
});
