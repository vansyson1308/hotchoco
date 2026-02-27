import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseInventoryCaption } from '../../src/core/captionParser';
import { buildIntakeConfirmationPayload } from '../../src/core/inventoryIntake';

function loadFixture(name: string) {
  const path = resolve('tests/fixtures/telegram', name);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

describe('inventory intake confirmation payload', () => {
  it('photo+caption produces expected confirmation payload', async () => {
    const fixture = loadFixture('inventory-photo-caption.json');
    const parsed = await parseInventoryCaption(fixture.message.caption);

    const payload = buildIntakeConfirmationPayload({
      ...parsed,
      sku: 'RI-2602-ABCD',
      ref: 'abc123'
    });

    expect(payload.text).toContain('SKU: RI-2602-ABCD');
    expect(payload.text).toContain('Nhà ký gửi: KS_MAI');
    expect(payload.reply_markup.inline_keyboard[0]).toHaveLength(3);
  });
});
