export interface AutoCreateInput {
  rawConsignor: string;
  shopDefaultCommissionRate: number;
  parsedCurrency?: string;
}

export interface ConsignorInsertPayload {
  code: string;
  display_name: string;
  commission_type: 'FIXED';
  commission_rate_fixed: number;
  currency_default: string;
  status: 'ACTIVE';
}

export function detectCurrency(raw: string): 'THB' | 'VND' {
  const normalized = raw.toUpperCase();
  if (normalized.includes('THB') || normalized.includes('฿')) {
    return 'THB';
  }
  return 'VND';
}

export function buildConsignorAutoCreatePayload(input: AutoCreateInput): ConsignorInsertPayload {
  const displayName = input.rawConsignor.trim();
  if (!displayName) {
    throw new Error('Tên nhà ký gửi không hợp lệ');
  }

  const code = displayName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

  return {
    code: code || 'CONSIGNOR_AUTO',
    display_name: displayName,
    commission_type: 'FIXED',
    commission_rate_fixed: input.shopDefaultCommissionRate,
    currency_default: input.parsedCurrency?.toUpperCase() === 'THB' ? 'THB' : detectCurrency(displayName),
    status: 'ACTIVE'
  };
}
