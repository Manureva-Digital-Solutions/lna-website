#!/usr/bin/env bash
#
# Rotate the staging.lnaflow.com basic-auth credential in BOTH places at once:
#   1. the nginx file /etc/nginx/.htpasswd-lna-vitrine-staging on the server
#   2. the GitHub environment secret STAGING_BASIC_AUTH (environment: staging),
#      which deploy-staging.yml passes to deploy-vitrine.sh as DEPLOY_BASIC_AUTH
# If only one of them changes, the next staging deploy gets a 401 with
# credentials and rolls back. This script keeps them in step.
#
# Run by an operator on a machine with ssh access to the server (sudo there)
# and an authenticated `gh` that can set environment secrets on the repo.
# Works with macOS /bin/bash 3.2.
#
# The password is never printed, logged or passed on a command line. It is
# written only to a 0600 file (default ~/.config/lna/staging-basic-auth.txt,
# as "user:password"); the script prints that path.
#
# Usage:
#   scripts/rotate-staging-basic-auth.sh [options]
#   scripts/rotate-staging-basic-auth.sh --password-stdin < file   # chosen password
#
# Options:
#   --dry-run             check access and print the plan; change nothing
#   --password-stdin      read the new password from stdin (first line) instead
#                         of generating one
#   --user NAME           basic-auth user name (default: lna)
#   --out PATH            where to write user:password (default above)
#   --ssh-host USER@HOST  server (default: ubuntu@137.74.172.61)
#   --ssh-key PATH        ssh key (default: ~/.ssh/lna-ovh)
#   --htpasswd PATH       htpasswd on the server
#                         (default: /etc/nginx/.htpasswd-lna-vitrine-staging)
#   --repo OWNER/NAME     (default: Manureva-Digital-Solutions/lna-website)
#   --env NAME            GitHub environment (default: staging)
#   --secret NAME         (default: STAGING_BASIC_AUTH)
#   --url URL             public URL to verify (default: https://staging.lnaflow.com/fr)
#
# After a successful run, hand the password from the --out file to testers
# through a private channel, never a shared one.
set -euo pipefail

BA_USER="lna"
OUT="${HOME}/.config/lna/staging-basic-auth.txt"
SSH_HOST="ubuntu@137.74.172.61"
SSH_KEY="${HOME}/.ssh/lna-ovh"
HTPASSWD="/etc/nginx/.htpasswd-lna-vitrine-staging"
REPO="Manureva-Digital-Solutions/lna-website"
GH_ENV="staging"
SECRET="STAGING_BASIC_AUTH"
URL="https://staging.lnaflow.com/fr"
DRY_RUN=0
PASSWORD_STDIN=0

log() { printf '[rotate] %s\n' "$*" >&2; }
die() { printf '[rotate] FATAL: %s\n' "$*" >&2; exit 1; }
usage() { sed -n '2,/^set -euo/p' "$0" | sed -e '/^set -euo/d' -e 's/^# \{0,1\}//'; }

need_arg() { [ "$#" -ge 2 ] && [ -n "$2" ] || die "$1 needs a value"; }
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1 ;;
    --password-stdin) PASSWORD_STDIN=1 ;;
    --user) need_arg "$@"; BA_USER="$2"; shift ;;
    --out) need_arg "$@"; OUT="$2"; shift ;;
    --ssh-host) need_arg "$@"; SSH_HOST="$2"; shift ;;
    --ssh-key) need_arg "$@"; SSH_KEY="$2"; shift ;;
    --htpasswd) need_arg "$@"; HTPASSWD="$2"; shift ;;
    --repo) need_arg "$@"; REPO="$2"; shift ;;
    --env) need_arg "$@"; GH_ENV="$2"; shift ;;
    --secret) need_arg "$@"; SECRET="$2"; shift ;;
    --url) need_arg "$@"; URL="$2"; shift ;;
    -h | --help) usage; exit 0 ;;
    *) die "unknown option: $1 (see --help)" ;;
  esac
  shift
done

case "$BA_USER" in
  "" | *:* | *[!A-Za-z0-9._-]*) die "--user must be letters, digits, . _ - only" ;;
esac
case "$HTPASSWD" in
  /etc/nginx/*) ;;
  *) die "--htpasswd must be under /etc/nginx/" ;;
esac
case "$OUT" in
  /*) ;;
  *) die "--out must be an absolute path" ;;
esac

for cmd in ssh gh curl openssl; do
  command -v "$cmd" >/dev/null || die "$cmd not found on PATH"
done
[ -r "$SSH_KEY" ] || die "ssh key not readable: $SSH_KEY"

SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15)
# Remote commands are built here with printf %q on purpose (client-side expansion).
# shellcheck disable=SC2029
remote() { ssh "${SSH_OPTS[@]}" "$SSH_HOST" "$@"; }
q() { printf '%q' "$1"; }

# HTTP status of URL, optionally with credentials read from a curl config on
# stdin (so the password never appears in the process list).
http_status() {
  local url="$1" with_auth="$2"
  if [ "$with_auth" = 1 ]; then
    curl -s -L -o /dev/null -w '%{http_code}' -K - "$url" || true
  else
    curl -s -L -o /dev/null -w '%{http_code}' "$url" </dev/null || true
  fi
}

# ── Preflight (read-only) ─────────────────────────────────────────────────────
log "server: $SSH_HOST  htpasswd: $HTPASSWD"
log "github: $REPO  environment: $GH_ENV  secret: $SECRET"
log "verify: $URL  output file: $OUT"

remote "sudo -n test -f $(q "$HTPASSWD")" \
  || die "preflight failed: no $HTPASSWD or no passwordless sudo on $SSH_HOST"
gh auth status >/dev/null 2>&1 || die "gh is not authenticated (run gh auth login)"
gh secret list -R "$REPO" --env "$GH_ENV" >/dev/null \
  || die "cannot list secrets of environment '$GH_ENV' on $REPO (scope or permission)"
log "preflight ok"

if [ "$DRY_RUN" = 1 ]; then
  log "dry run: would write $BA_USER's line in $HTPASSWD (timestamped backup, atomic mv; no nginx reload),"
  log "dry run: then gh secret set $SECRET --env $GH_ENV -R $REPO, then check 200 with and 401 without."
  exit 0
fi

# ── New password ──────────────────────────────────────────────────────────────
PASSWORD=""
if [ "$PASSWORD_STDIN" = 1 ]; then
  IFS= read -r PASSWORD || [ -n "$PASSWORD" ] || die "no password on stdin"
else
  PASSWORD="$(openssl rand -base64 48 | LC_ALL=C tr -dc 'A-Za-z0-9' | cut -c1-32)"
fi
# Restrict the alphabet so it is safe in a curl config and the user:password
# secret, and long enough to matter.
case "$PASSWORD" in
  *[!A-Za-z0-9._~+/=-]*) die "password may only use A-Z a-z 0-9 . _ ~ + / = -" ;;
esac
[ "${#PASSWORD}" -ge 16 ] || die "password must be at least 16 characters"

HASH="$(printf '%s\n' "$PASSWORD" | openssl passwd -apr1 -stdin)"
# Literal "$apr1$" prefix, not an expansion.
# shellcheck disable=SC2016
case "$HASH" in
  '$apr1$'*) ;;
  *) die "openssl did not produce an apr1 hash" ;;
esac

# Write the credential locally first, so it is never lost mid-run.
umask 077
mkdir -p "$(dirname "$OUT")"
NEW_OUT="$OUT.new"
printf '%s:%s\n' "$BA_USER" "$PASSWORD" >"$NEW_OUT"
chmod 600 "$NEW_OUT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="$HTPASSWD.bak-$STAMP"

# ── 1. htpasswd on the server ─────────────────────────────────────────────────
# Keep every other user's line, replace (or add) ours, write to a temp file in
# the same directory, copy owner/mode, back up, then atomic mv. The hash travels
# on stdin, never on a command line.
# No nginx -t and no reload: nginx re-reads auth_basic_user_file on every
# request, and a reload on this shared box could also apply unrelated pending
# config to production.
REMOTE_WRITE="set -euo pipefail
f=$(q "$HTPASSWD"); u=$(q "$BA_USER"); bak=$(q "$BACKUP")
tmp=\$(sudo -n mktemp \"\$(dirname \"\$f\")/.htpasswd-rotate.XXXXXX\")
trap 'sudo -n rm -f \"\$tmp\"' EXIT
{ sudo -n awk -F: -v u=\"\$u\" '\$1 != u' \"\$f\"; printf '%s:' \"\$u\"; cat; } | sudo -n tee \"\$tmp\" >/dev/null
sudo -n chown --reference=\"\$f\" \"\$tmp\"
sudo -n chmod --reference=\"\$f\" \"\$tmp\"
sudo -n cp -p \"\$f\" \"\$bak\"
sudo -n mv -f \"\$tmp\" \"\$f\""

# Put the backup back (atomically) if one was taken. Prints "restored" or
# "no-backup" (the write failed before the backup, so the file never changed).
REMOTE_RESTORE="set -euo pipefail
f=$(q "$HTPASSWD"); bak=$(q "$BACKUP")
if ! sudo -n test -f \"\$bak\"; then echo no-backup; exit 0; fi
tmp=\$(sudo -n mktemp \"\$(dirname \"\$f\")/.htpasswd-restore.XXXXXX\")
trap 'sudo -n rm -f \"\$tmp\"' EXIT
sudo -n cp -p \"\$bak\" \"\$tmp\"
sudo -n mv -f \"\$tmp\" \"\$f\"
sudo -n cmp -s \"\$bak\" \"\$f\"
echo restored"

# Any failure once the htpasswd may have been replaced: restore from the
# backup, and keep $NEW_OUT (never delete it, never claim more than we know).
restore_or_die() {
  local why="$1" result
  log "$why — restoring $HTPASSWD from $BACKUP so the pair does not drift"
  if result="$(remote "bash -c $(q "$REMOTE_RESTORE")")"; then
    case "$result" in
      restored)
        die "$why. htpasswd restored from $BACKUP; the old credential is valid again. The unused new password is kept in $NEW_OUT (delete it once checked)."
        ;;
      no-backup)
        die "$why. No backup was taken, so the htpasswd was never replaced. The unused new password is kept in $NEW_OUT (delete it once checked)."
        ;;
    esac
  fi
  die "$why AND the restore failed or could not be confirmed. Server state is UNKNOWN: check $HTPASSWD against $BACKUP on $SSH_HOST by hand. The new password is in $NEW_OUT."
}

log "writing new htpasswd line on $SSH_HOST (backup: $BACKUP)"
if ! printf '%s\n' "$HASH" | remote "bash -c $(q "$REMOTE_WRITE")"; then
  # ssh can fail after the mv (e.g. the connection drops), so do not assume
  # the file is unchanged.
  restore_or_die "htpasswd update failed or was cut off; $SECRET was not touched"
fi
HASH=""

# ── 2. GitHub environment secret ──────────────────────────────────────────────
log "setting $SECRET in environment $GH_ENV on $REPO"
if ! printf '%s:%s' "$BA_USER" "$PASSWORD" | gh secret set "$SECRET" -R "$REPO" --env "$GH_ENV" >/dev/null; then
  restore_or_die "gh secret set failed; $SECRET not updated"
fi

# The pair is now consistent; promote the local file.
if [ -f "$OUT" ]; then
  mv -f "$OUT" "$OUT.prev"
fi
mv -f "$NEW_OUT" "$OUT"
chmod 600 "$OUT"

# ── 3. Verify ─────────────────────────────────────────────────────────────────
sleep 2
WITH="$(printf 'user = "%s:%s"\n' "$BA_USER" "$PASSWORD" | http_status "$URL" 1)"
WITHOUT="$(http_status "$URL" 0)"
PASSWORD=""
log "public check: with credentials $WITH, without $WITHOUT"
if [ "$WITH" != "200" ] || [ "$WITHOUT" != "401" ]; then
  die "verification failed (expected 200 / 401). htpasswd and $SECRET were both updated; check the vhost and the app. Credential: $OUT; previous htpasswd: $BACKUP"
fi

log "done: htpasswd and $SECRET now hold the same credential (backup on server: $BACKUP)"
printf '%s\n' "$OUT"
