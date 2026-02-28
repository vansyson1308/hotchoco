export type CommissionType = 'FIXED' | 'SLIDING';

export interface SlidingRule {
  days: number;
  rate: number;
}

export interface CommissionConfig {
  commissionType: CommissionType;
  fixedRate?: number;
  slidingRules?: SlidingRule[];
}

export interface CommissionResult {
  rate: number;
  commissionAmountVnd: number;
  consignorPayoutVnd: number;
  daysConsigned: number;
}

function roundVnd(input: number): number {
  return Math.round(input);
}

function calcDaysConsigned(receivedAt: Date, soldAt: Date): number {
  const ms = soldAt.getTime() - receivedAt.getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function resolveSlidingRate(daysConsigned: number, rules: SlidingRule[]): number {
  const ordered = [...rules].sort((a, b) => a.days - b.days);
  let picked = ordered[0]?.rate;

  if (picked === undefined) {
    throw new Error('Thiếu cấu hình sliding rules');
  }

  for (const rule of ordered) {
    if (daysConsigned >= rule.days) {
      picked = rule.rate;
    }
  }

  return picked;
}

export function calculateCommission(
  salePriceVnd: number,
  config: CommissionConfig,
  receivedAt: Date,
  soldAt: Date
): CommissionResult {
  if (!Number.isFinite(salePriceVnd) || salePriceVnd < 0) {
    throw new Error('salePriceVnd không hợp lệ');
  }

  const daysConsigned = calcDaysConsigned(receivedAt, soldAt);

  const rate = config.commissionType === 'FIXED'
    ? config.fixedRate ?? 0
    : resolveSlidingRate(daysConsigned, config.slidingRules ?? []);

  if (rate < 0 || rate > 1) {
    throw new Error('Commission rate ngoài phạm vi [0,1]');
  }

  const commissionAmountVnd = roundVnd(salePriceVnd * rate);
  const consignorPayoutVnd = salePriceVnd - commissionAmountVnd;

  return {
    rate,
    commissionAmountVnd,
    consignorPayoutVnd,
    daysConsigned
  };
}
