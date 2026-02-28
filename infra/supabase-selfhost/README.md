# Self-hosted Supabase (optional VN data residency)

> Optional deployment for PDPD data residency needs. Cloud Supabase remains default.

## Start
```bash
cd infra/supabase-selfhost
cp .env.example .env
docker compose up -d
```

## Apply HOT CHOCO migrations
Run all SQL files in `supabase/migrations/` in order `001..012` using `psql` against self-host DB.

## Secrets management
- Keep DB password, service keys, JWT secrets in vault/KMS.
- Rotate quarterly or on incident.
- Do not commit real secrets.

## Backup strategy
- Reuse `scripts/backup.sh` and `scripts/restore.sh` with `SUPABASE_DB_URL` pointing to self-host DB.
- Keep encrypted backups in local secure storage or S3-compatible object storage.

## Production notes
- Enable TLS termination at ingress/load balancer.
- Restrict Postgres network access to trusted CIDRs.
- Monitor WAL growth and disk capacity.
