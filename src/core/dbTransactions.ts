export interface SaleTransactionParams {
  shopId: string;
  inventoryId: string;
  sku: string;
  soldByStaffId: string;
  soldPriceVnd: number;
  commissionRate: number;
  commissionAmountVnd: number;
  consignorAmountVnd: number;
  daysConsigned: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'MOMO' | 'ZALOPAY' | 'CARD';
}

export function buildRecordSaleTransactionSQL(): string {
  return [
    'begin;',
    "with inv as (",
    "  select id, shop_id from public.inventory",
    "  where id = $2::uuid and shop_id = $1::uuid and status = 'AVAILABLE'",
    '  for update',
    '), ins as (',
    '  insert into public.sales (shop_id, inventory_id, sku, sold_by_staff_id, sold_price_vnd, commission_rate, commission_amount_vnd, consignor_amount_vnd, days_consigned, payment_method)',
    '  select $1::uuid, $2::uuid, $3, $4::uuid, $5::bigint, $6::numeric, $7::bigint, $8::bigint, $9::int, $10',
    '  from inv',
    '  returning id',
    ')',
    "update public.inventory set status = 'SOLD', sold_at = timezone('utc', now()), updated_at = timezone('utc', now())",
    'where id = $2::uuid and exists(select 1 from ins);',
    'commit;'
  ].join(' ');
}

export function buildRecordSaleRollbackSQL(): string {
  return 'rollback;';
}

export function buildDailySalesReportSQL(): string {
  return [
    'select',
    'coalesce(sum(s.sold_price_vnd),0) as total_revenue_vnd,',
    'coalesce(sum(case when s.status = \'REFUNDED\' then -s.sold_price_vnd else 0 end),0) as refunds_vnd,',
    'jsonb_agg(distinct jsonb_build_object(\'payment_method\', s.payment_method)) filter (where s.payment_method is not null) as by_payment_method,',
    'jsonb_agg(distinct jsonb_build_object(\'staff_id\', s.sold_by_staff_id)) filter (where s.sold_by_staff_id is not null) as by_staff,',
    'jsonb_agg(distinct jsonb_build_object(\'consignor_id\', i.consignor_id)) filter (where i.consignor_id is not null) as by_consignor',
    'from public.sales s',
    'join public.inventory i on i.id = s.inventory_id',
    'where s.shop_id = $1::uuid',
    "and (s.sold_at at time zone 'Asia/Ho_Chi_Minh')::date = $2::date;"
  ].join(' ');
}
