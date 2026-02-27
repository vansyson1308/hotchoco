import { describe, expect, it } from 'vitest';
import { buildExpiryWarningQuery } from '../../src/core/expiry';

describe('bg04 expiry query integration contract', () => {
  it('includes sku + consignor fields for alert message', () => {
    const sql = buildExpiryWarningQuery().toLowerCase();
    expect(sql).toContain('i.sku');
    expect(sql).toContain('consignor_name');
    expect(sql).toContain('order by');
  });
});
