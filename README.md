# HOT CHOCO MVP Bootstrap

Production bootstrap for **HOT CHOCO** (Telegram bot for VN consignment retail), aligned with PRD v1.1.0: Supabase-first, n8n queue mode + Redis, single Telegram webhook, async media handling, and DB-backed error logging.

## 1) Prerequisites
- Docker + Docker Compose
- Node.js 20+
- npm or pnpm

## 2) Local infra startup
```bash
cp .env.example .env
cd infra
docker compose up -d
```

Expected services:
- `n8n` on `http://localhost:5678`
- `redis` on `localhost:6379`
- `postgres` (local optional DB for n8n runtime/tests) on `localhost:5433`

Validate compose syntax/config:
```bash
docker compose -f infra/docker-compose.yml config
```

## 3) Supabase migration
Apply SQL in order:
1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_attendance_bg.sql`

Key attendance/background additions in `002`:
- `staff_attendance.attendance_date`, `clock_in_time`, `clock_out_time`
- `upload_status`, `storage_url` for async media status
- `UNIQUE(staff_id, attendance_date)` for dedupe-friendly attendance
- `temp_batches` status normalization to `ACTIVE` for cron cleanup logic

## 4) Import n8n workflows
Workflow JSON files are in `n8n/workflows/`:
- `master.json` (**single Telegram master workflow**) 
- `attendance.json` (callable attendance handler for video_note clock-in + `/out` clock-out)
- `bg_upload_worker.json` (BG-01 upload worker)
- `bg_session_cleanup_cron.json` (BG-02 hourly stale session cleanup)
- `bg.media.upload.json`, `bg.error.logger.json`, `bg.temp-batch.cleanup.json`, `bg.report.scheduler.json` (legacy placeholders)

Import steps:
1. n8n UI → **Workflows** → **Import from File**
2. Import `master.json`, `attendance.json`, `bg_upload_worker.json`, `bg_session_cleanup_cron.json`
3. Configure env vars (`TELEGRAM_BOT_TOKEN`, `SUPABASE_*`, Postgres credentials)
4. Keep **only one Telegram Trigger active** (inside `master.json`)

### Telegram webhook (single endpoint)
When the master workflow is activated, n8n registers the webhook for that one trigger.

```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

## 5) Sprint scope implemented
- Router entrypoint with one Telegram trigger
- Auth guard + permission matrix
- Attendance workflow logic:
  - accepts only `message.video_note` for clock-in
  - validates 06:00–12:00 VN window
  - DB write uses dedupe-safe unique constraint (`staff_id + attendance_date`)
  - duplicate check-in gets friendly Vietnamese message
  - LATE_CRITICAL supports owner notification branch
  - `/out` updates `clock_out_time`
- BG-01 worker stores FAILED safely if media upload fails (does not lose `telegram_file_id`)
- BG-02 hourly cron cancels stale `temp_batches` in ACTIVE > 2h and notifies staff

## 6) Core utility modules
`src/core/` includes:
- `sanitizeVND.ts`
- `sku.ts`
- `categoryMap.ts`
- `captionParser.ts`
- `permissions.ts`
- `error.ts`
- `timezone.ts`
- `latePenalty.ts`
- `attendance.ts`
- `sessionCleanup.ts`

## 7) Run tests
```bash
npm install
npm test
```

Coverage:
- Unit: sanitizeVND, SKU, category map, caption parser, permissions, late penalty tiers, attendance dedupe
- E2E-light: fixture-based router decision tests
- Integration-light: migration guard + session cleanup query builder


## 8) Inventory intake (photo + caption)
- Workflow file: `n8n/workflows/inventory_intake.json`.
- Input format (regex-first): `<consignor>, <category>, <giá nhập>, <giá bán>` (comma or dash separators).
- Supported categories: `RING`, `NECKLACE`, `BRACELET`, `EARRING`, `BROOCH`, `OTHER`.
- Currency sanitizer supports: `350k`, `1.2tr`, `1,2tr`, `350.000`, `350,000`, `350 000`.
- If regex cannot extract 4 fields and no LLM parser is configured, system returns friendly message: `Caption không hiểu...` and does not crash.
- Confirmation uses inline keyboard `[✅][✏️][❌]` with callback_data length guard (<=64 bytes).
- `telegram_file_id` is stored immediately; async worker updates `storage_url` + `photo_status`.


## 9) Sales + bulk receive
- Workflows:
  - `n8n/workflows/sales.json` for `/sell {SKU}` + payment callback.
  - `n8n/workflows/bulk_receive.json` for `/receive` session + album grouping by `media_group_id` + `/done` close totals.
- Master router dispatches command branch to:
  - `sell` -> execute `sales.json`
  - `receive/done` -> execute `bulk_receive.json`
  - `sales` -> daily report stub branch
- ACID sale write pattern is defined in `src/core/dbTransactions.ts` and used as SQL template for `BEGIN/COMMIT` with inventory lock/update.
- Commission engine (`src/core/commission.ts`) supports `FIXED` and `SLIDING` rules.


## 10) Refund + settlement
- Workflows:
  - `n8n/workflows/refund.json` handles `/refund {SKU}` + confirm callback.
  - `n8n/workflows/settlement.json` handles `/settle {consignor_code}` with pending deduction application.
- Refund ACID logic (all-or-nothing): mark `sales` as `REFUNDED` + restore `inventory` to `AVAILABLE`; if sale already settled then create `refund_adjustments` as `PENDING`.
- `/sales` report SQL builder emits refund amounts as negative line values.
- Settlement computes: `net_payout = gross_payout - applied_pending_deductions`; if deductions exceed gross, remainder stays carry-over.


## 11) /expense, /bctc, BG-03 (21:00 VN)
- Workflows added:
  - `n8n/workflows/expense.json`
  - `n8n/workflows/bctc.json`
  - `n8n/workflows/bg_daily_report_21h.json`
- Router dispatch in `master.json` includes `/expense` and `/bctc` (permission matrix still enforced in master).
- Feature flags (fallback default `true`) are read from `shops.settings.features`:
  - `expense_enabled`
  - `bctc_enabled`
- `/expense` confirmation format: `✅ Đã ghi chi phí: {category} {amount}đ`.
- `/bctc [YYYYMM]` includes revenue, refunds (negative), commission kept, consignor payout, total expense, net profit.
- BG-03 runs daily at 21:00 and sends a daily summary to each shop owner; if owner Telegram ID is missing, workflow logs an error to `error_logs` and continues.


## 12) Sprint 6: settlement summary, BG-04 expiry warning, /return
- Updated `n8n/workflows/settlement.json` to send per-consignor summary (items, gross, commission, deductions, net, carry-over note).
- Added `n8n/workflows/bg_expiry_warning_08h.json` to alert owners at 08:00 VN for items expiring in 3 days.
- Added `n8n/workflows/return_item.json` for `/return {SKU}` (idempotent, safe for AVAILABLE/RESERVED, blocks SOLD).
- Feature flags (default `true` fallback):
  - `shops.settings.features.return_enabled`
  - `shops.settings.features.expiry_warning_enabled`


## 13) Sprint 7: /setrate, FX fallback, /export, compression, consignor auto-create
- Added workflows:
  - `n8n/workflows/setrate.json`
  - `n8n/workflows/export_excel.json`
- Updated router to dispatch `/setrate` and `/export`.
- Added FX provider core (`src/core/fxProvider.ts`) with:
  - env-driven mode (`none|api`),
  - 12h cache (shop+currency),
  - fallback to `shops.exchange_rates` manual values.
- Added export workbook schema builder (`src/core/exportExcel.ts`) with minimum sheets: Sales, Inventory, Attendance.
- Updated BG-01 upload worker with safe compression path (attempt >2MB handling, fallback to original + warning log-friendly context).
- Added consignor auto-create payload builder (`src/core/consignorAutoCreate.ts`) and intake workflow auto-create DB path with shop default commission.
- Feature flags (default true fallback) expected in `shops.settings.features`:
  - `fx_api_enabled`, `export_enabled`, `auto_create_consignor_enabled`, `photo_compress_enabled`.

## 14) Sprint 8 stabilization (QA + hardening)
### E2E suite
- Added `tests/e2e/router.e2e.test.ts` with fixture-driven end-to-end simulation for:
  - auth
  - attendance
  - intake
  - sell
  - refund
  - bctc
  - settle
  - return
  - setrate
  - export
- Added dedicated fixture folder: `tests/e2e/fixtures/*.json`.
- Added regression file: `tests/e2e/qa-regressions.e2e.test.ts` for P0/P1 bugs.

### Unified test command
```bash
npm run test:all
```
It runs:
1. `npm run test:unit`
2. `npm run test:integration`
3. `npm run test:e2e`

### Load test tooling
- Tool: `tools/loadtest/run_loadtest.ts`
- Simulates 50 concurrent users and 500 requests/day pattern by default.
- Handles Telegram-like 429 responses with bounded backoff, avoids tight retry loops.

Example:
```bash
LOADTEST_URL="http://localhost:5678/webhook/hotchoco" \
LOADTEST_CONCURRENCY=50 \
LOADTEST_TOTAL=500 \
node tools/loadtest/run_loadtest.ts
```

### Security audit checklist
- No hardcoded secrets in repo (all runtime secrets via `.env`).
- RLS hardening migration added: `supabase/migrations/009_rls_hardening.sql` with `WITH CHECK` tenant policies.
- Negative policy checks are covered in `tests/integration/rlsPolicies.test.ts`.

### Token rotation steps
1. Rotate Telegram bot token with BotFather.
2. Update `TELEGRAM_BOT_TOKEN` in runtime secret manager.
3. Re-activate `master.json` webhook workflow to refresh webhook auth.
4. Rotate Supabase service/anon keys in Supabase dashboard.
5. Update deployment secrets and restart n8n workers.
6. Validate with `getWebhookInfo` and `/health` endpoint.

### Monitoring workflows
- `n8n/workflows/healthcheck.json`:
  - exposes GET webhook path `hotchoco-health`
  - returns HTTP `200` JSON (`status=ok`) for UptimeRobot.
- `n8n/workflows/alert_on_failure.json`:
  - listens via n8n error trigger
  - logs CRITICAL error row
  - notifies `OWNER_TELEGRAM_ID`.

### Backup + restore automation
- `scripts/backup_supabase.sh`: daily compressed `pg_dump` with optional AES-256 encryption.
- `scripts/restore_supabase.sh`: decrypt (if needed) and restore into target DB.

Daily cron example (03:00 UTC):
```bash
0 3 * * * cd /workspace/hotchoco && SUPABASE_DB_URL='postgresql://...' BACKUP_DIR='./backups' ENCRYPT_PASSPHRASE='***' ./scripts/backup_supabase.sh >> ./backups/backup.log 2>&1
```

Restore example:
```bash
SUPABASE_DB_URL='postgresql://...' BACKUP_FILE='./backups/supabase_20250101T030000Z.sql.gz.enc' ENCRYPT_PASSPHRASE='***' ./scripts/restore_supabase.sh
```

### Beta checklist
- [ ] `npm run test:all` green.
- [ ] `/health` endpoint monitored and returning 200.
- [ ] `alert_on_failure` sends owner Telegram alert in under 5 minutes.
- [ ] Daily backup cron enabled and one restore drill completed.
- [ ] RLS migration `009` applied in staging + prod.

## 15) Sprint 9: multi-tenant onboarding + billing gating
### /setup onboarding flow
- New workflow: `n8n/workflows/setup_onboarding.json`.
- Master router now checks `/setup` **before** normal auth guard and forwards request to setup workflow.
- Security model: `/setup` requires `SETUP_SECRET` and can be disabled with `ONBOARDING_ENABLED=false`.
- Command format:
```bash
/setup <SETUP_SECRET> <SHOP_CODE> <shop_name>|<owner_name>|<timezone>|<default_commission_rate>
```
- On success: create `shops` row + owner `staff` row + default `FREE` subscription in a single transaction.

### RLS enforcement model (multi-shop)
- RLS helper `public.current_shop_id()` now supports:
  1. `app.current_shop_id` (preferred)
  2. fallback `request.jwt.claims.shop_id`
- For SQL transactions, set tenant context explicitly:
```sql
begin;
set local app.current_shop_id = '<shop_uuid>';
-- tenant-safe queries here
commit;
```
- Automated policy matrix checks are in:
  - `tests/integration/rlsIsolationMatrix.test.ts`
  - `tests/integration/rlsPolicies.test.ts`

### Shop-specific settings access
- Use `src/core/shopSettings.ts` to resolve per-shop timezone, late rules, and default commission.
- Do not hardcode shop defaults in feature flows; always read from `shops` row using staff context `shop_id`.

### Billing plans + subscription gating
- New tables:
  - `public.plans`
  - `public.subscriptions`
  - `public.usage_counters_daily`
- Seeded plan `FREE` is data-driven (`limits_json`) and can be edited without code changes.
- Gating helper: `src/core/gating.ts`.
- If quota/feature is blocked, show upgrade message in Vietnamese.
- Rollback safety: set `GATING_ENFORCE=false` to switch to warn-only mode.

### Env vars for Sprint 9
- `SETUP_SECRET=...`
- `ONBOARDING_ENABLED=true`
- `GATING_ENFORCE=true`

## 16) Sprint 10: AI Analytics
- New workflow: `n8n/workflows/analytics.json` (OWNER only via permission matrix in master).
- Command: `/analytics`, `/analytics 7d`, `/analytics 30d`, `/analytics 90d`.
- Output includes:
  - explicit date range used,
  - *Facts block* (computed numbers),
  - *Insights* (LLM optional) and deterministic fallback,
  - *Recommended actions*.

### Analytics computation scope
- Sales trend analysis: top category, peak hours, slow movers.
- Consignor performance scoring: sell-through + average days to sell.
- Smart pricing suggestions: recommendation band from faster-selling data.
- Anomaly detection: wording is always **"cảnh báo cần kiểm tra"** (non-accusatory).

### Fallback and safety
- If data is too small: report says `chưa đủ dữ liệu`.
- If LLM is unavailable: deterministic fallback report is still returned.
- Feature toggles:
  - `shops.settings.features.analytics_enabled`
  - `shops.settings.anomaly_enabled`

## 17) Sprint 11: platform expansion
### Platform-agnostic core (v2)
- New normalized model: `src/core/platform/types.ts`.
- New handler entrypoint: `src/core/platform/handlers/index.ts` returning action model:
  - `sendText`, `sendKeyboard`, `sendFile`.
- Telegram adapter: `src/adapters/telegram.ts` (update -> normalized event, action -> Telegram requests).
- Zalo prototype adapter: `src/adapters/zalo.ts` (TEXT parity, TODO for production signing).

### n8n workflows
- Added `n8n/workflows/zalo_webhook_prototype.json` (inactive by default).
- Added `n8n/workflows/consignor_portal.json` for read-only consignor commands.
- Master workflow routing extended for `/myitems`, `/mysales`, `/mypayouts` and pre-auth consignor portal path.

### POS API service
- Service path: `services/pos-api`.
- API key auth backed by `public.api_keys` table (shop scoped).
- Endpoints:
  - `GET /inventory`
  - `POST /inventory`
  - `PATCH /inventory/:sku`
  - `DELETE /inventory/:sku`
  - `POST /sales` (ACID transaction)
- OpenAPI spec: `services/pos-api/openapi.yaml`.

Run locally:
```bash
npm run pos-api:start
```

### Consignor read-only mode
- New DB table: `public.consignor_users` for mapping Telegram users to consignor identity.
- Commands:
  - `/myitems`
  - `/mysales`
  - `/mypayouts`
- Queries are strictly scoped by `shop_id + consignor_id` to avoid cross-consignor leakage.

### DB migration
- `supabase/migrations/012_platform_expansion.sql` adds:
  - `api_keys`
  - `consignor_users`
  - indexes + RLS policies.

### Rollback switches
- Keep platform core behind runtime flag `platform_core_v2` in handler context.
- Zalo prototype remains disabled by default (inactive workflow).
- POS API is independent service; disable by not deploying.

## 18) Sprint 12 production hardening

### Load & capacity (50 shops)
Run:
```bash
npm run loadtest:50shops
```
or explicitly:
```bash
LOADTEST_URL="http://localhost:5678/webhook/hotchoco" \
LOADTEST_SHOPS=50 \
LOADTEST_TX_PER_SHOP_DAY=500 \
LOADTEST_CONCURRENCY=100 \
node tools/loadtest/run_loadtest_50shops.ts
```
Report template: `tools/loadtest/report.md`.

### Multi-worker n8n queue scaling
Production compose file: `infra/docker-compose.prod.yml`.

Start:
```bash
docker compose -f infra/docker-compose.prod.yml up -d
```
Scale workers:
```bash
docker compose -f infra/docker-compose.prod.yml up --scale n8n-worker=4 -d
```

### Optional self-hosted Supabase (VN data residency)
Folder: `infra/supabase-selfhost/`.

```bash
cd infra/supabase-selfhost
cp .env.example .env
docker compose up -d
```
Then apply `supabase/migrations/001..012`.

### Compliance & security docs
- `docs/pdpd_technical_assessment.md`
- `docs/security_controls.md`

### Ops runbook
- `docs/runbook.md`
- Includes deploy, upgrade, rollback, incident flow.

### DR drill + smoke test
- Backup/restore wrappers:
  - `scripts/backup.sh`
  - `scripts/restore.sh`
- Drill checklist:
  - `docs/dr_drill.md`
- Post-restore smoke command:
```bash
npm run smoke
```

## 19) Final beta-ready audit summary
- Audit detail: `docs/release_audit_sprint12.md`.
- Troubleshooting: `docs/troubleshooting.md`.
- Backup & restore: `docs/backup_restore.md`.

## 20) How to run from scratch (new developer)
1. Prerequisites:
   - Docker + Docker Compose
   - Node.js 20+
2. Setup env:
```bash
cp .env.example .env
```
3. Start infra:
```bash
docker compose -f infra/docker-compose.yml up -d
```
4. Apply Supabase migrations in order:
   - `supabase/migrations/001_init.sql` ... `supabase/migrations/012_platform_expansion.sql`
5. Import workflows from `n8n/workflows/` and activate only `master.json` trigger.
6. Install deps and run tests:
```bash
npm install
npm run test:all
```
7. Run smoke verification:
```bash
npm run smoke
```

## 21) Manual Smoke Test Checklist (Telegram)
Execute in order:
1. `/start` returns welcome.
2. Unauthorized user sends `/sales` -> denied + logged to `error_logs`.
3. Attendance: send `video_note` -> success; duplicate same day -> friendly duplicate message.
4. Intake: send photo+caption (`consignor, category, intake, sale`) -> parse + confirm keyboard.
5. Intake callback flow: confirm / edit one field / cancel.
6. `/sell {SKU}` -> success and inventory transitions to SOLD.
7. `/refund {SKU}` -> inventory restored AVAILABLE and refund line negative in report.
8. `/settle ...` -> settlement summary generated.
9. `/expense ...` -> expense row inserted.
10. `/bctc YYYYMM` -> monthly financial summary.
11. `/return {SKU}` -> AVAILABLE/RESERVED -> RETURNED (idempotent).
12. `/setrate THB 650` -> rate updated.
13. `/export ...` -> workbook generation path responds.
14. `/analytics 30d` -> Facts block + Insights + Recommended actions (or "chưa đủ dữ liệu").
15. Trigger BG flows manually in n8n UI:
   - daily report 21:00
   - expiry warning 08:00
   - upload worker
   - session cleanup
16. Confirm alerts:
   - `healthcheck.json` returns 200.
   - `alert_on_failure.json` sends owner notification on forced failure.
