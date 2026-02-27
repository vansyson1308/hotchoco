import { describe, expect, it } from 'vitest';
import { buildRecordSaleRollbackSQL, buildRecordSaleTransactionSQL } from '../../src/core/dbTransactions';

describe('dbTransactions SQL', () => {
  it('contains BEGIN/COMMIT and atomic inventory update pattern', () => {
    const sql = buildRecordSaleTransactionSQL().toLowerCase();
    expect(sql).toContain('begin;');
    expect(sql).toContain('for update');
    expect(sql).toContain('insert into public.sales');
    expect(sql).toContain("update public.inventory set status = 'sold'");
    expect(sql).toContain('commit;');
  });

  it('provides rollback SQL', () => {
    expect(buildRecordSaleRollbackSQL().toLowerCase()).toContain('rollback');
  });
});
