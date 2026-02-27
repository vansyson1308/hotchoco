import { customAlphabet } from 'nanoid';
import { toCategoryPrefix } from './categoryMap';

const SKU_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const skuToken = customAlphabet(SKU_ALPHABET, 4);

function yymmUTC(date: Date): string {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

export function generateSku(categoryCode: string, now: Date = new Date(), token: () => string = skuToken): string {
  const prefix = toCategoryPrefix(categoryCode);
  return `${prefix}-${yymmUTC(now)}-${token()}`;
}

export async function generateUniqueSku(
  categoryCode: string,
  exists: (sku: string) => Promise<boolean>,
  options?: { maxRetries?: number; now?: Date; token?: () => string }
): Promise<string> {
  const maxRetries = options?.maxRetries ?? 5;
  const now = options?.now ?? new Date();
  const token = options?.token ?? skuToken;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const sku = generateSku(categoryCode, now, token);
    // idempotent collision retry on UNIQUE violation pattern
    // caller should still guard final insert with DB unique constraint
    if (!(await exists(sku))) {
      return sku;
    }
  }

  throw new Error('Không thể tạo SKU duy nhất sau nhiều lần thử');
}
