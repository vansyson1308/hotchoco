import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canAccessCommand } from '../../src/core/permissions';
import { buildSettlementApplySQL } from '../../src/core/settlement';

function loadFixture(name: string) {
  return JSON.parse(readFileSync(resolve('tests/fixtures/telegram', name), 'utf-8'));
}

describe('return and settle fixtures', () => {
  it('/return permission: MGR allowed, STAFF blocked', () => {
    const a = loadFixture('return-command-authorized.json');
    const u = loadFixture('return-command-unauthorized.json');
    expect(a.message.text).toContain('/return');
    expect(u.message.text).toContain('/return');
    expect(canAccessCommand('MGR', '/return RI-2602-ABCD')).toBe(true);
    expect(canAccessCommand('STAFF', '/return RI-2602-ABCD')).toBe(false);
  });

  it('/settle called twice should not double-apply settled sales', () => {
    const fx = loadFixture('settle-command-twice.json');
    expect(fx.message.text).toContain('/settle');
    const sql = buildSettlementApplySQL().toLowerCase();
    expect(sql).toContain('status = \'completed\'');
  });
});
