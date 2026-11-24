import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import { localeOgImagePath } from "@/lib/og";

const publicPath = (url: string) =>
  join(process.cwd(), "public", url.replace(/^\//, ""));

const MAX_BYTES = 300 * 1024;

describe("LNAW-122 locale og:image share cards", () => {
  it("ships FR and EN 1200×630 PNGs under 300 KB", () => {
    for (const locale of ["fr", "en"] as const) {
      const url = localeOgImagePath(locale);
      expect(url).toBe(`/brand/og-${locale}-1200x630.png`);
      const abs = publicPath(url);
      expect(existsSync(abs), `missing ${url}`).toBe(true);
      expect(statSync(abs).size).toBeLessThanOrEqual(MAX_BYTES);

      const buf = readFileSync(abs);
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50); // PNG signature
      // IHDR width/height at bytes 16–23 (big-endian)
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBe(1200);
      expect(height).toBe(630);
    }
  });

  it("uses each locale H1 for og:image:alt (no invented tagline)", () => {
    expect(localeOgImagePath("fr")).toBe("/brand/og-fr-1200x630.png");
    expect(localeOgImagePath("en")).toBe("/brand/og-en-1200x630.png");

    const frAlt = `${fr.home.hero.heading} ${fr.home.hero.headingHighlight}`;
    const enAlt = `${en.home.hero.heading} ${en.home.hero.headingHighlight}`;
    expect(frAlt).toBe(
      "Vos PDF entrent. Votre tableau Excel sort, déjà rempli."
    );
    expect(enAlt).toBe(
      "Your PDFs go in. Your Excel sheet comes out, already filled."
    );
  });

  it("wires openGraph + twitter images in the locale layout and drops og-default.svg", () => {
    const layout = readFileSync(
      join(process.cwd(), "src/app/[locale]/layout.tsx"),
      "utf8"
    );
    expect(layout).toMatch(/localeOgImagePath/);
    expect(layout).toMatch(/width:\s*1200/);
    expect(layout).toMatch(/height:\s*630/);
    expect(layout).toMatch(/twitter:\s*\{/);
    expect(layout).toMatch(/summary_large_image/);
    expect(layout).toMatch(/tHero\("heading"\)/);
    expect(layout).toMatch(/tHero\("headingHighlight"\)/);
    expect(layout).not.toMatch(/og-default\.svg/);
    expect(existsSync(publicPath("/brand/og-default.svg"))).toBe(false);
  });
});
