import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_REQUEST_ROLES } from "@/lib/demo-request-roles";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";

const sendMail = vi.fn();
const mailConfigured = vi.fn();

vi.mock("@/lib/mailer", () => ({
  mailConfigured: () => mailConfigured(),
  escapeHtml: (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;"),
  sendMail: (...args: unknown[]) => sendMail(...args),
}));

describe("POST /api/demo-request", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMail.mockReset();
    mailConfigured.mockReset();
  });

  it("keeps the server allowlist in sync with demoForm.roles catalogs", () => {
    expect([...DEMO_REQUEST_ROLES].sort()).toEqual(
      Object.keys(en.demoForm.roles).sort()
    );
    expect(Object.keys(fr.demoForm.roles).sort()).toEqual(
      Object.keys(en.demoForm.roles).sort()
    );
  });

  it("includes the submitted role in the email subject and body", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Léa Martin",
          email: "lea@example.fr",
          company: "Cabinet Martin",
          role: "accountant",
          message: "Besoin d'une démo",
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(1);
    const arg = sendMail.mock.calls[0][0] as {
      subject: string;
      html: string;
    };
    expect(arg.subject).toContain("accountant");
    expect(arg.html).toContain("accountant");
    expect(arg.html).toContain("Fonction / Role");
  });

  it("rejects roles outside the ICP allowlist", async () => {
    mailConfigured.mockReturnValue(true);

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sam",
          email: "sam@broker.fr",
          company: "Courtage Sam",
          role: "ceo\nBcc: evil@x.com",
        }),
      })
    );

    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ error: "Invalid role" });
  });

  it("strips line breaks from the email subject parts", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Léa\nMartin",
          email: "lea@example.fr",
          company: "Cabinet\r\nMartin",
          role: "propertyManager",
        }),
      })
    );

    expect(res.status).toBe(200);
    const arg = sendMail.mock.calls[0][0] as { subject: string };
    expect(arg.subject).not.toMatch(/[\r\n]/);
    expect(arg.subject).toContain("Léa Martin");
    expect(arg.subject).toContain("Cabinet Martin");
    expect(arg.subject).toContain("propertyManager");
  });

  it("still records the role when SMTP is not configured", async () => {
    mailConfigured.mockReturnValue(false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sam",
          email: "sam@broker.fr",
          company: "Courtage Sam",
          role: "insuranceBroker",
        }),
      })
    );

    expect(res.status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("email NOT sent"),
      expect.objectContaining({ role: "insuranceBroker" })
    );
    warn.mockRestore();
  });
});
