import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

const publicPath = (url: string) =>
  join(process.cwd(), "public", url.replace(/^\//, ""));

describe("LNAW-100 blog hero assets", () => {
  it("ships the drop-in hero-mockup.svg referenced by the why-pdf post", () => {
    const why = getPostBySlug("why-pdf-to-excel-automation-matters");
    expect(why?.image).toBe("/illustrations/hero-mockup.svg");
    expect(existsSync(publicPath("/illustrations/hero-mockup.svg"))).toBe(true);

    const svg = readFileSync(
      publicPath("/illustrations/hero-mockup.svg"),
      "utf8"
    );
    expect(svg).toMatch(/<svg[\s\S]*<\/svg>/);
    expect(svg).toMatch(/#14366F/);
  });

  it("ships in-article and og:image assets wired on the why-pdf post", () => {
    const why = getPostBySlug("why-pdf-to-excel-automation-matters");
    expect(why?.articleImage).toBe(
      "/illustrations/lna-blog-hero-1600x900.webp"
    );
    expect(why?.ogImage).toBe("/illustrations/lna-blog-hero-og-1200x630.png");

    expect(
      existsSync(publicPath("/illustrations/lna-blog-hero-1600x900.webp"))
    ).toBe(true);
    expect(
      existsSync(publicPath("/illustrations/lna-blog-hero-1600x900.png"))
    ).toBe(true);
    expect(
      existsSync(publicPath("/illustrations/lna-blog-hero-og-1200x630.png"))
    ).toBe(true);
  });

  it("resolves every blog listing image path under public/", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);

    for (const post of posts) {
      if (!post.image) continue;
      expect(
        existsSync(publicPath(post.image)),
        `missing listing image for ${post.slug}: ${post.image}`
      ).toBe(true);
      if (post.articleImage) {
        expect(
          existsSync(publicPath(post.articleImage)),
          `missing articleImage for ${post.slug}: ${post.articleImage}`
        ).toBe(true);
      }
      if (post.ogImage) {
        expect(
          existsSync(publicPath(post.ogImage)),
          `missing ogImage for ${post.slug}: ${post.ogImage}`
        ).toBe(true);
      }
    }
  });

  it("prefers ogImage over listing image in the blog detail metadata", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/[locale]/blog/[slug]/page.tsx"),
      "utf8"
    );
    expect(page).toMatch(/post\.ogImage \?\? post\.image/);
    expect(page).toMatch(/post\.articleImage/);
    expect(page).toMatch(/twitter:\s*\{/);
  });
});
