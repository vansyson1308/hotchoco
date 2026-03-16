import { describe, it, expect, beforeEach } from 'vitest';
import { RedisCache, MemoryCache } from '../src/core/cache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  it('returns null for missing key', async () => {
    const result = await cache.get('missing');
    expect(result).toBeNull();
  });

  it('stores and retrieves a value', async () => {
    await cache.set('key1', '{"a":1}', 'EX', 3600);
    const result = await cache.get('key1');
    expect(result).toBe('{"a":1}');
  });

  it('expires entries', async () => {
    await cache.set('key1', '"val"', 'EX', 0);
    // TTL of 0 seconds means expired immediately (in next tick)
    await new Promise((r) => setTimeout(r, 10));
    const result = await cache.get('key1');
    expect(result).toBeNull();
  });

  it('deletes entries', async () => {
    await cache.set('key1', '"val"', 'EX', 3600);
    const deleted = await cache.del('key1');
    expect(deleted).toBe(1);
    expect(await cache.get('key1')).toBeNull();
  });

  it('returns 0 when deleting non-existent key', async () => {
    const deleted = await cache.del('nope');
    expect(deleted).toBe(0);
  });
});

describe('RedisCache', () => {
  it('gets and sets with namespace', async () => {
    const store = new MemoryCache();
    const redis = new RedisCache(store, 'test:');

    await redis.set('fx', 'USD', { rate: 25000 }, 3600);
    const result = await redis.get<{ rate: number }>('fx', 'USD');

    expect(result).toEqual({ rate: 25000 });
  });

  it('returns null for missing entry', async () => {
    const store = new MemoryCache();
    const redis = new RedisCache(store);

    const result = await redis.get('fx', 'EUR');
    expect(result).toBeNull();
  });

  it('deletes entry', async () => {
    const store = new MemoryCache();
    const redis = new RedisCache(store);

    await redis.set('fx', 'USD', { rate: 25000 });
    await redis.del('fx', 'USD');
    const result = await redis.get('fx', 'USD');

    expect(result).toBeNull();
  });

  it('handles malformed JSON gracefully', async () => {
    const store: MemoryCache = new MemoryCache();
    await store.set('hc:fx:USD', 'not-json{', 'EX', 3600);

    const redis = new RedisCache(store);
    const result = await redis.get('fx', 'USD');

    expect(result).toBeNull();
  });
});
