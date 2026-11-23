/**
 * Shared transactional email helpers for the marketing site.
 *
 * Copy lives in messages/{en,fr}.json under `emails` so UI/email strings are
 * not hardcoded in route handlers. Branding matches the product-app shell
 * (logo from the public brand assets, Lemon Tree SAS legal line).
 */

import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { escapeHtml } from "@/lib/mailer";

const catalogs = { en, fr } as const;

export type EmailLocale = keyof typeof catalogs;

export function resolveEmailLocale(locale: unknown): EmailLocale {
  return locale === "en" ? "en" : "fr";
}

function interpolate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (out, [key, value]) => out.replaceAll(`{${key}}`, value),
    template
  );
}

/** Branded HTML shell (table layout + logo) around a transactional body.
 *  Catalog strings are trusted; only visitor-controlled values are escaped. */
export function emailShell(bodyHtml: string, locale: EmailLocale): string {
  const brand = catalogs[locale].emails.brand;

  return `
    <div style="margin:0;padding:24px 12px;background:#f1f5f9;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
             style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
        <tr>
          <td style="padding:24px 28px 4px 28px;">
            <a href="https://lnaflow.com" style="text-decoration:none;">
              <img src="https://lnaflow.com/brand/logo-email.png" width="160" height="39" alt="LNA"
                   style="display:block;width:160px;height:auto;border:0;outline:none;text-decoration:none;">
            </a>
            <p style="margin:8px 0 0 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#94a3b8;">
              ${brand.tagline}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 28px 28px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#334155;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #e2e8f0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;">
            ${brand.legal}<br>
            <a href="https://lnaflow.com" style="color:#64748b;text-decoration:none;">lnaflow.com</a>
          </td>
        </tr>
      </table>
    </div>`;
}

export function demoAcknowledgementEmail(
  locale: EmailLocale,
  name: string
): { subject: string; html: string } {
  const copy = catalogs[locale].emails.demoAcknowledgement;
  const safeName = escapeHtml(name.trim() || (locale === "en" ? "there" : ""));
  const greeting = interpolate(copy.greeting, { name: safeName });

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">${greeting}</p>
    <h2 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;color:#1e293b;">${copy.heading}</h2>
    <p style="margin:0 0 16px 0;">${copy.body}</p>
    <p style="margin:0;">${copy.signoff}</p>
  `;

  return {
    subject: copy.subject,
    html: emailShell(bodyHtml, locale),
  };
}

export function newsletterConfirmationEmail(locale: EmailLocale): {
  subject: string;
  html: string;
} {
  const copy = catalogs[locale].emails.newsletterConfirmation;
  const bodyHtml = `
    <h2 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;color:#1e293b;">${copy.heading}</h2>
    <p style="margin:0 0 16px 0;">${copy.body}</p>
    <p style="margin:0;">${copy.signoff}</p>
  `;

  return {
    subject: copy.subject,
    html: emailShell(bodyHtml, locale),
  };
}
