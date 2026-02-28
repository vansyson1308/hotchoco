import { describe, expect, it } from 'vitest';
import { toCategoryCode, toCategoryPrefix } from '../src/core/categoryMap';

describe('category mapping', () => {
  it('maps required intake categories', () => {
    expect(toCategoryCode('ring')).toBe('RING');
    expect(toCategoryCode('necklace')).toBe('NECKLACE');
    expect(toCategoryCode('bracelet')).toBe('BRACELET');
    expect(toCategoryCode('earring')).toBe('EARRING');
    expect(toCategoryCode('brooch')).toBe('BROOCH');
    expect(toCategoryCode('other')).toBe('OTHER');
  });

  it('returns valid prefixes', () => {
    expect(toCategoryPrefix('RING')).toBe('RI');
    expect(toCategoryPrefix('OTHER')).toBe('OT');
  });

  it('throws for unsupported category', () => {
    expect(() => toCategoryCode('áo')).toThrow(/không được hỗ trợ/);
  });
});
