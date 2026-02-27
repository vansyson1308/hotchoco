# Troubleshooting Guide

## 1) `npm install` fails with 403
- Symptom: `npm ERR! code E403`.
- Cause: environment/registry policy blocks npm registry.
- Fix:
  1. Check `.npmrc` registry/proxy settings.
  2. Use CI/private mirror with approved package access.
  3. Re-run `npm install` then `npm run test:all`.

## 2) n8n queue backlog keeps increasing
- Symptom: jobs waiting increase, delayed bot responses.
- Checks:
  - Redis connectivity (`N8N_QUEUE_BULL_REDIS_HOST`).
  - Worker count (`n8n-worker` replicas).
- Fix:
  - `docker compose -f infra/docker-compose.prod.yml up --scale n8n-worker=4 -d`
  - Reduce heavy workflow concurrency if DB is saturated.

## 3) Telegram webhook not receiving updates
- Symptom: `/start` in Telegram has no response.
- Checks:
  - `getWebhookInfo` token + URL.
  - Only one Telegram trigger in active workflows.
- Fix:
  - Re-activate `master.json`.
  - Ensure `WEBHOOK_URL` matches public endpoint.

## 4) Supabase RLS denies expected rows
- Symptom: empty results unexpectedly.
- Cause: missing tenant context.
- Fix:
  - Set `SET LOCAL app.current_shop_id = '<shop_uuid>'` in SQL transactions.
  - Verify policy SQL in migrations `009+`.

## 5) POS API returns `invalid_api_key`
- Checks:
  - API key sent as `Authorization: Bearer <raw_key>`.
  - DB contains SHA-256 hash of raw key in `api_keys.key_hash`.
  - `status='ACTIVE'` and correct `shop_id`.

## 6) Backup restore fails
- Checks:
  - Correct `SUPABASE_DB_URL`.
  - Correct `BACKUP_FILE` path and encryption passphrase.
- Fix:
  - See `docs/backup_restore.md` for end-to-end restore steps.
