-- Sprint 6: settlement summary support, return tracking, expiry warnings

alter type public.inventory_status add value if not exists 'RESERVED';

alter table public.inventory
  add column if not exists expiry_date date,
  add column if not exists returned_at timestamptz;

create index if not exists idx_inventory_expiry_status
  on public.inventory (shop_id, expiry_date, status);
