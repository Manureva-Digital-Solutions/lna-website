import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { pageAlternates } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  const locales = ["en", "fr"];
  return locales.flatMap((locale) =>
    posts.map((post) => ({ locale, slug: post.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const post = getPostBySlug(slug, locale);
  if (!post) return {};
  const shareImage = post.ogImage ?? post.image;
  return {
    title: `${post.title} — LNA Blog`,
    description: post.description,
    alternates: pageAlternates(locale, `/blog/${slug}`),
    openGraph: {
      title: post.title,
      description: post.description,
      images: shareImage ? [{ url: shareImage }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = getPostBySlug(slug, locale);
  if (!post) notFound();

  return (
    <>
      <Section className="overflow-hidden pt-10 pb-12 md:pt-12">
        <Container>
          <AnimateIn>
            {/* Back link — right-aligned, default container inset (no 70px pad) */}
            <div className="mb-6 flex justify-end">
              <Link
                href="/blog"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                {t("backToBlog")}
              </Link>
            </div>

            {/* Title + body: 70px side padding (tighter on small screens) */}
            <div className="px-6 md:px-[70px]">
              <span className="text-primary mt-0 block text-xs font-semibold tracking-wide uppercase">
                {post.category}
              </span>
              <h1 className="text-hero text-foreground mt-3 text-balance">
                {post.title}
              </h1>
              <div className="text-muted-foreground mt-3 mb-5 flex flex-wrap items-center gap-4 text-sm">
                <span>{post.author}</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {new Date(post.date).toLocaleDateString(
                    locale === "fr" ? "fr-FR" : "en-US",
                    {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {post.readingTime}
                </span>
              </div>
              {post.articleImage && (
                <div className="bg-muted relative mb-8 aspect-[16/9] w-full overflow-hidden">
                  <Image
                    src={post.articleImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 960px"
                    priority
                  />
                </div>
              )}
              <BlogArticle content={post.content} />
            </div>
          </AnimateIn>
        </Container>
      </Section>

      {/* Bottom back link — same as top, no 70px pad */}
      <Section className="border-border border-t py-8 md:pt-10 md:pb-12">
        <Container>
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            {t("backToAll")}
          </Link>
        </Container>
      </Section>
    </>
  );
}
