import { describe, expect, it } from 'vitest';
import { telegramUpdateToNormalizedEvent } from '../../src/adapters/telegram';
import { zaloWebhookToNormalizedEvent } from '../../src/adapters/zalo';
import { handleNormalizedEvent } from '../../src/core/platform/handlers';

describe('platform normalization + parity', () => {
  it('maps telegram and zalo text command to same handler action', () => {
    const tg = telegramUpdateToNormalizedEvent({ message: { text: '/start', chat: { id: 1 }, from: { id: 2, first_name: 'A' } } });
    const zalo = zaloWebhookToNormalizedEvent({ message: { text: '/start' }, sender: { id: '2' }, recipient: { id: '1' } });

    const tgActions = handleNormalizedEvent(tg, { platformCoreV2Enabled: true, isStaffAuthorized: true });
    const zaloActions = handleNormalizedEvent(zalo, { platformCoreV2Enabled: true, isStaffAuthorized: true });

    expect(tgActions[0].type).toBe('sendText');
    expect(zaloActions[0].type).toBe('sendText');
    expect((tgActions[0] as any).text).toContain('Xin chào');
    expect((zaloActions[0] as any).text).toContain('Xin chào');
  });
});
