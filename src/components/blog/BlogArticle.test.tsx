import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlogArticle } from "@/components/blog/BlogArticle";

vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source }: { source: string }) => (
    <div data-testid="mdx-source">{source}</div>
  ),
}));

describe("BlogArticle (LNAW-991)", () => {
  it("applies readable prose hierarchy and measure classes", () => {
    const { container } = render(
      <BlogArticle content="## Heading\n\nParagraph body." />
    );
    const article = container.querySelector("[data-blog-article]");
    expect(article).not.toBeNull();
    expect(article).toHaveClass("prose");
    expect(article).toHaveClass("max-w-none");
    expect(article?.className).toMatch(/prose-p:leading-\[1\.75\]/);
    expect(article?.className).toMatch(/prose-p:text-justify/);
    expect(article?.className).toMatch(/prose-h2:mt-8/);
    expect(article?.className).toMatch(/prose-li:my-2/);
    expect(article?.className).toMatch(/prose-p:first:mt-0/);
    expect(screen.getByTestId("mdx-source")).toHaveTextContent("Heading");
  });

  it("does not alter the MDX source passed through", () => {
    const source =
      "## 1. Your Team Spends Hours\n\n**The fix:** keep this copy.";
    render(<BlogArticle content={source} />);
    expect(screen.getByTestId("mdx-source").textContent).toBe(source);
  });
});
