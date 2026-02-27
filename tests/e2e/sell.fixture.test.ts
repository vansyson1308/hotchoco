import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSellSuccessMessage, parseSellCommand, paymentMethodKeyboard } from '../../src/core/salesFlow';

function loadFixture(name: string) {
  const path = resolve('tests/fixtures/telegram', name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('sell flow fixture', () => {
  it('/sell -> payment method -> success response', () => {
    const cmd = loadFixture('sell-command.json');
    const sku = parseSellCommand(cmd.message.text);
    expect(sku).toBe('RI-2602-ABCD');

    const kb = paymentMethodKeyboard(sku);
    expect(kb.inline_keyboard[0][0].callback_data).toBe('sellpay:RI-2602-ABCD:CASH');

    const cb = loadFixture('sell-payment-callback.json');
    expect(cb.callback_query.data).toContain('sellpay:RI-2602-ABCD:CASH');

    const msg = buildSellSuccessMessage(sku, 'CASH', 1200000);
    expect(msg).toContain('Đã bán RI-2602-ABCD');
  });
});
