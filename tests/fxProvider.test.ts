import { describe, expect, it, vi } from 'vitest';
import { getRate, mergeExchangeRates, parseSetRateCommand } from '../src/core/fxProvider';

describe('setrate parser + merge + fx fallback', () => {
  it('parses /setrate and validates', () => {
    expect(parseSetRateCommand('/setrate thb 650')).toEqual({ currency: 'THB', rate: 650 });
    expect(() => parseSetRateCommand('/setrate th 650')).toThrow(/Cú pháp đúng/);
  });

  it('merges exchange_rates json', () => {
    expect(mergeExchangeRates({ USD: 25000 }, 'thb', 650)).toEqual({ USD: 25000, THB: 650 });
  });

  it('falls back to manual rate when api fails', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('api down');
    });
    const rate = await getRate(
      'THB',
      { shopId: 's1', exchangeRates: { THB: 650 } },
      { provider: 'api', apiKey: 'k', apiUrl: 'https://fx.example' },
      fetcher
    );
    expect(rate).toBe(650);
  });
});
