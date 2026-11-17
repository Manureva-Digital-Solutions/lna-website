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

# --- public check decision ---
# Fake value only; never a real credential.
FAKE_CREDS="qa-user:not-a-real-password"

assert_decision() {
  local label="$1" expected="$2" code="$3" url="$4" flag="$5" creds="$6"
  local got
  got="$(PUBLIC_BEHIND_BASIC_AUTH="$flag" DEPLOY_BASIC_AUTH="$creds" deploy_public_check_decision "$code" "$url")"
  if [ "$got" = "$expected" ]; then
    pass "decision: $label -> $expected"
  else
    fail "decision: $label: expected '$expected', got '$got'"
  fi
}

STG="https://staging.lnaflow.com/fr"
PROD="https://lnaflow.com/fr"
assert_decision "staging 200 with creds" ok 200 "$STG" 1 "$FAKE_CREDS"
assert_decision "staging no creds + 401 (flag=1) is reachable with warning" warn-unauthenticated 401 "$STG" 1 ""
assert_decision "staging creds + 401 (flag=1) fails" fail-rejected-credentials 401 "$STG" 1 "$FAKE_CREDS"
assert_decision "staging creds + 401 (no flag) fails" fail-rejected-credentials 401 "$STG" 0 "$FAKE_CREDS"
assert_decision "staging no creds + 401 (no flag) stops" stop-needs-flag 401 "$STG" 0 ""
assert_decision "prod + 401 (flag=1, no creds) fails" fail-production 401 "$PROD" 1 ""
assert_decision "prod + 401 (creds) fails" fail-production 401 "https://WWW.LNAFLOW.COM:443/fr" 0 "$FAKE_CREDS"
assert_decision "prod 200" ok 200 "$PROD" 0 ""
assert_decision "staging 502" fail 502 "$STG" 1 ""
assert_decision "staging 000 (no answer)" fail 000 "$STG" 1 "$FAKE_CREDS"

hint="$(deploy_basic_auth_drift_hint)"
case "$hint" in
  *"/etc/nginx/.htpasswd-lna-vitrine-staging"*"STAGING_BASIC_AUTH"*"rotate-staging-basic-auth.sh"*)
    pass "drift hint names htpasswd file, secret and rotation script" ;;
  *) fail "drift hint missing names: $hint" ;;
esac
case "$(DEPLOY_BASIC_AUTH="$FAKE_CREDS" deploy_basic_auth_drift_hint)" in
  *not-a-real-password*) fail "drift hint leaks the credential" ;;
  *) pass "drift hint does not include the credential" ;;
esac

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
