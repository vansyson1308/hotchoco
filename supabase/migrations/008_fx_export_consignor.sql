-- Sprint 7: FX, export, consignor auto-create compatibility

alter table public.shops
  add column if not exists exchange_rates jsonb not null default '{}'::jsonb,
  add column if not exists default_commission_rate numeric(4,3) not null default 0.300;

alter table public.consignors
  add column if not exists currency_default text not null default 'VND',
  add column if not exists status text not null default 'ACTIVE';

create index if not exists idx_consignors_shop_display_name
  on public.consignors (shop_id, lower(display_name));
