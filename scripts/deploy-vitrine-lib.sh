#!/usr/bin/env bash
# Helpers for scripts/deploy-vitrine.sh. Safe to source from tests.
# Do not source user-controlled files from here.

deploy_trim() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

# Print the hostname of a URL: lowercase, strip scheme, userinfo, port, path,
# query, fragment and any trailing dot. Accepts http and https. No output on
# an empty result besides an empty string.
deploy_public_host() {
  local url="$1"
  local authority port maybe_host

  url="$(printf '%s' "$url" | tr '[:upper:]' '[:lower:]')"
  case "$url" in
    http://*) url="${url#http://}" ;;
    https://*) url="${url#https://}" ;;
  esac

  authority="$url"
  authority="${authority%%/*}"
  authority="${authority%%\?*}"
  authority="${authority%%#*}"

  case "$authority" in
    *@*) authority="${authority##*@}" ;;
  esac

  maybe_host="${authority%:*}"
  port="${authority##*:}"
  if [ "$maybe_host" != "$authority" ] && [ -n "$port" ] && [ "$port" -eq "$port" ] 2>/dev/null; then
    authority="$maybe_host"
  fi

  while [ "${authority%.}" != "$authority" ]; do
    authority="${authority%.}"
  done

  printf '%s' "$authority"
}

# Return 0 if the URL (or $1 / $PUBLIC_URL) is exactly the live site host
# lnaflow.com or www.lnaflow.com after deploy_public_host normalisation.
is_production_public_url() {
  local host
  host="$(deploy_public_host "${1-$PUBLIC_URL}")"
  case "$host" in
    lnaflow.com | www.lnaflow.com) return 0 ;;
    *) return 1 ;;
  esac
}

# The nginx file and the GitHub secret that must always hold the same staging
# basic-auth credential. scripts/rotate-staging-basic-auth.sh updates both.
STAGING_HTPASSWD_FILE="/etc/nginx/.htpasswd-lna-vitrine-staging"
STAGING_BASIC_AUTH_SECRET="STAGING_BASIC_AUTH"

# Decide what a public HTTP status means after a deploy. Prints one token:
#   ok                 200
#   warn-unauthenticated  401, staging, PUBLIC_BEHIND_BASIC_AUTH=1 and no
#                      credentials sent: reachable, but nothing proved that
#                      testers can log in. Deploy passes with a loud warning.
#   fail-rejected-credentials  401 although DEPLOY_BASIC_AUTH was sent: the
#                      htpasswd and the secret have drifted. Roll back.
#   fail-production    401 on lnaflow.com / www.lnaflow.com. Production must
#                      answer 200. Roll back.
#   stop-needs-flag    401, staging, no flag and no credentials (a manual run).
#                      Stop without rolling back; the build is live on loopback.
#   fail               anything else. Roll back.
# Arguments: $1 status code, $2 public URL (default $PUBLIC_URL). Reads
# PUBLIC_BEHIND_BASIC_AUTH and DEPLOY_BASIC_AUTH from the environment.
deploy_public_check_decision() {
  local code="$1" url="${2-${PUBLIC_URL-}}"

  if [ "$code" = "200" ]; then
    printf 'ok'
    return 0
  fi
  if [ "$code" != "401" ]; then
    printf 'fail'
    return 0
  fi
  if is_production_public_url "$url"; then
    printf 'fail-production'
  elif [ -n "${DEPLOY_BASIC_AUTH:-}" ]; then
    printf 'fail-rejected-credentials'
  elif [ "${PUBLIC_BEHIND_BASIC_AUTH:-0}" = "1" ]; then
    printf 'warn-unauthenticated'
  else
    printf 'stop-needs-flag'
  fi
}

# One-line explanation of a credential drift, for logs. Never includes the
# credential itself.
deploy_basic_auth_drift_hint() {
  printf '%s rejected the credentials in %s. The nginx file and the GitHub environment secret have drifted (one was rotated without the other). Rotate both together with scripts/rotate-staging-basic-auth.sh.' \
    "$STAGING_HTPASSWD_FILE" "$STAGING_BASIC_AUTH_SECRET"
}

# Parse a .deploy-constants file as plain KEY=VALUE lines. Never source or eval.
# Allowed keys only. Unknown keys, or lines containing $(, backticks or ;, fail
# with a message on stderr and exit status 1. Successful assignments are made
# in the caller (this function must be invoked, not run in a subshell, if the
# caller wants the values).
load_deploy_constants() {
  local file="$1"
  local line key value

  if [ ! -f "$file" ]; then
    printf 'load_deploy_constants: no such file: %s\n' "$file" >&2
    return 1
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    line="$(deploy_trim "$line")"
    [ -z "$line" ] && continue
    case "$line" in
      \#*) continue ;;
    esac

    # Match the literal characters $(, backtick and ; — do not expand.
    # shellcheck disable=SC2016
    case "$line" in
      *'$('* | *'`'* | *';'*)
        printf 'load_deploy_constants: unsafe line in %s\n' "$file" >&2
        return 1
        ;;
    esac

    case "$line" in
      *=*) ;;
      *)
        printf 'load_deploy_constants: not KEY=VALUE in %s\n' "$file" >&2
        return 1
        ;;
    esac

    key="$(deploy_trim "${line%%=*}")"
    value="$(deploy_trim "${line#*=}")"
    case "$value" in
      \"*\")
        value="${value#\"}"
        value="${value%\"}"
        ;;
      \'*\')
        value="${value#\'}"
        value="${value%\'}"
        ;;
    esac

    # Assignments are for the caller; this file is sourced.
    # shellcheck disable=SC2034
    case "$key" in
      APP_DIR) APP_DIR="$value" ;;
      BRANCH) BRANCH="$value" ;;
      HEALTH_URL) HEALTH_URL="$value" ;;
      PUBLIC_URL) PUBLIC_URL="$value" ;;
      PROCESS_MANAGER) PROCESS_MANAGER="$value" ;;
      PROCESS_UNIT) PROCESS_UNIT="$value" ;;
      *)
        printf 'load_deploy_constants: unknown key %s in %s\n' "$key" "$file" >&2
        return 1
        ;;
    esac
  done <"$file"
}
