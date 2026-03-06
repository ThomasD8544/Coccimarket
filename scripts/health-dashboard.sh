#!/usr/bin/env bash
set -euo pipefail

ok() { echo "✅ $*"; }
warn() { echo "⚠️  $*"; }
err() { echo "❌ $*"; }

check_http() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -k -sS -o /dev/null -w '%{http_code}' --max-time 10 "$url" || true)
  if [[ "$code" == "200" || "$code" == "307" || "$code" == "308" ]]; then
    ok "$name HTTP $code ($url)"
  else
    err "$name HTTP $code ($url)"
  fi
}

echo "=== Coccimarket Health Dashboard ==="
echo "Time (UTC): $(date -u '+%Y-%m-%d %H:%M:%S')"
echo

echo "[1/6] Docker services"
if sudo docker ps --format '{{.Names}} {{.Status}}' | grep -q 'coccimarket-app-1'; then
  ok "prod app container up"
else
  err "prod app container missing"
fi

if sudo docker ps --format '{{.Names}} {{.Status}}' | grep -q 'coccimarket_staging-app-1'; then
  ok "staging app container up"
else
  err "staging app container missing"
fi

echo

echo "[2/6] Web endpoints"
check_http "Prod login" "https://coccimarket-dlc.duckdns.org/login"
check_http "Staging login" "https://coccimarket-staging.duckdns.org/login"

echo

echo "[3/6] Databases (container level)"
if sudo docker ps --format '{{.Names}}' | grep -q '^coccimarket-db-1$'; then
  ok "prod db container up"
else
  err "prod db container missing"
fi
if sudo docker ps --format '{{.Names}}' | grep -q '^coccimarket_staging-db-1$'; then
  ok "staging db container up"
else
  err "staging db container missing"
fi

echo

echo "[4/6] Reverse proxy (Caddy)"
if systemctl is-active --quiet caddy; then
  ok "caddy active"
else
  err "caddy inactive"
fi

echo

echo "[5/6] OpenClaw gateway"
if openclaw gateway status >/dev/null 2>&1; then
  ok "openclaw gateway reachable"
else
  warn "openclaw gateway check failed"
fi

echo

echo "[6/6] Backups"
latest_prod=$(ls -1t /home/ubuntu/backups/coccimarket/prod/*.dump.gz 2>/dev/null | head -n1 || true)
latest_staging=$(ls -1t /home/ubuntu/backups/coccimarket/staging/*.dump.gz 2>/dev/null | head -n1 || true)

if [[ -n "${latest_prod}" ]]; then
  ok "latest prod backup: $(basename "$latest_prod")"
else
  warn "no prod backup file found"
fi

if [[ -n "${latest_staging}" ]]; then
  ok "latest staging backup: $(basename "$latest_staging")"
else
  warn "no staging backup file found"
fi

echo
if crontab -l 2>/dev/null | grep -q 'backup-all-db.sh'; then
  ok "backup cron installed"
else
  warn "backup cron missing"
fi

echo "=== End ==="
