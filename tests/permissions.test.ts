import { describe, expect, it } from 'vitest';
import { canAccessCommand, normalizeCommand } from '../src/core/permissions';

describe('permissions matrix', () => {
  it('allows staff commands for STAFF role', () => {
    expect(canAccessCommand('STAFF', '/sell SKU-123')).toBe(true);
    expect(canAccessCommand('STAFF', '/receive')).toBe(true);
  });

  it('blocks manager/owner-only commands for STAFF role', () => {
    expect(canAccessCommand('STAFF', '/refund SKU-123')).toBe(false);
    expect(canAccessCommand('STAFF', '/bctc 202602')).toBe(false);
  });

  it('allows owner-only command for OWNER role', () => {
    expect(canAccessCommand('OWNER', '/addstaff 123 A STAFF')).toBe(true);
  });

  it('normalizes command casing and arguments', () => {
    expect(normalizeCommand('/ReFuNd sku')).toBe('/refund');
    expect(canAccessCommand('MGR', '/ReFuNd sku')).toBe(true);
  });

  it('rejects unknown command', () => {
    expect(canAccessCommand('OWNER', '/unknown')).toBe(false);
  });
});
