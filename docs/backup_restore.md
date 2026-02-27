# Backup & Restore Operations

## Backup
```bash
SUPABASE_DB_URL='postgresql://...' \
BACKUP_DIR='./backups' \
ENCRYPT_PASSPHRASE='***' \
./scripts/backup.sh
```

Outputs encrypted (`.enc`) backup when passphrase is provided.

## Restore
```bash
SUPABASE_DB_URL='postgresql://...' \
BACKUP_FILE='./backups/supabase_YYYYMMDDTHHMMSSZ.sql.gz.enc' \
ENCRYPT_PASSPHRASE='***' \
./scripts/restore.sh
```

## Post-restore verification
1. Run smoke:
```bash
npm run smoke
```
2. Validate webhook health:
- `/health` workflow returns 200.
3. Execute manual smoke checklist from README.

## Retention
- Controlled by `RETENTION_DAYS` in backup script env.
- Store encrypted copies in offsite object storage.

## Drill target
- Full restore + smoke verification in < 1 hour.
- Use `docs/dr_drill.md` timed checklist.
