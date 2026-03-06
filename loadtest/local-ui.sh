#!/usr/bin/env bash
set -euo pipefail

# Local Locust Web UI launcher
# You can choose allowed domains and then set host/users directly in UI.

cd "$(dirname "$0")"

ALLOWED_HOSTS_DEFAULT="coccimarket-dlc.duckdns.org"
ALLOWED_HOSTS="${ALLOWED_HOSTS:-$ALLOWED_HOSTS_DEFAULT}"
LOADTEST_EMAIL="${LOADTEST_EMAIL:-admin@coccimarket.local}"
LOADTEST_PASSWORD="${LOADTEST_PASSWORD:-admin1234}"

if [[ -z "${ALLOWED_HOSTS:-}" ]]; then
  echo "ALLOWED_HOSTS is empty. Refusing to start."
  exit 1
fi

echo "Starting Locust Web UI on http://localhost:8089"
echo "Allowed hosts: $ALLOWED_HOSTS"
echo "In UI you can set host + users + spawn rate directly."

docker run --rm -it \
  -p 8089:8089 \
  -e ALLOWED_HOSTS="$ALLOWED_HOSTS" \
  -e LOADTEST_EMAIL="$LOADTEST_EMAIL" \
  -e LOADTEST_PASSWORD="$LOADTEST_PASSWORD" \
  -e PER_USER_RPS="${PER_USER_RPS:-2}" \
  -e ERROR_RATIO_ABORT_THRESHOLD="${ERROR_RATIO_ABORT_THRESHOLD:-0.05}" \
  -e MIN_REQUESTS_BEFORE_ABORT="${MIN_REQUESTS_BEFORE_ABORT:-500}" \
  -v "$PWD/cluster/distributed_locustfile.py":/mnt/locust/locustfile.py \
  locustio/locust -f /mnt/locust/locustfile.py
