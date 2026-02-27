import { describe, expect, it } from 'vitest';
import { getRate } from '../../src/core/fxProvider';

describe('THB import path uses stored/manual rate', () => {
  it('returns manual THB rate in provider=none mode', async () => {
    const rate = await getRate('THB', { shopId: 'shop1', exchangeRates: { THB: 650 } }, { provider: 'none' }, async () => 0);
    expect(rate).toBe(650);
    const vnd = Math.round(1000 * rate);
    expect(vnd).toBe(650000);
  });
});
