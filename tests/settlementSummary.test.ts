import { describe, expect, it } from 'vitest';
import { formatSettlementSummary } from '../src/core/settlementSummary';

describe('settlement summary formatting', () => {
  it('formats deterministic vietnamese summary with carry-over line', () => {
    const text = formatSettlementSummary({
      consignorName: 'Trang',
      itemCount: 5,
      grossPayoutVnd: 5_000_000,
      shopCommissionVnd: 1_500_000,
      deductionsVnd: 6_000_000,
      netPayoutVnd: 0,
      carryOverVnd: 1_000_000
    });

    expect(text).toContain('Quyết toán nhà ký gửi: Trang');
    expect(text).toContain('Số món: 5');
    expect(text).toContain('Khấu trừ chuyển kỳ sau');
  });
});
