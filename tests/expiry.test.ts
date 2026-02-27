import { describe, expect, it } from 'vitest';
import { buildExpiryWarningQuery } from '../src/core/expiry';

describe('expiry warning query', () => {
  it('filters by +3 days VN timezone and valid statuses', () => {
    const sql = buildExpiryWarningQuery().toLowerCase();
    expect(sql).toContain("status in ('available','reserved')");
    expect(sql).toContain("expiry_date is not null");
    expect(sql).toContain("interval '3 day'");
    expect(sql).toContain("asia/ho_chi_minh");
  });
});
