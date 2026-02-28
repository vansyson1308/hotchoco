import type { NormalizedAction, NormalizedEvent } from '../core/platform/types';

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id: number | string };
    from?: { id: number | string; first_name?: string };
    photo?: Array<{ file_id: string }>;
    video_note?: { file_id: string };
  };
}

export function telegramUpdateToNormalizedEvent(update: TelegramUpdate): NormalizedEvent {
  const msg = update.message ?? {};
  const text = msg.text?.trim() ?? '';
  const command = text.startsWith('/') ? text.split(/\s+/)[0].toLowerCase() : undefined;
  const args = command ? text.split(/\s+/).slice(1) : [];

  const media = [] as NormalizedEvent['message']['media'];
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    media?.push({ type: 'photo', fileId: msg.photo[msg.photo.length - 1].file_id });
  }
  if (msg.video_note?.file_id) {
    media?.push({ type: 'video_note', fileId: msg.video_note.file_id });
  }

  return {
    platform: 'telegram',
    chatId: String(msg.chat?.id ?? ''),
    user: {
      platformUserId: String(msg.from?.id ?? ''),
      displayName: msg.from?.first_name
    },
    message: {
      text,
      command,
      args,
      media
    },
    raw: update
  };
}

export interface TelegramApiRequest {
  method: 'sendMessage' | 'sendDocument';
  payload: Record<string, string>;
}

export function normalizedActionsToTelegramRequests(actions: NormalizedAction[]): TelegramApiRequest[] {
  return actions.map((action) => {
    if (action.type === 'sendText') {
      return { method: 'sendMessage', payload: { chat_id: action.chatId, text: action.text } };
    }

    if (action.type === 'sendKeyboard') {
      return {
        method: 'sendMessage',
        payload: {
          chat_id: action.chatId,
          text: action.text,
          reply_markup: JSON.stringify({ inline_keyboard: [action.buttons.map((b) => ({ text: b.text, callback_data: b.data }))] })
        }
      };
    }

    return {
      method: 'sendDocument',
      payload: {
        chat_id: action.chatId,
        document: action.fileUrl,
        caption: action.caption ?? ''
      }
    };
  });
}
