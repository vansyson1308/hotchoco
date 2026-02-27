export interface SaleFact {
  category: string;
  soldPriceVnd: number;
  soldAt: string;
  isRefunded?: boolean;
  staffId?: string;
  consignorId?: string;
  daysToSell?: number;
}

export interface InventoryFact {
  sku: string;
  category: string;
  status: string;
  ageDays: number;
  consignorId?: string;
}

export interface TopCategoryMetric {
  category: string;
  count: number;
  revenueVnd: number;
}

export interface PeakHourMetric { hour: number; count: number }

export interface SlowMoverMetric { sku: string; category: string; ageDays: number }

export interface ConsignorScoreMetric {
  consignorId: string;
  totalItems: number;
  soldItems: number;
  sellThroughRate: number;
  avgDaysToSell: number | null;
}

export interface PricingSuggestion {
  category: string;
  recommendedBand: string;
  reason: string;
}

export interface AnomalySignal { code: string; message: string; level: 'LOW' | 'MEDIUM' | 'HIGH' }

export function parseAnalyticsWindow(input: string | null | undefined): 7 | 30 | 90 {
  const cmd = (input ?? '').toLowerCase();
  if (cmd.includes('7d')) return 7;
  if (cmd.includes('90d')) return 90;
  return 30;
}

export function computeTopCategories(sales: SaleFact[], limit = 5): TopCategoryMetric[] {
  const map = new Map<string, TopCategoryMetric>();
  for (const s of sales) {
    if (s.isRefunded) continue;
    const category = s.category.toUpperCase();
    const cur = map.get(category) ?? { category, count: 0, revenueVnd: 0 };
    cur.count += 1;
    cur.revenueVnd += Math.max(0, Math.round(s.soldPriceVnd));
    map.set(category, cur);
  }
  return [...map.values()].sort((a, b) => b.revenueVnd - a.revenueVnd).slice(0, limit);
}

export function computePeakHours(sales: SaleFact[]): PeakHourMetric[] {
  const map = new Map<number, number>();
  for (const s of sales) {
    if (s.isRefunded) continue;
    const hour = new Date(s.soldAt).getHours();
    map.set(hour, (map.get(hour) ?? 0) + 1);
  }
  return [...map.entries()].map(([hour, count]) => ({ hour, count })).sort((a, b) => b.count - a.count || a.hour - b.hour);
}

export function computeSlowMovers(inventory: InventoryFact[], minDays = 30): SlowMoverMetric[] {
  return inventory
    .filter((i) => ['AVAILABLE', 'RESERVED'].includes(i.status.toUpperCase()) && i.ageDays >= minDays)
    .sort((a, b) => b.ageDays - a.ageDays)
    .map((i) => ({ sku: i.sku, category: i.category.toUpperCase(), ageDays: i.ageDays }));
}

export function computeConsignorScores(inventory: InventoryFact[], sales: SaleFact[]): ConsignorScoreMetric[] {
  const soldByConsignor = new Map<string, SaleFact[]>();
  for (const s of sales) {
    if (!s.consignorId || s.isRefunded) continue;
    const arr = soldByConsignor.get(s.consignorId) ?? [];
    arr.push(s);
    soldByConsignor.set(s.consignorId, arr);
  }

  const totalByConsignor = new Map<string, number>();
  for (const i of inventory) {
    if (!i.consignorId) continue;
    totalByConsignor.set(i.consignorId, (totalByConsignor.get(i.consignorId) ?? 0) + 1);
  }

  return [...totalByConsignor.entries()].map(([consignorId, totalItems]) => {
    const sold = soldByConsignor.get(consignorId) ?? [];
    const soldItems = sold.length;
    const sellThroughRate = totalItems > 0 ? Number(((soldItems / totalItems) * 100).toFixed(2)) : 0;
    const avgDaysToSell = soldItems > 0
      ? Number((sold.reduce((acc, s) => acc + Math.max(0, s.daysToSell ?? 0), 0) / soldItems).toFixed(2))
      : null;
    return { consignorId, totalItems, soldItems, sellThroughRate, avgDaysToSell };
  }).sort((a, b) => b.sellThroughRate - a.sellThroughRate);
}

export function computePricingSuggestions(sales: SaleFact[]): PricingSuggestion[] {
  const byCategory = new Map<string, SaleFact[]>();
  for (const s of sales) {
    if (s.isRefunded) continue;
    const key = s.category.toUpperCase();
    const arr = byCategory.get(key) ?? [];
    arr.push(s);
    byCategory.set(key, arr);
  }

  const out: PricingSuggestion[] = [];
  for (const [category, rows] of byCategory.entries()) {
    if (rows.length < 3) continue;
    const sorted = [...rows].sort((a, b) => a.soldPriceVnd - b.soldPriceVnd);
    const median = sorted[Math.floor(sorted.length / 2)].soldPriceVnd;
    const fast = rows.filter((x) => (x.daysToSell ?? 999) <= 14);
    const fastMedian = fast.length ? [...fast].sort((a, b) => a.soldPriceVnd - b.soldPriceVnd)[Math.floor(fast.length / 2)].soldPriceVnd : median;
    const bandMin = Math.round(fastMedian * 0.9);
    const bandMax = Math.round(fastMedian * 1.1);
    out.push({
      category,
      recommendedBand: `${bandMin}-${bandMax}đ`,
      reason: `Dữ liệu cho thấy nhóm giá gần ${fastMedian}đ có tốc độ bán tốt hơn trong 14 ngày.`
    });
  }
  return out;
}

export function detectAnomalySignals(sales: SaleFact[]): AnomalySignal[] {
  const signals: AnomalySignal[] = [];
  if (sales.length < 10) return signals;

  const refundRate = sales.filter((s) => s.isRefunded).length / sales.length;
  if (refundRate >= 0.2) {
    signals.push({
      code: 'REFUND_SPIKE',
      level: 'HIGH',
      message: 'Cảnh báo cần kiểm tra: tỷ lệ refund tăng cao bất thường so với tổng giao dịch.'
    });
  }

  const offHours = sales.filter((s) => {
    const h = new Date(s.soldAt).getHours();
    return h < 8 || h > 22;
  }).length;
  if (offHours / sales.length >= 0.15) {
    signals.push({
      code: 'OFF_HOUR_SALES',
      level: 'MEDIUM',
      message: 'Cảnh báo cần kiểm tra: xuất hiện nhiều giao dịch ngoài khung giờ vận hành thông thường.'
    });
  }

  const staffCounts = new Map<string, number>();
  for (const s of sales) {
    if (!s.staffId) continue;
    staffCounts.set(s.staffId, (staffCounts.get(s.staffId) ?? 0) + 1);
  }
  const counts = [...staffCounts.values()];
  if (counts.length >= 2) {
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const max = Math.max(...counts);
    if (max >= avg * 2.2) {
      signals.push({
        code: 'STAFF_OUTLIER',
        level: 'LOW',
        message: 'Cảnh báo cần kiểm tra: chênh lệch sản lượng theo nhân sự cao hơn mức thông thường.'
      });
    }
  }

  return signals;
}
