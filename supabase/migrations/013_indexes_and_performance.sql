-- Migration 013: Performance indexes and query optimization
-- Composite indexes for frequently-used query patterns

-- Inventory lookups by shop + status (most common query)
create index if not exists idx_inventory_shop_status
  on public.inventory (shop_id, status)
  where status = 'AVAILABLE';

-- Inventory lookups by shop + SKU (sale, refund, return flows)
create index if not exists idx_inventory_shop_sku
  on public.inventory (shop_id, sku);

-- Sales by shop + status for settlement aggregation
create index if not exists idx_sales_shop_status
  on public.sales (shop_id, status)
  where status = 'COMPLETED';

-- Sales by shop + sold_at for daily/monthly reports
create index if not exists idx_sales_shop_sold_at
  on public.sales (shop_id, sold_at desc);

-- Settlement lookups
create index if not exists idx_sales_settlement_id
  on public.sales (settlement_id)
  where settlement_id is not null;

-- Refund adjustments pending deductions (settlement flow)
create index if not exists idx_refund_adj_pending
  on public.refund_adjustments (shop_id, consignor_id)
  where deduction_status = 'PENDING';

-- Staff lookup by telegram user ID (every incoming message)
create index if not exists idx_staff_telegram_user
  on public.staff (telegram_user_id)
  where is_active = true;

-- Temp batches cleanup (cron job)
create index if not exists idx_temp_batches_active
  on public.temp_batches (updated_at)
  where status = 'ACTIVE';

-- Expenses by shop + date (BCTC report)
create index if not exists idx_expenses_shop_date
  on public.expenses (shop_id, expense_date);

-- Error logs by shop + timestamp (debugging)
create index if not exists idx_error_logs_shop_ts
  on public.error_logs (shop_id, created_at desc);

-- Analytics facts for aggregation
create index if not exists idx_analytics_facts_shop_sold
  on public.analytics_facts (shop_id, sold_at desc);

-- API keys lookup optimization
create index if not exists idx_api_keys_hash_active
  on public.api_keys (key_hash)
  where status = 'ACTIVE';
