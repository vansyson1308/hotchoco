import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  computeConsignorScores,
  computePeakHours,
  computeSlowMovers,
  computeTopCategories,
  detectAnomalySignals
} from '../../src/core/analytics/metrics';

const facts = JSON.parse(readFileSync('tests/fixtures/analytics/sampleFacts.json', 'utf8'));

describe('analytics facts integration expectations', () => {
  it('matches expected deterministic facts JSON', () => {
    const top = computeTopCategories(facts.sales);
    const peak = computePeakHours(facts.sales);
    const slow = computeSlowMovers(facts.inventory, 30);
    const consignor = computeConsignorScores(facts.inventory, facts.sales);
    const anomalies = detectAnomalySignals(facts.sales);

    expect(top[0]).toMatchObject({ category: 'RING' });
    expect(peak[0]).toMatchObject({ hour: 9 });
    expect(slow.length).toBeGreaterThan(0);
    expect(consignor.length).toBeGreaterThan(0);
    expect(anomalies.every((x) => x.message.includes('cần kiểm tra'))).toBe(true);
  });
});
