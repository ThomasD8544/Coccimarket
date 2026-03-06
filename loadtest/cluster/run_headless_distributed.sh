#!/usr/bin/env bash
set -euo pipefail

# Usage:
# HOST=https://coccimarket-dlc.duckdns.org ./run_headless_distributed.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$ROOT_DIR/results"
mkdir -p "$OUT_DIR"

HOST="${HOST:-https://coccimarket-dlc.duckdns.org}"
ALLOWED_HOSTS="${ALLOWED_HOSTS:-coccimarket-dlc.duckdns.org}"
MAX_GLOBAL_RPS="${MAX_GLOBAL_RPS:-300}"
PER_USER_RPS="${PER_USER_RPS:-2}"
SPAWN_RATE="${SPAWN_RATE:-20}"
DURATION="${DURATION:-10m}"
ERROR_RATIO_ABORT_THRESHOLD="${ERROR_RATIO_ABORT_THRESHOLD:-0.05}"
MIN_REQUESTS_BEFORE_ABORT="${MIN_REQUESTS_BEFORE_ABORT:-500}"

EXPECT_WORKERS="${EXPECT_WORKERS:-4}"

MAX_USERS=$(python3 - <<PY
max_rps=float("$MAX_GLOBAL_RPS")
per_user=max(0.1, float("$PER_USER_RPS"))
print(int(max_rps/per_user))
PY
)

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PREFIX="/mnt/locust/results/locust_${STAMP}"

echo "[INFO] host=$HOST users=$MAX_USERS spawn_rate=$SPAWN_RATE duration=$DURATION"

kubectl -n loadtest set env deployment/locust-master \
  ALLOWED_HOSTS="$ALLOWED_HOSTS" \
  PER_USER_RPS="$PER_USER_RPS" \
  ERROR_RATIO_ABORT_THRESHOLD="$ERROR_RATIO_ABORT_THRESHOLD" \
  MIN_REQUESTS_BEFORE_ABORT="$MIN_REQUESTS_BEFORE_ABORT" >/dev/null

kubectl -n loadtest set env deployment/locust-worker \
  ALLOWED_HOSTS="$ALLOWED_HOSTS" \
  PER_USER_RPS="$PER_USER_RPS" \
  ERROR_RATIO_ABORT_THRESHOLD="$ERROR_RATIO_ABORT_THRESHOLD" \
  MIN_REQUESTS_BEFORE_ABORT="$MIN_REQUESTS_BEFORE_ABORT" >/dev/null

kubectl -n loadtest rollout status deployment/locust-master >/dev/null
kubectl -n loadtest rollout status deployment/locust-worker >/dev/null

MASTER_POD=$(kubectl -n loadtest get pods -l app=locust-master -o jsonpath='{.items[0].metadata.name}')

kubectl -n loadtest exec "$MASTER_POD" -- sh -lc "locust -f /mnt/locust/locustfile.py --headless --master --expect-workers $EXPECT_WORKERS --host '$HOST' -u $MAX_USERS -r $SPAWN_RATE -t $DURATION --csv '$PREFIX'"

kubectl -n loadtest cp "${MASTER_POD}:${PREFIX}_stats.csv" "$OUT_DIR/" || true
kubectl -n loadtest cp "${MASTER_POD}:${PREFIX}_stats_history.csv" "$OUT_DIR/" || true
kubectl -n loadtest cp "${MASTER_POD}:${PREFIX}_failures.csv" "$OUT_DIR/" || true

echo "✅ Résultats copiés dans $OUT_DIR"
python3 "$ROOT_DIR/report.py" "$OUT_DIR/$(basename "${PREFIX}_stats.csv")" "$OUT_DIR/$(basename "${PREFIX}_failures.csv")"
