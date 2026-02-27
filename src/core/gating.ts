export interface PlanLimits {
  features?: Record<string, boolean>;
  quotas_daily?: Record<string, number>;
}

export interface GatingInput {
  featureKey: string;
  metricKey?: string;
  currentUsage?: number;
  planCode: string;
  limits: PlanLimits;
  enforce?: boolean;
}

export interface GatingResult {
  allowed: boolean;
  reason?: string;
  upgradeMessage?: string;
  warnOnly: boolean;
}

function buildUpgradeMessage(planCode: string): string {
  return `Bạn đã chạm giới hạn gói ${planCode}. Vui lòng nâng cấp gói để tiếp tục sử dụng tính năng này.`;
}

export function checkFeatureGate(input: GatingInput): GatingResult {
  const enforce = input.enforce ?? process.env.GATING_ENFORCE !== 'false';
  const featureEnabled = input.limits.features?.[input.featureKey] ?? true;
  const warnOnly = !enforce;

  if (!featureEnabled) {
    return {
      allowed: warnOnly,
      reason: 'FEATURE_DISABLED_BY_PLAN',
      upgradeMessage: buildUpgradeMessage(input.planCode),
      warnOnly
    };
  }

  if (input.metricKey) {
    const limit = input.limits.quotas_daily?.[input.metricKey];
    const current = input.currentUsage ?? 0;
    if (typeof limit === 'number' && current >= limit) {
      return {
        allowed: warnOnly,
        reason: 'QUOTA_EXCEEDED',
        upgradeMessage: buildUpgradeMessage(input.planCode),
        warnOnly
      };
    }
  }

  return { allowed: true, warnOnly };
}
