import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import {
  demoAcknowledgementEmail,
  emailShell,
  newsletterConfirmationEmail,
  resolveEmailLocale,
} from "@/lib/transactional-email";

describe("transactional-email", () => {
  it("resolves unknown locales to French (site default)", () => {
    expect(resolveEmailLocale("en")).toBe("en");
    expect(resolveEmailLocale("fr")).toBe("fr");
    expect(resolveEmailLocale(undefined)).toBe("fr");
    expect(resolveEmailLocale("de")).toBe("fr");
  });

  it("keeps EN/FR email catalog keys in parity", () => {
    expect(Object.keys(en.emails).sort()).toEqual(
      Object.keys(fr.emails).sort()
    );
    expect(Object.keys(en.emails.brand).sort()).toEqual(
      Object.keys(fr.emails.brand).sort()
    );
    expect(Object.keys(en.emails.demoAcknowledgement).sort()).toEqual(
      Object.keys(fr.emails.demoAcknowledgement).sort()
    );
    expect(Object.keys(en.emails.newsletterConfirmation).sort()).toEqual(
      Object.keys(fr.emails.newsletterConfirmation).sort()
    );
  });

  it("builds a branded shell with LNA logo and Lemon Tree legal line", () => {
    const html = emailShell("<p>Body</p>", "en");
    expect(html).toContain("https://lnaflow.com/brand/logo-email.png");
    expect(html).toContain("Lemon Tree SAS");
    expect(html).toContain(en.emails.brand.tagline);
    expect(html).toContain("Body");
    // Newsletter body asks readers to reply to unsubscribe — no "do not reply".
    expect(html).not.toMatch(/do not reply/i);
    expect(html).not.toMatch(/ne pas y répondre/i);
  });

  it("builds the demo acknowledgement in EN with the 24-hour follow-up", () => {
    const { subject, html } = demoAcknowledgementEmail("en", "Ada Broker");
    expect(subject).toBe(en.emails.demoAcknowledgement.subject);
    expect(html).toContain("Hi Ada Broker,");
    expect(html).toContain(en.emails.demoAcknowledgement.heading);
    expect(html).toMatch(/within 24 hours/i);
    expect(html).toContain(en.emails.demoAcknowledgement.signoff);
    expect(html).toContain("https://lnaflow.com/brand/logo-email.png");
  });

  it("builds the demo acknowledgement in FR", () => {
    const { subject, html } = demoAcknowledgementEmail("fr", "Léa Martin");
    expect(subject).toBe(fr.emails.demoAcknowledgement.subject);
    expect(html).toContain("Bonjour Léa Martin,");
    expect(html).toMatch(/sous 24 heures/i);
    expect(html).toContain(fr.emails.demoAcknowledgement.signoff);
  });

  it("escapes visitor names in the acknowledgement body", () => {
    const { html } = demoAcknowledgementEmail(
      "en",
      `<img src=x onerror=alert(1)>`
    );
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img src=x");
  });

  it("builds the newsletter confirmation from the message catalog", () => {
    const enMail = newsletterConfirmationEmail("en");
    const frMail = newsletterConfirmationEmail("fr");
    expect(enMail.subject).toBe(en.emails.newsletterConfirmation.subject);
    expect(frMail.subject).toBe(fr.emails.newsletterConfirmation.subject);
    expect(enMail.html).toContain(en.emails.newsletterConfirmation.heading);
    expect(frMail.html).toContain(fr.emails.newsletterConfirmation.heading);
  });
});
