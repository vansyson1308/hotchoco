import { describe, expect, it } from 'vitest';
import { buildSettlementApplySQL } from '../../src/core/settlement';

describe('settlement atomic transaction SQL', () => {
  it('updates sales settlement_id and adjustments in one transaction', () => {
    const sql = buildSettlementApplySQL().toLowerCase();
    expect(sql).toContain('begin;');
    expect(sql).toContain('insert into public.settlements');
    expect(sql).toContain('update public.refund_adjustments');
    expect(sql).toContain('commit;');
  });
});
