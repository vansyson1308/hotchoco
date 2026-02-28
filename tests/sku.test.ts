import { describe, expect, it, vi } from 'vitest';
import { generateSku, generateUniqueSku } from '../src/core/sku';

describe('SKU generation', () => {
  it('generates {CAT_PREFIX}-{YYMM}-{NANOID_4}', () => {
    const sku = generateSku('RING', new Date('2026-02-01T00:00:00.000Z'), () => 'ABCD');
    expect(sku).toBe('RI-2602-ABCD');
  });

  it('retries on collision and returns next unique', async () => {
    const exists = vi
      .fn<(_: string) => Promise<boolean>>()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const token = vi.fn<() => string>().mockReturnValueOnce('AAAA').mockReturnValueOnce('BBBB');

    const sku = await generateUniqueSku('NECKLACE', exists, {
      now: new Date('2026-02-01T00:00:00.000Z'),
      token
    });

    expect(sku).toBe('NE-2602-BBBB');
    expect(exists).toHaveBeenCalledTimes(2);
  });
});
