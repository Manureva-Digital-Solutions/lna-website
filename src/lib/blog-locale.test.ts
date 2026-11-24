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
    expect(five?.image).toBe("/illustrations/workflow-diagram-fr.svg");
    expect(five?.content).toMatch(/L'automatisation documentaire/);

    expect(why?.title).toBe(
      "Pourquoi l'automatisation PDF vers Excel compte plus que jamais"
    );
    expect(why?.category).toBe("Perspectives sectorielles");
    expect(why?.image).toBe("/illustrations/hero-mockup.svg");
    expect(why?.content).toMatch(/coût caché de la saisie manuelle/);
  });

  it("keeps English posts unchanged when locale is en", () => {
    const five = getPostBySlug("five-signs-you-need-document-automation", "en");
    expect(five?.title).toBe("5 Signs Your Team Needs Document Automation");
    expect(five?.category).toBe("Best Practices");
    expect(five?.image).toBe("/illustrations/workflow-diagram.svg");
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
