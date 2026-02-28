import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  computeConsignorScores,
  computePeakHours,
  computePricingSuggestions,
  computeSlowMovers,
  computeTopCategories,
  detectAnomalySignals,
  parseAnalyticsWindow
} from '../src/core/analytics/metrics';

const facts = JSON.parse(readFileSync('tests/fixtures/analytics/sampleFacts.json', 'utf8'));

describe('analytics metrics', () => {
  it('parses lookback windows', () => {
    expect(parseAnalyticsWindow('/analytics 7d')).toBe(7);
    expect(parseAnalyticsWindow('/analytics 90d')).toBe(90);
    expect(parseAnalyticsWindow('/analytics')).toBe(30);
  });

  it('computes top categories by revenue', () => {
    const top = computeTopCategories(facts.sales);
    expect(top[0].category).toBe('RING');
    expect(top[0].count).toBeGreaterThanOrEqual(1);
  });

  it('computes peak hours distribution', () => {
    const peaks = computePeakHours(facts.sales);
    expect(peaks[0].hour).toBe(9);
  });

  it('detects slow movers over threshold', () => {
    const slow = computeSlowMovers(facts.inventory, 30);
    expect(slow.some((x) => x.sku === 'R1')).toBe(true);
  });

  it('computes consignor score metrics', () => {
    const scores = computeConsignorScores(facts.inventory, facts.sales);
    const c1 = scores.find((x) => x.consignorId === 'c1');
    expect(c1?.sellThroughRate).toBeGreaterThan(0);
  });

  it('creates explainable pricing suggestions', () => {
    const suggestions = computePricingSuggestions(facts.sales);
    expect(suggestions.some((x) => x.category === 'RING')).toBe(true);
  });

  it('anomaly detector uses need-check wording only', () => {
    const signals = detectAnomalySignals(facts.sales);
    for (const s of signals) {
      expect(s.message.toLowerCase()).toContain('cần kiểm tra');
      expect(s.message.toLowerCase()).not.toMatch(/gian lận|trộm|đánh cắp|thủ phạm/);
    }
  });
});
