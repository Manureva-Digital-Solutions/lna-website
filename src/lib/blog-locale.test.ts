import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

const publicPath = (url: string) =>
  join(process.cwd(), "public", url.replace(/^\//, ""));

describe("blog locale content (FR MDX + EN fallback)", () => {
  it("serves French card metadata and body for both posts", () => {
    const five = getPostBySlug("five-signs-you-need-document-automation", "fr");
    const why = getPostBySlug("why-pdf-to-excel-automation-matters", "fr");

    expect(five?.title).toBe(
      "5 signes que votre équipe a besoin d'automatiser ses documents"
    );
    expect(five?.category).toBe("Bonnes pratiques");
    expect(five?.image).toBe("/illustrations/hero-mockup.svg");
    expect(five?.articleImage).toBe(
      "/illustrations/lna-blog-hero-1600x900.webp"
    );
    expect(five?.ogImage).toBe("/illustrations/lna-blog-hero-og-1200x630.png");
    expect(five?.content).toMatch(/L'automatisation documentaire/);

    expect(why?.title).toBe(
      "Pourquoi l'automatisation PDF vers Excel compte plus que jamais"
    );
    expect(why?.category).toBe("Perspectives sectorielles");
    expect(why?.image).toBe("/illustrations/hero-mockup.svg");
    expect(why?.articleImage).toBe(
      "/illustrations/lna-blog-hero-1600x900.webp"
    );
    expect(why?.ogImage).toBe("/illustrations/lna-blog-hero-og-1200x630.png");
    expect(why?.content).toMatch(/coût caché de la saisie manuelle/);
  });

  it("keeps FR/EN blog share images on the OG PNG, not the old workflow SVG", () => {
    const whyFr = getPostBySlug("why-pdf-to-excel-automation-matters", "fr");
    const whyEn = getPostBySlug("why-pdf-to-excel-automation-matters", "en");
    const fiveFr = getPostBySlug(
      "five-signs-you-need-document-automation",
      "fr"
    );
    const fiveEn = getPostBySlug(
      "five-signs-you-need-document-automation",
      "en"
    );

    expect(whyFr?.ogImage).toBe(whyEn?.ogImage);
    expect(whyFr?.ogImage).toBe("/illustrations/lna-blog-hero-og-1200x630.png");
    expect(existsSync(publicPath(whyFr!.ogImage!))).toBe(true);

    expect(fiveEn?.ogImage).toBe(
      "/illustrations/lna-blog-hero-og-1200x630.png"
    );
    expect(fiveFr?.ogImage).toBe(fiveEn?.ogImage);
    expect(existsSync(publicPath(fiveEn!.ogImage!))).toBe(true);
    expect(fiveEn?.image).not.toMatch(/workflow-diagram/);
    expect(fiveFr?.image).not.toMatch(/workflow-diagram/);
  });

  it("keeps English posts on blog-style images when locale is en", () => {
    const five = getPostBySlug("five-signs-you-need-document-automation", "en");
    expect(five?.title).toBe("5 Signs Your Team Needs Document Automation");
    expect(five?.category).toBe("Best Practices");
    expect(five?.image).toBe("/illustrations/hero-mockup.svg");
    expect(five?.articleImage).toBe(
      "/illustrations/lna-blog-hero-1600x900.webp"
    );
    expect(five?.ogImage).toBe("/illustrations/lna-blog-hero-og-1200x630.png");
    expect(five?.content).toMatch(/Document automation isn't just/);
  });

  it("falls back to EN when a locale file is missing", () => {
    const post = getPostBySlug("five-signs-you-need-document-automation", "de");
    expect(post?.title).toBe("5 Signs Your Team Needs Document Automation");
    expect(post?.content).toMatch(/Document automation isn't just/);
  });

  it("lists the same slugs for FR and EN with localized titles", () => {
    const en = getAllPosts("en");
    const fr = getAllPosts("fr");
    expect(en.map((p) => p.slug).sort()).toEqual(fr.map((p) => p.slug).sort());
    expect(fr.map((p) => p.title)).toEqual([
      "5 signes que votre équipe a besoin d'automatiser ses documents",
      "Pourquoi l'automatisation PDF vers Excel compte plus que jamais",
    ]);
  });

  it("resolves FR listing images under public/", () => {
    for (const post of getAllPosts("fr")) {
      expect(post.image).toBeTruthy();
      expect(existsSync(publicPath(post.image!))).toBe(true);
    }
  });
});
