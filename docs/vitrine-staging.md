# Staging environment for the LNA vitrine website

> **Status: implemented on 2026-11-17.** The plan below is kept as the reasoning
> record. Two of its `[ASSUMED]` values were confirmed on the box on the day and
> are superseded by the "As built" table at the end of this file — read that
> table first if you are here to operate the environment, not to review the plan.

Written 16 Nov 2026, about 19:20 IST (Asia/Calcutta, UTC+5:30), as a **written plan only**. Nothing in this file has been applied to a server, to GitHub, or to DNS. Do not treat it as approval to change production.

This guide tells Gilbert how to stand up a staging site for [Manureva-Digital-Solutions/lna-website](https://github.com/Manureva-Digital-Solutions/lna-website) using **the same process as the LNA app**, adapted for a Next.js marketing site (no Postgres, Redis or MinIO).

**How to read the labels**

- **[VERIFIED]** — observed in the LNA or lna-website repo, in shared ops docs under `/workspace/shared/lna/`, or with a read-only HTTPS request. Cited where it helps.
- **[ASSUMED]** — a concrete recommendation that has not been confirmed on the box (paths, exact ports, who has SSH). Fill these in before running anything.

Do not put secrets, private keys, passwords, or server IPs in this file, in git, in Slack, or in a ticket. Domain names are fine.

---

## 1. What the LNA app actually does today

### 1.1 Branch flow **[VERIFIED]**

The intended line, from LNA PR #193 (open as of 16 Nov, not merged) and the 16 Nov stand-up notes:

| Branch           | Role                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| feature branches | PRs into `develop`                                                          |
| `develop`        | integration line                                                            |
| `release`        | deploy line: **fast-forwarded from `develop`, never committed to directly** |
| live             | from Wednesday 18 Nov 2026, live deploys from `release`                     |

PR #193 (Gilbert, base `develop`, still open) changes `scripts/deploy-ovh.sh` from the stale default `BRANCH="feature/paid-self-serve-phase1-ui-overhaul"` to `BRANCH="release"`. After that is merged and `release` is fast-forwarded to include it, the GitHub Actions variable `DEPLOY_BRANCH` is flipped to `release` **last**, not first — because the script lives in the repo and the next `git reset --hard origin/release` is what teaches the box the new name.

The repo's GitHub default branch is still `feature/paid-self-serve-phase1-ui-overhaul`. Do **not** copy that habit onto lna-website.

### 1.2 Hosting vocabulary (read this before you copy an older doc) **[VERIFIED]**

This has moved twice in two weeks. Use the 16 Nov stand-up, not the 14 Nov wording.

- **14 Nov** (`ovh-vs-scaleway-2026-11-14.md`): “production” would be a new dedicated server (then Scaleway, later an OVH Advance-4); the current OVH VPS would stay staging/dev.
- **16 Nov stand-up** (`lna-286-jira-proposed.md`): **no Scaleway, no separate Advance-4**. The existing OVH VPS is upgraded in place. Production and staging both stay on that same server, isolated by process, database, Redis and buckets.
- On that box today, “live” is the pm2 process `lna-backend`, reached as `https://app.lnaflow.com` and `https://lna.manurevasolutions.com`. Staging is `lna-staging-backend`, reached as `https://staging.lna.manurevasolutions.com`. Isolation of staging (own Postgres, Redis on loopback:6380, MinIO user) was done on 16 Nov; live was not restarted.

Scripts and comments still say “OVH prod”. That is leftover language. On this box, `lna-backend` is live and `lna-staging-backend` is staging.

### 1.3 On-box deploy script **[VERIFIED]** (`scripts/deploy-ovh.sh` on `develop` / `release`)

The script runs **on the host**, not from a laptop. Shape (the vitrine script in §8 follows this, minus Prisma and the Vite `dist/` check):

- `set -euo pipefail`
- hardcoded `APP_DIR`, `BRANCH`, `HEALTH_URL`, `PUBLIC_URL`, `PM2_APP`
- optional quiesce guard (in-flight work); vitrine does not need this
- `git fetch origin "$BRANCH"`, resolve the target to an immutable SHA, `git reset --hard "$SHA"`, then re-read `HEAD` and abort if it does not match
- install, build, `pm2 restart` of **one named process** (never `pm2 restart all`)
- health check, then an assertion that the _served_ artefact matches the _just-built_ artefact
- `.env` is gitignored, so `git reset --hard` leaves it alone

It does **not** currently keep a previous build and roll back automatically. Staging deploys of the app have been doing that by hand (`dist.bak-<sha>`, then checkout + copy back + `pm2 restart lna-staging-backend`). The vitrine script below adds an explicit rollback, which is a small improvement, not something the app script already does.

There is no auto-deploy of the app's staging: `~/LNA-staging` is updated by a manual, named-process restart (most recently 55db085 on 16 Nov).

### 1.4 GitHub Actions **[VERIFIED]**

Only two workflows exist in the LNA repo:

1. `.github/workflows/deploy-aws.yml` — “CI and deploy (EC2 via SSH)”. Node 20. On PRs and pushes to **`main`**: `npm ci`, Prisma generate, tests, lint, build. Deploy job runs only on push (or `workflow_dispatch`) to **`main`**, over SSH (`appleboy/ssh-action`), using **repo variables and secrets**, not GitHub Environments:
   - vars: `DEPLOY_HOST`, `DEPLOY_USER` (default `ubuntu`), `DEPLOY_SSH_PORT` (default 22), `DEPLOY_PATH` (default `/home/ubuntu/LNA`), `DEPLOY_BRANCH` (default `main`), optional `DEPLOY_SKIP_SERVICE_RESTART`, `DEPLOY_POST_COMMAND`
   - secrets: `DEPLOY_SSH_PRIVATE_KEY` (and an API key sync that is irrelevant to the vitrine)
   - remote script: `git fetch` / `checkout -f` / `reset --hard origin/$BRANCH`, `npm ci`, migrate, build, `pm2 restart lna-backend` or `pm2 start` if missing, `pm2 save`, `chmod` on `dist`, optional nginx reload
2. `.github/workflows/secret-scan.yml` — gitleaks 8.30.1, full history (`fetch-depth: 0`), `--redact`, **independent** of the deploy workflow so a scanner outage cannot block a deploy (and vice versa). Runs on every push and PR.

There is **no SonarQube workflow** in `.github/workflows` of the LNA repo. Do not invent one for the vitrine just to “match LNA”.

The Actions deploy is stale relative to the branch flow: it still triggers on `main` and defaults `DEPLOY_BRANCH` to `main`. The live source of truth on the OVH box is the on-box script plus (for staging) a manual checkout. The vitrine should copy the **intended** model (`develop` → staging, `release` → prod) and use GitHub Environments, which the LNA app does not have today.

### 1.5 App staging URL (for the vitrine's “Sign in” / “Register” links) **[VERIFIED]**

`https://staging.lna.manurevasolutions.com` — nginx/1.24 Ubuntu in front of `lna-staging-backend` on port 3002. Live app is `https://app.lnaflow.com`.

---

## 2. How the vitrine is served today

**[VERIFIED]** unless noted.

- Public site: `https://lnaflow.com` (www redirects there). `GET /` is a 307 to `/fr`. `GET /fr` is 200, `Server: nginx/1.24.0 (Ubuntu)`, with `x-nextjs-cache` / `x-nextjs-prerender` — so it is `next start` behind nginx, not a static export and not Vercel.
- The same OVH VPS already runs a pm2 process named **`lna-vitrine`**, online, Node **v20.20.2**, pm2 7.0.3 (read-only inspection, 16 Nov, `staging-isolation-plan.md`). ufw allows 22, 80, 443 **and 3000**. The LNA-286 notes say port 3000 (the vitrine) is open to the world and bypasses nginx. The unused Scaleway pack (`deploy/scaleway/nginx/sites/lnaflow.com.conf.optional`) documents the intended shape: nginx proxies `lnaflow.com` / `www.lnaflow.com` to `http://127.0.0.1:3000`.
- The vitrine checkout path (cwd of `lna-vitrine`) was **not** recorded. **[ASSUMED]** until someone runs `pm2 show lna-vitrine` (see Q1).
- Repo `Manureva-Digital-Solutions/lna-website`: default branch is `main` at `33334d9` (squash of PR #17). PR #18 is open against `main`. There is **no** `develop` or `release` branch. **`main` is not protected.** The only workflow on `main` is `.github/workflows/ci.yml` (lint, format, type-check, build on Node 20). It has no deploy job. A comment in that file says Vercel previews “can be added later”. A leftover branch `claude/aws-deployment-pipeline-JC96V` has a Docker-on-EC2 `deploy.yml` and a generic `nginx.conf`. **Do not use that branch** — it is not how LNA is hosted.
- `src/lib/site.ts`: `NEXT_PUBLIC_SITE_URL` defaults to `https://lnaflow.com`. `PRELAUNCH = true` drives `robots.txt` (`disallow: /`) and a per-page noindex meta. That flag is still on in the live code, and it will be flipped to `false` on launch day. That is why staging noindex must live in **nginx**, not in this flag.
- `src/lib/app-urls.ts`: `NEXT_PUBLIC_APP_URL` defaults to `https://app.lnaflow.com`. Sign-in and register are absolute links to that host. If staging is built without overriding this, testers will be sent to the **live** app.
- `.env.example` covers SMTP (Google Workspace relay, IP-allowlisted), Crisp, GA, and `NEXT_PUBLIC_SITE_URL`. It does not list `NEXT_PUBLIC_APP_URL`.
- Slack `#lna-vitrine-website` (12 Nov, Dinesh): he was already “waiting for staging server and pipeline” before raising PRs. No staging or preview URL has been published in that channel, in GitHub Deployments, or in PR checks.
- Live `lnaflow.com` is **not** running the PR #17 header (merged to `main` as `33334d9`). There is no pipeline to push `main` to the box.

**Do not SSH, restart, or edit anything on the box until Gilbert says so, in his own words.** The rest of this file is the procedure to run after that.

---

## 3. Recommended process (short version)

```
feature branch  ──PR──►  develop  ──auto SSH deploy──►  staging.lnaflow.com
                            │
                            │  Gilbert fast-forwards (never commit on release)
                            ▼
                         release  ──manual SSH deploy, Gilbert approves──►  lnaflow.com
```

1. Keep the vitrine on the **same OVH VPS** that already runs `lna-vitrine`, `lna-backend` and `lna-staging-backend` (16 Nov plan: one box, isolated processes).
2. Add a second checkout, a systemd unit (`lna-vitrine-staging.service`), and a second nginx vhost. Never touch the live vitrine, `lna-backend`, or `lna-staging-backend` to stand this up.
3. `develop` auto-deploys to staging. `release` is the only branch that may be deployed to `lnaflow.com`, by a workflow in the GitHub Environment `production` with **required reviewers = Gilbert**.
4. Staging gets basic auth and an nginx `X-Robots-Tag: noindex, nofollow, noarchive` header. Do not flip `PRELAUNCH` or add a noindex meta “for staging” in application code.
5. `.env` lives on the box, is gitignored, and survives `git reset --hard`. `NEXT_PUBLIC_*` is baked in at **build** time, so an env change needs a rebuild, not just a process restart.

---

## 4. Branches, protection, and open PR #18

**[ASSUMED]** as a recommendation. Today only `main` exists, and it is unprotected. **[VERIFIED]**

### 4.1 Create the LNA-shaped branches from today's `main`

Do this **before** merging PR #18, so the PR can be retargeted cleanly.

```bash
# from a clean clone of Manureva-Digital-Solutions/lna-website
git fetch origin
git checkout -B develop origin/main    # 33334d9 today
git push -u origin develop
git checkout -B release origin/main
git push -u origin release
```

Leave `main` in place for now, pointing at the same commit. After the first successful staging deploy, either:

- **Preferred:** make `develop` the default branch, keep `release` as the prod line, and stop merging to `main`; or
- Keep `main` as a fast-forward mirror of `release` (update it when you promote) so old bookmarks and PR #18's earlier comments still make sense.

Do not force-push `main`. Do not commit directly to `release`.

### 4.2 Retarget PR #18 **[VERIFIED]** it currently targets `main`

1. In the GitHub UI: PR #18 → Edit → base = `develop`.
2. Re-run CI (the workflow in §9 must listen to `develop`, or the existing `ci.yml` will not run).
3. Review and merge to `develop` as usual. That merge is what first appears on `staging.lnaflow.com`.
4. Only after Pravin (and Gilbert) have signed off on staging, fast-forward `release` and deploy prod.

If PR #18 is instead merged to `main` first, cherry-pick or merge that commit into `develop` afterwards. Retargeting first is cleaner.

### 4.3 Branch protection (Settings → Branches)

| Branch    | Protection                                                                                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `develop` | Require a PR. Require the CI jobs (lint, type-check, build) and gitleaks to pass. No force-push. Dinesh and Pravin can merge once checks are green, unless Gilbert wants his own review on every PR. |
| `release` | Require a PR, or restrict pushes to admins / Gilbert only so the only legal update is a fast-forward from `develop`. No force-push. No direct commits.                                               |
| `main`    | If it stays: same as `release`, or lock it once `develop` is the default. Today it is unprotected — fix that even if you do nothing else.                                                            |

---

## 5. DNS

**[ASSUMED]** name. `staging.lnaflow.com` is the obvious match for `lnaflow.com` and for the app's `staging.lna.manurevasolutions.com`.

1. Gilbert (or whoever holds the `lnaflow.com` zone) adds an **A record**: `staging.lnaflow.com` → the same public IPv4 as `lnaflow.com` (the OVH VPS). No Cloudflare in front of the app staging host today; keep the vitrine the same unless Gilbert decides otherwise.
2. Wait until the name resolves from outside (`dig +short staging.lnaflow.com A`), then run certbot (§6.4).
3. Do not point `staging.lnaflow.com` at a different machine. Do not reuse `staging.lna.manurevasolutions.com` — that is the **app**.

---

## 6. Server: first-time setup

All commands run as the same unprivileged user that already runs `lna-vitrine` (almost certainly `ubuntu` — **[ASSUMED]** until `pm2 show` confirms). Never as a step that restarts `lna-backend`, `lna-staging-backend`, or `lna-vitrine`. Never `pm2 restart all` / `pm2 reload all`.

The only systemd unit this setup may restart is `lna-vitrine-staging`.

### Port and process naming convention

- Prod stays on its current port (**3000**) with its usual process name (`lna-vitrine`, under pm2 as today). Do not change prod.
- Staging gets the **next free port up** from prod's port. 3001 and 3002 are taken: 3002 is `lna-staging-backend` (**[VERIFIED]**, §1.5). This guide already lists 3001 as occupied in the §6 table but does not name the process; the LNA isolation notes attribute 3001 to `lna-backend`. The expected staging port is therefore **3003**, marked **[ASSUMED]** until `ss -ltn` confirms it is free. If 3003 is taken, take the next free one up.
- Staging process name = prod name + `-staging` = `lna-vitrine-staging`, running under **its own systemd unit** `lna-vitrine-staging.service` (not pm2), so a restart or deploy of one cannot touch the other, and they are distinguishable in `ps` and `systemctl`.

| Role             | Port                                           | Process name          | Supervisor                                 |
| ---------------- | ---------------------------------------------- | --------------------- | ------------------------------------------ |
| Prod (unchanged) | 3000                                           | `lna-vitrine`         | pm2, as today                              |
| Staging          | next free port up, e.g. **3003** **[ASSUMED]** | `lna-vitrine-staging` | systemd unit `lna-vitrine-staging.service` |

### 6.1 Inspect first (read-only)

```bash
pm2 ls
pm2 show lna-vitrine          # note cwd, port, exec cwd, interpreter; do not copy env values off the box
node -v                       # expect v20.x (v20.20.2 on 16 Nov)
ss -ltn | awk '{print $4}'    # list listeners; confirm 3003 is free, else next free up
sudo nginx -T 2>/dev/null | grep -E 'server_name|proxy_pass|listen ' | head
ls /etc/nginx/sites-enabled
```

Fill in the blanks and keep them on the box, not in chat:

| Item             | Recommendation                                                                            | Fill in                                           |
| ---------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Live vitrine dir | whatever `pm2 show lna-vitrine` reports as cwd                                            | **[ASSUMED]** e.g. `/home/ubuntu/lna-website`     |
| Staging dir      | a **sibling** checkout, not a second worktree of the live dir                             | **[ASSUMED]** `/home/ubuntu/lna-website-staging`  |
| Live port        | already 3000                                                                              | **[VERIFIED]** as the vitrine port on this box    |
| Staging port     | next free loopback port up from 3000; 3001 and 3002 are taken, so **3003** if free        | **[ASSUMED]** `3003` until `ss -ltn` confirms     |
| Staging process  | `lna-vitrine-staging`, under its own systemd unit `lna-vitrine-staging.service` (not pm2) |                                                   |
| Node             | 20, via the same nvm already on the box                                                   | **[VERIFIED]** `.nvmrc` is `20`; box has v20.20.2 |

Bind both Next processes to `127.0.0.1`, not `0.0.0.0`. After staging is up, consider closing ufw 3000 so the live vitrine is only reachable through nginx (**[VERIFIED]** it is currently world-open). That change needs its own go — it is a live-path change.

### 6.2 Checkout

The LNA staging checkout had a stale `origin` and a deploy-key problem; Gilbert is renewing the server GitHub deploy key himself (`lna-286-jira-proposed.md`). The vitrine clone must be able to `git fetch` **`Manureva-Digital-Solutions/lna-website`**. Confirm `git ls-remote` works before the first deploy.

```bash
# After confirming the live cwd, and that 3003 is free:
STAGING_DIR=/home/ubuntu/lna-website-staging   # [ASSUMED] path
git clone git@github.com:Manureva-Digital-Solutions/lna-website.git "$STAGING_DIR"
cd "$STAGING_DIR"
git checkout develop
# leave .env out of git — next section
```

If a deploy key is scoped to the LNA app repo only, add a **read-only** deploy key for `lna-website` (or a machine user) rather than widening the existing key.

### 6.3 systemd unit (staging only; prod stays on pm2)

Do **not** add `lna-vitrine-staging` to pm2. Create a dedicated unit so `systemctl restart lna-vitrine-staging` cannot touch `lna-vitrine`, and so the two are distinguishable in `ps` and `systemctl`.

Fill in the vitrine user, the staging checkout, and the node binary from §6.1 (`pm2 show lna-vitrine`, `which node` as that user). The node path below matches v20.20.2 on nvm as of 16 Nov; confirm it before enabling the unit. **[ASSUMED]** until then.

`/etc/systemd/system/lna-vitrine-staging.service`:

```ini
[Unit]
Description=LNA vitrine staging (Next.js)
After=network.target
# Independent of lna-vitrine (pm2) and of the LNA app units. Do not add
# After= or Requires= on those.

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/lna-website-staging
# Next.js reads `.env` from WorkingDirectory. Skip EnvironmentFile= if the
# file has comments or values that systemd would misparse (spaces, #, quotes).
# PORT / HOSTNAME / NODE_ENV are set below and win over anything in `.env`.
Environment=NODE_ENV=production
Environment=PORT=3003
Environment=HOSTNAME=127.0.0.1
# Pin the nvm node binary; a systemd unit has no login shell, so PATH alone
# is not enough. Adjust the version directory after `which node`.
ExecStart=/home/ubuntu/.nvm/versions/node/v20.20.2/bin/npx next start -H 127.0.0.1 -p 3003
Restart=on-failure
RestartSec=5
SyslogIdentifier=lna-vitrine-staging

[Install]
WantedBy=multi-user.target
```

If 3003 was taken, change `PORT=`, the `-p` flag, and the nginx `proxy_pass` in §6.4 to the next free port, consistently.

Sudoers drop-in so the deploy user can restart and check **only** this unit, with no password (needed by the deploy script and by Actions over SSH). Do not allow `start`/`stop`/`enable`/`daemon-reload` here — those stay first-time, interactive steps. Confirm the `systemctl` path with `which systemctl` (usually `/usr/bin/systemctl` on Ubuntu):

```bash
# /etc/sudoers.d/lna-vitrine-staging  — install with visudo, never a raw echo
sudo visudo -f /etc/sudoers.d/lna-vitrine-staging
```

```
# Replace ubuntu with the vitrine / deploy user if it is different.
ubuntu ALL=(root) NOPASSWD: /usr/bin/systemctl restart lna-vitrine-staging, /usr/bin/systemctl restart lna-vitrine-staging.service, /usr/bin/systemctl status lna-vitrine-staging, /usr/bin/systemctl status lna-vitrine-staging.service
```

```bash
sudo chmod 440 /etc/sudoers.d/lna-vitrine-staging

# run once, after the first .env and the first successful `npm ci && npm run build`
sudo systemctl daemon-reload
sudo systemctl enable --now lna-vitrine-staging
sudo systemctl status lna-vitrine-staging
journalctl -u lna-vitrine-staging -e --no-pager | tail -40

# confirm you did not touch the other processes (pm2 pid/restarts unchanged):
pm2 ls
```

`next start` honours `PORT` and, in current Next.js, `HOSTNAME` for the bind address. The `ExecStart` line also passes `-H 127.0.0.1 -p 3003` so a missing or typo'd env still binds to loopback on the intended port.

### 6.4 nginx vhost, TLS, basic auth, noindex

Create a **new** site file. Do not edit the live `lnaflow.com` server block except to review it.

`/etc/nginx/sites-available/staging.lnaflow.com`:

```nginx
# Staging only. Do not copy these headers or auth_basic into the lnaflow.com vhost.
server {
    listen 80;
    listen [::]:80;
    server_name staging.lnaflow.com;
    location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { return 301 https://staging.lnaflow.com$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name staging.lnaflow.com;

    ssl_certificate     /etc/letsencrypt/live/staging.lnaflow.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.lnaflow.com/privkey.pem;

    # Keep crawlers out even after PRELAUNCH is flipped to false in the app.
    add_header X-Robots-Tag "noindex, nofollow, noarchive" always;

    auth_basic           "LNA vitrine staging";
    auth_basic_user_file /etc/nginx/.htpasswd-lna-vitrine-staging;

    location / {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://127.0.0.1:3003;
    }
}
```

Then:

```bash
# password is typed, not pasted into Slack or git
sudo apt-get install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd-lna-vitrine-staging <reviewer-user>
sudo chmod 640 /etc/nginx/.htpasswd-lna-vitrine-staging
sudo chown root:www-data /etc/nginx/.htpasswd-lna-vitrine-staging

# DNS must already answer. nginx needs a temporary HTTP-only server block
# (comment out the 443 server) for the first certificate, or use certbot certonly --webroot.
sudo ln -s /etc/nginx/sites-available/staging.lnaflow.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d staging.lnaflow.com
sudo nginx -t && sudo systemctl reload nginx
```

`reload` is enough. Do not `restart` nginx unless `nginx -t` failed after an edit you have already reverted — a restart is a live-path blip for `app.lnaflow.com` and `lnaflow.com` too.

**Why the header is in nginx, not in code.** `PRELAUNCH` in `src/lib/site.ts` already noindexes the live site today. On launch day that constant becomes `false` and ships in the same git history that staging will deploy from `develop`. A code-level “if staging, noindex” is easy to get wrong (`NEXT_PUBLIC_SITE_URL` checks, forgotten env, a preview that looks like prod). An nginx header on this vhost only cannot leak to `lnaflow.com`.

Basic auth credentials go to Pravin, Dinesh and Gilbert via the team vault, not Slack.

---

## 7. Environment files

Create `/home/ubuntu/lna-website-staging/.env` on the box (mode 600). Name it `.env`, not `.env.staging`, so `next build` / `next start` pick it up without extra wiring. It must be gitignored (confirm in `.gitignore` before the first `git reset --hard`).

```bash
# .env on the STAGING checkout only. Values that matter:
NEXT_PUBLIC_SITE_URL=https://staging.lnaflow.com
NEXT_PUBLIC_APP_URL=https://staging.lna.manurevasolutions.com

# Leave analytics / chat empty on staging unless you have a dedicated property.
# NEXT_PUBLIC_CRISP_WEBSITE_ID=
# NEXT_PUBLIC_GA_MEASUREMENT_ID=

# SMTP: the contact form can use the same Workspace relay, because it is
# allowlisted by the box's source IP. Copy SMTP_* from the live vitrine .env
# on the box (do not paste values off the box). Set:
SMTP_NAME=staging.lnaflow.com
# SMTP_FROM can stay noreply@lnaflow.com, or a staging address if you have one.
# CONTACT_INBOX: a shared review inbox, not necessarily hello@lnaflow.com.
```

Live vitrine `.env` keeps `NEXT_PUBLIC_SITE_URL=https://lnaflow.com` and `NEXT_PUBLIC_APP_URL=https://app.lnaflow.com` (or unset, which is the same default).

**`NEXT_PUBLIC_*` is inlined at `next build`.** Changing these values and only restarting the process (`sudo systemctl restart lna-vitrine-staging` on staging, `pm2 reload` on prod) will serve the old URLs. The deploy script always rebuilds; a manual env fix must too.

Take a backup before the first deploy: `cp -p .env .env.bak-$(date +%Y%m%d)`.

---

## 8. Deploy script (modelled on `deploy-ovh.sh`)

Commit this as `scripts/deploy-vitrine.sh` in `lna-website` (staging and production each have their own copy on disk after checkout, with `BRANCH`, `APP_DIR`, `PROCESS_MANAGER`, `PROCESS_UNIT` and `PUBLIC_URL` set for that environment). Run it **on the host**.

This is a template. Substitute the **[ASSUMED]** paths and the staging basic-auth user after §6.

```bash
#!/usr/bin/env bash
#
# Deploy the LNA vitrine (Next.js) on the OVH box. Runs ON the host.
# Staging and production are separate checkouts. Staging is restarted via
# its own systemd unit; production still uses pm2. Never run this against
# the wrong APP_DIR. Never pm2 restart all. Never systemctl restart
# anything except the unit named in PROCESS_UNIT.
#
# Usage:
#   ./scripts/deploy-vitrine.sh                 # tip of $BRANCH
#   ./scripts/deploy-vitrine.sh <git-sha>       # a specific commit
#
set -euo pipefail

# --- per-environment constants (staging values shown) ---
APP_DIR="/home/ubuntu/lna-website-staging"          # [ASSUMED]
BRANCH="develop"                                    # production copy: release
HEALTH_URL="http://127.0.0.1:3003/fr"               # [ASSUMED] port
PUBLIC_URL="https://staging.lnaflow.com/fr"
# PROCESS_MANAGER: systemd (staging) or pm2 (prod). Never "all".
PROCESS_MANAGER="systemd"                           # production copy: pm2
PROCESS_UNIT="lna-vitrine-staging"                  # production copy: lna-vitrine
# If PUBLIC_URL is basic-auth protected, set this in the environment of the
# person (or Action) running the script, do not hardcode it:
#   CURL_AUTH=(-u "$STAGING_BASIC_AUTH")
# For the loopback health check, auth is not required.
CURL_AUTH=()

TARGET_REF="${1:-origin/$BRANCH}"

log() { printf '[deploy %s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }
die() { printf '[deploy] FATAL: %s\n' "$*" >&2; exit 1; }

cd "$APP_DIR" || die "no $APP_DIR"
[ -f .env ] || die ".env missing — refusing to build (NEXT_PUBLIC_* would be wrong)"

if [ -f "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi
command -v node >/dev/null || die "node not on PATH"
log "node $(node -v)"

# ── 1. Resolve an immutable SHA, then move HEAD ───────────────────────────
git fetch origin "$BRANCH" --quiet
TARGET_SHA=$(git rev-parse --verify --quiet "${TARGET_REF}^{commit}") \
  || die "not a valid commit: '$TARGET_REF'"
log "target: $TARGET_SHA (from $TARGET_REF)"

# ── 2. Snapshot the running build for rollback ────────────────────────────
STAMP=$(date +%Y%m%d%H%M%S)
PREV_SHA=$(git rev-parse HEAD)
if [ -d .next ]; then
  rm -rf ".next.prev"
  cp -a .next ".next.prev"
  log "saved previous .next (was $PREV_SHA)"
fi
printf '%s\n' "$PREV_SHA" > .deploy-previous-sha

# Restart only the process this checkout owns. Staging: systemd unit.
# Prod: named pm2 process. Never "all".
reload_app() {
  case "$PROCESS_MANAGER" in
    systemd)
      sudo systemctl restart "$PROCESS_UNIT"
      ;;
    pm2)
      pm2 reload "$PROCESS_UNIT" --update-env
      ;;
    *)
      die "PROCESS_MANAGER must be systemd or pm2, not '$PROCESS_MANAGER'"
      ;;
  esac
}

rollback() {
  local reason="$1"
  log "ROLLBACK: $reason"
  if [ -d .next.prev ]; then
    rm -rf .next
    mv .next.prev .next
  fi
  if git rev-parse --verify --quiet "$PREV_SHA^{commit}" >/dev/null; then
    git reset --hard "$PREV_SHA" >/dev/null || true
  fi
  reload_app >/dev/null 2>&1 || true
  die "deploy failed and was rolled back toward $PREV_SHA"
}

git reset --hard "$TARGET_SHA" >/dev/null
[ "$(git rev-parse HEAD)" = "$TARGET_SHA" ] || die "HEAD $(git rev-parse HEAD) != target $TARGET_SHA"
[ -f .env ] || die ".env disappeared after reset — is it gitignored?"
log "HEAD now $(git rev-parse --short HEAD)"

# ── 3. Build ──────────────────────────────────────────────────────────────
log "npm ci + next build"
npm ci --no-audit --no-fund > "/tmp/vitrine-install-$STAMP.log" 2>&1 \
  || { tail -20 "/tmp/vitrine-install-$STAMP.log"; rollback "npm ci failed"; }
npm run build > "/tmp/vitrine-build-$STAMP.log" 2>&1 \
  || { tail -40 "/tmp/vitrine-build-$STAMP.log"; rollback "next build failed"; }
[ -d .next ] || rollback "build produced no .next"

# ── 4. Reload the named process only ──────────────────────────────────────
if [ "$PROCESS_MANAGER" = systemd ]; then
  systemctl is-active --quiet "$PROCESS_UNIT" \
    || die "systemd unit $PROCESS_UNIT is not active — enable it once by hand (see the guide)"
  sudo systemctl restart "$PROCESS_UNIT" 2>&1 | tail -5 \
    || rollback "systemctl restart $PROCESS_UNIT failed"
elif [ "$PROCESS_MANAGER" = pm2 ]; then
  if pm2 describe "$PROCESS_UNIT" >/dev/null 2>&1; then
    pm2 reload "$PROCESS_UNIT" --update-env 2>&1 | tail -5 \
      || rollback "pm2 reload failed"
  else
    die "pm2 process $PROCESS_UNIT is not defined — start it once by hand (see the guide)"
  fi
  pm2 save >/dev/null || true
else
  die "PROCESS_MANAGER must be systemd or pm2, not '$PROCESS_MANAGER'"
fi
sleep 5

# ── 5. Verify — prove it, don't assume it ─────────────────────────────────
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || echo 000)
[ "$CODE" = "200" ] || rollback "loopback health returned $CODE for $HEALTH_URL"
log "loopback health: 200"

# Public check (follows redirects). Supply CURL_AUTH for staging basic auth.
PUB=$(curl -sI -o /dev/null -w '%{http_code}' "${CURL_AUTH[@]}" -L "$PUBLIC_URL" || echo 000)
[ "$PUB" = "200" ] || rollback "public URL returned $PUB for $PUBLIC_URL"
log "public health: 200 ($PUBLIC_URL)"

# Confirm the running checkout is the SHA we intended (not a mid-script drift).
[ "$(git rev-parse HEAD)" = "$TARGET_SHA" ] || rollback "HEAD drifted during deploy"
log "DONE — $(git rev-parse --short HEAD), health 200"
```

`chmod +x scripts/deploy-vitrine.sh`. For production, the copy under the live cwd has `BRANCH="release"`, `APP_DIR` = the live checkout, `PROCESS_MANAGER="pm2"`, `PROCESS_UNIT="lna-vitrine"`, `HEALTH_URL=http://127.0.0.1:3000/fr`, `PUBLIC_URL=https://lnaflow.com/fr`, and no basic auth. Staging stays on `PROCESS_MANAGER="systemd"` and `PROCESS_UNIT="lna-vitrine-staging"`.

Manual prod deploy, after `release` has been fast-forwarded:

```bash
cd /home/ubuntu/lna-website          # [ASSUMED] live cwd
./scripts/deploy-vitrine.sh          # or ./scripts/deploy-vitrine.sh <sha>
```

---

## 9. GitHub Actions

Add two workflows. Keep gitleaks independent, as LNA does.

Put Actions secrets in **GitHub Environments**, which is stricter than the LNA app's repo-level vars (the app workflow does not use Environments today).

### 9.1 Environments (Settings → Environments)

| Environment  | Branch gate | Reviewers                        | Secrets / vars                                                                                                                                                                                 |
| ------------ | ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `staging`    | `develop`   | none (auto-deploy)               | vars: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_SSH_PORT` (22). Secret: `DEPLOY_SSH_PRIVATE_KEY`. Optional secret: `STAGING_BASIC_AUTH` (`user:password`) for the post-deploy curl. |
| `production` | `release`   | **required reviewers = Gilbert** | same keys, pointing at the **live** checkout path and the same host. No basic auth.                                                                                                            |

The SSH key should be a dedicated deploy key on the box (`authorized_keys`), not a personal laptop key, with command restrictions if practical. Do not reuse a key that can also reach production databases or as root.

### 9.2 CI (replace the `on:` of existing `.github/workflows/ci.yml`)

Keep the existing lint / format / type-check / build jobs on Node 20. Change the triggers so PRs against the new branches are covered:

```yaml
on:
  push:
    branches: [develop, release, main]
  pull_request:
    branches: [develop, release, main]
```

### 9.3 Gitleaks (new `.github/workflows/secret-scan.yml`)

Copy the LNA workflow's shape: pinned gitleaks **8.30.1**, `fetch-depth: 0`, `--redact`, upload SARIF, runs on every push and PR, **not** `needs:`-wired into deploy. Add a `.gitleaks.toml` if you want allowlists; start from LNA's file and drop app-specific paths.

### 9.4 Deploy to staging (new `.github/workflows/deploy-staging.yml`)

```yaml
name: Deploy vitrine staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

concurrency:
  group: deploy-vitrine-staging
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  ci-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build

  deploy:
    needs: ci-gate
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Pull, build and reload on the server
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ vars.DEPLOY_HOST }}
          username: ${{ vars.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
          port: ${{ vars.DEPLOY_SSH_PORT || '22' }}
          script_stop: true
          script: |
            set -euo pipefail
            export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:/usr/local/bin:$PATH"
            if [ -f "$HOME/.nvm/nvm.sh" ]; then
              . "$HOME/.nvm/nvm.sh"
            fi
            cd "${{ vars.DEPLOY_PATH }}"
            ./scripts/deploy-vitrine.sh "origin/develop"
```

`DEPLOY_PATH` must be the **staging** checkout. The script's own `BRANCH=develop` and rollback stay in charge.

### 9.5 Deploy to production (new `.github/workflows/deploy-production.yml`)

Same shape, but:

- `on.push.branches: [release]` and `workflow_dispatch`
- `environment: production` (this is what blocks the job until Gilbert approves)
- `cd` to the **live** checkout
- `./scripts/deploy-vitrine.sh "origin/release"`

Prefer a Wednesday window, in step with the app's “live from `release`” line, and do not start a production deploy on a Friday.

Until these workflows are merged to `develop` / `release`, the first staging cut can be a **manual** `./scripts/deploy-vitrine.sh` on the box, the same way app staging is deployed today.

---

## 10. Optional alternative: Vercel previews per PR

Gilbert asked for Vercel PR previews on 13 Nov. The current `ci.yml` already notes that the Vercel GitHub App can be added later without changing the workflow. That is a **complement**, not a replacement, if the requirement is “the same process as the LNA app”.

|                                                        | Mirror LNA (this guide)                                         | Vercel previews                                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| What Pravin looks at                                   | One stable URL, `staging.lnaflow.com`, after merge to `develop` | A unique URL per PR, before merge                                                            |
| Same box, nginx, Node 20 (prod: pm2; staging: systemd) | Yes                                                             | No — Vercel's runtime, CDN, and env UI                                                       |
| Basic auth + nginx noindex                             | Under your control, cannot leak to prod via a code flag         | Must be configured per-project; easy to get a public preview indexed                         |
| `NEXT_PUBLIC_APP_URL`                                  | Pointed at app staging                                          | Must be set on every preview or testers hit **live** `app.lnaflow.com`                       |
| Cost / account                                         | None extra                                                      | A Vercel team, (probably) a paid seat for a private repo, and someone to own the integration |
| Prod                                                   | Stays on the OVH box                                            | Tempting to also ship prod to Vercel — do not, if the point is to match LNA                  |

**Recommendation:** implement this guide for staging and production. If Gilbert still wants pre-merge visual review, add the Vercel GitHub App **for Preview only**, protect those URLs, set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` on the preview environment, and keep production deploys on the OVH box from `release`. Do not do both as production.

---

## 11. Who does what

| Person                                                              | Does                                                                                                                                                                                                                                                                                                                                                                                                                      | Does not                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Gilbert**                                                         | Answers the open questions in §13. Creates DNS. Approves the first server change, in his own words. Creates GitHub Environments and pastes the SSH key / host vars. Is the required reviewer on `production`. Fast-forwards `release`. Signs off the first prod deploy. Renews or adds the GitHub deploy key if fetch fails (he is already doing this for the LNA repo). Shares basic-auth credentials through the vault. | Does not need to write the script; can delegate the first staging cut.                               |
| **Dinesh**                                                          | Opens PRs against `develop`. Lands the deploy script and workflows in a PR. Retargets PR #18 once `develop` exists. Uses staging (with basic auth) to show work.                                                                                                                                                                                                                                                          | No SSH to the box. No prod deploy. No merge to `release`.                                            |
| **Pravin**                                                          | Reviews the work on `https://staging.lnaflow.com` (after DNS + auth). Signs off visually (header, hero, FR/EN, 390/768/1024).                                                                                                                                                                                                                                                                                             | No SSH required. No prod deploy.                                                                     |
| **Whoever has SSH today** (Gilbert, and possibly Jayaraj — confirm) | First-time §6: inspect, clone, `.env`, nginx, certbot, systemd unit for staging (leave prod on pm2), first manual deploy. Closes ufw 3000 only after a separate go.                                                                                                                                                                                                                                                       | Does not restart `lna-backend`, `lna-staging-backend`, or live `lna-vitrine` while standing this up. |

---

## 12. Checklist (after Gilbert's go)

On the box, after the first manual or Actions deploy of `develop`:

- [ ] `systemctl status lna-vitrine-staging` is **active**. `ps` and `ss` show it on `127.0.0.1:3003` (or the next free port if 3003 was taken). The pm2 pid and restart count of `lna-vitrine` are unchanged from the start of the work, as are those of `lna-backend` and `lna-staging-backend`.
- [ ] `ss -ltn` shows `127.0.0.1:3003` (or the chosen port). It is not listed on `0.0.0.0:3003`.
- [ ] `curl -sI http://127.0.0.1:3003/fr` is 200.
- [ ] `curl -sI https://staging.lnaflow.com/fr` is **401** without credentials, and **200** with them.
- [ ] The 200 response includes `X-Robots-Tag: noindex, nofollow, noarchive`.
- [ ] `curl -sI https://lnaflow.com/fr` is still 200, still nginx/1.24, and has **no** new `X-Robots-Tag` and **no** `WWW-Authenticate`.
- [ ] Staging sign-in / register go to `https://staging.lna.manurevasolutions.com/...`, not `app.lnaflow.com`. View-source or a click is enough; if they go to live, the build was done without `NEXT_PUBLIC_APP_URL`.
- [ ] Canonical / OG URLs on staging mention `staging.lnaflow.com`, not `lnaflow.com`.
- [ ] `.env` is still present after the deploy (`ls -l .env` mode 600) and is not in `git ls-files`.
- [ ] A second deploy of an older SHA (or a forced build failure) restores the previous `.next` and leaves staging on 200.
- [ ] Pravin has walked FR and EN at 390 / 768 / 1024 on the real staging URL.
- [ ] Prod is unchanged until Gilbert approves a `release` deploy. The first prod deploy should be a no-op SHA already visually signed off on staging, or a deliberate promotion of that SHA, not a new unreviewed commit.
- [ ] `main` / `develop` / `release` protection is on. PR #18 is retargeted (or already merged to `develop`).

---

## 13. Open questions only Gilbert can answer

These block a safe first cut. The recommendations in brackets are not confirmed.

1. **Confirm the live vitrine cwd and user.** What does `pm2 show lna-vitrine` report as cwd and `exec cwd`? (Recommendation: put staging in a sibling directory, e.g. `~/lna-website-staging`.)
2. **Who has SSH** to that OVH box today, and who is allowed to run the first §6? (Likely Gilbert; possibly Jayaraj. Dinesh and Pravin should not need it.)
3. **Subdomain.** Is `staging.lnaflow.com` the name you want? Who can add the A record in the `lnaflow.com` zone?
4. **Deploy key.** Can the box already `git fetch` `Manureva-Digital-Solutions/lna-website`, or do you need to add a read-only deploy key the way you are doing for the LNA app repo?
5. **Port.** Is **3003** free on loopback (`ss -ltn`)? If not, take the next free port up. Do not use 3000, 3001, or 3002, and do not change prod's 3000.
6. **Branch cut.** Approve creating `develop` and `release` from today's `main` (`33334d9`) and retargeting PR #18 to `develop` before it merges?
7. **Who may merge to `develop`?** Dinesh/Pravin once CI is green, or Gilbert on every PR?
8. **Close ufw 3000** so the live vitrine is only reachable through nginx? This is a live-path change and needs its own sentence of approval.
9. **Vercel.** Do you still want PR previews on top of this, or is `staging.lnaflow.com` after merge to `develop` enough for Pravin?
10. **SMTP / Crisp / GA on staging.** Empty analytics, and a non-customer `CONTACT_INBOX`, unless you say otherwise.

Nothing in this guide is a go to change the server, DNS, or GitHub settings. When you want the first cut, say so in your own words and name who runs it.

---

## As built — 2026-11-17

Verified on the box and in GitHub during implementation. Everything here overrides
a conflicting `[ASSUMED]` value above.

| Item               | As built                                                                                                                                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host               | OVH `137.74.172.61`, user `ubuntu`, key `~/.ssh/lna-ovh` (ops) / `~/.ssh/lna-vitrine-deploy` (CI)                                                                                                                                                                      |
| Live vitrine       | dir `/home/ubuntu/lna-website`, pm2 `lna-vitrine`, port **3000** on `0.0.0.0`, branch `main` @ `bda838b` (older than `origin/main`)                                                                                                                                    |
| Staging vitrine    | dir `/home/ubuntu/lna-website-staging`, branch `develop`, port **3003** on `127.0.0.1` only                                                                                                                                                                            |
| Staging supervisor | systemd `lna-vitrine-staging.service` (enabled, `Restart=on-failure`) — **not** pm2                                                                                                                                                                                    |
| Node               | `/usr/bin/node` **v20.20.2** (system package). There is **no nvm** and no `/usr/local/bin/node` on this box, so the guide's nvm path was wrong: `ExecStart` uses the local binary `/home/ubuntu/lna-website-staging/node_modules/.bin/next start -H 127.0.0.1 -p 3003` |
| Sudoers drop-in    | **not created** — `ubuntu` already has `(ALL) NOPASSWD: ALL` (`sudo -l`), so a drop-in would have added nothing                                                                                                                                                        |
| Ports taken        | 3000 (vitrine prod), 3001 (`lna-backend`), 3002 (`lna-staging-backend`) — 3003 was free                                                                                                                                                                                |
| Box → GitHub       | `git ls-remote` on `lna-website` already worked with the existing deploy key; no new server key was needed                                                                                                                                                             |
| CI key             | new ed25519 `lna-vitrine-deploy`, public half appended to `/home/ubuntu/.ssh/authorized_keys`, private half stored only as the `DEPLOY_SSH_PRIVATE_KEY` secret in the `staging` and `production` GitHub Environments                                                   |
| `.env` on staging  | mode 600, gitignored. `SMTP_*` copied from the live `.env` **on the box** (never through chat); `SMTP_NAME=staging.lnaflow.com` so the relay's EHLO check passes; `CONTACT_INBOX` left as the live inbox; Crisp + GA deliberately unset                                |
| ufw                | unchanged — **3000/tcp still open** (Gilbert: leave it; closing it is a separate approval)                                                                                                                                                                             |
| DNS                | `lnaflow.com` zone is on GoDaddy (`ns23/ns24.domaincontrol.com`), so the `staging` A record is a manual GoDaddy step, not something CI can do                                                                                                                          |
| Branches           | `develop` and `release` created from `33334d9`, `main` untouched; PR #18 retargeted to `develop`                                                                                                                                                                       |
| Environments       | `staging` (branch gate `develop`, auto) and `production` (branch gate `release`, required reviewer Gilbert-G)                                                                                                                                                          |

Verification captured that day: `systemctl status lna-vitrine-staging` active;
`curl 127.0.0.1:3003/fr` → 200 and `/` → 307; `ss -ltn` shows `127.0.0.1:3003`
and **not** `0.0.0.0:3003`; `lna-backend`, `lna-staging-backend` and `lna-vitrine`
kept their original PIDs and restart counts throughout.

The deploy script in this repo is the authority on paths and ports — if the two
disagree, the script wins and this table is stale.

### Operational notes learned on the first cut

- **The first deploy on a fresh checkout cannot come from Actions.** The workflow
  runs `./scripts/deploy-vitrine.sh` on the box, and the script that pulls
  `develop` is itself in `develop`, so the checkout has to reach `develop` once by
  hand (`git fetch origin develop && git reset --hard origin/develop`). After
  that the workflow owns it. The first attempt failed with
  `./scripts/deploy-vitrine.sh: No such file or directory` for exactly this reason.
- **A manual staging run needs `DEPLOY_BASIC_AUTH`.** The post-deploy public
  assertion is a 401 without credentials. The script now says so and exits
  without rolling back — the build is already live and healthy on loopback by
  then. The Action supplies it from the `STAGING_BASIC_AUTH` environment secret.
- **Never rotate the staging password by hand.** The htpasswd
  (`/etc/nginx/.htpasswd-lna-vitrine-staging`) and the `STAGING_BASIC_AUTH`
  secret (environment `staging`) must hold the same credential. If credentials
  are sent and the public URL still answers 401, the deploy fails and rolls back
  with a "basic-auth drift" error (17 Nov: the htpasswd was rotated, the secret
  was not). Rotate both together from a machine with ssh and `gh`:
  `scripts/rotate-staging-basic-auth.sh --dry-run`, then without `--dry-run`.
  It writes the new `user:password` only to a 0600 file
  (default `~/.config/lna/staging-basic-auth.txt`) and prints that path; hand
  the password to testers privately. A 401 with no credentials sent (empty
  secret) still passes, but only with a loud warning.
- **`.next.prev` must stay ignored** (`.gitignore`, `tsconfig` exclude, eslint
  `globalIgnores`, `.prettierignore`). The snapshot lives inside the checkout, so
  an unignored `git add -A` stages the whole previous build and eslint/tsc then
  read Next's generated route types. The script refuses to snapshot if the path is
  not ignored.

### Rollback drill — evidence

Run on the box after the first green deploy, not simulated:

```
HEAD before:       da32557 (last good deploy, loopback 200)
deploy target:     21db1eb — a local-only commit adding a deliberate type error
result:            ✓ Compiled successfully → Failed to compile (TS2322)
                   [deploy] ROLLBACK: next build failed
                   script exit 1
HEAD after:        da32557
service:           active, loopback /fr → 200
.next.prev:        consumed (restored), tree clean
```

The first attempt at this drill was invalid and taught something worth keeping:
it left HEAD _at_ the broken commit, so `PREV_SHA` was the broken SHA and
"rollback" restored only the build, not the source. A rollback only restores both
when HEAD is a good commit at the time of the deploy — which is the real case, but
it means a checkout left on a broken commit needs `git reset --hard origin/develop`
before the next deploy.
