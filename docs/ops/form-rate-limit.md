# Form rate limit (demo-request / newsletter)

Short operational note for the LNA vitrine. Implemented in
`src/lib/rate-limit.ts` and used by:

- `src/app/api/demo-request/route.ts`
- `src/app/api/newsletter/route.ts`

Both routes send mail to a visitor-supplied address, so both are throttled
**before** the body is parsed and before anything reaches SMTP. The buckets are
separate per route, so one visitor can still use both forms normally.

## Limits

| Setting                | Default | Meaning                                       |
| ---------------------- | ------- | --------------------------------------------- |
| `RATE_LIMIT_MAX`       | `5`     | requests per window, per client IP, per route |
| `RATE_LIMIT_WINDOW_MS` | `60000` | sliding window length, in milliseconds        |

Both are optional and are read from the environment on each request. Unset means
the default applies — the limit is on with no configuration. A non-numeric, zero
or negative value falls back to the default, so a typo cannot switch the limiter
off. Values are never logged.

There is no need to set these in production or staging. To tighten the limit
temporarily, set the variable and restart the process (a plain restart is
enough — nothing is inlined at build time).

## Responses

When the limit is exceeded the route returns:

- status `429`
- header `Retry-After: <seconds>` — whole seconds until the oldest hit leaves
  the window (never below `1`)
- body `{ "error": "rate_limited" }`

The body is a stable, locale-neutral signal. Both forms map `429` to their own
translated copy (`demoForm.errors.rateLimited`, `newsletter.rateLimited` in
`messages/en.json` and `messages/fr.json`); no raw API string is rendered.
Other failures keep the generic locale copy.

## How the client IP is taken

nginx proxies the site with:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

`$proxy_add_x_forwarded_for` **appends** `$remote_addr` to whatever the client
sent. The leading entries are therefore client-controlled, while the
**rightmost** entry is always the address that actually connected. The limiter
reads the rightmost `X-Forwarded-For` entry, and prefers `X-Real-IP` when the
proxy sets it. The leftmost entry is never trusted — otherwise a caller could
rotate a fake prefix and never be limited.

If neither header is present the request still counts: all such requests share a
single `unknown` bucket per route. That is deliberately conservative — the limit
does not fail open when the IP cannot be determined.

## Single Node process only

The counters live in a module-scope `Map` inside the Node process. That is
correct today because the vitrine runs as:

- **production** — one named pm2 process (`lna-vitrine`), fork mode;
- **staging** — one systemd unit (`lna-vitrine-staging`).

If the vitrine is ever scaled to several Node instances (pm2 cluster mode, a
second server, a load balancer in front of two processes), every instance will
keep its own counters and the effective limit becomes `max × instances`. At that
point replace the store in `src/lib/rate-limit.ts` with a shared one (e.g.
Redis) before scaling. Nothing else in the routes needs to change.

## Not covered

`/api/contact` also sends mail and is **not** rate limited yet — out of scope
here.

## Tests

`src/lib/rate-limit.test.ts` covers the window, per-route and per-IP buckets,
forged `X-Forwarded-For` handling, the unknown-IP bucket, env fallbacks and the
429 contract. Route-level tests live next to each handler
(`src/app/api/*/route.test.ts`).
