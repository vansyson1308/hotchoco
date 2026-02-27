-- HOT CHOCO PRD v1.1.0 bootstrap schema
-- Supabase-first, multi-tenant, refund carry-over, async media upload, error logging

create extension if not exists pgcrypto;

create type public.staff_role as enum ('OWNER', 'MGR', 'STAFF');
create type public.inventory_status as enum ('AVAILABLE', 'SOLD', 'RETURNED', 'EXPIRED');
create type public.sale_status as enum ('COMPLETED', 'REFUNDED');
create type public.media_status as enum ('PENDING_UPLOAD', 'UPLOADED', 'FAILED');
create type public.attendance_status as enum ('CLOCKED_IN', 'CLOCKED_OUT');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  currency text not null default 'VND',
  late_rules jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  telegram_user_id bigint not null,
  full_name text not null,
  role public.staff_role not null default 'STAFF',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, telegram_user_id)
);

create table if not exists public.consignors (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  code text not null,
  display_name text not null,
  phone text,
  default_commission_rate numeric(5,2) not null default 0,
  payout_cycle_days integer not null default 30,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, code)
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  consignor_id uuid not null references public.consignors(id),
  sku text not null,
  category text not null,
  title text,
  material text,
  condition_note text,
  intake_price_vnd bigint not null check (intake_price_vnd >= 0),
  sale_price_vnd bigint not null check (sale_price_vnd >= 0),
  commission_rate numeric(5,2) not null check (commission_rate >= 0 and commission_rate <= 100),
  status public.inventory_status not null default 'AVAILABLE',
  telegram_file_id text,
  media_storage_path text,
  media_status public.media_status not null default 'PENDING_UPLOAD',
  media_uploaded_at timestamptz,
  intake_batch_id uuid,
  received_by_staff_id uuid references public.staff(id),
  sold_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (shop_id, sku)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  inventory_id uuid not null references public.inventory(id),
  sku text not null,
  sold_by_staff_id uuid references public.staff(id),
  sold_price_vnd bigint not null check (sold_price_vnd >= 0),
  commission_amount_vnd bigint not null check (commission_amount_vnd >= 0),
  consignor_amount_vnd bigint not null check (consignor_amount_vnd >= 0),
  sold_at timestamptz not null default timezone('utc', now()),
  status public.sale_status not null default 'COMPLETED',
  refunded_at timestamptz,
  refund_reason text,
  settlement_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.refund_adjustments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  consignor_id uuid not null references public.consignors(id),
  amount_vnd bigint not null check (amount_vnd > 0),
  deduction_status text not null default 'PENDING',
  deducted_in_settlement_id uuid,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  status public.attendance_status not null,
  video_note_file_id text not null,
  check_at timestamptz not null default timezone('utc', now()),
  late_minutes integer not null default 0,
  penalty_vnd bigint not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.temp_batches (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  staff_id uuid not null references public.staff(id),
  defaults jsonb not null default '{}'::jsonb,
  status text not null default 'OPEN',
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  recorded_by_staff_id uuid references public.staff(id),
  expense_date date not null,
  category text not null,
  amount_vnd bigint not null check (amount_vnd >= 0),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  consignor_id uuid not null references public.consignors(id),
  period_start date not null,
  period_end date not null,
  gross_sales_vnd bigint not null default 0,
  commission_total_vnd bigint not null default 0,
  refund_deductions_vnd bigint not null default 0,
  net_payout_vnd bigint not null default 0,
  status text not null default 'DRAFT',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.error_logs (
  id bigint generated always as identity primary key,
  shop_id uuid references public.shops(id) on delete set null,
  workflow_name text not null,
  node_name text,
  telegram_chat_id bigint,
  level text not null default 'ERROR',
  error_code text,
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_staff_shop_role on public.staff (shop_id, role) where is_active = true;
create index if not exists idx_inventory_shop_status on public.inventory (shop_id, status);
create index if not exists idx_inventory_media_pending on public.inventory (media_status) where media_status <> 'UPLOADED';
create index if not exists idx_sales_shop_sold_at on public.sales (shop_id, sold_at desc);
create index if not exists idx_refund_adjustments_pending on public.refund_adjustments (shop_id, consignor_id) where deduction_status = 'PENDING';
create index if not exists idx_attendance_staff_check_at on public.staff_attendance (staff_id, check_at desc);
create index if not exists idx_temp_batches_expiry on public.temp_batches (expires_at) where status = 'OPEN';
create index if not exists idx_error_logs_created_at on public.error_logs (created_at desc);

create trigger trg_shops_updated before update on public.shops for each row execute function public.set_updated_at();
create trigger trg_staff_updated before update on public.staff for each row execute function public.set_updated_at();
create trigger trg_consignors_updated before update on public.consignors for each row execute function public.set_updated_at();
create trigger trg_inventory_updated before update on public.inventory for each row execute function public.set_updated_at();
create trigger trg_sales_updated before update on public.sales for each row execute function public.set_updated_at();
create trigger trg_refund_adjustments_updated before update on public.refund_adjustments for each row execute function public.set_updated_at();
create trigger trg_temp_batches_updated before update on public.temp_batches for each row execute function public.set_updated_at();
create trigger trg_expenses_updated before update on public.expenses for each row execute function public.set_updated_at();
create trigger trg_settlements_updated before update on public.settlements for each row execute function public.set_updated_at();

alter table public.shops enable row level security;
alter table public.staff enable row level security;
alter table public.consignors enable row level security;
alter table public.inventory enable row level security;
alter table public.sales enable row level security;
alter table public.refund_adjustments enable row level security;
alter table public.staff_attendance enable row level security;
alter table public.temp_batches enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;
alter table public.error_logs enable row level security;

-- Skeleton policy: application sets request.jwt.claims.shop_id in Supabase Auth context.
create policy shop_isolation_shops on public.shops
  for all using (id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_staff on public.staff
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_consignors on public.consignors
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_inventory on public.inventory
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_sales on public.sales
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_refund_adjustments on public.refund_adjustments
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_staff_attendance on public.staff_attendance
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_temp_batches on public.temp_batches
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_expenses on public.expenses
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_settlements on public.settlements
  for all using (shop_id::text = current_setting('request.jwt.claims.shop_id', true));

create policy shop_isolation_error_logs on public.error_logs
  for all using (
    shop_id is null
    or shop_id::text = current_setting('request.jwt.claims.shop_id', true)
  );
