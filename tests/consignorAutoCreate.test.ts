import { describe, expect, it } from 'vitest';
import { buildConsignorAutoCreatePayload, detectCurrency } from '../src/core/consignorAutoCreate';

describe('consignor auto-create', () => {
  it('creates defaults with fixed commission and active status', () => {
    const payload = buildConsignorAutoCreatePayload({
      rawConsignor: 'Trang House',
      shopDefaultCommissionRate: 0.3
    });

    expect(payload.commission_type).toBe('FIXED');
    expect(payload.commission_rate_fixed).toBe(0.3);
    expect(payload.status).toBe('ACTIVE');
  });

  it('detects thb currency', () => {
    expect(detectCurrency('BKK Supplier THB')).toBe('THB');
  });
});
