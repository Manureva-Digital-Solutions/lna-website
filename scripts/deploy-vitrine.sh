#!/usr/bin/env bash
#
# Deploy the LNA vitrine (Next.js) on the OVH box. Runs ON the host.
#
# Staging and production are separate checkouts. Staging is restarted through its
# own systemd unit (lna-vitrine-staging.service); production is still the pm2
# process `lna-vitrine`. Never run this against the wrong APP_DIR. Never
# `pm2 restart all`. Never restart anything except the unit named in PROCESS_UNIT.
#
# Usage:
#   ./scripts/deploy-vitrine.sh                 # tip of $BRANCH
#   ./scripts/deploy-vitrine.sh <git-sha>       # a specific commit
#
# Per-environment constants live in the `--- constants ---` block below (staging
# defaults). Production overrides them with a gitignored .deploy-constants in
# this checkout, because git reset --hard would otherwise restore the staging
# values. Do not pass APP_DIR or BRANCH as flags.
#
set -euo pipefail

# shellcheck source=scripts/deploy-vitrine-lib.sh
. "$(cd "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/deploy-vitrine-lib.sh"

# --- per-environment constants (staging values shown) ---
APP_DIR="/home/ubuntu/lna-website-staging"          # production copy: /home/ubuntu/lna-website
BRANCH="develop"                                    # production copy: release
HEALTH_URL="http://127.0.0.1:3003/fr"               # production copy: http://127.0.0.1:3000/fr
PUBLIC_URL="https://staging.lnaflow.com/fr"         # production copy: https://lnaflow.com/fr
# PROCESS_MANAGER: systemd (staging) or pm2 (production). Never "all".
PROCESS_MANAGER="systemd"                           # production copy: pm2
PROCESS_UNIT="lna-vitrine-staging"                  # production copy: lna-vitrine

# Staging is behind nginx auth_basic; production is not.
# DEPLOY_BASIC_AUTH="user:password" (the staging workflow sends the
# STAGING_BASIC_AUTH secret) makes the public check log in and require 200.
# If those credentials are sent and still get 401, the htpasswd and the secret
# have drifted: the deploy FAILS and rolls back, because testers would be locked
# out. Fix it with scripts/rotate-staging-basic-auth.sh, which updates both.
# PUBLIC_BEHIND_BASIC_AUTH=1 with NO credentials lets a public 401 count as
# reachable, with a loud warning (nothing proved anyone can log in).
# Production (lnaflow.com / www.lnaflow.com) always needs 200; the flag is
# ignored there. Never hardcode the credential here. Never log it.
CURL_AUTH=()
if [ -n "${DEPLOY_BASIC_AUTH:-}" ]; then
  CURL_AUTH=(-u "$DEPLOY_BASIC_AUTH")
fi

# git reset --hard restores the staging defaults above. Production therefore
# keeps overrides in a gitignored .deploy-constants next to this repo root.
# That file is parsed as KEY=VALUE (never sourced or eval'd).
ROOT="$(cd "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
log() { printf '[deploy %s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }
die() { printf '[deploy] FATAL: %s\n' "$*" >&2; exit 1; }

if [ -f "$ROOT/.deploy-constants" ]; then
  load_deploy_constants "$ROOT/.deploy-constants" \
    || die "invalid .deploy-constants"
fi

TARGET_REF="${1:-origin/$BRANCH}"

cd "$APP_DIR" || die "no $APP_DIR"
# Refuse to run if this script lives in a different checkout than APP_DIR.
# That is what happens on production after a reset --hard if .deploy-constants
# is missing: the restored defaults point at the staging directory.
if [ "$(pwd -P)" != "$(cd "$ROOT" && pwd -P)" ]; then
  die "APP_DIR ($APP_DIR) is not this checkout ($ROOT). For production, add a gitignored .deploy-constants in this checkout (see the release notes)."
fi
[ -f .env ] || die ".env missing — refusing to build (NEXT_PUBLIC_* would be baked in wrong)"
if [ -f .deploy-constants ]; then
  git check-ignore -q .deploy-constants \
    || die ".deploy-constants is not gitignored — refusing to run"
fi

if [ -f "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
fi
command -v node >/dev/null || die "node not on PATH"
log "node $(node -v)"

# ── 1. Resolve an immutable SHA ───────────────────────────────────────────────
git fetch origin "$BRANCH" --quiet
TARGET_SHA=$(git rev-parse --verify --quiet "${TARGET_REF}^{commit}") \
  || die "not a valid commit: '$TARGET_REF'"
log "target: $TARGET_SHA (from $TARGET_REF)"

# ── 2. Snapshot the running build for rollback ────────────────────────────────
# `.next.prev` and `.deploy-previous-sha` live inside the checkout, so they MUST be
# gitignored: an unignored 24MB previous build gets staged by `git add -A` and
# type-checked by tsc. The trailing slash matters — git only matches the directory
# form of `.next.prev/` when the directory does not exist yet.
git check-ignore -q .next.prev/ \
  || die ".next.prev/ is not gitignored — refusing to snapshot (see .gitignore)"
git check-ignore -q .deploy-previous-sha \
  || die ".deploy-previous-sha is not gitignored — refusing to snapshot (see .gitignore)"
STAMP=$(date +%Y%m%d%H%M%S)
PREV_SHA=$(git rev-parse HEAD)
if [ -d .next ]; then
  rm -rf .next.prev
  cp -a .next .next.prev
  log "saved previous .next (was $PREV_SHA)"
fi
printf '%s\n' "$PREV_SHA" > .deploy-previous-sha

# Restart only the process this checkout owns. Staging: systemd unit.
# Production: named pm2 process. Never "all".
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
  if git rev-parse --verify --quiet "${PREV_SHA}^{commit}" >/dev/null; then
    git reset --hard "$PREV_SHA" >/dev/null || true
  fi
  reload_app >/dev/null 2>&1 || true
  die "deploy failed and was rolled back toward $PREV_SHA"
}

git reset --hard "$TARGET_SHA" >/dev/null
[ "$(git rev-parse HEAD)" = "$TARGET_SHA" ] || die "HEAD $(git rev-parse HEAD) != target $TARGET_SHA"
[ -f .env ] || die ".env disappeared after reset — is it gitignored?"
log "HEAD now $(git rev-parse --short HEAD)"

# ── 3. Build ──────────────────────────────────────────────────────────────────
log "npm ci + next build"
npm ci --no-audit --no-fund > "/tmp/vitrine-install-$STAMP.log" 2>&1 \
  || { tail -20 "/tmp/vitrine-install-$STAMP.log"; rollback "npm ci failed"; }
npm run build > "/tmp/vitrine-build-$STAMP.log" 2>&1 \
  || { tail -40 "/tmp/vitrine-build-$STAMP.log"; rollback "next build failed"; }
[ -d .next ] || rollback "build produced no .next"

# ── 4. Reload the named process only ──────────────────────────────────────────
if [ "$PROCESS_MANAGER" = systemd ]; then
  systemctl is-active --quiet "$PROCESS_UNIT" \
    || die "systemd unit $PROCESS_UNIT is not active — enable it once by hand (see the staging guide)"
  sudo systemctl restart "$PROCESS_UNIT" 2>&1 | tail -5 \
    || rollback "systemctl restart $PROCESS_UNIT failed"
elif [ "$PROCESS_MANAGER" = pm2 ]; then
  if pm2 describe "$PROCESS_UNIT" >/dev/null 2>&1; then
    pm2 reload "$PROCESS_UNIT" --update-env 2>&1 | tail -5 \
      || rollback "pm2 reload failed"
  else
    die "pm2 process $PROCESS_UNIT is not defined — start it once by hand (see the staging guide)"
  fi
  pm2 save >/dev/null || true
else
  die "PROCESS_MANAGER must be systemd or pm2, not '$PROCESS_MANAGER'"
fi
sleep 5

# ── 5. Verify — prove it, do not assume it ────────────────────────────────────
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || echo 000)
[ "$CODE" = "200" ] || rollback "loopback health returned $CODE for $HEALTH_URL"
log "loopback health: 200"

# Public check (follows redirects). See the constants block for the rules;
# deploy_public_check_decision in deploy-vitrine-lib.sh is the single source.
PUB=$(curl -sI -o /dev/null -w '%{http_code}' "${CURL_AUTH[@]+"${CURL_AUTH[@]}"}" -L "$PUBLIC_URL" || echo 000)
case "$(deploy_public_check_decision "$PUB" "$PUBLIC_URL")" in
  ok)
    log "public health: 200 ($PUBLIC_URL)"
    ;;
  warn-unauthenticated)
    log "WARNING: public URL answered 401 and no credentials were sent (DEPLOY_BASIC_AUTH empty)."
    log "WARNING: treated as reachable because PUBLIC_BEHIND_BASIC_AUTH=1, but nothing checked that testers can log in."
    log "WARNING: set the $STAGING_BASIC_AUTH_SECRET secret so the next deploy proves a 200 through $STAGING_HTPASSWD_FILE."
    printf '::warning title=Staging basic auth not verified::%s returned 401 and no credentials were sent. Set %s.\n' \
      "$PUBLIC_URL" "$STAGING_BASIC_AUTH_SECRET"
    ;;
  fail-rejected-credentials)
    printf '::error title=Staging basic auth drift::%s\n' "$(deploy_basic_auth_drift_hint)"
    log "ERROR: $(deploy_basic_auth_drift_hint)"
    rollback "public URL returned 401 WITH credentials for $PUBLIC_URL (basic-auth drift: $STAGING_HTPASSWD_FILE vs $STAGING_BASIC_AUTH_SECRET)"
    ;;
  fail-production)
    rollback "public URL returned 401 for $PUBLIC_URL — production must answer 200"
    ;;
  stop-needs-flag)
    # Loopback is already 200 and the build is live. Do not roll it back just
    # because a manual run omitted both the flag and the password.
    log "public URL answered 401 — staging is behind basic auth"
    die "build is live and healthy on loopback, but $PUBLIC_URL returned 401. Re-run with DEPLOY_BASIC_AUTH=\"user:password\" (preferred) or PUBLIC_BEHIND_BASIC_AUTH=1"
    ;;
  *)
    rollback "public URL returned $PUB for $PUBLIC_URL"
    ;;
esac

# Confirm the running checkout is still the SHA we intended (no mid-script drift).
[ "$(git rev-parse HEAD)" = "$TARGET_SHA" ] || rollback "HEAD drifted during deploy"
log "DONE — $(git rev-parse --short HEAD)"
