import { describe, expect, it } from 'vitest';
import { checkFeatureGate } from '../src/core/gating';

describe('gating feature/quota checks', () => {
  it('blocks when quota exceeded with upgrade message', () => {
    const out = checkFeatureGate({
      featureKey: 'export_enabled',
      metricKey: 'sell_txn',
      currentUsage: 50,
      planCode: 'FREE',
      limits: { features: { export_enabled: true }, quotas_daily: { sell_txn: 50 } },
      enforce: true
    });
    expect(out.allowed).toBe(false);
    expect(out.reason).toBe('QUOTA_EXCEEDED');
    expect(out.upgradeMessage).toMatch(/nâng cấp gói/i);
  });

  it('warn-only mode does not block', () => {
    const out = checkFeatureGate({
      featureKey: 'billing_enabled',
      planCode: 'FREE',
      limits: { features: { billing_enabled: false } },
      enforce: false
    });
    expect(out.allowed).toBe(true);
    expect(out.warnOnly).toBe(true);
  });
});
