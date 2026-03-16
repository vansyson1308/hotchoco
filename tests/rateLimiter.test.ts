import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit, rateLimitMessage, RATE_LIMITS } from '../src/core/rateLimiter.js';

function createMockRedis() {
  const store = new Map<string, { count: number; ttl: number }>();

  return {
    incr: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (entry) {
        entry.count++;
        return entry.count;
      }
      store.set(key, { count: 1, ttl: -1 });
      return 1;
    }),
    expire: vi.fn(async (key: string, seconds: number) => {
      const entry = store.get(key);
      if (entry) entry.ttl = seconds;
      return 1;
    }),
    ttl: vi.fn(async (key: string) => {
      const entry = store.get(key);
      return entry?.ttl ?? -1;
    }),
    _store: store,
  };
}

describe('Rate Limiter', () => {
  it('allows requests within limit', async () => {
    const redis = createMockRedis();
    const result = await checkRateLimit(redis, 'user_command', 'user123');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.user_command.maxRequests - 1);
  });

  it('sets TTL on first request', async () => {
    const redis = createMockRedis();
    await checkRateLimit(redis, 'user_command', 'user123');
    expect(redis.expire).toHaveBeenCalledWith('rl:user_command:user123', 60);
  });

  it('blocks requests exceeding limit', async () => {
    const redis = createMockRedis();
    const config = { maxRequests: 2, windowSeconds: 60 };

    await checkRateLimit(redis, 'test', 'user1', config);
    await checkRateLimit(redis, 'test', 'user1', config);
    const result = await checkRateLimit(redis, 'test', 'user1', config);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns correct remaining count', async () => {
    const redis = createMockRedis();
    const config = { maxRequests: 5, windowSeconds: 60 };

    const r1 = await checkRateLimit(redis, 'test', 'user1', config);
    const r2 = await checkRateLimit(redis, 'test', 'user1', config);

    expect(r1.remaining).toBe(4);
    expect(r2.remaining).toBe(3);
  });

  it('uses default config when scope not found', async () => {
    const redis = createMockRedis();
    const result = await checkRateLimit(redis, 'unknown_scope', 'user1');
    expect(result.allowed).toBe(true);
  });

  describe('rateLimitMessage', () => {
    it('returns Vietnamese message', () => {
      const msg = rateLimitMessage(30);
      expect(msg).toContain('30');
      expect(msg).toContain('giây');
    });
  });

  describe('RATE_LIMITS', () => {
    it('has expected scopes', () => {
      expect(RATE_LIMITS.user_command).toBeDefined();
      expect(RATE_LIMITS.shop_aggregate).toBeDefined();
      expect(RATE_LIMITS.api_key).toBeDefined();
    });
  });
});
