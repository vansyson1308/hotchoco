import { describe, expect, it } from 'vitest';
import { buildSettlementApplySQL } from '../../src/core/settlement';

describe('settlement SQL with deductions', () => {
  it('computes net payout and applies/keeps carry-over deductions', () => {
    const sql = buildSettlementApplySQL().toLowerCase();
    expect(sql).toContain('insert into public.settlements');
    expect(sql).toContain('update public.sales set settlement_id');
    expect(sql).toContain('update public.refund_adjustments set deduction_status');
    expect(sql).toContain('carry_over_vnd');
    expect(sql).toContain('commit;');
  });
});
