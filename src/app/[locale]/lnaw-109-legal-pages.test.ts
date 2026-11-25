import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getLegalPage, LEGAL_SLUGS } from "@/lib/legal";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

const root = process.cwd();

describe("LNAW-109 Security, DPA, Sub-processors", () => {
  it("ships EN and FR markdown for all three pages", () => {
    for (const slug of LEGAL_SLUGS) {
      for (const locale of ["en", "fr"] as const) {
        const page = getLegalPage(slug, locale);
        expect(page, `${locale}/${slug}`).not.toBeNull();
        expect(page!.title.length).toBeGreaterThan(0);
        expect(page!.metaTitle.length).toBeGreaterThan(0);
        expect(page!.metaDescription.length).toBeGreaterThan(0);
        expect(page!.toc.length).toBeGreaterThan(0);
        expect(page!.content.length).toBeGreaterThan(100);
        expect(page!.updated).toMatch(
          /\[(publication date|date de publication)\]/
        );
      }
    }
  });

  it("keeps TO CONFIRM / À CONFIRMER markers on Security and DPA (staging)", () => {
    const secEn = getLegalPage("security", "en")!;
    const secFr = getLegalPage("security", "fr")!;
    const dpaEn = getLegalPage("dpa", "en")!;
    const dpaFr = getLegalPage("dpa", "fr")!;
    expect(secEn.content).toMatch(/\[TO CONFIRM/);
    expect(secFr.content).toMatch(/\[À CONFIRMER/);
    expect(dpaEn.content).toMatch(/\[TO CONFIRM/);
    expect(dpaFr.content).toMatch(/\[À CONFIRMER/);
  });

  it("treats Sub-processors as final (no confirm markers)", () => {
    const enPage = getLegalPage("sub-processors", "en")!;
    const frPage = getLegalPage("sub-processors", "fr")!;
    expect(enPage.content).not.toMatch(/\[TO CONFIRM/);
    expect(frPage.content).not.toMatch(/\[À CONFIRMER/);
    expect(enPage.content).toMatch(/privacy@lnaflow\.com/);
    expect(frPage.content).toMatch(/privacy@lnaflow\.com/);
    expect(enPage.content).toMatch(/Lemon Tree SAS/);
    expect(frPage.content).toMatch(/Lemon Tree SAS/);
  });

  it("wires DPA PDF download paths (PDFs supplied when text is frozen)", () => {
    const enPage = getLegalPage("dpa", "en")!;
    const frPage = getLegalPage("dpa", "fr")!;
    expect(enPage.pdfEn).toBe("dpa-en.pdf");
    expect(enPage.pdfFr).toBe("dpa-fr.pdf");
    expect(frPage.pdfEn).toBe("dpa-en.pdf");
    expect(frPage.pdfFr).toBe("dpa-fr.pdf");
  });

  it("names Lemon Tree SAS as seller only", () => {
    for (const slug of LEGAL_SLUGS) {
      for (const locale of ["en", "fr"] as const) {
        const page = getLegalPage(slug, locale)!;
        expect(page.content).toMatch(/Lemon Tree SAS/);
        expect(page.content).not.toMatch(/Manureva/i);
      }
    }
  });

  it("exposes routes, footer links, and sitemap entries", () => {
    for (const slug of LEGAL_SLUGS) {
      expect(
        existsSync(join(root, `src/app/[locale]/${slug}/page.tsx`)),
        `missing page for /${slug}`
      ).toBe(true);
    }

    const footer = readFileSync(
      join(root, "src/components/layout/footer.tsx"),
      "utf8"
    );
    expect(footer).toMatch(/href: "\/security"/);
    expect(footer).toMatch(/href: "\/dpa"/);
    expect(footer).toMatch(/href: "\/sub-processors"/);

    const sitemap = readFileSync(join(root, "src/app/sitemap.ts"), "utf8");
    expect(sitemap).toMatch(/"\/security"/);
    expect(sitemap).toMatch(/"\/dpa"/);
    expect(sitemap).toMatch(/"\/sub-processors"/);

    expect(en.footer.security).toBe("Security");
    expect(fr.footer.security).toBe("Sécurité");
    expect(en.footer.dpa).toBe("Data Processing Agreement");
    expect(fr.footer.dpa).toBe("Accord de traitement des données");
    expect(en.footer.subProcessors).toBe("Sub-processors");
    expect(fr.footer.subProcessors).toBe("Sous-traitants ultérieurs");
  });

  it("uses full width below 672px and 80% width from 672px up", () => {
    const shell = readFileSync(
      join(root, "src/components/legal/LegalDocument.tsx"),
      "utf8"
    );
    expect(shell).toMatch(/w-full/);
    expect(shell).toMatch(/min-\[672px\]:w-\[80%\]/);
    expect(shell).toMatch(/min-\[672px\]:max-w-\[80%\]/);

    const privacy = readFileSync(
      join(root, "src/app/[locale]/privacy/page.tsx"),
      "utf8"
    );
    const terms = readFileSync(
      join(root, "src/app/[locale]/terms/page.tsx"),
      "utf8"
    );
    expect(privacy).toMatch(/legalPageWidth/);
    expect(terms).toMatch(/legalPageWidth/);
  });
});
