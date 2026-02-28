import { describe, expect, it } from 'vitest';
import { buildReturnItemSQL, validateReturnStatus } from '../src/core/return';

describe('/return guard rails', () => {
  it('rejects SOLD item', () => {
    const result = validateReturnStatus('SOLD');
    expect(result.ok).toBe(false);
  });

  it('is idempotent for already RETURNED', () => {
    const result = validateReturnStatus('RETURNED');
    expect(result.ok).toBe(true);
    expect(result.message).toContain('RETURNED');
  });

  it('allows AVAILABLE/RESERVED and SQL sets RETURNED', () => {
    expect(validateReturnStatus('AVAILABLE').ok).toBe(true);
    expect(validateReturnStatus('RESERVED').ok).toBe(true);
    expect(buildReturnItemSQL().toLowerCase()).toContain("set status = 'returned'");
  });
});
