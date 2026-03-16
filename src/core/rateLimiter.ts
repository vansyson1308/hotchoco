/**
 * Redis-based rate limiter for bot commands and API requests.
 * Uses a sliding window counter pattern.
 */

export interface RateLimitConfig {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/** Default rate limits by scope */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  /** Per-user Telegram command limit */
  user_command: { maxRequests: 30, windowSeconds: 60 },
  /** Per-shop aggregate limit */
  shop_aggregate: { maxRequests: 200, windowSeconds: 60 },
  /** POS API per-key limit */
  api_key: { maxRequests: 100, windowSeconds: 60 },
};

/**
 * Check rate limit against a Redis-compatible store.
 * Designed to work with ioredis or any compatible client.
 */
export async function checkRateLimit(
  redisExec: {
    incr: (key: string) => Promise<number>;
    expire: (key: string, seconds: number) => Promise<number>;
    ttl: (key: string) => Promise<number>;
  },
  scope: string,
  identifier: string,
  config?: RateLimitConfig,
): Promise<RateLimitResult> {
  const cfg = config ?? RATE_LIMITS[scope] ?? RATE_LIMITS.user_command;
  const key = `rl:${scope}:${identifier}`;

  const count = await redisExec.incr(key);

  if (count === 1) {
    await redisExec.expire(key, cfg.windowSeconds);
  }

  const ttl = await redisExec.ttl(key);
  const resetInSeconds = ttl > 0 ? ttl : cfg.windowSeconds;

  if (count > cfg.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    remaining: cfg.maxRequests - count,
    resetInSeconds,
  };
}

/** Vietnamese message for rate-limited users */
export function rateLimitMessage(resetInSeconds: number): string {
  return `Bạn đang gửi lệnh quá nhanh. Vui lòng thử lại sau ${resetInSeconds} giây.`;
}
