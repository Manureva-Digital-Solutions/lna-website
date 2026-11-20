import { MDXRemote } from "next-mdx-remote/rsc";
import { cn } from "@/lib/utils";

/**
 * LNAW-991 — readable long-form article body on the full v4 content width.
 * Even vertical rhythm for headings, paragraphs and lists (EN/FR).
 */
export function BlogArticle({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <article
      data-blog-article
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none",
        "prose-headings:text-foreground prose-headings:font-normal prose-headings:scroll-mt-24",
        // Equal block spacing: 2rem before headings, 1rem after; 1.25rem between paragraphs
        "prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-2xl prose-h2:leading-snug md:prose-h2:text-[1.75rem]",
        "prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-xl prose-h3:leading-snug",
        "prose-p:my-5 prose-p:text-justify prose-p:text-base prose-p:leading-[1.75] md:prose-p:text-[1.0625rem] md:prose-p:leading-[1.8]",
        "prose-ul:my-5 prose-ol:my-5 prose-li:my-2 prose-li:text-justify prose-li:leading-[1.75]",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-hr:border-border prose-hr:my-8",
        "prose-blockquote:border-border prose-blockquote:text-muted-foreground",
        // First block sits flush under the meta row (no double top gap)
        "prose-headings:first:mt-0 prose-p:first:mt-0",
        className
      )}
    >
      <MDXRemote source={content} />
    </article>
  );
}
