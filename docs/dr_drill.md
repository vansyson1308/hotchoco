# Disaster Recovery Drill (< 1 hour target)

## Objective
Recover full service from backup and verify critical paths within 60 minutes.

## Timed checklist
- T+00:00 start drill timer.
- T+00:05 collect latest backup artifact.
- T+00:10 restore DB on target instance.
- T+00:25 apply pending migrations (if any).
- T+00:30 start n8n + workers.
- T+00:35 import workflows / activate master.
- T+00:45 run smoke checks (`npm run smoke`).
- T+00:55 capture evidence and close drill.

## Commands
```bash
SUPABASE_DB_URL='postgresql://...' ./scripts/backup.sh
SUPABASE_DB_URL='postgresql://...' BACKUP_FILE='./backups/supabase_*.sql.gz.enc' ENCRYPT_PASSPHRASE='***' ./scripts/restore.sh
npm run smoke
```

## Verification checks
- `/health` returns 200.
- Router accepts `/start`.
- One attendance insert succeeds.
- One sale transaction path succeeds.

## Evidence to archive
- Restore logs
- Smoke output
- Duration timestamps
- Action items
