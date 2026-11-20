import { describe, expect, it } from "vitest";
import {
  DEMO_REQUEST_ROLES,
  isDemoRequestRole,
  sanitizeEmailSubjectPart,
} from "@/lib/demo-request-roles";

describe("demo-request-roles", () => {
  it("accepts only allowlisted ICP keys", () => {
    for (const role of DEMO_REQUEST_ROLES) {
      expect(isDemoRequestRole(role)).toBe(true);
    }
    expect(isDemoRequestRole("ceo")).toBe(false);
    expect(isDemoRequestRole("accountant\n")).toBe(false);
    expect(isDemoRequestRole(null)).toBe(false);
  });

  it("strips CR/LF from subject parts", () => {
    expect(sanitizeEmailSubjectPart("a\nb\rc")).toBe("a b c");
    expect(sanitizeEmailSubjectPart("  padded \n ")).toBe("padded");
  });
});
