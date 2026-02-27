-- Sprint 9: multi-tenant onboarding + billing subscriptions + app.current_shop_id support

create or replace function public.current_shop_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('app.current_shop_id', true), '')::uuid,
    nullif(current_setting('request.jwt.claims.shop_id', true), '')::uuid
  );
$$;

create table if not exists public.plans (
  code text primary key,
  name text not null,
  limits_json jsonb not null default '{}'::jsonb,
  price_vnd bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan_code text not null references public.plans(code),
  status text not null default 'ACTIVE',
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, status)
);

create table if not exists public.usage_counters_daily (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  counter_date date not null,
  counters_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, counter_date)
);

create index if not exists idx_subscriptions_shop_status on public.subscriptions (shop_id, status);
create index if not exists idx_usage_counter_shop_date on public.usage_counters_daily (shop_id, counter_date);

create trigger trg_plans_updated before update on public.plans for each row execute function public.set_updated_at();
create trigger trg_subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger trg_usage_counters_daily_updated before update on public.usage_counters_daily for each row execute function public.set_updated_at();

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_counters_daily enable row level security;

-- plans is shared metadata, readable by all authenticated sessions
create policy plans_read_all on public.plans
  for select
  using (true);

create policy shop_isolation_subscriptions on public.subscriptions
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

create policy shop_isolation_usage_counters_daily on public.usage_counters_daily
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

insert into public.plans (code, name, limits_json, price_vnd, is_active)
values (
  'FREE',
  'Free',
  '{"features":{"billing_enabled":false,"export_enabled":true,"onboarding_enabled":true},"quotas_daily":{"sell_txn":50,"intake_items":100}}'::jsonb,
  0,
  true
)
on conflict (code) do update
set limits_json = excluded.limits_json,
    name = excluded.name,
    is_active = excluded.is_active,
    updated_at = timezone('utc', now());
