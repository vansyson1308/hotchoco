export type Platform = 'telegram' | 'zalo' | 'unknown';

export interface NormalizedUser {
  platformUserId: string;
  displayName?: string;
  shopId?: string;
}

export interface NormalizedMedia {
  type: 'photo' | 'video_note' | 'file';
  fileId: string;
  mimeType?: string;
}

export interface NormalizedMessage {
  text?: string;
  command?: string;
  args?: string[];
  media?: NormalizedMedia[];
}

export interface NormalizedEvent {
  platform: Platform;
  chatId: string;
  user: NormalizedUser;
  message: NormalizedMessage;
  raw: unknown;
}

export type NormalizedAction =
  | { type: 'sendText'; chatId: string; text: string }
  | { type: 'sendKeyboard'; chatId: string; text: string; buttons: Array<{ text: string; data: string }> }
  | { type: 'sendFile'; chatId: string; fileUrl: string; caption?: string };

export interface HandlerContext {
  platformCoreV2Enabled: boolean;
  isStaffAuthorized: boolean;
  isConsignorAuthorized?: boolean;
  consignorId?: string;
}
