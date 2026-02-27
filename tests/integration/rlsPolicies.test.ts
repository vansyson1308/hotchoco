import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('RLS hardening migration', () => {
  const sql = readFileSync(resolve('supabase/migrations/009_rls_hardening.sql'), 'utf8');

  it('defines helper current_shop_id claim function', () => {
    expect(sql).toMatch(/create or replace function public\.current_shop_id\(\)/i);
  });

  it('enforces WITH CHECK on multi-tenant policies', () => {
    const policyCount = (sql.match(/with check \(shop_id = public\.current_shop_id\(\)\)/gi) ?? []).length;
    expect(policyCount).toBeGreaterThanOrEqual(8);
  });

  it('keeps error_logs nullable-shop writes constrained', () => {
    expect(sql).toMatch(/shop_id is null or shop_id = public\.current_shop_id\(\)/i);
  });
});
