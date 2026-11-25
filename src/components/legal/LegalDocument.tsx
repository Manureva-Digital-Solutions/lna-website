import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { AnimateIn } from "@/components/ui/animate-in";
import type { LegalPage } from "@/lib/legal";

/**
 * Shared shell for legal pages: full width on small screens, 80% from 672px up
 * (matches the v4 4→8 column breakpoint).
 */
export const legalPageWidth =
  "w-full max-w-none min-[672px]:w-[80%] min-[672px]:max-w-[80%]";

/**
 * LNAW-109 — v4 legal chrome (Plex, TOC + body, responsive 100%/80%, centered H1).
 * Staging keeps [TO CONFIRM] / [À CONFIRMER] and [publication date] visible.
 */
export function LegalDocument({
  page,
  onThisPage,
  downloadPdfEn,
  downloadPdfFr,
}: {
  page: LegalPage;
  onThisPage: string;
  downloadPdfEn: string;
  downloadPdfFr: string;
}) {
  return (
    <>
      <Section className="overflow-hidden pt-16 pb-8 md:pt-20 md:pb-10">
        <Container className={legalPageWidth}>
          <AnimateIn>
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-hero text-foreground text-balance">
                {page.title}
              </h1>
              <p className="text-body mt-4">{page.updated}</p>
              {(page.pdfEn || page.pdfFr) && (
                <p className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold">
                  {page.pdfEn && (
                    <a
                      href={`/legal/${page.pdfEn}`}
                      className="text-primary focus-visible:outline-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {downloadPdfEn}
                    </a>
                  )}
                  {page.pdfFr && (
                    <a
                      href={`/legal/${page.pdfFr}`}
                      className="text-primary focus-visible:outline-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      {downloadPdfFr}
                    </a>
                  )}
                </p>
              )}
            </div>
          </AnimateIn>
        </Container>
      </Section>

      <Section className="border-gray-20 border-t pt-10 pb-24 md:pt-14 md:pb-32">
        <Container className={legalPageWidth}>
          <div className="grid items-start gap-10 lg:grid-cols-[220px_1fr] lg:gap-16">
            <AnimateIn>
              <nav
                className="border-gray-20 mb-2 border-b pb-8 lg:sticky lg:top-24 lg:mb-0 lg:border-b-0 lg:pb-0"
                aria-label={onThisPage}
              >
                <p className="text-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                  {onThisPage}
                </p>
                <ul className="grid gap-2.5">
                  {page.toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="text-gray-70 hover:text-foreground focus-visible:outline-primary text-sm leading-5 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </AnimateIn>

            <AnimateIn delay={0.08}>
              <article
                data-legal-document
                className="prose prose-neutral prose-headings:scroll-mt-28 prose-headings:font-normal prose-headings:text-foreground prose-h2:mt-12 prose-h2:mb-4 prose-h2:text-[1.75rem] prose-h2:leading-9 prose-h2:font-normal first:prose-h2:mt-0 prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl prose-h3:leading-7 prose-h3:font-normal prose-p:my-4 prose-p:text-base prose-p:leading-6 prose-p:text-gray-70 prose-li:my-1.5 prose-li:text-base prose-li:leading-6 prose-li:text-gray-70 prose-ul:my-4 prose-ol:my-4 prose-strong:font-semibold prose-strong:text-foreground prose-a:text-primary prose-a:font-normal prose-a:no-underline hover:prose-a:underline prose-hr:my-10 prose-hr:border-gray-20 prose-table:my-6 prose-table:w-full prose-table:border-collapse prose-table:text-sm prose-th:border prose-th:border-gray-20 prose-th:bg-gray-10 prose-th:px-3 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold prose-th:text-foreground prose-td:border prose-td:border-gray-20 prose-td:px-3 prose-td:py-2.5 prose-td:align-top prose-td:text-gray-70 prose-code:font-mono prose-code:text-[0.875em] prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none max-w-none font-sans"
              >
                <MDXRemote source={page.content} />
              </article>
            </AnimateIn>
          </div>
        </Container>
      </Section>
    </>
  );
}
