import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { canAccessCommand } from '../../src/core/permissions';
import { parseSetRateCommand } from '../../src/core/fxProvider';
import { buildConsignorAutoCreatePayload } from '../../src/core/consignorAutoCreate';

function loadFixture(name: string) {
  return JSON.parse(readFileSync(resolve('tests/fixtures/telegram', name), 'utf-8'));
}

describe('setrate/export fixtures + auto-create consignor', () => {
  it('/setrate owner-only and parser works', () => {
    const fx = loadFixture('setrate-command.json');
    const parsed = parseSetRateCommand(fx.message.text);
    expect(parsed.currency).toBe('THB');
    expect(canAccessCommand('OWNER', '/setrate THB 650')).toBe(true);
    expect(canAccessCommand('MGR', '/setrate THB 650')).toBe(false);
  });

  it('/export mgr+ allowed but staff blocked', () => {
    const fx = loadFixture('export-command.json');
    expect(fx.message.text).toContain('/export');
    expect(canAccessCommand('MGR', '/export')).toBe(true);
    expect(canAccessCommand('STAFF', '/export')).toBe(false);
  });

  it('new consignor caption auto-create defaults', () => {
    const fx = loadFixture('new-consignor-caption.json');
    const payload = buildConsignorAutoCreatePayload({
      rawConsignor: fx.message.caption.split(',')[0],
      shopDefaultCommissionRate: 0.3,
      parsedCurrency: 'THB'
    });

    expect(payload.currency_default).toBe('THB');
    expect(payload.status).toBe('ACTIVE');
  });
});
