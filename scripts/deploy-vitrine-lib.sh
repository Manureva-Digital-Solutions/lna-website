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
