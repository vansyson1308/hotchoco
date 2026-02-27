import { describe, expect, it } from 'vitest';
import { normalizedActionsToTelegramRequests, telegramUpdateToNormalizedEvent } from '../../src/adapters/telegram';
import { zaloWebhookToNormalizedEvent } from '../../src/adapters/zalo';

describe('platform adapters', () => {
  it('normalizes telegram media and command', () => {
    const ev = telegramUpdateToNormalizedEvent({
      message: {
        text: '/myitems',
        chat: { id: 1 },
        from: { id: 2, first_name: 'U' },
        photo: [{ file_id: 'p1' }]
      }
    });
    expect(ev.message.command).toBe('/myitems');
    expect(ev.message.media?.[0].type).toBe('photo');
  });

  it('normalizes zalo text command', () => {
    const ev = zaloWebhookToNormalizedEvent({ message: { text: '/myitems' }, sender: { id: '2' }, recipient: { id: '1' } });
    expect(ev.platform).toBe('zalo');
    expect(ev.message.command).toBe('/myitems');
  });

  it('maps normalized actions to telegram api payloads', () => {
    const req = normalizedActionsToTelegramRequests([{ type: 'sendText', chatId: '1', text: 'hello' }]);
    expect(req[0].method).toBe('sendMessage');
    expect(req[0].payload.text).toBe('hello');
  });
});
