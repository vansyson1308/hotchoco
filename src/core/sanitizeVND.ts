const CURRENCY_NOISE_REGEX = /(vnd|đ|dong)/gi;

function normalizeNumberToken(raw: string): string {
  return raw.replace(/\s+/g, '').replace(CURRENCY_NOISE_REGEX, '').trim().toLowerCase();
}

export function sanitizeVND(input: string | number | null | undefined): number {
  if (input === null || input === undefined) {
    throw new Error('Giá trị tiền không được để trống');
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0 || !Number.isInteger(input)) {
      throw new Error('Giá trị tiền VND không hợp lệ');
    }
    return input;
  }

  const token = normalizeNumberToken(input);
  if (!token) {
    throw new Error('Giá trị tiền không được để trống');
  }

  const suffixMatch = token.match(/(k|tr)$/);
  const suffix = suffixMatch?.[1] ?? '';
  const numericPart = suffix ? token.slice(0, -suffix.length) : token;

  if (!numericPart || /[^0-9.,]/.test(numericPart)) {
    throw new Error('Giá trị tiền VND không hợp lệ, vui lòng nhập lại');
  }

  let baseNumber = 0;

  const hasDecimal = numericPart.includes('.') || numericPart.includes(',');
  if (suffix && hasDecimal) {
    const normalizedDecimal = numericPart.replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(normalizedDecimal)) {
      throw new Error('Giá trị tiền VND không hợp lệ, vui lòng nhập lại');
    }
    baseNumber = Number.parseFloat(normalizedDecimal);
  } else {
    const integerDigits = numericPart.replace(/[.,]/g, '');
    if (!/^\d+$/.test(integerDigits)) {
      throw new Error('Giá trị tiền VND không hợp lệ, vui lòng nhập lại');
    }
    baseNumber = Number.parseInt(integerDigits, 10);
  }

  const multiplier = suffix === 'k' ? 1_000 : suffix === 'tr' ? 1_000_000 : 1;
  const result = Math.round(baseNumber * multiplier);

  if (!Number.isSafeInteger(result) || result < 0) {
    throw new Error('Giá trị tiền VND vượt phạm vi cho phép');
  }

  return result;
}
