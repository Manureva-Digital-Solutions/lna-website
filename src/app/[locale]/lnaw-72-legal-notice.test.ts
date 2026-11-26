import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("LNAW-72 legal notice, seller, emails", () => {
  it("ships /legal-notice from Terms §13 Lemon Tree facts only", () => {
    expect(
      existsSync(join(root, "src/app/[locale]/legal-notice/page.tsx"))
    ).toBe(true);
    expect(en.legalNotice.company).toBe("Lemon Tree SAS");
    expect(fr.legalNotice.company).toBe("Lemon Tree SAS");
    expect(en.legalNotice.registration).toMatch(/904 401 882/);
    expect(en.legalNotice.publicationDirector).toMatch(/Alexandre Prieto/);
    expect(en.legalNotice.hosting).toMatch(/OVH SAS/);
    expect(en.seo.legalNotice.title).toMatch(/Legal notice/);
    expect(fr.seo.legalNotice.title).toMatch(/Mentions légales/);
  });

  it("links Mentions légales from footer column and bottom strip", () => {
    const footer = read("src/components/layout/footer.tsx");
    expect(footer).toMatch(/href: "\/legal-notice"/);
    expect(footer).toMatch(/t\("legalNotice"\)/);
    expect(footer).toMatch(/t\("legalNoticeShort"\)/);
    expect(en.footer.legalNotice).toBe("Legal notice");
    expect(fr.footer.legalNotice).toBe("Mentions légales");
  });

  it("keeps pricing in EUR with card-required trial and Lemon Tree seller", () => {
    expect(en.pricing.tiers.starter.priceMonthly).toMatch(/€/);
    expect(fr.pricing.tiers.starter.priceMonthly).toMatch(/€/);
    expect(en.pricing.tiers.starter.microcopy).toMatch(/Credit card required/i);
    expect(en.pricing.billing.sellerNote).toMatch(/Lemon Tree SAS/);
    expect(fr.pricing.billing.sellerNote).toMatch(/Lemon Tree SAS/);
    expect(en.pricing.perMonth).toMatch(/excl\. VAT/i);
    expect(JSON.stringify(en.pricing)).not.toMatch(/\$[0-9]/);
    expect(JSON.stringify(fr.pricing)).not.toMatch(/\$[0-9]/);
  });

  it("offers DPA to all customers and does not name Manureva on Privacy", () => {
    expect(en.privacy.s6.gdpr).toMatch(/all customers/i);
    expect(fr.privacy.s6.gdpr).toMatch(/tous les clients/i);
    expect(en.privacy.s6.gdpr).not.toMatch(/Enterprise/i);
    expect(fr.privacy.s6.gdpr).not.toMatch(/Enterprise/i);
    expect(en.privacy.s5.serviceProvidersDesc).not.toMatch(/Manureva/i);
    expect(fr.privacy.s5.serviceProvidersDesc).not.toMatch(/Manureva/i);
    expect(en.privacy.s4).not.toHaveProperty("b5");
    expect(en.privacy.s4.b3).not.toMatch(/audit/i);
  });

  it("uses support@ for contact/support and keeps privacy@ / legal@", () => {
    expect(en.contact.sidebar.emailAddress).toBe("support@lnaflow.com");
    expect(fr.contact.sidebar.emailAddress).toBe("support@lnaflow.com");
    expect(read("src/app/[locale]/privacy/page.tsx")).toMatch(
      /mailto:support@lnaflow\.com/
    );
    expect(read("src/app/[locale]/privacy/page.tsx")).toMatch(
      /mailto:privacy@lnaflow\.com/
    );
    expect(read("src/app/[locale]/terms/page.tsx")).toMatch(
      /mailto:legal@lnaflow\.com/
    );
    expect(read("src/app/[locale]/legal-notice/page.tsx")).toMatch(
      /mailto:legal@lnaflow\.com/
    );
    expect(read("src/lib/mailer.ts")).toMatch(
      /CONTACT_INBOX.*support@lnaflow\.com/
    );
  });
});
