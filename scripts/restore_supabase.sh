#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL is required}"
: "${BACKUP_FILE:?BACKUP_FILE is required}"
ENCRYPT_PASSPHRASE="${ENCRYPT_PASSPHRASE:-}"

TMP_SQL_GZ="$(mktemp /tmp/hotchoco_restore.XXXXXX.sql.gz)"
cleanup() {
  rm -f "$TMP_SQL_GZ"
}
trap cleanup EXIT

if [[ "$BACKUP_FILE" == *.enc ]]; then
  : "${ENCRYPT_PASSPHRASE:?ENCRYPT_PASSPHRASE is required for encrypted backup}"
  openssl enc -d -aes-256-cbc -pbkdf2 -in "$BACKUP_FILE" -out "$TMP_SQL_GZ" -pass "pass:$ENCRYPT_PASSPHRASE"
else
  cp "$BACKUP_FILE" "$TMP_SQL_GZ"
fi

gunzip -c "$TMP_SQL_GZ" | psql "$SUPABASE_DB_URL"

echo "Restore completed from: $BACKUP_FILE"
