import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseExpenseCommand } from '../../src/core/expenseParser';
import { canAccessCommand } from '../../src/core/permissions';

function loadFixture(name: string) {
  return JSON.parse(readFileSync(resolve('tests/fixtures/telegram', name), 'utf-8'));
}

describe('expense/bctc fixture + permission', () => {
  it('parses /expense and enforces role permissions', () => {
    const fx = loadFixture('expense-command.json');
    const parsed = parseExpenseCommand(fx.message.text);
    expect(parsed.amountVnd).toBe(1200000);

    expect(canAccessCommand('STAFF', '/expense rent 100k')).toBe(false);
    expect(canAccessCommand('MGR', '/expense rent 100k')).toBe(true);
  });

  it('routes /bctc as owner-only', () => {
    const fx = loadFixture('bctc-command.json');
    expect(fx.message.text).toContain('/bctc');
    expect(canAccessCommand('STAFF', '/bctc 202602')).toBe(false);
    expect(canAccessCommand('OWNER', '/bctc 202602')).toBe(true);
  });
});
