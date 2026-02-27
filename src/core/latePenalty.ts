import { getVNMinutesFromMidnight } from './timezone';

export type PenaltyRule = 'ON_TIME' | 'LATE_MINOR' | 'LATE_MEDIUM' | 'LATE_MAJOR' | 'LATE_CRITICAL';

export interface LatePenaltyTier {
  after_minutes: number;
  penalty: number;
  rule: PenaltyRule;
}

export interface LatePenaltyResult {
  lateMinutes: number;
  penaltyVnd: number;
  rule: PenaltyRule;
  shouldNotifyOwner: boolean;
}

const CHECK_IN_BASE_MINUTES = 9 * 60;

export const DEFAULT_LATE_RULES: LatePenaltyTier[] = [
  { after_minutes: 0, penalty: 0, rule: 'ON_TIME' },
  { after_minutes: 5, penalty: 30000, rule: 'LATE_MINOR' },
  { after_minutes: 30, penalty: 100000, rule: 'LATE_MAJOR' },
  { after_minutes: 60, penalty: 200000, rule: 'LATE_CRITICAL' }
];

export function calculateLatePenalty(checkInTime: Date, tiers: LatePenaltyTier[] = DEFAULT_LATE_RULES): LatePenaltyResult {
  const checkInMinutes = getVNMinutesFromMidnight(checkInTime);
  const lateMinutes = Math.max(checkInMinutes - CHECK_IN_BASE_MINUTES, 0);

  const ordered = [...tiers].sort((a, b) => a.after_minutes - b.after_minutes);
  let selected = ordered[0];

  for (const tier of ordered) {
    if (lateMinutes >= tier.after_minutes) {
      selected = tier;
    }
  }

  return {
    lateMinutes,
    penaltyVnd: selected.penalty,
    rule: selected.rule,
    shouldNotifyOwner: selected.rule === 'LATE_CRITICAL'
  };
}
