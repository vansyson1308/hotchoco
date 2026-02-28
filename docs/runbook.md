# HOT CHOCO Runbook

## Fresh deploy
1. Prepare `.env` from `.env.example`.
2. Start queue-mode stack:
   ```bash
   docker compose -f infra/docker-compose.prod.yml up -d
   ```
3. Scale workers:
   ```bash
   docker compose -f infra/docker-compose.prod.yml up --scale n8n-worker=3 -d
   ```
4. Apply migrations `001..012`.
5. Import workflows from `n8n/workflows/`.
6. Activate `master.json` only one Telegram trigger.

## Upgrade
1. Backup DB.
2. Apply new migration(s).
3. Import updated workflow JSON.
4. Restart workers rolling (avoid full downtime).

## Rollback
1. Disable newly introduced workflow(s).
2. Restore last good DB backup if data corruption.
3. Re-import previous workflow export.

## Common failures
- High queue lag: increase `n8n-worker` scale.
- 429 spikes: tune retry + reduce burst.
- DB connection errors: check pool, credentials, and RLS context.

## Incident handling
1. Declare severity.
2. Stop harmful automation paths.
3. Rotate potentially exposed keys.
4. Restore service and run smoke tests.
5. Postmortem within 48 hours.

## References
- Troubleshooting: `docs/troubleshooting.md`
- Backup/Restore: `docs/backup_restore.md`
- DR drill: `docs/dr_drill.md`
