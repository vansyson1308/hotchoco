-- Sprint 11: API keys + consignor users

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  key_hash text not null unique,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.consignor_users (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  consignor_id uuid not null references public.consignors(id) on delete cascade,
  telegram_user_id bigint not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, telegram_user_id)
);

create index if not exists idx_api_keys_shop_status on public.api_keys (shop_id, status);
create index if not exists idx_consignor_users_shop on public.consignor_users (shop_id, consignor_id, status);

alter table public.api_keys enable row level security;
alter table public.consignor_users enable row level security;

create policy shop_isolation_api_keys on public.api_keys
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

create policy shop_isolation_consignor_users on public.consignor_users
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());
