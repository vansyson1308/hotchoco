export type FxProviderMode = 'none' | 'api';

export interface FxConfig {
  provider: FxProviderMode;
  apiKey?: string;
  apiUrl?: string;
  ttlMs?: number;
}

export interface FxContext {
  shopId: string;
  exchangeRates: Record<string, number>;
}

interface CacheEntry {
  value: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(shopId: string, currency: string): string {
  return `${shopId}:${currency.toUpperCase()}`;
}

export function mergeExchangeRates(
  current: Record<string, number> | null | undefined,
  cur: string,
  rate: number
): Record<string, number> {
  return {
    ...(current ?? {}),
    [cur.toUpperCase()]: rate
  };
}

export function parseSetRateCommand(text: string): { currency: string; rate: number } {
  const m = text.trim().match(/^\/setrate\s+([A-Za-z]{3})\s+([0-9]+(?:[.,][0-9]+)?)$/);
  if (!m) {
    throw new Error('Cú pháp đúng: /setrate {CUR} {rate}');
  }

  const currency = m[1].toUpperCase();
  const rate = Number(m[2].replace(',', '.'));

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Tỷ giá không hợp lệ');
  }

  return { currency, rate };
}

export async function getRate(
  currency: string,
  ctx: FxContext,
  cfg: FxConfig,
  fetcher: (url: string, apiKey?: string) => Promise<number>
): Promise<number> {
  const cur = currency.toUpperCase();
  const key = cacheKey(ctx.shopId, cur);
  const now = Date.now();
  const ttl = cfg.ttlMs ?? 12 * 60 * 60 * 1000;

  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }

  let resolved: number | undefined;

  if (cfg.provider === 'api' && cfg.apiUrl && cfg.apiKey) {
    try {
      resolved = await fetcher(`${cfg.apiUrl}?base=VND&symbols=${cur}`, cfg.apiKey);
    } catch {
      resolved = undefined;
    }
  }

  if (resolved === undefined) {
    resolved = ctx.exchangeRates[cur];
  }

  if (!resolved || !Number.isFinite(resolved) || resolved <= 0) {
    throw new Error(`Không có tỷ giá khả dụng cho ${cur}`);
  }

  cache.set(key, { value: resolved, expiresAt: now + ttl });
  return resolved;
}
