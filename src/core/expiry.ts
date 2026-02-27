export function buildExpiryWarningQuery(): string {
  return [
    'select',
    '  i.shop_id,',
    '  i.sku,',
    '  c.display_name as consignor_name,',
    '  i.expiry_date',
    'from public.inventory i',
    'join public.consignors c on c.id = i.consignor_id',
    "where i.status in ('AVAILABLE','RESERVED')",
    '  and i.expiry_date is not null',
    "  and i.expiry_date = ((timezone('Asia/Ho_Chi_Minh', now()))::date + interval '3 day')::date",
    'order by i.shop_id, c.display_name, i.sku;'
  ].join(' ');
}
