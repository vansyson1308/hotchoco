# Security Controls Baseline

## Key rotation
- Telegram token: rotate via BotFather on schedule/incident.
- Supabase keys: rotate in dashboard + redeploy env.
- POS API keys: rotate by creating new `api_keys` row and disabling old key.

## Least privilege
- Service credentials only where needed.
- Keep `SUPABASE_SERVICE_KEY` out of client-facing contexts.
- Use shop-scoped API key auth for POS API.

## Audit plan
- Log workflow failures to `error_logs`.
- Log sensitive ops context (`setup`, `refund`, `settle`, `setrate`).
- Export audit reports periodically.

## Hardening checklist
- Enforce TLS on all public endpoints.
- Restrict DB ingress.
- Enable monitoring for queue depth, error spikes, backup failures.
