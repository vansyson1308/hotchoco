export interface SettlementInput {
  grossPayoutVnd: number;
  pendingDeductionVnd: number;
}

export interface SettlementResult {
  appliedDeductionVnd: number;
  carryOverDeductionVnd: number;
  netPayoutVnd: number;
}

export function calculateSettlementNet(input: SettlementInput): SettlementResult {
  const gross = Math.max(0, Math.round(input.grossPayoutVnd));
  const pending = Math.max(0, Math.round(input.pendingDeductionVnd));

  const appliedDeductionVnd = Math.min(gross, pending);
  const netPayoutVnd = gross - appliedDeductionVnd;
  const carryOverDeductionVnd = pending - appliedDeductionVnd;

  return {
    appliedDeductionVnd,
    carryOverDeductionVnd,
    netPayoutVnd
  };
}

export function buildSettlementApplySQL(): string {
  return [
    'begin;',
    'with sale_rows as (',
    '  select s.id, s.commission_amount_vnd, s.consignor_amount_vnd',
    '  from public.sales s',
    '  join public.inventory i on i.id = s.inventory_id',
    "  where s.shop_id = $1::uuid and i.consignor_id = $2::uuid and s.status = 'COMPLETED' and s.settlement_id is null",
    '  for update',
    '), sale_agg as (',
    '  select',
    '    count(*)::int as item_count,',
    '    coalesce(sum(consignor_amount_vnd),0)::bigint as gross_payout_vnd,',
    '    coalesce(sum(commission_amount_vnd),0)::bigint as shop_commission_vnd',
    '  from sale_rows',
    '), adj_agg as (',
    '  select coalesce(sum(amount_vnd),0)::bigint as pending_deduction_vnd',
    '  from public.refund_adjustments',
    "  where shop_id = $1::uuid and consignor_id = $2::uuid and deduction_status = 'PENDING'",
    '), calc as (',
    '  select',
    '    sa.item_count,',
    '    sa.gross_payout_vnd,',
    '    sa.shop_commission_vnd,',
    '    aa.pending_deduction_vnd,',
    '    least(sa.gross_payout_vnd, aa.pending_deduction_vnd)::bigint as applied_deduction_vnd,',
    '    greatest(0, aa.pending_deduction_vnd - sa.gross_payout_vnd)::bigint as carry_over_vnd,',
    '    greatest(0, sa.gross_payout_vnd - aa.pending_deduction_vnd)::bigint as net_payout_vnd',
    '  from sale_agg sa cross join adj_agg aa',
    '), ins as (',
    "  insert into public.settlements (shop_id, consignor_id, period_start, period_end, gross_sales_vnd, commission_total_vnd, refund_deductions_vnd, net_payout_vnd, status)",
    "  select $1::uuid, $2::uuid, $3::date, $4::date, gross_payout_vnd, shop_commission_vnd, applied_deduction_vnd, net_payout_vnd, 'COMPLETED'",
    '  from calc returning id',
    '), upd_sales as (',
    "  update public.sales set settlement_id = (select id from ins), updated_at = timezone('utc', now())",
    '  where id in (select id from sale_rows)',
    '  returning id',
    ')',
    "update public.refund_adjustments set deduction_status = case when (select carry_over_vnd from calc) > 0 then 'PENDING' else 'DEDUCTED' end,",
    '  carry_over_vnd = (select carry_over_vnd from calc),',
    '  deducted_in_settlement_id = (select id from ins),',
    "  note = coalesce(note,'') || ' | settled'",
    "where shop_id = $1::uuid and consignor_id = $2::uuid and deduction_status = 'PENDING';",
    'commit;'
  ].join(' ');
}
