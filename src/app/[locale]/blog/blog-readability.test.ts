import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getPostBySlug } from "@/lib/blog";

describe("LNAW-991 blog readability contracts", () => {
  it("wires BlogArticle into the blog detail page on the full v4 container", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/[locale]/blog/[slug]/page.tsx"),
      "utf8"
    );
    expect(page).toMatch(/BlogArticle/);
    expect(page).not.toMatch(/MDXRemote/);
    expect(page).not.toMatch(/max-w-3xl/);
    expect(page).toMatch(/pt-10/);
    expect(page).toMatch(/md:pt-12/);
    expect(page).toMatch(/mb-5/);
    expect(page).toMatch(/md:px-\[70px\]/);
    // Back links sit on default Container (no 70px wrapper)
    expect(page).toMatch(/backToBlog/);
  });

  it("keeps listed article copy available unchanged for both detail URLs", () => {
    const five = getPostBySlug("five-signs-you-need-document-automation");
    const why = getPostBySlug("why-pdf-to-excel-automation-matters");
    expect(five?.content).toMatch(/## 1\. Your Team Spends Hours/);
    expect(why?.content).toMatch(/PDF/);
    // Meaning/copy must stay — titles and opening lines intact.
    expect(five?.title).toBe("5 Signs Your Team Needs Document Automation");
    expect(why?.title.length).toBeGreaterThan(0);
  });

  it("enables the typography plugin used by prose classes", () => {
    const css = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf8"
    );
    expect(css).toMatch(/@plugin "@tailwindcss\/typography"/);
  });
});
