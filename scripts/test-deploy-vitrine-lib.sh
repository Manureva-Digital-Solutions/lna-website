#!/usr/bin/env bash
# Unit tests for scripts/deploy-vitrine-lib.sh
set -euo pipefail

ROOT="$(cd "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/deploy-vitrine-lib.sh
. "$ROOT/scripts/deploy-vitrine-lib.sh"

fails=0
passes=0

pass() {
  passes=$((passes + 1))
  printf 'ok  %s\n' "$1"
}

fail() {
  fails=$((fails + 1))
  printf 'FAIL  %s\n' "$1" >&2
}

assert_host() {
  local input="$1" expected="$2"
  local got
  got="$(deploy_public_host "$input")"
  if [ "$got" = "$expected" ]; then
    pass "deploy_public_host $(printf %q "$input") -> $expected"
  else
    fail "deploy_public_host $(printf %q "$input"): expected '$expected', got '$got'"
  fi
}

assert_is_prod() {
  local input="$1"
  if is_production_public_url "$input"; then
    pass "is_production_public_url $(printf %q "$input")"
  else
    fail "is_production_public_url $(printf %q "$input") should be production"
  fi
}

assert_not_prod() {
  local input="$1"
  if is_production_public_url "$input"; then
    fail "is_production_public_url $(printf %q "$input") should NOT be production"
  else
    pass "not production: $(printf %q "$input")"
  fi
}

# --- host parsing ---
assert_host "HTTPS://LNAFLOW.COM/FR" "lnaflow.com"
assert_is_prod "HTTPS://LNAFLOW.COM/FR"

assert_host "http://lnaflow.com/fr" "lnaflow.com"
assert_is_prod "http://lnaflow.com/fr"

assert_host "https://www.lnaflow.com:443/fr" "www.lnaflow.com"
assert_is_prod "https://www.lnaflow.com:443/fr"

assert_host "https://lnaflow.com./fr" "lnaflow.com"
assert_is_prod "https://lnaflow.com./fr"

assert_host "https://lnaflow.com/fr?utm=1#top" "lnaflow.com"
assert_is_prod "https://lnaflow.com/fr?utm=1#top"

assert_host "https://staging.lnaflow.com/fr" "staging.lnaflow.com"
assert_not_prod "https://staging.lnaflow.com/fr"

# --- constants parser ---
tmp="$(mktemp -d "${TMPDIR:-/tmp}/vitrine-lib-test.XXXXXX")"
cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT

APP_DIR="default"
BRANCH="default"
cat >"$tmp/allowed" <<'CONST'
# a comment

APP_DIR="/home/ubuntu/lna-website"
BRANCH='release'
CONST
if load_deploy_constants "$tmp/allowed"; then
  if [ "$APP_DIR" = "/home/ubuntu/lna-website" ] && [ "$BRANCH" = "release" ]; then
    pass "allowed key APP_DIR/BRANCH with quotes"
  else
    fail "allowed key: APP_DIR='$APP_DIR' BRANCH='$BRANCH'"
  fi
else
  fail "allowed key: load_deploy_constants exited $? "
fi

APP_DIR="default"
if load_deploy_constants "$tmp/allowed-missing" 2>"$tmp/err-missing"; then
  fail "missing file should fail"
else
  pass "missing file rejected"
fi

cat >"$tmp/unknown" <<'CONST'
APP_DIR="/home/ubuntu/lna-website"
EVIL=1
CONST
if load_deploy_constants "$tmp/unknown" 2>"$tmp/err-unknown"; then
  fail "unknown key should fail"
else
  pass "unknown key rejected"
fi

cat >"$tmp/inject" <<'CONST'
APP_DIR="/tmp/$(whoami)"
CONST
if load_deploy_constants "$tmp/inject" 2>"$tmp/err-inject"; then
  fail "injection \$(...) should fail"
else
  pass "injection \$(...) rejected"
fi

cat >"$tmp/inject-bt" <<'CONST'
APP_DIR=`whoami`
CONST
if load_deploy_constants "$tmp/inject-bt" 2>"$tmp/err-bt"; then
  fail "injection backticks should fail"
else
  pass "injection backticks rejected"
fi

cat >"$tmp/inject-semi" <<'CONST'
APP_DIR="/tmp/x"; PROCESS_MANAGER=pm2
CONST
if load_deploy_constants "$tmp/inject-semi" 2>"$tmp/err-semi"; then
  fail "semicolon should fail"
else
  pass "semicolon rejected"
fi

printf '\n%s\n' "--- $passes passed, $fails failed ---"
[ "$fails" -eq 0 ]
