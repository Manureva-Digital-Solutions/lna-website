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
# Per-environment constants live in the `--- constants ---` block below and in the
# per-environment comments beside them. Edit them per checkout; do not pass them
# as flags, so a mis-typed deploy cannot silently target the other environment.
#
set -euo pipefail

# --- per-environment constants (staging values shown) ---
APP_DIR="/home/ubuntu/lna-website-staging"          # production copy: /home/ubuntu/lna-website
BRANCH="develop"                                    # production copy: release
HEALTH_URL="http://127.0.0.1:3003/fr"               # production copy: http://127.0.0.1:3000/fr
PUBLIC_URL="https://staging.lnaflow.com/fr"         # production copy: https://lnaflow.com/fr
# PROCESS_MANAGER: systemd (staging) or pm2 (production). Never "all".
PROCESS_MANAGER="systemd"                           # production copy: pm2
PROCESS_UNIT="lna-vitrine-staging"                  # production copy: lna-vitrine

# If PUBLIC_URL is behind basic auth, export DEPLOY_BASIC_AUTH="user:password"
# in the environment of the person (or Action) running the script. Never hardcode
# it here. The loopback health check does not need it. A manual staging run without
# it exits with a clear message AFTER the build is already live — it does not roll
# back a healthy deploy.
CURL_AUTH=()
if [ -n "${DEPLOY_BASIC_AUTH:-}" ]; then
  CURL_AUTH=(-u "$DEPLOY_BASIC_AUTH")
fi

TARGET_REF="${1:-origin/$BRANCH}"

log() { printf '[deploy %s] %s\n' "$(date -u +%H:%M:%SZ)" "$*"; }
die() { printf '[deploy] FATAL: %s\n' "$*" >&2; exit 1; }

cd "$APP_DIR" || die "no $APP_DIR"
[ -f .env ] || die ".env missing — refusing to build (NEXT_PUBLIC_* would be baked in wrong)"

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

# Public check (follows redirects). Supply DEPLOY_BASIC_AUTH for staging basic auth.
PUB=$(curl -sI -o /dev/null -w '%{http_code}' "${CURL_AUTH[@]+"${CURL_AUTH[@]}"}" -L "$PUBLIC_URL" || echo 000)
if [ "$PUB" != "200" ]; then
  if [ "$PUB" = "401" ] && [ -z "${DEPLOY_BASIC_AUTH:-}" ]; then
    # The build is already health-checked on loopback and is live. Rolling it back
    # because the operator forgot the password would take a good deploy offline.
    log "public URL answered 401 — staging is behind basic auth"
    die "build is live and healthy on loopback, but $PUBLIC_URL cannot be asserted without credentials. Re-run with DEPLOY_BASIC_AUTH=\"user:password\""
  fi
  rollback "public URL returned $PUB for $PUBLIC_URL"
fi
log "public health: 200 ($PUBLIC_URL)"

# Confirm the running checkout is still the SHA we intended (no mid-script drift).
[ "$(git rev-parse HEAD)" = "$TARGET_SHA" ] || rollback "HEAD drifted during deploy"
log "DONE — $(git rev-parse --short HEAD), health 200"
