import type { AnomalySignal, ConsignorScoreMetric, PeakHourMetric, PricingSuggestion, SlowMoverMetric, TopCategoryMetric } from './metrics';

export interface AnalyticsFacts {
  rangeLabel: string;
  topCategories: TopCategoryMetric[];
  peakHours: PeakHourMetric[];
  slowMovers: SlowMoverMetric[];
  consignorScores: ConsignorScoreMetric[];
  pricingSuggestions: PricingSuggestion[];
  anomalies: AnomalySignal[];
}

function lineOrEmpty(lines: string[], empty: string): string {
  return lines.length ? lines.join('\n') : empty;
}

export function buildAnalyticsFallbackReport(facts: AnalyticsFacts): string {
  const top = facts.topCategories.map((x, i) => `${i + 1}. ${x.category}: ${x.count} món, ${x.revenueVnd}đ`);
  const peak = facts.peakHours.slice(0, 3).map((x) => `- ${x.hour}h: ${x.count} giao dịch`);
  const slow = facts.slowMovers.slice(0, 5).map((x) => `- ${x.sku} (${x.category}) tồn ${x.ageDays} ngày`);
  const consignor = facts.consignorScores.slice(0, 5).map((x) => `- ${x.consignorId}: STR ${x.sellThroughRate}% | Avg days ${x.avgDaysToSell ?? 'N/A'}`);
  const pricing = facts.pricingSuggestions.slice(0, 3).map((x) => `- ${x.category}: ${x.recommendedBand} (${x.reason})`);
  const anomalies = facts.anomalies.map((x) => `- ${x.message}`);

  return [
    `📊 *Analytics (${facts.rangeLabel})*`,
    '',
    '*Facts block*',
    '• Top categories:',
    lineOrEmpty(top, '- chưa đủ dữ liệu'),
    '• Peak hours:',
    lineOrEmpty(peak, '- chưa đủ dữ liệu'),
    '• Slow movers:',
    lineOrEmpty(slow, '- chưa đủ dữ liệu'),
    '• Consignor scores:',
    lineOrEmpty(consignor, '- chưa đủ dữ liệu'),
    '',
    '*Insights*',
    lineOrEmpty(pricing, '- chưa đủ dữ liệu để đề xuất giá.'),
    lineOrEmpty(anomalies, '- chưa phát hiện cảnh báo cần kiểm tra.'),
    '',
    '*Recommended actions*',
    '- Ưu tiên đẩy các SKU slow mover trên 30 ngày.',
    '- Điều chỉnh giá theo band đề xuất và theo dõi 7 ngày.',
    '- Rà soát các cảnh báo cần kiểm tra trước khi kết luận.'
  ].join('\n');
}
