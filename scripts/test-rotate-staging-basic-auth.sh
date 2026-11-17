#!/usr/bin/env bash
# Offline tests for scripts/rotate-staging-basic-auth.sh. ssh, sudo, gh, curl,
# nginx and systemctl are replaced by local stubs; nothing leaves this machine.
# Every password here is generated or fake.
#
# check() evals its single-quoted condition later, on purpose, and the
# variables it reads are only used inside those strings.
# shellcheck disable=SC2016,SC2034
set -euo pipefail

ROOT="$(cd "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT/scripts/rotate-staging-basic-auth.sh"

fails=0
passes=0
pass() { passes=$((passes + 1)); printf 'ok  %s\n' "$1"; }
fail() { fails=$((fails + 1)); printf 'FAIL  %s\n' "$1" >&2; }
check() { if eval "$2"; then pass "$1"; else fail "$1"; fi; }

SANDBOX="$(mktemp -d "${TMPDIR:-/tmp}/rotate-test.XXXXXX")"
trap 'rm -rf "$SANDBOX"' EXIT
BIN="$SANDBOX/bin"
mkdir -p "$BIN"

# ssh: drop options up to user@host, map /etc/nginx into the sandbox, run locally.
# MOCK_SSH_DROP_AFTER_WRITE=1: run the htpasswd write, then fail like a dropped
# connection. MOCK_SSH_FAIL_WRITE=1: fail the write before anything runs.
cat >"$BIN/ssh" <<'STUB'
#!/usr/bin/env bash
while [ "$#" -gt 0 ]; do case "$1" in *@*) shift; break ;; *) shift ;; esac; done
cmd="$*"
cmd="${cmd//\/etc\/nginx\//$SANDBOX/etc/nginx/}"
case "$cmd" in
  *htpasswd-rotate*)
    if [ "${MOCK_SSH_FAIL_WRITE:-0}" = 1 ]; then cat >/dev/null; exit 255; fi
    if [ "${MOCK_SSH_DROP_AFTER_WRITE:-0}" = 1 ]; then bash -c "$cmd"; exit 255; fi
    ;;
esac
exec bash -c "$cmd"
STUB
# sudo: no-op for chown/chmod (owner/mode is a server concern), else run.
cat >"$BIN/sudo" <<'STUB'
#!/usr/bin/env bash
[ "${1-}" = "-n" ] && shift
case "$1" in chown | chmod) exit 0 ;; esac
exec "$@"
STUB
# nginx / systemctl must never be called; record any call.
cat >"$BIN/nginx" <<'STUB'
#!/usr/bin/env bash
printf 'nginx %s\n' "$*" >>"$SANDBOX/forbidden.log"
STUB
cat >"$BIN/systemctl" <<'STUB'
#!/usr/bin/env bash
printf 'systemctl %s\n' "$*" >>"$SANDBOX/forbidden.log"
STUB
cat >"$BIN/gh" <<'STUB'
#!/usr/bin/env bash
case "$1 $2" in
  "auth status") exit 0 ;;
  "secret list") exit 0 ;;
  "secret set")
    [ "${MOCK_GH_FAIL:-0}" = 1 ] && { cat >/dev/null; exit 1; }
    printf '%s\n' "$*" >"$SANDBOX/gh-args"
    cat >"$SANDBOX/secret"
    ;;
  *) exit 2 ;;
esac
STUB
# curl: 200 only when the -K credentials match the htpasswd line, else 401.
cat >"$BIN/curl" <<'STUB'
#!/usr/bin/env bash
creds=""
for a in "$@"; do
  if [ "$a" = "-K" ]; then
    line="$(cat)"; creds="${line#user = \"}"; creds="${creds%\"}"
  fi
done
code=401
if [ -n "$creds" ]; then
  u="${creds%%:*}"; p="${creds#*:}"
  stored="$(awk -F: -v u="$u" '$1 == u { print $2 }' "$SANDBOX/etc/nginx/.htpasswd-lna-vitrine-staging")"
  salt="$(printf '%s' "$stored" | cut -d'$' -f3)"
  [ -n "$salt" ] && [ "$(printf '%s\n' "$p" | openssl passwd -apr1 -salt "$salt" -stdin)" = "$stored" ] && code=200
fi
printf '%s' "$code"
STUB
chmod +x "$BIN"/*

reset_server() {
  rm -rf "${SANDBOX:?}/etc" "${SANDBOX:?}/home" "$SANDBOX/secret" "$SANDBOX/gh-args" "$SANDBOX/forbidden.log"
  mkdir -p "$SANDBOX/etc/nginx" "$SANDBOX/home/.ssh"
  : >"$SANDBOX/home/.ssh/lna-ovh"
  # Hashes of throwaway values, only so the file has realistic lines.
  printf 'other:%s\nlna:%s\n' \
    "$(printf 'x1\n' | openssl passwd -apr1 -stdin)" \
    "$(printf 'x2\n' | openssl passwd -apr1 -stdin)" \
    >"$SANDBOX/etc/nginx/.htpasswd-lna-vitrine-staging"
  cp "$SANDBOX/etc/nginx/.htpasswd-lna-vitrine-staging" "$SANDBOX/original"
}

HT="$SANDBOX/etc/nginx/.htpasswd-lna-vitrine-staging"
OUT_DEFAULT="$SANDBOX/home/.config/lna/staging-basic-auth.txt"
run() {
  env -i PATH="$BIN:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin" \
    HOME="$SANDBOX/home" SANDBOX="$SANDBOX" TMPDIR="$SANDBOX" \
    MOCK_GH_FAIL="${MOCK_GH_FAIL:-0}" MOCK_SSH_DROP_AFTER_WRITE="${MOCK_SSH_DROP_AFTER_WRITE:-0}" \
    MOCK_SSH_FAIL_WRITE="${MOCK_SSH_FAIL_WRITE:-0}" \
    bash "$SCRIPT" "$@"
}

# 1. Happy path
reset_server
rc=0; run >"$SANDBOX/stdout" 2>"$SANDBOX/stderr" || rc=$?
check "happy path exits 0" '[ "$rc" = 0 ]'
check "stdout is only the output path" '[ "$(cat "$SANDBOX/stdout")" = "$OUT_DEFAULT" ]'
check "output file is mode 600" '[ "$(stat -c %a "$OUT_DEFAULT" 2>/dev/null || stat -f %Lp "$OUT_DEFAULT")" = 600 ]'
check "secret equals output file" '[ "$(cat "$SANDBOX/secret")" = "$(cat "$OUT_DEFAULT")" ]'
check "secret set on environment staging" 'grep -q -- "--env staging" "$SANDBOX/gh-args" && grep -q "STAGING_BASIC_AUTH" "$SANDBOX/gh-args"'
pw="$(cut -d: -f2- "$OUT_DEFAULT")"
check "password is 32 characters" '[ "${#pw}" = 32 ]'
check "password not in stdout or stderr" '! grep -qF -- "$pw" "$SANDBOX/stdout" "$SANDBOX/stderr"'
check "other htpasswd users kept" 'grep -q "^other:" "$HT" && [ "$(grep "^other:" "$HT")" = "$(grep "^other:" "$SANDBOX/original")" ]'
check "lna line replaced, exactly one" '[ "$(grep -c "^lna:" "$HT")" = 1 ] && [ "$(grep "^lna:" "$HT")" != "$(grep "^lna:" "$SANDBOX/original")" ]'
check "timestamped backup equals original" 'cmp -s "$(ls "$HT".bak-* | head -1)" "$SANDBOX/original"'
check "nginx and systemctl never called" '[ ! -e "$SANDBOX/forbidden.log" ]'
check "no .new file left" '[ ! -e "$OUT_DEFAULT.new" ]'

# 2. A second run keeps the previous credential file as .prev
rc=0; run >/dev/null 2>&1 || rc=$?
check "second run exits 0 and keeps .prev" '[ "$rc" = 0 ] && [ -f "$OUT_DEFAULT.prev" ]'

# 3. gh fails after the htpasswd mv -> restored from backup, new password kept
reset_server
rc=0; MOCK_GH_FAIL=1 run >/dev/null 2>"$SANDBOX/stderr" || rc=$?
check "gh failure exits non-zero" '[ "$rc" != 0 ]'
check "gh failure restores htpasswd from the backup" 'cmp -s "$HT" "$SANDBOX/original" && cmp -s "$(ls "$HT".bak-* | head -1)" "$SANDBOX/original"'
check "gh failure keeps the new-password file (0600), no promoted file" '[ -s "$OUT_DEFAULT.new" ] && [ "$(stat -c %a "$OUT_DEFAULT.new" 2>/dev/null || stat -f %Lp "$OUT_DEFAULT.new")" = 600 ] && [ ! -e "$OUT_DEFAULT" ]'
check "gh failure message says restored" 'grep -q "htpasswd restored from" "$SANDBOX/stderr"'
check "gh failure never calls nginx/systemctl" '[ ! -e "$SANDBOX/forbidden.log" ]'

# 4. ssh drops right after the mv -> restored from backup, new password kept,
#    secret never set
reset_server
rc=0; MOCK_SSH_DROP_AFTER_WRITE=1 run >/dev/null 2>"$SANDBOX/stderr" || rc=$?
check "post-mv ssh failure exits non-zero" '[ "$rc" != 0 ]'
check "post-mv ssh failure restores htpasswd from the backup" 'cmp -s "$HT" "$SANDBOX/original" && ls "$HT".bak-* >/dev/null 2>&1'
check "post-mv ssh failure keeps the new-password file" '[ -s "$OUT_DEFAULT.new" ] && [ ! -e "$OUT_DEFAULT" ]'
check "post-mv ssh failure never sets the secret" '[ ! -e "$SANDBOX/secret" ]'
check "post-mv ssh failure message says restored" 'grep -q "htpasswd restored from" "$SANDBOX/stderr"'

# 4b. write fails before anything ran -> no backup, file untouched, honest message
reset_server
rc=0; MOCK_SSH_FAIL_WRITE=1 run >/dev/null 2>"$SANDBOX/stderr" || rc=$?
check "pre-write failure exits non-zero, htpasswd untouched" '[ "$rc" != 0 ] && cmp -s "$HT" "$SANDBOX/original"'
check "pre-write failure says no backup was taken, keeps new-password file" 'grep -q "No backup was taken" "$SANDBOX/stderr" && [ -s "$OUT_DEFAULT.new" ]'
check "pre-write failure never sets the secret" '[ ! -e "$SANDBOX/secret" ]'

# 5. Dry run changes nothing
reset_server
rc=0; run --dry-run >/dev/null 2>&1 || rc=$?
check "dry run exits 0" '[ "$rc" = 0 ]'
check "dry run leaves htpasswd, secret and local file untouched" 'cmp -s "$HT" "$SANDBOX/original" && [ ! -e "$SANDBOX/secret" ] && [ ! -e "$OUT_DEFAULT" ]'

# 6. --password-stdin
reset_server
chosen="Fake-test-only-$(openssl rand -hex 8)"
rc=0; printf '%s\n' "$chosen" | run --password-stdin --out "$SANDBOX/home/chosen.txt" >/dev/null 2>&1 || rc=$?
check "password-stdin is used" '[ "$rc" = 0 ] && [ "$(cat "$SANDBOX/home/chosen.txt")" = "lna:$chosen" ]'
reset_server
rc=0; printf 'bad"quote-1234567890\n' | run --password-stdin >/dev/null 2>&1 || rc=$?
check "password with a quote is refused before any change" '[ "$rc" != 0 ] && cmp -s "$HT" "$SANDBOX/original"'
rc=0; printf 'short\n' | run --password-stdin >/dev/null 2>&1 || rc=$?
check "short password is refused" '[ "$rc" != 0 ] && cmp -s "$HT" "$SANDBOX/original"'

printf '\n%s\n' "--- $passes passed, $fails failed ---"
[ "$fails" -eq 0 ]
