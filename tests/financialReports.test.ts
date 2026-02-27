import { describe, expect, it } from 'vitest';
import { buildDailySalesSummarySQL, buildMonthlyBCTCSQL, computeDailyNetRevenue, computeNetProfit } from '../src/core/financialReports';

describe('financial reports helpers', () => {
  it('computes net profit = commission_kept - total_expense', () => {
    expect(computeNetProfit({ commissionKeptVnd: 900000, totalExpenseVnd: 250000 })).toBe(650000);
  });

  it('daily net reduced by negative refunds', () => {
    expect(computeDailyNetRevenue(1200000, -200000)).toBe(1000000);
  });

  it('contains SQL aggregators for monthly and daily reports', () => {
    const monthly = buildMonthlyBCTCSQL().toLowerCase();
    const daily = buildDailySalesSummarySQL().toLowerCase();
    expect(monthly).toContain('net_profit_vnd');
    expect(monthly).toContain("status = 'refunded'");
    expect(daily).toContain("status = 'refunded'");
  });
});
