#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <prod|staging> <backup_file.dump.gz> <target_db_name>"
  exit 1
fi

ENV_NAME="$1"
FILE="$2"
TARGET_DB="$3"

if [[ ! -f "$FILE" ]]; then
  echo "Backup file not found: $FILE"
  exit 1
fi

case "$ENV_NAME" in
  prod)
    CONTAINER="coccimarket-db-1"
    ;;
  staging)
    CONTAINER="coccimarket_staging-db-1"
    ;;
  *)
    echo "Invalid env: $ENV_NAME (use prod|staging)"
    exit 1
    ;;
esac

TMP_FILE="/tmp/restore_$(basename "$FILE" .gz)"

gunzip -c "$FILE" > /tmp/restore.dump
sudo docker cp /tmp/restore.dump "$CONTAINER:$TMP_FILE"

sudo docker exec "$CONTAINER" sh -lc "PGPASSWORD=postgres dropdb -U postgres --if-exists '$TARGET_DB' && PGPASSWORD=postgres createdb -U postgres '$TARGET_DB' && PGPASSWORD=postgres pg_restore -U postgres -d '$TARGET_DB' '$TMP_FILE' && rm -f '$TMP_FILE'"

rm -f /tmp/restore.dump

echo "Restore complete: $ENV_NAME -> $TARGET_DB"
