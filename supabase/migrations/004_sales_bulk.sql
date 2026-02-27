-- Sales + bulk receive support

alter table public.consignors
  add column if not exists commission_type text not null default 'FIXED' check (commission_type in ('FIXED','SLIDING')),
  add column if not exists commission_rate_fixed numeric(4,3) not null default 0.300,
  add column if not exists commission_sliding_rules jsonb not null default '[]'::jsonb;

alter table public.sales
  add column if not exists payment_method text check (payment_method in ('CASH','TRANSFER','MOMO','ZALOPAY','CARD')),
  add column if not exists commission_rate numeric(4,3) not null default 0,
  add column if not exists days_consigned integer not null default 1;

alter table public.temp_batches
  add column if not exists media_group_id text,
  add column if not exists item_count integer not null default 0,
  add column if not exists total_intake_vnd bigint not null default 0,
  add column if not exists total_sale_vnd bigint not null default 0,
  add column if not exists closed_at timestamptz;

create table if not exists public.temp_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.temp_batches(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  media_group_id text,
  telegram_file_id text not null,
  caption_raw text,
  parsed_data jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING_CONFIRM',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_temp_batch_items_batch on public.temp_batch_items(batch_id, created_at desc);
create index if not exists idx_sales_shop_payment_sold_at on public.sales(shop_id, payment_method, sold_at desc);
