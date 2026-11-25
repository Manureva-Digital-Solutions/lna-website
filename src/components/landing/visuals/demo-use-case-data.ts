/**
 * Fictional demo values for homepage use-case before/after visuals (LNAW-127).
 * Stored next to demo-sheet-data.ts for the shared demo-documents set.
 * Not real client brands or client documents.
 */

import {
  DEMO_FILLED,
  DEMO_ISSUERS,
} from "@/components/landing/visuals/demo-sheet-data";

/** Loan insurance — reuses the shared ADP demo (Lumina Cover column). */
export const DEMO_USE_CASE_ADP = {
  issuer: DEMO_ISSUERS[0],
  docFile: "devis-lumina-2026.pdf",
  rate: DEMO_FILLED.rate[0],
  totalCost: DEMO_FILLED.totalCost[0],
  quota: DEMO_FILLED.quota[0],
} as const;

/** Health cover — fictional mutual / quote. */
export const DEMO_USE_CASE_HEALTH = {
  issuer: "Clarté Santé",
  docFile: "devis-clarte-sante-2026.pdf",
  /** Sample annual reimbursements (€) — illustrative only. */
  hospital: 1840,
  optical: 220,
  dental: 360,
} as const;

/** Condo service charges — fictional building statement. */
export const DEMO_USE_CASE_CONDO = {
  building: "Résidence des Pins",
  docFile: "decompte-pins-t1-2026.pdf",
  item: "Entretien parties communes",
  amount: 1240,
  /** Apportionment key (tantièmes). */
  allocationKey: "120/1000",
} as const;
