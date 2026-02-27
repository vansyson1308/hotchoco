import { describe, expect, it } from 'vitest';
import { validateReturnStatus } from '../../src/core/return';
import { parseSetRateCommand } from '../../src/core/fxProvider';

describe('QA regression fixes (P0/P1)', () => {
  it('P0: /return refuses SOLD item', () => {
    const result = validateReturnStatus('SOLD');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/không thể \/return/i);
  });

  it('P1: /setrate accepts lowercase currency and normalizes uppercase', () => {
    const parsed = parseSetRateCommand('/setrate thb 650');
    expect(parsed.currency).toBe('THB');
  });
});
