/**
 * Illustrative export-history rows for the homepage security band (LNAW-128).
 * Fictional users and files only — not real clients, accounts, or e-mails.
 * Filenames stay aligned with the shared ADP demo set where possible.
 */

export const DEMO_EXPORT_HISTORY = [
  {
    userKey: "userCamille",
    file: "comparatif-adp.xlsx",
    /** UTC instant for locale-aware formatting in the visual. */
    at: "2026-03-18T09:14:00.000Z",
  },
  {
    userKey: "userNoah",
    file: "suivi-sante-2026.xlsx",
    at: "2026-03-17T16:42:00.000Z",
  },
  {
    userKey: "userLea",
    file: "charges-copro.xlsx",
    at: "2026-03-17T11:05:00.000Z",
  },
  {
    userKey: "userInes",
    file: "comparatif-adp.xlsx",
    at: "2026-03-16T14:28:00.000Z",
  },
] as const;

export type DemoExportHistoryRow = (typeof DEMO_EXPORT_HISTORY)[number];
