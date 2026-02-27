-- Refund + settlement carry-over support

create index if not exists idx_sales_refund_lookup
  on public.sales (shop_id, sku, status, sold_at desc);

create index if not exists idx_refund_adjustments_pending_settlement
  on public.refund_adjustments (shop_id, consignor_id, deduction_status, created_at desc);

alter table public.refund_adjustments
  add column if not exists carry_over_vnd bigint not null default 0;
