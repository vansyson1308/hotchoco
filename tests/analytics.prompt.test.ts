import { describe, expect, it } from 'vitest';
import { buildAnalyticsSummaryPrompt } from '../src/core/analytics/prompt';

describe('analytics prompt guardrails', () => {
  it('contains strict anti-hallucination rules', () => {
    const prompt = buildAnalyticsSummaryPrompt('{"x":1}', '30d');
    expect(prompt).toContain('Không được tự tạo số');
    expect(prompt).toContain('JSON facts');
    expect(prompt).toContain('cần kiểm tra');
  });
});
