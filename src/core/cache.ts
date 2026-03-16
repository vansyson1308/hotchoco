/**
 * Redis-backed cache layer.
 * Replaces in-memory caches for multi-worker compatibility.
 */

export interface CacheStore {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode: 'EX', ttl: number) => Promise<string | null>;
  del: (key: string) => Promise<number>;
}

export interface CacheOptions {
  /** TTL in seconds */
  ttlSeconds: number;
  /** Key prefix for namespacing */
  prefix?: string;
}

const DEFAULT_TTL = 43200; // 12 hours

export class RedisCache {
  constructor(
    private store: CacheStore,
    private prefix: string = 'hc:',
  ) {}

  private key(namespace: string, id: string): string {
    return `${this.prefix}${namespace}:${id}`;
  }

  async get<T>(namespace: string, id: string): Promise<T | null> {
    const raw = await this.store.get(this.key(namespace, id));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(namespace: string, id: string, value: T, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
    await this.store.set(this.key(namespace, id), JSON.stringify(value), 'EX', ttlSeconds);
  }

  async del(namespace: string, id: string): Promise<void> {
    await this.store.del(this.key(namespace, id));
  }
}

/**
 * In-memory fallback cache for environments without Redis.
 * Compatible with CacheStore interface shape.
 */
export class MemoryCache implements CacheStore {
  private data = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, _mode: 'EX', ttl: number): Promise<string | null> {
    this.data.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.data.delete(key) ? 1 : 0;
  }
}
