import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import { pageAlternates } from "@/lib/seo";
import { localeOgImagePath } from "@/lib/og";
import { PRELAUNCH, SITE_URL } from "@/lib/site";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const FONT_FILES = [
  "IBMPlexSans-Light.woff2",
  "IBMPlexSans-Regular.woff2",
  "IBMPlexSans-SemiBold.woff2",
  "IBMPlexMono-Regular.woff2",
  "IBMPlexMono-SemiBold.woff2",
] as const;

/** Real site copy — LNAW-86 must not invent new slogans. */
const SEO_COPY = {
  en: {
    title: "LNA — your PDFs fill in your Excel sheet",
    description:
      "Drop in your quotes, amortisation schedules or service-charge statements. LNA fills your own Excel template, straight into your sheet.",
  },
  fr: {
    title: "LNA — vos PDF remplissent votre tableau Excel",
    description:
      "Déposez vos devis, tableaux d'amortissement ou décomptes de charges. LNA remplit votre propre modèle Excel, directement dans votre feuille.",
  },
} as const;

describe("LNAW-86 self-hosted IBM Plex (GDPR)", () => {
  it("ships Plex Sans 300/400/600 and Plex Mono 400/600 as same-origin woff2", () => {
    for (const file of FONT_FILES) {
      const abs = join(root, "src/fonts", file);
      expect(existsSync(abs), `missing ${file}`).toBe(true);
      expect(statSync(abs).size).toBeGreaterThan(10_000);
      const buf = readFileSync(abs);
      // woff2 signature "wOF2"
      expect(buf.subarray(0, 4).toString("ascii")).toBe("wOF2");
    }
    expect(existsSync(join(root, "src/fonts/OFL.txt"))).toBe(true);
  });

  it("loads fonts via next/font/local with preload, not Google Fonts", () => {
    const fonts = read("src/lib/fonts.ts");
    expect(fonts).toMatch(/from ["']next\/font\/local["']/);
    expect(fonts).not.toMatch(/next\/font\/google/);
    expect(fonts).toMatch(/preload:\s*true/);
    expect(fonts).toMatch(/IBMPlexSans-Light\.woff2/);
    expect(fonts).toMatch(/IBMPlexSans-Regular\.woff2/);
    expect(fonts).toMatch(/IBMPlexSans-SemiBold\.woff2/);
    expect(fonts).toMatch(/IBMPlexMono-Regular\.woff2/);
    expect(fonts).toMatch(/IBMPlexMono-SemiBold\.woff2/);
    expect(fonts).toMatch(/--font-ibm-plex-sans/);
    expect(fonts).toMatch(/--font-ibm-plex-mono/);

    const layout = read("src/app/[locale]/layout.tsx");
    expect(layout).toMatch(/ibmPlexSans\.variable/);
    expect(layout).toMatch(/ibmPlexMono\.variable/);

    const css = read("src/app/globals.css");
    expect(css).toMatch(/--font-ibm-plex-sans/);
    expect(css).toMatch(/--font-ibm-plex-mono/);
  });

  it("has no fonts.googleapis.com / fonts.gstatic.com in shippable source", () => {
    const shipRoots = ["src", "public", "messages"];
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const name of readdirSync(dir, { withFileTypes: true })) {
        if (name.name === "node_modules" || name.name.startsWith(".")) continue;
        const abs = join(dir, name.name);
        if (name.isDirectory()) {
          walk(abs);
          continue;
        }
        if (!/\.(ts|tsx|js|jsx|css|html|json|svg|mdx)$/.test(name.name))
          continue;
        // Tests + fonts.ts may mention the banned hosts as the policy under test.
        if (/\.test\.(ts|tsx)$/.test(name.name)) continue;
        if (abs.replace(/\\/g, "/").endsWith("src/lib/fonts.ts")) continue;
        const text = readFileSync(abs, "utf8");
        if (
          text.includes("fonts.googleapis.com") ||
          text.includes("fonts.gstatic.com")
        ) {
          offenders.push(abs.replace(root + "/", ""));
        }
      }
    };

    for (const rel of shipRoots) walk(join(root, rel));
    expect(offenders).toEqual([]);
  });
});

describe("LNAW-86 SEO metadata (title, canonical, hreflang, OG)", () => {
  it("keeps existing locale title and description copy", () => {
    expect(en.seo.title).toBe(SEO_COPY.en.title);
    expect(en.seo.description).toBe(SEO_COPY.en.description);
    expect(fr.seo.title).toBe(SEO_COPY.fr.title);
    expect(fr.seo.description).toBe(SEO_COPY.fr.description);
  });

  it("keeps self-referential canonical + hreflang (en, fr, x-default→fr)", () => {
    const homeEn = pageAlternates("en");
    expect(homeEn.canonical).toBe(`${SITE_URL}/en`);
    expect(homeEn.languages).toEqual({
      fr: `${SITE_URL}/fr`,
      en: `${SITE_URL}/en`,
      "x-default": `${SITE_URL}/fr`,
    });

    const pricingFr = pageAlternates("fr", "/pricing");
    expect(pricingFr.canonical).toBe(`${SITE_URL}/fr/pricing`);
    expect(pricingFr.languages.en).toBe(`${SITE_URL}/en/pricing`);
    expect(pricingFr.languages["x-default"]).toBe(`${SITE_URL}/fr/pricing`);

    const layout = read("src/app/[locale]/layout.tsx");
    expect(layout).toMatch(/canonical:\s*`\$\{SITE_URL\}\/\$\{locale\}`/);
    expect(layout).toMatch(/"x-default":\s*`\$\{SITE_URL\}\/fr`/);
  });

  it("ships v4 locale OG PNGs at least 1200×630 (no legacy og-default.svg)", () => {
    for (const locale of ["fr", "en"] as const) {
      const url = localeOgImagePath(locale);
      const abs = join(root, "public", url.replace(/^\//, ""));
      expect(existsSync(abs), `missing ${url}`).toBe(true);
      const buf = readFileSync(abs);
      expect(buf[0]).toBe(0x89);
      expect(buf[1]).toBe(0x50);
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBeGreaterThanOrEqual(1200);
      expect(height).toBeGreaterThanOrEqual(630);
    }
    expect(existsSync(join(root, "public/brand/og-default.svg"))).toBe(false);

    const layout = read("src/app/[locale]/layout.tsx");
    expect(layout).toMatch(/localeOgImagePath/);
    expect(layout).toMatch(/openGraph:/);
    expect(layout).toMatch(/twitter:/);
  });
});

describe("LNAW-86 robots ownership (LNA-251 — do not change)", () => {
  it("leaves PRELAUNCH-driven robots meta and robots.txt as-is", () => {
    expect(PRELAUNCH).toBe(true);

    const robots = read("src/app/robots.ts");
    expect(robots).toMatch(/PRELAUNCH/);
    expect(robots).toMatch(/disallow:\s*"\/"/);
    expect(robots).toMatch(/sitemap:\s*`\$\{SITE_URL\}\/sitemap\.xml`/);

    const layout = read("src/app/[locale]/layout.tsx");
    expect(layout).toMatch(
      /robots:\s*PRELAUNCH\s*\?\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/
    );
    expect(layout).not.toMatch(/index:\s*true/);
  });
});
