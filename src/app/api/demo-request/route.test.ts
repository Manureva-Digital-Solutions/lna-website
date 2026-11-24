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

/** Each test gets a fresh module graph AND fresh limiter counters. */
async function loadRoute() {
  const { resetRateLimit } = await import("@/lib/rate-limit");
  resetRateLimit();
  return import("./route");
}

function demoRequest(
  body: Record<string, unknown>,
  ip = "198.51.100.10"
): Request {
  return new Request("http://localhost/api/demo-request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // nginx appends the real peer address as the rightmost entry.
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  name: "Léa Martin",
  email: "lea@example.fr",
  company: "Cabinet Martin",
  role: "accountant",
  message: "Besoin d'une démo",
  locale: "fr",
};

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

  it("includes the submitted role in the inbox email subject and body", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await loadRoute();
    const res = await POST(demoRequest(VALID_BODY));

    expect(res.status).toBe(200);
    expect(sendMail).toHaveBeenCalledTimes(2);
    const inbox = sendMail.mock.calls[0][0] as {
      subject: string;
      html: string;
    };
    expect(inbox.subject).toContain("accountant");
    expect(inbox.html).toContain("accountant");
    expect(inbox.html).toContain("Fonction / Role");
  });

  it("sends a branded EN acknowledgement after the inbox notification", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await loadRoute();
    const res = await POST(
      demoRequest({
        name: "Ada Broker",
        email: "ada@cabinet.fr",
        company: "Cabinet Ada",
        role: "insuranceBroker",
        locale: "en",
      })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      acknowledged: true,
    });

    expect(sendMail).toHaveBeenCalledTimes(2);
    const ack = sendMail.mock.calls[1][0] as {
      to: string;
      subject: string;
      html: string;
      replyTo: { email: string };
    };
    expect(ack.to).toBe("ada@cabinet.fr");
    expect(ack.replyTo.email).toBe("hello@lnaflow.com");
    expect(ack.subject).toBe(en.emails.demoAcknowledgement.subject);
    expect(ack.html).toContain("Hi Ada Broker,");
    expect(ack.html).toMatch(/within 24 hours/i);
    expect(ack.html).toContain("https://lnaflow.com/brand/logo-email.png");
    expect(ack.html).toContain("Lemon Tree SAS");
  });

  it("sends the FR acknowledgement when locale is French", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await loadRoute();
    await POST(
      demoRequest({
        name: "Léa Martin",
        email: "lea@example.fr",
        company: "Cabinet Martin",
        role: "propertyManager",
        locale: "fr",
      })
    );

    const ack = sendMail.mock.calls[1][0] as { subject: string; html: string };
    expect(ack.subject).toBe(fr.emails.demoAcknowledgement.subject);
    expect(ack.html).toContain("Bonjour Léa Martin,");
    expect(ack.html).toMatch(/sous 24 heures/i);
  });

  it("soft-fails acknowledgement with 200 acknowledged:false after inbox notify", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, error: "SMTP down" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await loadRoute();
    const res = await POST(
      demoRequest({
        name: "Ada Broker",
        email: "ada@cabinet.fr",
        company: "Cabinet Ada",
        role: "other",
        locale: "en",
      })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      acknowledged: false,
    });
    expect(error).toHaveBeenCalledWith(
      "Demo-request acknowledgement failed",
      expect.objectContaining({
        acknowledged: { ok: false, error: "SMTP down" },
      })
    );
    error.mockRestore();
  });

  it("rejects roles outside the ICP allowlist", async () => {
    mailConfigured.mockReturnValue(true);

    const { POST } = await loadRoute();
    const res = await POST(
      demoRequest({
        name: "Sam",
        email: "sam@broker.fr",
        company: "Courtage Sam",
        role: "ceo\nBcc: evil@x.com",
      })
    );

    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
    await expect(res.json()).resolves.toEqual({ error: "Invalid role" });
  });

  it("strips line breaks from the email subject parts", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await loadRoute();
    const res = await POST(
      demoRequest({
        name: "Léa\nMartin",
        email: "lea@example.fr",
        company: "Cabinet\r\nMartin",
        role: "propertyManager",
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

    const { POST } = await loadRoute();
    const res = await POST(
      demoRequest({
        name: "Sam",
        email: "sam@broker.fr",
        company: "Courtage Sam",
        role: "insuranceBroker",
      })
    );

    expect(res.status).toBe(200);
    // Nothing was sent, so the form must not promise a confirmation email.
    await expect(res.json()).resolves.toEqual({
      success: true,
      delivered: false,
      acknowledged: false,
    });
    expect(sendMail).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("email NOT sent"),
      expect.objectContaining({ role: "insuranceBroker" })
    );
    warn.mockRestore();
  });

  it("returns 429 with Retry-After once one IP exceeds the limit", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i++) {
      const res = await POST(demoRequest(VALID_BODY, "203.0.113.50"));
      expect(res.status).toBe(200);
    }
    // 5 valid submissions = 5 inbox + 5 acknowledgement sends.
    expect(sendMail).toHaveBeenCalledTimes(10);

    const blocked = await POST(demoRequest(VALID_BODY, "203.0.113.50"));

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    await expect(blocked.json()).resolves.toEqual({ error: "rate_limited" });
    // The abusive request never reached SMTP.
    expect(sendMail).toHaveBeenCalledTimes(10);
  });

  it("keeps the limit per IP, not global", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await loadRoute();
    for (let i = 0; i < 5; i++) {
      await POST(demoRequest(VALID_BODY, "203.0.113.51"));
    }
    expect((await POST(demoRequest(VALID_BODY, "203.0.113.51"))).status).toBe(
      429
    );

    const otherVisitor = await POST(demoRequest(VALID_BODY, "203.0.113.52"));
    expect(otherVisitor.status).toBe(200);
    await expect(otherVisitor.json()).resolves.toEqual({
      success: true,
      acknowledged: true,
    });
  });

  it("still accepts one normal submission in EN and FR", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { POST } = await loadRoute();

    const english = await POST(
      demoRequest(
        {
          name: "Ada Broker",
          email: "ada@cabinet.fr",
          company: "Cabinet Ada",
          role: "insuranceBroker",
          locale: "en",
        },
        "203.0.113.53"
      )
    );
    expect(english.status).toBe(200);
    await expect(english.json()).resolves.toEqual({
      success: true,
      acknowledged: true,
    });

    const french = await POST(demoRequest(VALID_BODY, "203.0.113.54"));
    expect(french.status).toBe(200);
    await expect(french.json()).resolves.toEqual({
      success: true,
      acknowledged: true,
    });
  });
});
