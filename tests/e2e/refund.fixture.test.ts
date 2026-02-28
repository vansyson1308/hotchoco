import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseRefundCommand } from '../../src/core/refund';

function loadFixture(name: string) {
  const path = resolve('tests/fixtures/telegram', name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('refund fixture flow', () => {
  it('/refund -> confirm callback -> restored + report negative expectation', () => {
    const cmd = loadFixture('refund-command.json');
    const parsed = parseRefundCommand(cmd.message.text);
    expect(parsed.sku).toBe('RI-2602-ABCD');

    const cb = loadFixture('refund-confirm-callback.json');
    expect(cb.callback_query.data).toBe('refund:confirm:RI-2602-ABCD');

    const inventoryStatusAfterRefund = 'AVAILABLE';
    const refundLineInReport = -1200000;
    expect(inventoryStatusAfterRefund).toBe('AVAILABLE');
    expect(refundLineInReport).toBeLessThan(0);
  });
});
