export type HotChocoErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_INPUT'
  | 'ROUTING_ERROR'
  | 'DB_ERROR'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'EXTERNAL_SERVICE_DOWN'
  | 'VALIDATION_FAILED'
  | 'PERMISSION_DENIED'
  | 'QUOTA_EXCEEDED'
  | 'DB_CONNECTION_LOST';

export type ErrorSeverity = 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO';

const VIETNAMESE_MESSAGES: Record<HotChocoErrorCode, string> = {
  UNAUTHORIZED: 'Bạn chưa được cấp quyền sử dụng bot. Vui lòng liên hệ chủ shop.',
  FORBIDDEN: 'Bạn không có quyền thực hiện lệnh này.',
  INVALID_INPUT: 'Dữ liệu chưa đúng định dạng. Bạn kiểm tra lại giúp mình nhé.',
  ROUTING_ERROR: 'Không nhận diện được yêu cầu. Bạn thử lại hoặc dùng /help nhé.',
  DB_ERROR: 'Hệ thống đang bận lưu dữ liệu. Bạn thử lại sau ít phút.',
  INTERNAL_ERROR: 'Có lỗi hệ thống. Đội ngũ đang xử lý, bạn vui lòng thử lại sau.',
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.',
  TIMEOUT: 'Hệ thống xử lý quá lâu. Vui lòng thử lại sau.',
  RATE_LIMITED: 'Bạn đang gửi lệnh quá nhanh. Vui lòng thử lại sau ít giây.',
  EXTERNAL_SERVICE_DOWN: 'Dịch vụ bên ngoài đang không khả dụng. Vui lòng thử lại sau.',
  VALIDATION_FAILED: 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.',
  PERMISSION_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
  QUOTA_EXCEEDED: 'Bạn đã vượt quá giới hạn sử dụng. Vui lòng nâng cấp gói.',
  DB_CONNECTION_LOST: 'Mất kết nối cơ sở dữ liệu. Hệ thống đang tự khôi phục.',
};

const SEVERITY_MAP: Record<HotChocoErrorCode, ErrorSeverity> = {
  UNAUTHORIZED: 'WARN',
  FORBIDDEN: 'WARN',
  INVALID_INPUT: 'INFO',
  ROUTING_ERROR: 'INFO',
  DB_ERROR: 'ERROR',
  INTERNAL_ERROR: 'ERROR',
  NETWORK_ERROR: 'WARN',
  TIMEOUT: 'WARN',
  RATE_LIMITED: 'INFO',
  EXTERNAL_SERVICE_DOWN: 'ERROR',
  VALIDATION_FAILED: 'INFO',
  PERMISSION_DENIED: 'WARN',
  QUOTA_EXCEEDED: 'INFO',
  DB_CONNECTION_LOST: 'CRITICAL',
};

export interface ErrorLogPayload {
  shop_id: string | null;
  workflow_name: string;
  node_name: string | null;
  telegram_chat_id: number | null;
  level: ErrorSeverity;
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

export function getErrorSeverity(errorCode: HotChocoErrorCode): ErrorSeverity {
  return SEVERITY_MAP[errorCode] ?? 'ERROR';
}

export function buildErrorLogPayload(input: BuildErrorPayloadInput): ErrorLogPayload {
  return {
    shop_id: input.shopId ?? null,
    workflow_name: input.workflowName,
    node_name: input.nodeName ?? null,
    telegram_chat_id: input.telegramChatId ?? null,
    level: getErrorSeverity(input.errorCode),
    error_code: input.errorCode,
    message: input.technicalMessage ?? toVietnameseErrorMessage(input.errorCode),
    context: {
      user_message_vi: toVietnameseErrorMessage(input.errorCode),
      ...(input.context ?? {}),
    },
  };
}

/**
 * Structured error class for programmatic handling.
 */
export class HotChocoError extends Error {
  constructor(
    public readonly code: HotChocoErrorCode,
    message?: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message ?? toVietnameseErrorMessage(code));
    this.name = 'HotChocoError';
  }

  get severity(): ErrorSeverity {
    return getErrorSeverity(this.code);
  }

  get userMessage(): string {
    return toVietnameseErrorMessage(this.code);
  }
}
