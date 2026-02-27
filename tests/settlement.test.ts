import { describe, expect, it } from 'vitest';
import { calculateSettlementNet } from '../src/core/settlement';

describe('settlement carry-over', () => {
  it('net payout deducts pending adjustments', () => {
    const result = calculateSettlementNet({ grossPayoutVnd: 2_000_000, pendingDeductionVnd: 300_000 });
    expect(result.netPayoutVnd).toBe(1_700_000);
    expect(result.appliedDeductionVnd).toBe(300_000);
    expect(result.carryOverDeductionVnd).toBe(0);
  });

  it('carry-over remains when deductions exceed gross', () => {
    const result = calculateSettlementNet({ grossPayoutVnd: 200_000, pendingDeductionVnd: 500_000 });
    expect(result.netPayoutVnd).toBe(0);
    expect(result.appliedDeductionVnd).toBe(200_000);
    expect(result.carryOverDeductionVnd).toBe(300_000);
  });
});
