#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env.staging ]]; then
  echo "[deploy-staging] Missing .env.staging"
  echo "Copy .env.staging.example -> .env.staging and fill secrets first."
  exit 1
fi

echo "[deploy-staging] Pull latest develop..."
git fetch origin develop || true
git checkout develop || true
git pull --ff-only origin develop || true

echo "[deploy-staging] Build & start staging stack..."
sudo docker compose -p coccimarket_staging -f docker-compose.staging.yml --env-file .env.staging up -d --build

echo "[deploy-staging] Staging containers:"
sudo docker compose -p coccimarket_staging -f docker-compose.staging.yml --env-file .env.staging ps

echo "[deploy-staging] Done. App expected on :3001"
