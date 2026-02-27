import { describe, expect, it } from 'vitest';
import { buildSessionCleanupQuery } from '../../src/core/sessionCleanup';

describe('buildSessionCleanupQuery', () => {
  it('builds active stale cleanup SQL with 2 hour default', () => {
    const query = buildSessionCleanupQuery();
    expect(query).toContain("update public.temp_batches");
    expect(query).toContain("status = 'ACTIVE'");
    expect(query).toContain("interval '2 hours'");
    expect(query).toContain('returning id, shop_id, staff_id');
  });
});
