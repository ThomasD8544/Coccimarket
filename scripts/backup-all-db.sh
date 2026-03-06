#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/home/ubuntu/backups/coccimarket}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$BACKUP_ROOT/prod" "$BACKUP_ROOT/staging"

# PROD
sudo docker exec coccimarket-db-1 sh -lc 'PGPASSWORD=postgres pg_dump -U postgres -d coccimarket -Fc' \
  > "$BACKUP_ROOT/prod/coccimarket_prod_${TS}.dump"

gzip -f "$BACKUP_ROOT/prod/coccimarket_prod_${TS}.dump"

# STAGING
sudo docker exec coccimarket_staging-db-1 sh -lc 'PGPASSWORD=postgres pg_dump -U postgres -d coccimarket_staging -Fc' \
  > "$BACKUP_ROOT/staging/coccimarket_staging_${TS}.dump"

gzip -f "$BACKUP_ROOT/staging/coccimarket_staging_${TS}.dump"

# Retention
find "$BACKUP_ROOT/prod" -type f -name '*.dump.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_ROOT/staging" -type f -name '*.dump.gz' -mtime +"$RETENTION_DAYS" -delete

echo "[backup] done at $(date -u). Files:"
ls -1 "$BACKUP_ROOT/prod" | tail -n 3 || true
ls -1 "$BACKUP_ROOT/staging" | tail -n 3 || true
