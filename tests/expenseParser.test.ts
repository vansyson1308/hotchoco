import { describe, expect, it } from 'vitest';
import { parseExpenseCommand } from '../src/core/expenseParser';

describe('expense parser', () => {
  it('parses valid expense command and sanitizes amount', () => {
    const parsed = parseExpenseCommand('/expense rent 1.2tr tiền nhà tháng 2');
    expect(parsed.category).toBe('RENT');
    expect(parsed.amountVnd).toBe(1200000);
    expect(parsed.note).toContain('tiền nhà');
  });

  it('normalizes categories aliases', () => {
    expect(parseExpenseCommand('/expense luong 350k').category).toBe('SALARY');
    expect(parseExpenseCommand('/expense vc 50k').category).toBe('SHIPPING');
  });

  it('fails for invalid syntax/category/amount', () => {
    expect(() => parseExpenseCommand('/expense')).toThrow(/Cú pháp đúng/);
    expect(() => parseExpenseCommand('/expense abc 100k')).toThrow(/Danh mục/);
    expect(() => parseExpenseCommand('/expense rent xyz')).toThrow(/không hợp lệ/i);
  });
});
