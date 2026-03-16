import { logger } from './logger';

export interface RetryOptions {
  /** Maximum number of attempts (including the first) */
  maxAttempts?: number;
  /** Base delay in ms between retries */
  baseDelayMs?: number;
  /** Use exponential backoff */
  exponential?: boolean;
  /** Optional label for logging */
  label?: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  exponential: true,
  label: 'retry',
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for unreliable external calls (Telegram API, FX provider, etc.)
 * Uses exponential backoff by default.
 */
export async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === opts.maxAttempts) {
        break;
      }

      const delay = opts.exponential ? opts.baseDelayMs * Math.pow(2, attempt - 1) : opts.baseDelayMs;

      logger.warn(
        { label: opts.label, attempt, maxAttempts: opts.maxAttempts, delay, error: lastError.message },
        `Retry attempt ${attempt}/${opts.maxAttempts}`,
      );

      await sleep(delay);
    }
  }

  throw lastError;
}
