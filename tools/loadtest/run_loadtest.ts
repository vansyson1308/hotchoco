/* eslint-disable no-console */

type Sample = { ok: boolean; status: number; latencyMs: number };

const TARGET_URL = process.env.LOADTEST_URL ?? 'http://localhost:5678/webhook/hotchoco';
const CONCURRENCY = Number(process.env.LOADTEST_CONCURRENCY ?? 50);
const TOTAL_REQUESTS = Number(process.env.LOADTEST_TOTAL ?? 500);
const TIMEOUT_MS = Number(process.env.LOADTEST_TIMEOUT_MS ?? 8000);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendOnce(index: number): Promise<Sample> {
  const payload = {
    update_id: 100000 + index,
    message: {
      message_id: index,
      from: { id: 5000 + (index % 50) },
      chat: { id: -9000 },
      date: Math.floor(Date.now() / 1000),
      text: '/sales'
    }
  };

  const started = Date.now();
  let attempts = 0;

  while (attempts < 4) {
    attempts += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(TARGET_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.status === 429) {
        const backoff = Math.min(1000 * attempts, 3000);
        await sleep(backoff);
        continue;
      }

      return { ok: res.ok, status: res.status, latencyMs: Date.now() - started };
    } catch {
      clearTimeout(timer);
      if (attempts >= 4) {
        return { ok: false, status: 0, latencyMs: Date.now() - started };
      }
      await sleep(300 * attempts);
    }
  }

  return { ok: false, status: 429, latencyMs: Date.now() - started };
}

async function run(): Promise<void> {
  const all: Promise<Sample>[] = [];
  let next = 0;

  async function worker(): Promise<void> {
    while (next < TOTAL_REQUESTS) {
      const current = next;
      next += 1;
      all.push(Promise.resolve(sendOnce(current)));
      if (all.length % CONCURRENCY === 0) {
        await Promise.all(all.splice(0, all.length));
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  const samples = await Promise.all(all);
  const okCount = samples.filter((x) => x.ok).length;
  const timeoutCount = samples.filter((x) => x.status === 0).length;
  const p95 = [...samples].sort((a, b) => a.latencyMs - b.latencyMs)[Math.floor(samples.length * 0.95)]?.latencyMs ?? 0;

  console.log(JSON.stringify({
    target: TARGET_URL,
    concurrency: CONCURRENCY,
    total: TOTAL_REQUESTS,
    okCount,
    errorCount: samples.length - okCount,
    timeoutCount,
    p95LatencyMs: p95
  }, null, 2));

  if (timeoutCount > 0) {
    process.exitCode = 1;
  }
}

run();
