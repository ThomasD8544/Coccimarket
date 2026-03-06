#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${HOME}/.openclaw/pushover.env"
DASH_SCRIPT="/home/ubuntu/.openclaw/workspace/Coccimarket/scripts/health-dashboard.sh"
LOG_FILE="/home/ubuntu/backups/coccimarket/health-dashboard.log"

mkdir -p /home/ubuntu/backups/coccimarket

# shellcheck disable=SC1090
source "$ENV_FILE"
: "${PUSHOVER_USER_KEY:?Missing PUSHOVER_USER_KEY}"
: "${PUSHOVER_APP_TOKEN:?Missing PUSHOVER_APP_TOKEN}"

OUTPUT="$($DASH_SCRIPT 2>&1 | tee -a "$LOG_FILE")"

ERR_COUNT=$(printf '%s\n' "$OUTPUT" | grep -c '^❌' || true)
WARN_COUNT=$(printf '%s\n' "$OUTPUT" | grep -c '^⚠️' || true)

if [[ "$ERR_COUNT" -gt 0 || "$WARN_COUNT" -gt 0 ]]; then
  MSG="Healthcheck Coccimarket: ${ERR_COUNT} erreur(s), ${WARN_COUNT} warning(s). Voir /home/ubuntu/backups/coccimarket/health-dashboard.log"
  curl -sS https://api.pushover.net/1/messages.json \
    --form-string "token=${PUSHOVER_APP_TOKEN}" \
    --form-string "user=${PUSHOVER_USER_KEY}" \
    --form-string "title=Coccimarket health alert" \
    --form-string "message=${MSG}" \
    --form-string "priority=1" >/dev/null
fi

echo "health-dashboard-pushover: done (errors=$ERR_COUNT warnings=$WARN_COUNT)"
