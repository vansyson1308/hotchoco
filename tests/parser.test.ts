import { describe, expect, it } from 'vitest';
import { parseInventoryCaption } from '../src/core/captionParser';

describe('parseInventoryCaption', () => {
  it('parses structured caption with commas', async () => {
    const parsed = await parseInventoryCaption('ks_mai, ring, 350k, 1.2tr');
    expect(parsed).toEqual({
      consignorCode: 'KS_MAI',
      categoryCode: 'RING',
      intakePriceVnd: 350000,
      salePriceVnd: 1200000
    });
  });

  it('parses weird separators with dashes', async () => {
    const parsed = await parseInventoryCaption('ks01 - earring - 350.000 - 450,000');
    expect(parsed.categoryCode).toBe('EARRING');
    expect(parsed.intakePriceVnd).toBe(350000);
    expect(parsed.salePriceVnd).toBe(450000);
  });

  it('uses llm fallback only when regex fails', async () => {
    const llm = {
      async parseCaptionToJson() {
        return {
          consignorCode: 'ks77',
          categoryCode: 'bracelet',
          intakePriceVnd: '200k',
          salePriceVnd: '350k'
        };
      }
    };

    const parsed = await parseInventoryCaption('bad caption', llm);
    expect(parsed).toEqual({
      consignorCode: 'KS77',
      categoryCode: 'BRACELET',
      intakePriceVnd: 200000,
      salePriceVnd: 350000
    });
  });

  it('returns friendly parse error when no llm configured', async () => {
    await expect(parseInventoryCaption('bad caption')).rejects.toThrow(/Caption không hiểu/);
  });
});
