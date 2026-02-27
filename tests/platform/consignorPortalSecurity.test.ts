import { describe, expect, it } from 'vitest';
import { buildMyItemsQuery, buildMyPayoutsQuery, buildMySalesQuery, verifyConsignorScope } from '../../src/core/consignorPortal';

describe('consignor portal security', () => {
  it('queries are scoped by shop_id + consignor_id', () => {
    expect(buildMyItemsQuery()).toContain('shop_id = $1::uuid and consignor_id = $2::uuid');
    expect(buildMySalesQuery()).toContain('shop_id = $1::uuid and i.consignor_id = $2::uuid');
    expect(buildMyPayoutsQuery()).toContain('shop_id = $1::uuid and consignor_id = $2::uuid');
  });

  it('consignor cannot access another consignor data', () => {
    expect(verifyConsignorScope('c1', 'c1')).toBe(true);
    expect(verifyConsignorScope('c2', 'c1')).toBe(false);
  });
});
