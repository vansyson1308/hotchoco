export type HotChocoErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_INPUT'
  | 'ROUTING_ERROR'
  | 'DB_ERROR'
  | 'INTERNAL_ERROR';

const VIETNAMESE_MESSAGES: Record<HotChocoErrorCode, string> = {
  UNAUTHORIZED: 'Bạn chưa được cấp quyền sử dụng bot. Vui lòng liên hệ chủ shop.',
  FORBIDDEN: 'Bạn không có quyền thực hiện lệnh này.',
  INVALID_INPUT: 'Dữ liệu chưa đúng định dạng. Bạn kiểm tra lại giúp mình nhé.',
  ROUTING_ERROR: 'Không nhận diện được yêu cầu. Bạn thử lại hoặc dùng /help nhé.',
  DB_ERROR: 'Hệ thống đang bận lưu dữ liệu. Bạn thử lại sau ít phút.',
  INTERNAL_ERROR: 'Có lỗi hệ thống. Đội ngũ đang xử lý, bạn vui lòng thử lại sau.'
};

export interface ErrorLogPayload {
  shop_id: string | null;
  workflow_name: string;
  node_name: string | null;
  telegram_chat_id: number | null;
  level: 'ERROR';
  error_code: HotChocoErrorCode;
  message: string;
  context: Record<string, unknown>;
}

interface BuildErrorPayloadInput {
  errorCode: HotChocoErrorCode;
  workflowName: string;
  nodeName?: string;
  shopId?: string | null;
  telegramChatId?: number | null;
  context?: Record<string, unknown>;
  technicalMessage?: string;
}

export function toVietnameseErrorMessage(errorCode: HotChocoErrorCode): string {
  return VIETNAMESE_MESSAGES[errorCode] ?? VIETNAMESE_MESSAGES.INTERNAL_ERROR;
}

export function buildErrorLogPayload(input: BuildErrorPayloadInput): ErrorLogPayload {
  return {
    shop_id: input.shopId ?? null,
    workflow_name: input.workflowName,
    node_name: input.nodeName ?? null,
    telegram_chat_id: input.telegramChatId ?? null,
    level: 'ERROR',
    error_code: input.errorCode,
    message: input.technicalMessage ?? toVietnameseErrorMessage(input.errorCode),
    context: {
      user_message_vi: toVietnameseErrorMessage(input.errorCode),
      ...(input.context ?? {})
    }
  };
}
