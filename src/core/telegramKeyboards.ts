export type IntakeAction = 'confirm' | 'edit' | 'cancel';

function callbackData(action: IntakeAction, ref: string, field?: string): string {
  const data = field ? `inv:${action}:${ref}:${field}` : `inv:${action}:${ref}`;
  if (Buffer.byteLength(data, 'utf-8') > 64) {
    throw new Error('callback_data vượt quá 64 bytes');
  }
  return data;
}

export function intakeConfirmKeyboard(ref: string) {
  return {
    inline_keyboard: [[
      { text: '✅ Xác nhận', callback_data: callbackData('confirm', ref) },
      { text: '✏️ Sửa', callback_data: callbackData('edit', ref) },
      { text: '❌ Hủy', callback_data: callbackData('cancel', ref) }
    ]]
  };
}

export function intakeEditFieldKeyboard(ref: string) {
  return {
    inline_keyboard: [
      [
        { text: 'Nhà ký gửi', callback_data: callbackData('edit', ref, 'consignor') },
        { text: 'Danh mục', callback_data: callbackData('edit', ref, 'category') }
      ],
      [
        { text: 'Giá nhập', callback_data: callbackData('edit', ref, 'intake') },
        { text: 'Giá bán', callback_data: callbackData('edit', ref, 'sale') }
      ],
      [{ text: '❌ Hủy', callback_data: callbackData('cancel', ref) }]
    ]
  };
}
