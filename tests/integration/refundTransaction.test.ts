import { describe, expect, it } from 'vitest';
import { buildRefundTransactionSQL } from '../../src/core/refund';

describe('refund ACID SQL', () => {
  it('marks sale refunded, restores inventory, and inserts adjustment when settled', () => {
    const sql = buildRefundTransactionSQL().toLowerCase();
    expect(sql).toContain('begin;');
    expect(sql).toContain("update public.sales set status='refunded'");
    expect(sql).toContain("update public.inventory set status='available'");
    expect(sql).toContain('insert into public.refund_adjustments');
    expect(sql).toContain('commit;');
  });
});
