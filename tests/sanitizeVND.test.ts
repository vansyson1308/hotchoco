import { describe, expect, it } from 'vitest';
import { sanitizeVND } from '../src/core/sanitizeVND';

describe('sanitizeVND matrix', () => {
  it('supports PRD examples and common formats', () => {
    expect(sanitizeVND('350k')).toBe(350000);
    expect(sanitizeVND('1.2tr')).toBe(1200000);
    expect(sanitizeVND('1,2tr')).toBe(1200000);
    expect(sanitizeVND('350.000')).toBe(350000);
    expect(sanitizeVND('350,000')).toBe(350000);
    expect(sanitizeVND('350 000')).toBe(350000);
    expect(sanitizeVND(' 350.000đ ')).toBe(350000);
  });

  it('accepts integer number input', () => {
    expect(sanitizeVND(50000)).toBe(50000);
  });

  it('throws for invalid input', () => {
    expect(() => sanitizeVND('abc')).toThrow(/không hợp lệ/i);
    expect(() => sanitizeVND('12xk')).toThrow(/không hợp lệ/i);
    expect(() => sanitizeVND(-100)).toThrow(/không hợp lệ/i);
  });
});
