export function buildMyItemsQuery(): string {
  return [
    'select sku, category, status, created_at',
    'from public.inventory',
    'where shop_id = $1::uuid and consignor_id = $2::uuid',
    'order by created_at desc',
    'limit 100;'
  ].join(' ');
}

export function buildMySalesQuery(): string {
  return [
    'select s.sku, s.sold_price_vnd, s.sold_at, s.status',
    'from public.sales s',
    'join public.inventory i on i.id = s.inventory_id',
    'where s.shop_id = $1::uuid and i.consignor_id = $2::uuid',
    'order by s.sold_at desc',
    'limit 100;'
  ].join(' ');
}

export function buildMyPayoutsQuery(): string {
  return [
    'select period_start, period_end, gross_sales_vnd, net_payout_vnd, status',
    'from public.settlements',
    'where shop_id = $1::uuid and consignor_id = $2::uuid',
    'order by created_at desc',
    'limit 24;'
  ].join(' ');
}

export function verifyConsignorScope(requestedConsignorId: string, contextConsignorId: string): boolean {
  return requestedConsignorId === contextConsignorId;
}
