/**
 * Stable ICP role keys accepted by POST /api/demo-request.
 * Must stay in sync with `demoForm.roles` in messages/en.json + fr.json.
 */
export const DEMO_REQUEST_ROLES = [
  "accountant",
  "insuranceBroker",
  "propertyManager",
  "other",
] as const;

export type DemoRequestRole = (typeof DEMO_REQUEST_ROLES)[number];

export function isDemoRequestRole(value: unknown): value is DemoRequestRole {
  return (
    typeof value === "string" &&
    (DEMO_REQUEST_ROLES as readonly string[]).includes(value)
  );
}

/** Collapse CR/LF so crafted roles/names cannot break the email subject. */
export function sanitizeEmailSubjectPart(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}
