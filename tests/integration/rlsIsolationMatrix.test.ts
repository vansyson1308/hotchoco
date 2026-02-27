import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const TENANT_TABLES = [
  'staff',
  'consignors',
  'inventory',
  'sales',
  'refund_adjustments',
  'staff_attendance',
  'temp_batches',
  'expenses',
  'settlements',
  'error_logs',
  'subscriptions',
  'usage_counters_daily',
  'api_keys',
  'consignor_users'
];

describe('RLS isolation policy matrix across shops', () => {
  const sql009 = readFileSync('supabase/migrations/009_rls_hardening.sql', 'utf8');
  const sql010 = readFileSync('supabase/migrations/010_multi_tenant_onboarding_billing.sql', 'utf8');

  it('current_shop_id supports app.current_shop_id first', () => {
    expect(sql010).toContain("current_setting('app.current_shop_id'");
  });

  it('all tenant tables have shop isolation policy statements', () => {
    for (const table of TENANT_TABLES) {
      const marker = table === 'usage_counters_daily'
        ? 'shop_isolation_usage_counters_daily'
        : table === 'subscriptions'
          ? 'shop_isolation_subscriptions'
          : `shop_isolation_${table}`;
      expect(`${sql009}\n${sql010}`).toContain(marker);
    }
  });

  it('policies enforce write protection via WITH CHECK', () => {
    const merged = `${sql009}\n${sql010}`;
    const withCheckCount = (merged.match(/with check \(shop_id = public\.current_shop_id\(\)\)/gi) ?? []).length;
    expect(withCheckCount).toBeGreaterThanOrEqual(10);
  });
});
