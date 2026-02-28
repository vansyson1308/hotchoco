export type RouteDecision =
  | 'ATTENDANCE_VIDEO_NOTE'
  | 'INTAKE_PHOTO_WITH_CAPTION'
  | 'INTAKE_PHOTO_NO_CAPTION'
  | 'CALLBACK_HANDLER'
  | 'COMMAND_HANDLER'
  | 'TEXT_HANDLER'
  | 'UNSUPPORTED';

interface TelegramMessage {
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string }>;
  video_note?: { file_id: string };
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    data?: string;
    from?: { id: number };
  };
}

export function decideRoute(update: TelegramUpdate): RouteDecision {
  if (update.callback_query?.id) {
    return 'CALLBACK_HANDLER';
  }

  const message = update.message;
  if (!message) {
    return 'UNSUPPORTED';
  }

  if (message.video_note?.file_id) {
    return 'ATTENDANCE_VIDEO_NOTE';
  }

  if (Array.isArray(message.photo) && message.photo.length > 0) {
    if (message.caption && message.caption.trim()) {
      return 'INTAKE_PHOTO_WITH_CAPTION';
    }
    return 'INTAKE_PHOTO_NO_CAPTION';
  }

  const text = message.text?.trim();
  if (!text) {
    return 'UNSUPPORTED';
  }

  if (text.startsWith('/')) {
    return 'COMMAND_HANDLER';
  }

  return 'TEXT_HANDLER';
}
