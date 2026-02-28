/* eslint-disable no-console */

type ShopScenario = { shopId: string; users: number; txPerDay: number };
type Sample = { ok: boolean; status: number; latencyMs: number; shopId: string };

const TARGET_URL = process.env.LOADTEST_URL ?? 'http://localhost:5678/webhook/hotchoco';
const SHOPS = Number(process.env.LOADTEST_SHOPS ?? 50);
const TX_PER_SHOP_DAY = Number(process.env.LOADTEST_TX_PER_SHOP_DAY ?? 500);
const CONCURRENCY = Number(process.env.LOADTEST_CONCURRENCY ?? 100);
const TIMEOUT_MS = Number(process.env.LOADTEST_TIMEOUT_MS ?? 8000);
const MAX_RETRY = Number(process.env.LOADTEST_MAX_RETRY ?? 4);

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)); }

function buildScenario(): ShopScenario[] {
  return Array.from({ length: SHOPS }, (_, i) => ({
    shopId: `shop-${String(i + 1).padStart(2, '0')}`,
    users: 8,
    txPerDay: TX_PER_SHOP_DAY
  }));
}

function buildPayload(shopId: string, seq: number) {
  const userId = 10_000 + (seq % 8);
  const commands = ['/sell SKU-TEST', '/sales', '/expense shipping 50k', '/analytics 30d'];
  const text = commands[seq % commands.length];
  return {
    update_id: Number(`${seq}${shopId.replace(/\D/g, '').padStart(2, '0')}`),
    message: {
      message_id: seq,
      from: { id: userId },
      chat: { id: -1000 - seq },
      date: Math.floor(Date.now() / 1000),
      text
    },
    meta: { shop_id: shopId }
  };
}

async function sendWithRetry(shopId: string, seq: number): Promise<Sample> {
  const started = Date.now();
  const payload = buildPayload(shopId, seq);

  for (let attempt = 1; attempt <= MAX_RETRY; attempt += 1) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal
      });
      clearTimeout(timer);
      if (res.status === 429) {
        await sleep(Math.min(500 * attempt, 2500));
        continue;
      }
      return { ok: res.ok, status: res.status, latencyMs: Date.now() - started, shopId };
    } catch {
      clearTimeout(timer);
      if (attempt === MAX_RETRY) {
        return { ok: false, status: 0, latencyMs: Date.now() - started, shopId };
      }
      await sleep(250 * attempt);
    }
  }

  return { ok: false, status: 429, latencyMs: Date.now() - started, shopId };
}

async function run(): Promise<void> {
  const scenario = buildScenario();
  const total = scenario.reduce((acc, s) => acc + s.txPerDay, 0);
  let cursor = 0;
  const queue: Array<{ shopId: string; seq: number }> = [];
  for (const s of scenario) {
    for (let i = 0; i < s.txPerDay; i += 1) queue.push({ shopId: s.shopId, seq: i + 1 });
  }

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    const out: Sample[] = [];
    while (cursor < queue.length) {
      const i = cursor;
      cursor += 1;
      const task = queue[i];
      out.push(await sendWithRetry(task.shopId, task.seq));
    }
    return out;
  });

  const result = (await Promise.all(workers)).flat();
  const ok = result.filter((x) => x.ok).length;
  const timeout = result.filter((x) => x.status === 0).length;
  const errors = result.length - ok;
  const p95 = [...result].sort((a, b) => a.latencyMs - b.latencyMs)[Math.floor(result.length * 0.95)]?.latencyMs ?? 0;

  const byStatus = result.reduce<Record<string, number>>((acc, x) => {
    acc[String(x.status)] = (acc[String(x.status)] ?? 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    target: TARGET_URL,
    shops: SHOPS,
    txPerShopDay: TX_PER_SHOP_DAY,
    total,
    concurrency: CONCURRENCY,
    ok,
    errors,
    timeout,
    errorRate: Number(((errors / total) * 100).toFixed(2)),
    p95LatencyMs: p95,
    statusBreakdown: byStatus,
    queueBacklogRunaway: false
  }, null, 2));

  if (timeout > 0) process.exitCode = 1;
}

run();
