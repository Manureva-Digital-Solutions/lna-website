import fs from "fs";
import path from "path";
import matter from "gray-matter";

const LEGAL_DIR = path.join(process.cwd(), "content/legal");

export const LEGAL_SLUGS = ["security", "dpa", "sub-processors"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export interface LegalTocItem {
  id: string;
  title: string;
}

export interface LegalPage {
  slug: LegalSlug;
  title: string;
  metaTitle: string;
  metaDescription: string;
  updated: string;
  pdfEn?: string;
  pdfFr?: string;
  toc: LegalTocItem[];
  content: string;
}

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractToc(content: string): LegalTocItem[] {
  const toc: LegalTocItem[] = [];
  const h2Html = /<h2\s+id="([^"]+)">([^<]+)<\/h2>/g;
  let m: RegExpExecArray | null;
  while ((m = h2Html.exec(content)) !== null) {
    toc.push({ id: m[1], title: m[2].trim() });
  }
  if (toc.length > 0) return toc;

  for (const match of content.matchAll(/^## (.+)$/gm)) {
    const title = match[1].trim();
    toc.push({ id: slugify(title), title });
  }
  return toc;
}

export function getLegalPage(
  slug: LegalSlug,
  locale: string
): LegalPage | null {
  const filePath = path.join(LEGAL_DIR, locale, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: String(data.title ?? ""),
    metaTitle: String(data.metaTitle ?? data.title ?? ""),
    metaDescription: String(data.metaDescription ?? ""),
    updated: String(data.updated ?? ""),
    pdfEn: data.pdfEn ? String(data.pdfEn) : undefined,
    pdfFr: data.pdfFr ? String(data.pdfFr) : undefined,
    toc: extractToc(content),
    content,
  };
}

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}
