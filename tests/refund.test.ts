import { describe, expect, it } from 'vitest';
import { buildRefundDecision } from '../src/core/refund';

describe('refund decision', () => {
  it('no adjustment when sale not settled', () => {
    const decision = buildRefundDecision({
      saleId: 's1',
      inventoryId: 'i1',
      shopId: 'shop1',
      sku: 'RI-2602-ABCD',
      consignorId: 'c1',
      soldPriceVnd: 1000000,
      commissionAmountVnd: 300000,
      consignorAmountVnd: 700000,
      settled: false,
      settlementId: null
    });

    expect(decision.needsAdjustment).toBe(false);
    expect(decision.adjustmentAmountVnd).toBe(0);
  });

  it('creates pending deduction when sale settled', () => {
    const decision = buildRefundDecision({
      saleId: 's2',
      inventoryId: 'i2',
      shopId: 'shop1',
      sku: 'RI-2602-BBBB',
      consignorId: 'c1',
      soldPriceVnd: 1000000,
      commissionAmountVnd: 300000,
      consignorAmountVnd: 700000,
      settled: true,
      settlementId: 'set1'
    });

    expect(decision.needsAdjustment).toBe(true);
    expect(decision.adjustmentAmountVnd).toBe(700000);
  });
});
