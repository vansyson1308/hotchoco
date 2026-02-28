export function parseSellCommand(text: string): string {
  const m = text.trim().match(/^\/sell\s+([A-Z0-9-]+)$/i);
  if (!m) {
    throw new Error('Cú pháp đúng: /sell {SKU}');
  }
  return m[1].toUpperCase();
}

export function paymentMethodKeyboard(sku: string) {
  return {
    inline_keyboard: [
      [
        { text: 'Tiền mặt', callback_data: `sellpay:${sku}:CASH` },
        { text: 'Chuyển khoản', callback_data: `sellpay:${sku}:TRANSFER` }
      ],
      [
        { text: 'MoMo', callback_data: `sellpay:${sku}:MOMO` },
        { text: 'ZaloPay', callback_data: `sellpay:${sku}:ZALOPAY` }
      ],
      [{ text: 'Thẻ', callback_data: `sellpay:${sku}:CARD` }]
    ]
  };
}

export function buildSellSuccessMessage(sku: string, paymentMethod: string, soldPriceVnd: number): string {
  return `✅ Đã bán ${sku}\nThanh toán: ${paymentMethod}\nGiá bán: ${soldPriceVnd.toLocaleString('vi-VN')}đ`;
}
