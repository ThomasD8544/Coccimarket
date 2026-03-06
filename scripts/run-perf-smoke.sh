#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/loadtest"

TARGET_HOST="${TARGET_HOST:-https://staging.coccimarket-dlc.duckdns.org}"
USERS="${USERS:-25}"
SPAWN="${SPAWN:-5}"
DURATION="${DURATION:-3m}"

if [[ -z "${LOADTEST_EMAIL:-}" || -z "${LOADTEST_PASSWORD:-}" ]]; then
  echo "LOADTEST_EMAIL and LOADTEST_PASSWORD are required"
  exit 1
fi

mkdir -p results

echo "[perf-smoke] host=$TARGET_HOST users=$USERS spawn=$SPAWN duration=$DURATION"

docker run --rm \
  -e LOADTEST_EMAIL="$LOADTEST_EMAIL" \
  -e LOADTEST_PASSWORD="$LOADTEST_PASSWORD" \
  -v "$PWD":/mnt/locust \
  locustio/locust -f /mnt/locust/locustfile.py \
  --headless -u "$USERS" -r "$SPAWN" -t "$DURATION" \
  --host "$TARGET_HOST" \
  --csv /mnt/locust/results/perf-smoke

echo "[perf-smoke] done -> loadtest/results/perf-smoke_*.csv"
