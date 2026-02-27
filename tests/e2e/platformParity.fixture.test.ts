import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { telegramUpdateToNormalizedEvent } from '../../src/adapters/telegram';
import { zaloWebhookToNormalizedEvent } from '../../src/adapters/zalo';
import { handleNormalizedEvent } from '../../src/core/platform/handlers';

function load(path: string): any { return JSON.parse(readFileSync(path, 'utf8')); }

describe('fixture parity Telegram vs Zalo (text)', () => {
  it('produces equivalent sendText action intent', () => {
    const tg = telegramUpdateToNormalizedEvent(load('tests/e2e/fixtures/platform/telegram-start.json'));
    const zl = zaloWebhookToNormalizedEvent(load('tests/e2e/fixtures/platform/zalo-start.json'));
    const a = handleNormalizedEvent(tg, { platformCoreV2Enabled: true, isStaffAuthorized: true });
    const b = handleNormalizedEvent(zl, { platformCoreV2Enabled: true, isStaffAuthorized: true });
    expect(a[0].type).toBe('sendText');
    expect(b[0].type).toBe('sendText');
    expect((a[0] as any).text).toBe((b[0] as any).text);
  });
});
