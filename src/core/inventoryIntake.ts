import type { ParsedCaption } from './captionParser';
import { intakeConfirmKeyboard } from './telegramKeyboards';

export interface IntakeConfirmationPayload {
  text: string;
  reply_markup: ReturnType<typeof intakeConfirmKeyboard>;
}

export function buildIntakeConfirmationPayload(input: ParsedCaption & { sku: string; ref: string }): IntakeConfirmationPayload {
  const text = [
    '🧾 Xác nhận nhập hàng:',
    `SKU: ${input.sku}`,
    `Nhà ký gửi: ${input.consignorCode}`,
    `Danh mục: ${input.categoryCode}`,
    `Giá nhập: ${input.intakePriceVnd.toLocaleString('vi-VN')}đ`,
    `Giá bán: ${input.salePriceVnd.toLocaleString('vi-VN')}đ`
  ].join('\n');

  return {
    text,
    reply_markup: intakeConfirmKeyboard(input.ref)
  };
}
