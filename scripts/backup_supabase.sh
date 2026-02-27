#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
ENCRYPT_PASSPHRASE="${ENCRYPT_PASSPHRASE:-}"

mkdir -p "$BACKUP_DIR"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
BASENAME="supabase_${TS}.sql.gz"
OUT_PATH="$BACKUP_DIR/$BASENAME"

pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges | gzip -9 > "$OUT_PATH"

if [[ -n "$ENCRYPT_PASSPHRASE" ]]; then
  openssl enc -aes-256-cbc -pbkdf2 -salt -in "$OUT_PATH" -out "$OUT_PATH.enc" -pass "pass:$ENCRYPT_PASSPHRASE"
  rm -f "$OUT_PATH"
  OUT_PATH="$OUT_PATH.enc"
fi

find "$BACKUP_DIR" -type f -mtime +"$RETENTION_DAYS" -name 'supabase_*.sql.gz*' -delete

echo "Backup created: $OUT_PATH"
