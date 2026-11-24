import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  /** Listing / card image (may be SVG). */
  image?: string;
  /** Optional 1600×900 in-article hero (PNG/WebP). */
  articleImage?: string;
  /** Optional 1200×630 share image for og:image. */
  ogImage?: string;
  readingTime: string;
  content: string;
}

/** Canonical EN post slugs live in `content/blog/*.mdx`. */
function listEnSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/**
 * Prefer `content/blog/{locale}/{slug}.mdx` when present; otherwise fall back
 * to the English file at `content/blog/{slug}.mdx`.
 */
function resolvePostPath(slug: string, locale = "en"): string | null {
  if (locale && locale !== "en") {
    const localized = path.join(BLOG_DIR, locale, `${slug}.mdx`);
    if (fs.existsSync(localized)) return localized;
  }

  const enPath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (fs.existsSync(enPath)) return enPath;
  return null;
}

export function getAllPosts(locale = "en"): BlogPost[] {
  const posts = listEnSlugs().map((slug) => getPostBySlug(slug, locale));

  return posts
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string, locale = "en"): BlogPost | null {
  const filePath = resolvePostPath(slug, locale);
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? "",
    author: data.author ?? "LNA Team",
    category: data.category ?? "General",
    image: data.image,
    articleImage: data.articleImage,
    ogImage: data.ogImage,
    readingTime: stats.text,
    content,
  };
}
