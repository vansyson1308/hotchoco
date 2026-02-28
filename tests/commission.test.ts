import { describe, expect, it } from 'vitest';
import { calculateCommission } from '../src/core/commission';

describe('commission engine', () => {
  it('calculates fixed commission correctly', () => {
    const result = calculateCommission(
      1_000_000,
      { commissionType: 'FIXED', fixedRate: 0.3 },
      new Date('2026-02-01T00:00:00.000Z'),
      new Date('2026-02-03T00:00:00.000Z')
    );

    expect(result.rate).toBe(0.3);
    expect(result.commissionAmountVnd).toBe(300000);
    expect(result.consignorPayoutVnd).toBe(700000);
  });

  it('calculates sliding commission by day tiers', () => {
    const result = calculateCommission(
      1_000_000,
      {
        commissionType: 'SLIDING',
        slidingRules: [
          { days: 1, rate: 0.2 },
          { days: 5, rate: 0.3 },
          { days: 11, rate: 0.4 }
        ]
      },
      new Date('2026-02-01T00:00:00.000Z'),
      new Date('2026-02-13T00:00:00.000Z')
    );

    expect(result.rate).toBe(0.4);
    expect(result.commissionAmountVnd).toBe(400000);
    expect(result.consignorPayoutVnd).toBe(600000);
  });
});
