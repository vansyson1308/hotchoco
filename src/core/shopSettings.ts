export interface ShopRowSettings {
  timezone?: string | null;
  late_rules?: Record<string, number> | null;
  default_commission_rate?: number | null;
}

export interface ShopResolvedSettings {
  timezone: string;
  lateRules: Record<string, number>;
  defaultCommissionRate: number;
}

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

function validTimezone(tz?: string | null): tz is string {
  if (!tz) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function resolveShopSettings(row: ShopRowSettings): ShopResolvedSettings {
  const timezone = validTimezone(row.timezone) ? row.timezone : DEFAULT_TIMEZONE;
  const defaultCommissionRate = Number.isFinite(row.default_commission_rate)
    ? Math.max(0, Math.min(100, Number(row.default_commission_rate)))
    : 20;

  return {
    timezone,
    lateRules: row.late_rules ?? {},
    defaultCommissionRate
  };
}
