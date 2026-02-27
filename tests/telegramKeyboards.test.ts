import { describe, expect, it } from 'vitest';
import { intakeConfirmKeyboard, intakeEditFieldKeyboard } from '../src/core/telegramKeyboards';

describe('telegram keyboards', () => {
  it('generates confirm/edit/cancel keyboard with callback_data <= 64 bytes', () => {
    const kb = intakeConfirmKeyboard('abc123');
    const buttons = kb.inline_keyboard[0];
    expect(buttons).toHaveLength(3);
    for (const btn of buttons) {
      expect(Buffer.byteLength(String(btn.callback_data), 'utf-8')).toBeLessThanOrEqual(64);
    }
  });

  it('generates edit field keyboard', () => {
    const kb = intakeEditFieldKeyboard('abc123');
    expect(kb.inline_keyboard.length).toBeGreaterThanOrEqual(2);
  });
});
