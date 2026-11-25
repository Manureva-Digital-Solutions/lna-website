import { beforeEach, describe, expect, it, vi } from "vitest";

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
async function loadRoutes() {
  const { resetRateLimit } = await import("@/lib/rate-limit");
  resetRateLimit();
  const newsletter = await import("./route");
  const demoRequest = await import("../demo-request/route");
  return { newsletter: newsletter.POST, demoRequest: demoRequest.POST };
}

function signup(body: Record<string, unknown>, ip = "198.51.100.20"): Request {
  return new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // nginx appends the real peer address as the rightmost entry.
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/newsletter", () => {
  beforeEach(() => {
    vi.resetModules();
    sendMail.mockReset();
    mailConfigured.mockReset();
  });

  it("notifies the inbox then confirms the subscriber", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { newsletter } = await loadRoutes();
    const res = await newsletter(
      signup({ email: "lea@example.fr", locale: "fr" })
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      confirmed: true,
    });
    expect(sendMail).toHaveBeenCalledTimes(2);

    const inbox = sendMail.mock.calls[0][0] as {
      subject: string;
      html: string;
    };
    expect(inbox.subject).toContain("lea@example.fr");
    expect(inbox.html).toContain("lea@example.fr");

    const confirmation = sendMail.mock.calls[1][0] as { to: string };
    expect(confirmation.to).toBe("lea@example.fr");
  });

  it("reports confirmed:false when the confirmation email fails, still 200", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, error: "SMTP down" });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const { newsletter } = await loadRoutes();
    const res = await newsletter(signup({ email: "lea@example.fr" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      confirmed: false,
    });
    error.mockRestore();
  });

  it("reports confirmed:false and sends nothing when SMTP is not configured", async () => {
    mailConfigured.mockReturnValue(false);
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    const { newsletter } = await loadRoutes();
    const res = await newsletter(signup({ email: "sam@example.fr" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      delivered: false,
      confirmed: false,
    });
    expect(sendMail).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("rejects an invalid email address without sending", async () => {
    mailConfigured.mockReturnValue(true);

    const { newsletter } = await loadRoutes();
    const res = await newsletter(signup({ email: "not-an-email" }));

    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("rejects a malformed JSON body", async () => {
    mailConfigured.mockReturnValue(true);

    const { newsletter } = await loadRoutes();
    const res = await newsletter(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "203.0.113.60",
        },
        body: "{not json",
      })
    );

    expect(res.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After once one IP exceeds the limit", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { newsletter } = await loadRoutes();
    for (let i = 0; i < 5; i++) {
      const res = await newsletter(
        signup({ email: `lea${i}@example.fr` }, "203.0.113.61")
      );
      expect(res.status).toBe(200);
    }
    expect(sendMail).toHaveBeenCalledTimes(10);

    const blocked = await newsletter(
      signup({ email: "lea6@example.fr" }, "203.0.113.61")
    );

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    // Stable, locale-neutral signal — the form supplies its own copy.
    await expect(blocked.json()).resolves.toEqual({ error: "rate_limited" });
    expect(sendMail).toHaveBeenCalledTimes(10);
  });

  it("does not consume the demo-request bucket", async () => {
    mailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue({ ok: true });

    const { newsletter, demoRequest } = await loadRoutes();
    for (let i = 0; i < 5; i++) {
      await newsletter(signup({ email: `lea${i}@example.fr` }, "203.0.113.62"));
    }
    expect(
      (await newsletter(signup({ email: "lea6@example.fr" }, "203.0.113.62")))
        .status
    ).toBe(429);

    const demo = await demoRequest(
      new Request("http://localhost/api/demo-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": "203.0.113.62",
        },
        body: JSON.stringify({
          name: "Léa Martin",
          email: "lea@example.fr",
          company: "Cabinet Martin",
          role: "accountant",
          locale: "fr",
        }),
      })
    );
    expect(demo.status).toBe(200);
  });
});
