import { describe, it, expect } from 'vitest';
import { buildSessionCleanupQuery } from '../src/core/sessionCleanup.js';

describe('sessionCleanup parameterized query', () => {
  it('returns parameterized SQL with $1 placeholder', () => {
    const { sql, params } = buildSessionCleanupQuery();
    expect(sql).toContain('$1');
    expect(sql).not.toMatch(/'\d+ hours'/);
    expect(params).toEqual([2]);
  });

  it('uses custom staleAfterHours', () => {
    const { params } = buildSessionCleanupQuery({ staleAfterHours: 4 });
    expect(params).toEqual([4]);
  });

  it('clamps minimum to 1 hour', () => {
    const { params } = buildSessionCleanupQuery({ staleAfterHours: 0 });
    expect(params[0]).toBeGreaterThanOrEqual(1);
  });

  it('clamps maximum to 72 hours', () => {
    const { params } = buildSessionCleanupQuery({ staleAfterHours: 200 });
    expect(params[0]).toBeLessThanOrEqual(72);
  });

  it('uses make_interval for safe parameterization', () => {
    const { sql } = buildSessionCleanupQuery();
    expect(sql).toContain('make_interval');
  });
});
