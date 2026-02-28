import { describe, expect, it } from 'vitest';
import { buildMonthlyBCTCSQL } from '../../src/core/financialReports';

describe('bctc integration sql contract', () => {
  it('contains sales and expenses aggregation fields', () => {
    const sql = buildMonthlyBCTCSQL().toLowerCase();
    expect(sql).toContain('revenue_vnd');
    expect(sql).toContain('refunds_vnd');
    expect(sql).toContain('commission_kept_vnd');
    expect(sql).toContain('consignor_payout_vnd');
    expect(sql).toContain('total_expense_vnd');
    expect(sql).toContain('net_profit_vnd');
  });
});
