/**
 * Process-local rate limiter for the public form routes (demo-request, newsletter).
 *
 * WHY IN MEMORY: the vitrine runs as ONE Node process — a single named pm2
 * process (`lna-vitrine`) in production and a single systemd unit on staging —
 * so a module-scope Map is a complete counter. It is deliberately dependency
 * free: no Redis, no captcha, no npm package.
 *
 * LIMIT: if the vitrine is ever run with more than one Node instance (pm2
 * cluster mode, several servers behind a load balancer), each instance keeps
 * its own counters and the effective limit multiplies by the number of
 * instances. At that point this module must be replaced by a shared store
 * (e.g. Redis) — do not scale the process without revisiting it.
 *
 * CLIENT IP: nginx sets `X-Forwarded-For $proxy_add_x_forwarded_for`, which
 * APPENDS `$remote_addr` to whatever the client sent. A client can therefore
 * forge the leftmost entries, but the RIGHTMOST entry is always the address
 * that actually connected. We read the rightmost entry (or `X-Real-IP` when the
 * proxy sets it). Never trust the leftmost value.
 *
 * If no IP can be determined the request still counts: every such request
 * shares one conservative "unknown" bucket per route, so a caller cannot dodge
 * the limit by hiding the header. That bucket is small on purpose — it is
 * better to make anonymous callers share 5/60s than to fail open.
 *
 * ENV (all optional; defaults keep the limiter ON with no configuration):
 *   RATE_LIMIT_MAX        — requests allowed per window, per IP, per route (default 5)
 *   RATE_LIMIT_WINDOW_MS  — sliding window length in ms (default 60000)
 * Non-numeric, zero or negative values fall back to the default; they can never
 * disable the limiter. Values are never logged.
 *
 * 429 CONTRACT: status 429, `Retry-After` in whole seconds, body
 * `{ "error": "rate_limited" }` (machine-readable, locale-neutral — forms map it
 * to their own translated copy).
 */

import { NextResponse } from "next/server";

export type RateLimitScope = "demo-request" | "newsletter";

export const DEFAULT_RATE_LIMIT_MAX = 5;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

/** Bucket key used when the client IP cannot be determined. */
export const UNKNOWN_CLIENT_KEY = "unknown";

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

/** Hit timestamps (ms) per `${scope}:${clientKey}`. */
const hits = new Map<string, number[]>();

/** Opportunistic sweep threshold — keeps the map bounded on long-lived processes. */
const SWEEP_THRESHOLD = 5_000;

function positiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  // Rejects NaN, Infinity, zero and negatives: a bad value must fall back to the
  // default, never switch the limiter off.
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

/** Reads the env on every call so tests (and a restart-free env change) see it. */
export function rateLimitConfig(): RateLimitConfig {
  return {
    max: positiveNumber(process.env.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
    windowMs: positiveNumber(
      process.env.RATE_LIMIT_WINDOW_MS,
      DEFAULT_RATE_LIMIT_WINDOW_MS
    ),
  };
}

/**
 * Rightmost `X-Forwarded-For` entry (the one nginx appended), else `X-Real-IP`,
 * else null. The leftmost entries are client-controlled and never trusted.
 */
export function clientIp(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const chain = forwarded
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    const rightmost = chain[chain.length - 1];
    if (rightmost) return rightmost;
  }

  return null;
}

function sweep(now: number, windowMs: number) {
  for (const [key, stamps] of hits) {
    const live = stamps.filter((stamp) => now - stamp < windowMs);
    if (live.length === 0) hits.delete(key);
    else hits.set(key, live);
  }
}

/**
 * Counts one request against `scope` for the caller's IP.
 * Call this BEFORE any mail is sent so abusive traffic never reaches SMTP.
 */
export function checkRateLimit(
  scope: RateLimitScope,
  request: Request,
  now: number = Date.now()
): RateLimitResult {
  const { max, windowMs } = rateLimitConfig();
  const key = `${scope}:${clientIp(request) ?? UNKNOWN_CLIENT_KEY}`;

  const stamps = (hits.get(key) ?? []).filter(
    (stamp) => now - stamp < windowMs
  );

  if (stamps.length >= max) {
    // Retry once the oldest hit leaves the window, rounded up to whole seconds
    // and never below 1 (a `Retry-After: 0` invites an immediate retry loop).
    const waitMs = stamps[0] + windowMs - now;
    hits.set(key, stamps);
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)),
    };
  }

  stamps.push(now);
  hits.set(key, stamps);

  if (hits.size > SWEEP_THRESHOLD) sweep(now, windowMs);

  return { ok: true, remaining: max - stamps.length };
}

/** Standard 429 response: `Retry-After` seconds + stable machine-readable body. */
export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))),
        "Cache-Control": "no-store",
      },
    }
  );
}

/** Test hook — drops every counter. Not used by the routes. */
export function resetRateLimit() {
  hits.clear();
}

/** Test hook — number of tracked buckets. */
export function trackedBucketCount() {
  return hits.size;
}
