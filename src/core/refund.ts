export interface RefundSaleSnapshot {
  saleId: string;
  inventoryId: string;
  shopId: string;
  sku: string;
  consignorId: string;
  soldPriceVnd: number;
  commissionAmountVnd: number;
  consignorAmountVnd: number;
  settled: boolean;
  settlementId?: string | null;
}

export interface RefundDecision {
  needsAdjustment: boolean;
  adjustmentAmountVnd: number;
  userHint: string;
}

export function buildRefundDecision(snapshot: RefundSaleSnapshot): RefundDecision {
  if (!snapshot.settled) {
    return {
      needsAdjustment: false,
      adjustmentAmountVnd: 0,
      userHint: 'Sale chưa quyết toán, hoàn hàng trực tiếp không tạo khấu trừ kỳ sau.'
    };
  }

  return {
    needsAdjustment: true,
    adjustmentAmountVnd: snapshot.consignorAmountVnd,
    userHint: 'Sale đã quyết toán, sẽ tạo khấu trừ kỳ sau cho nhà ký gửi.'
  };
}

export function buildRefundTransactionSQL(): string {
  return [
    'begin;',
    "with target as (",
    "  select s.id as sale_id, s.inventory_id, s.shop_id, s.sku, i.consignor_id,",
    "         s.consignor_amount_vnd, s.settlement_id",
    '  from public.sales s',
    '  join public.inventory i on i.id = s.inventory_id',
    "  where s.shop_id = $1::uuid and s.sku = $2 and s.status = 'COMPLETED'",
    '  order by s.sold_at desc',
    '  limit 1',
    '  for update',
    '), upd_sale as (',
    "  update public.sales set status='REFUNDED', refunded_at=timezone('utc', now()), refund_reason=$3, updated_at=timezone('utc', now())",
    '  where id = (select sale_id from target)',
    '  returning id',
    '), upd_inv as (',
    "  update public.inventory set status='AVAILABLE', sold_at=null, updated_at=timezone('utc', now())",
    '  where id = (select inventory_id from target)',
    '  returning id',
    '), ins_adj as (',
    "  insert into public.refund_adjustments (shop_id, sale_id, consignor_id, amount_vnd, deduction_status, note)",
    "  select shop_id, sale_id, consignor_id, consignor_amount_vnd, 'PENDING', 'AUTO REFUND SETTLED'",
    '  from target',
    '  where settlement_id is not null',
    '  returning id',
    ')',
    'select',
    '  (select count(*) from upd_sale) as refunded_sale_count,',
    '  (select count(*) from upd_inv) as restored_inventory_count,',
    '  (select count(*) from ins_adj) as adjustment_count;',
    'commit;'
  ].join(' ');
}

export function parseRefundCommand(text: string): { sku: string } {
  const m = text.trim().match(/^\/refund\s+([A-Z0-9-]+)$/i);
  if (!m) {
    throw new Error('Cú pháp đúng: /refund {SKU}');
  }
  return { sku: m[1].toUpperCase() };
}
