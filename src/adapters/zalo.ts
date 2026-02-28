import type { NormalizedEvent } from '../core/platform/types';

interface ZaloWebhookPayload {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { text?: string };
}

export function zaloWebhookToNormalizedEvent(payload: ZaloWebhookPayload): NormalizedEvent {
  const text = payload.message?.text?.trim() ?? '';
  const command = text.startsWith('/') ? text.split(/\s+/)[0].toLowerCase() : undefined;
  const args = command ? text.split(/\s+/).slice(1) : [];

  return {
    platform: 'zalo',
    chatId: String(payload.recipient?.id ?? payload.sender?.id ?? ''),
    user: {
      platformUserId: String(payload.sender?.id ?? ''),
      displayName: 'Zalo User'
    },
    message: { text, command, args, media: [] },
    raw: payload
  };
}

// TODO: production Zalo OA send message API adapter with signed requests.
