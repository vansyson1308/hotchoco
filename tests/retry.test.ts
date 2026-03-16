import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../src/core/retry.js';

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValueOnce('ok');
    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail1')).mockResolvedValueOnce('ok');

    const result = await withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent fail'));

    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow('persistent fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses exponential backoff by default', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('ok');

    const start = Date.now();
    await withRetry(fn, { maxAttempts: 3, baseDelayMs: 10, exponential: true });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(8);
  });

  it('handles non-Error exceptions', async () => {
    const fn = vi.fn().mockRejectedValueOnce('string error').mockResolvedValueOnce('ok');

    const result = await withRetry(fn, { maxAttempts: 2, baseDelayMs: 1 });
    expect(result).toBe('ok');
  });
});
