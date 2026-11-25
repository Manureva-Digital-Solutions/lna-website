import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

const pub = (...parts: string[]) => join(process.cwd(), "public", ...parts);

/** LNAW-129 — keep public/ free of unused / off-brand leftovers. */
describe("LNAW-129 unused public assets removed", () => {
  it("removes the 19 unreferenced assets listed in the ticket", () => {
    const removed = [
      "illustrations/icons/icon-batch-processing.svg",
      "illustrations/icons/icon-chat-context.svg",
      "illustrations/icons/icon-data-extraction.svg",
      "illustrations/icons/icon-document-management.svg",
      "illustrations/icons/icon-export.svg",
      "illustrations/icons/icon-llm-qa.svg",
      "illustrations/icons/icon-template-mapping.svg",
      "illustrations/icons/icon-user-management.svg",
      "illustrations/chat-context-illustration.svg",
      "illustrations/llm-qa-illustration.svg",
      "illustrations/pricing-tiers.svg",
      "illustrations/screenshots/screenshot-chat-qa.svg",
      "brand/logo-dark.svg",
      "brand/logo-icon.svg",
      "next.svg",
      "vercel.svg",
      "file.svg",
      "globe.svg",
      "window.svg",
    ];
    expect(removed).toHaveLength(19);
    for (const rel of removed) {
      expect(existsSync(pub(rel)), `should be removed: ${rel}`).toBe(false);
    }
    expect(existsSync(pub("illustrations/icons"))).toBe(false);
  });

  it("keeps brand logos and favicon that the site still uses", () => {
    for (const rel of [
      "brand/logo.svg",
      "brand/logo-white.svg",
      "brand/logo-email.png",
      "favicon.svg",
    ]) {
      expect(existsSync(pub(rel)), `must keep: ${rel}`).toBe(true);
    }
  });
});
