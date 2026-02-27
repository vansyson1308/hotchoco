import { describe, expect, it } from 'vitest';
import { resolveShopSettings } from '../src/core/shopSettings';

describe('shop settings accessors', () => {
  it('uses row values when valid', () => {
    const s = resolveShopSettings({ timezone: 'Asia/Ho_Chi_Minh', default_commission_rate: 18, late_rules: { tier1: 5000 } });
    expect(s.timezone).toBe('Asia/Ho_Chi_Minh');
    expect(s.defaultCommissionRate).toBe(18);
    expect(s.lateRules.tier1).toBe(5000);
  });

  it('falls back safely for invalid timezone', () => {
    const s = resolveShopSettings({ timezone: 'Bad/TZ', default_commission_rate: null });
    expect(s.timezone).toBe('Asia/Ho_Chi_Minh');
  });
});
