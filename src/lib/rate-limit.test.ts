import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  UNKNOWN_CLIENT_KEY,
  checkRateLimit,
  clientIp,
  rateLimitConfig,
  rateLimitResponse,
  resetRateLimit,
  trackedBucketCount,
} from "@/lib/rate-limit";

function req(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/test", { method: "POST", headers });
}

describe("clientIp", () => {
  it("takes the RIGHTMOST X-Forwarded-For entry (the one nginx appended)", () => {
    const request = req({
      // Leading entries are attacker-controlled: never trusted.
      "X-Forwarded-For": "1.2.3.4, 5.6.7.8, 203.0.113.9",
    });
    expect(clientIp(request)).toBe("203.0.113.9");
  });

  it("prefers X-Real-IP when the proxy sets it", () => {
    const request = req({
      "X-Real-IP": "203.0.113.10",
      "X-Forwarded-For": "1.2.3.4, 203.0.113.11",
    });
    expect(clientIp(request)).toBe("203.0.113.10");
  });

  it("returns null when neither header is present", () => {
    expect(clientIp(req())).toBeNull();
  });
});

describe("rateLimitConfig", () => {
  beforeEach(() => {
    vi.stubEnv("RATE_LIMIT_MAX", "");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to 5 requests per 60s with no configuration", () => {
    expect(rateLimitConfig()).toEqual({
      max: DEFAULT_RATE_LIMIT_MAX,
      windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
    });
    expect(DEFAULT_RATE_LIMIT_MAX).toBe(5);
    expect(DEFAULT_RATE_LIMIT_WINDOW_MS).toBe(60_000);
  });

  it("honours numeric overrides", () => {
    vi.stubEnv("RATE_LIMIT_MAX", "3");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "5000");
    expect(rateLimitConfig()).toEqual({ max: 3, windowMs: 5000 });
  });

  it.each(["abc", "0", "-3", "NaN", "Infinity"])(
    "falls back to the default for the invalid value %s",
    (value) => {
      vi.stubEnv("RATE_LIMIT_MAX", value);
      vi.stubEnv("RATE_LIMIT_WINDOW_MS", value);
      expect(rateLimitConfig()).toEqual({
        max: DEFAULT_RATE_LIMIT_MAX,
        windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
      });
    }
  );
});

describe("checkRateLimit", () => {
  const NOW = 1_700_000_000_000;

  beforeEach(() => {
    vi.stubEnv("RATE_LIMIT_MAX", "3");
    vi.stubEnv("RATE_LIMIT_WINDOW_MS", "60000");
    resetRateLimit();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimit();
  });

  it("allows up to the limit and blocks the next request with a Retry-After", () => {
    const request = req({ "X-Forwarded-For": "203.0.113.20" });

    expect(checkRateLimit("demo-request", request, NOW)).toEqual({
      ok: true,
      remaining: 2,
    });
    expect(checkRateLimit("demo-request", request, NOW)).toEqual({
      ok: true,
      remaining: 1,
    });
    expect(checkRateLimit("demo-request", request, NOW)).toEqual({
      ok: true,
      remaining: 0,
    });

    const blocked = checkRateLimit("demo-request", request, NOW + 15_000);
    expect(blocked).toEqual({ ok: false, retryAfterSeconds: 45 });
  });

  it("lets the caller back in once the oldest hit leaves the window", () => {
    const request = req({ "X-Forwarded-For": "203.0.113.21" });
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("demo-request", request, NOW).ok).toBe(true);
    }
    expect(checkRateLimit("demo-request", request, NOW + 60_000).ok).toBe(true);
  });

  it("keeps a separate bucket per route", () => {
    const request = req({ "X-Forwarded-For": "203.0.113.22" });
    for (let i = 0; i < 3; i++) checkRateLimit("newsletter", request, NOW);

    expect(checkRateLimit("newsletter", request, NOW).ok).toBe(false);
    expect(checkRateLimit("demo-request", request, NOW).ok).toBe(true);
  });

  it("keeps a separate bucket per IP", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit(
        "demo-request",
        req({ "X-Forwarded-For": "203.0.113.23" }),
        NOW
      );
    }
    expect(
      checkRateLimit(
        "demo-request",
        req({ "X-Forwarded-For": "203.0.113.23" }),
        NOW
      ).ok
    ).toBe(false);
    expect(
      checkRateLimit(
        "demo-request",
        req({ "X-Forwarded-For": "203.0.113.24" }),
        NOW
      ).ok
    ).toBe(true);
  });

  it("cannot be dodged by omitting the IP headers — one shared unknown bucket", () => {
    expect(trackedBucketCount()).toBe(0);
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("demo-request", req(), NOW).ok).toBe(true);
    }
    expect(checkRateLimit("demo-request", req(), NOW).ok).toBe(false);
    expect(trackedBucketCount()).toBe(1);
    expect(`${"demo-request"}:${UNKNOWN_CLIENT_KEY}`).toBe(
      "demo-request:unknown"
    );
  });

  it("ignores forged leading X-Forwarded-For entries", () => {
    // Same attacker, different spoofed prefix each time, same real hop.
    for (let i = 0; i < 3; i++) {
      checkRateLimit(
        "demo-request",
        req({ "X-Forwarded-For": `10.0.0.${i}, 203.0.113.25` }),
        NOW
      );
    }
    expect(
      checkRateLimit(
        "demo-request",
        req({ "X-Forwarded-For": "10.9.9.9, 203.0.113.25" }),
        NOW
      ).ok
    ).toBe(false);
  });

  it("resetRateLimit clears every counter", () => {
    const request = req({ "X-Forwarded-For": "203.0.113.26" });
    for (let i = 0; i < 3; i++) checkRateLimit("demo-request", request, NOW);
    expect(checkRateLimit("demo-request", request, NOW).ok).toBe(false);

    resetRateLimit();
    expect(trackedBucketCount()).toBe(0);
    expect(checkRateLimit("demo-request", request, NOW).ok).toBe(true);
  });
});

describe("rateLimitResponse", () => {
  it("returns 429 with Retry-After seconds and a machine-readable body", async () => {
    const res = rateLimitResponse(42);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    await expect(res.json()).resolves.toEqual({ error: "rate_limited" });
  });

  it("never emits Retry-After below 1 second", () => {
    expect(rateLimitResponse(0).headers.get("Retry-After")).toBe("1");
  });
});
