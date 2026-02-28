import { describe, expect, it } from 'vitest';
import { buildAnalyticsFallbackReport } from '../src/core/analytics/fallback';

describe('analytics fallback report', () => {
  it('renders deterministic report sections', () => {
    const text = buildAnalyticsFallbackReport({
      rangeLabel: '30d',
      topCategories: [{ category: 'RING', count: 4, revenueVnd: 2000000 }],
      peakHours: [{ hour: 9, count: 8 }],
      slowMovers: [{ sku: 'R1', category: 'RING', ageDays: 45 }],
      consignorScores: [{ consignorId: 'c1', totalItems: 10, soldItems: 7, sellThroughRate: 70, avgDaysToSell: 8 }],
      pricingSuggestions: [{ category: 'RING', recommendedBand: '650000-750000đ', reason: 'Dữ liệu cho thấy nhóm giá này bán nhanh hơn.' }],
      anomalies: [{ code: 'REFUND_SPIKE', level: 'HIGH', message: 'Cảnh báo cần kiểm tra: tỷ lệ refund tăng cao.' }]
    });

    expect(text).toContain('Facts block');
    expect(text).toContain('Insights');
    expect(text).toContain('Recommended actions');
    expect(text).toContain('30d');
  });
});
