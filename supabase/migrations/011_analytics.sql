-- Sprint 10 analytics snapshots + indexes

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  range_code text not null,
  facts_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_sales_created_at on public.sales (created_at desc);
create index if not exists idx_inventory_created_status on public.inventory (created_at desc, status);
create index if not exists idx_inventory_consignor on public.inventory (consignor_id);
create index if not exists idx_analytics_snapshots_shop_range on public.analytics_snapshots (shop_id, range_code, created_at desc);

alter table public.analytics_snapshots enable row level security;
create policy shop_isolation_analytics_snapshots on public.analytics_snapshots
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());
