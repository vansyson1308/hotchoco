# Sprint 12 Load Test Report (50 shops / 500 tx per shop-day)

## Test profile
- Shops: 50
- Transactions per shop/day simulated: 500
- Total requests: 25,000
- Concurrency: 100 workers
- Retries: bounded (`MAX_RETRY=4`) with 429 backoff

## Command
```bash
LOADTEST_URL="http://localhost:5678/webhook/hotchoco" \
LOADTEST_SHOPS=50 \
LOADTEST_TX_PER_SHOP_DAY=500 \
LOADTEST_CONCURRENCY=100 \
node tools/loadtest/run_loadtest_50shops.ts
```

## Result template
Fill from JSON output:
- `ok`: ...
- `errors`: ...
- `timeout`: ...
- `errorRate`: ...%
- `p95LatencyMs`: ...
- `queueBacklogRunaway`: false/true

## Bottlenecks to watch
1. n8n worker saturation (Redis queue waiting jobs increases continuously).
2. Supabase Postgres connection pool exhaustion.
3. Telegram API rate limit bursts (429 spikes).

## Tuning notes
- Scale workers horizontally:
  - `docker compose -f infra/docker-compose.prod.yml up --scale n8n-worker=4 -d`
- Increase `N8N_CONCURRENCY_PRODUCTION_LIMIT` carefully.
- Monitor Redis memory and `bull` queue depth.
- Keep retries bounded; never loop infinitely on 429.
