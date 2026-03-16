import { describe, expect, it } from 'vitest';
import { buildSessionCleanupQuery } from '../../src/core/sessionCleanup';

describe('buildSessionCleanupQuery', () => {
  it('builds parameterized cleanup SQL with 2 hour default', () => {
    const { sql, params } = buildSessionCleanupQuery();
    expect(sql).toContain('update public.temp_batches');
    expect(sql).toContain("status = 'ACTIVE'");
    expect(sql).toContain('make_interval');
    expect(sql).toContain('$1');
    expect(sql).toContain('returning id, shop_id, staff_id');
    expect(params).toEqual([2]);
  });
});
