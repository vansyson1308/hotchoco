export function buildMonthlyBCTCSQL(): string {
  return [
    'with sales_agg as (',
    '  select',
    '    coalesce(sum(case when s.status = \'COMPLETED\' then s.sold_price_vnd else 0 end),0)::bigint as revenue_vnd,',
    '    coalesce(sum(case when s.status = \'REFUNDED\' then -s.sold_price_vnd else 0 end),0)::bigint as refunds_vnd,',
    '    coalesce(sum(case when s.status = \'COMPLETED\' then s.commission_amount_vnd else 0 end),0)::bigint as commission_kept_vnd,',
    '    coalesce(sum(case when s.status = \'COMPLETED\' then s.consignor_amount_vnd else 0 end),0)::bigint as consignor_payout_vnd',
    '  from public.sales s',
    '  where s.shop_id = $1::uuid',
    "    and to_char(s.sold_at at time zone 'Asia/Ho_Chi_Minh', 'YYYYMM') = $2",
    '), expense_agg as (',
    '  select',
    '    coalesce(sum(e.amount_vnd),0)::bigint as total_expense_vnd,',
    '    jsonb_agg(jsonb_build_object(\'category\', e.category, \'amount_vnd\', e.amount_vnd, \'note\', e.note)) as expense_breakdown',
    '  from public.expenses e',
    '  where e.shop_id = $1::uuid',
    "    and to_char(e.expense_date, 'YYYYMM') = $2",
    ')',
    'select',
    '  s.revenue_vnd, s.refunds_vnd, s.commission_kept_vnd, s.consignor_payout_vnd,',
    '  e.total_expense_vnd, coalesce(e.expense_breakdown, \"[]\"::jsonb) as expense_breakdown,',
    '  (s.commission_kept_vnd - e.total_expense_vnd)::bigint as net_profit_vnd',
    'from sales_agg s cross join expense_agg e;'
  ].join(' ');
}

export function buildDailySalesSummarySQL(): string {
  return [
    'select',
    'coalesce(sum(case when s.status = \'COMPLETED\' then s.sold_price_vnd else 0 end),0)::bigint as revenue_vnd,',
    'coalesce(sum(case when s.status = \'REFUNDED\' then -s.sold_price_vnd else 0 end),0)::bigint as refunds_vnd,',
    'coalesce(sum(case when s.status = \'COMPLETED\' then s.commission_amount_vnd else 0 end),0)::bigint as commission_kept_vnd,',
    'coalesce(sum(case when s.status = \'COMPLETED\' then s.consignor_amount_vnd else 0 end),0)::bigint as consignor_payout_vnd',
    'from public.sales s',
    'where s.shop_id = $1::uuid',
    "and (s.sold_at at time zone 'Asia/Ho_Chi_Minh')::date = $2::date;"
  ].join(' ');
}

export interface MonthlyBCTCData {
  commissionKeptVnd: number;
  totalExpenseVnd: number;
}

export function computeNetProfit(input: MonthlyBCTCData): number {
  return input.commissionKeptVnd - input.totalExpenseVnd;
}


export function computeDailyNetRevenue(revenueVnd: number, refundsVnd: number): number {
  return revenueVnd + refundsVnd;
}
