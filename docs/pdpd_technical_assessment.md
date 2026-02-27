# HOT CHOCO PDPD Technical Assessment (Engineering)

> Technical assessment only, **not legal advice**. Consult counsel before compliance sign-off.

## 1) Data inventory
- Identity: staff/consignor names, phone, telegram_user_id.
- Operational: inventory, sales, refunds, settlements, expenses.
- Media metadata: telegram_file_id, storage_url, upload status.
- Logs: error_logs, execution metadata.

## 2) Data residency
- Default: cloud Supabase region configured by operator.
- Optional: `infra/supabase-selfhost/` for VN-hosted deployment.
- Requirement: document selected hosting region and backup region.

## 3) Access control
- RLS tenant isolation by `current_shop_id()`.
- API key auth for POS API scoped to `shop_id`.
- Separate staff vs consignor read-only path.

## 4) Encryption
- In transit: HTTPS/TLS required for webhook, API, dashboard.
- At rest: managed DB/storage encryption or encrypted disk volume.
- Backup encryption: `scripts/backup.sh` supports AES-256 via passphrase.

## 5) Retention
- Define retention by table class:
  - transactional core: >= 5 years (or policy-defined)
  - logs: 90-365 days
  - media: business policy, with deletion workflow.
- Implement periodic retention jobs and evidence logs.

## 6) Incident response
- Severity classification (SEV-1..SEV-3).
- Trigger: alert_on_failure + external monitoring.
- Runbook path: isolate, rotate keys, restore service, postmortem.

## 7) Auditability
- Keep migration history in git.
- Keep workflow versions in git.
- Track privileged actions (`/setup`, `/setrate`, settlement/refund ops).

## 8) Pre-01/07/2026 readiness checklist
- [ ] Region and residency decision documented.
- [ ] RLS verification test evidence archived.
- [ ] Key rotation drill completed.
- [ ] Backup + restore drill < 1 hour completed.
- [ ] Counsel review completed.
