/**
 * Illustrative homepage demo data.
 * Fictional issuers only — not real client brands or client documents.
 * Hero sheet columns, before/after mini-sheets, confidence grid and PDF
 * stack all share this single set so provenance stays consistent.
 */
export const DEMO_ISSUERS = [
  "Lumina Cover",
  "Atelier Protect",
  "Rive Prévoyance",
] as const;

export type DemoIssuer = (typeof DEMO_ISSUERS)[number];

/** Source PDFs that feed the comparison-sheet columns above. */
export const DEMO_SOURCE_DOCS = [
  {
    file: "devis-lumina-2026.pdf",
    roleKey: "roleAdp",
    issuer: DEMO_ISSUERS[0],
  },
  {
    file: "devis-atelier-2026.pdf",
    roleKey: "roleAdp",
    issuer: DEMO_ISSUERS[1],
  },
  {
    file: "devis-rive-2026.pdf",
    roleKey: "roleAdp",
    issuer: DEMO_ISSUERS[2],
  },
  {
    file: "amortissement-pret.pdf",
    roleKey: "roleAmortization",
    issuer: null,
  },
] as const;

/** Filled values — one entry per issuer, clearly distinct across columns. */
export const DEMO_FILLED = {
  rate: [0.34, 0.29, 0.41] as const,
  totalCost: [4218, 3640, 5102] as const,
  quota: [100, 50, 100] as const,
} as const;

/** Per-cell confidence aligned with DEMO_FILLED (review when score < 0.6). */
export const DEMO_CONFIDENCE = {
  rate: [0.93, 0.71, 0.42] as const,
  totalCost: [0.91, 0.82, 0.88] as const,
  quota: [0.88, 0.48, 0.86] as const,
  /** Row-level confidence shown in the confidence band. */
  row: [0.91, 0.86, 0.64] as const,
} as const;
