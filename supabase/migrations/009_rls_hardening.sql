-- Sprint 8: RLS hardening with explicit WITH CHECK and helper claim function

create or replace function public.current_shop_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims.shop_id', true), '')::uuid;
$$;

-- recreate tenant policies with explicit read/write conditions

drop policy if exists shop_isolation_staff on public.staff;
create policy shop_isolation_staff on public.staff
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_consignors on public.consignors;
create policy shop_isolation_consignors on public.consignors
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_inventory on public.inventory;
create policy shop_isolation_inventory on public.inventory
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_sales on public.sales;
create policy shop_isolation_sales on public.sales
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_refund_adjustments on public.refund_adjustments;
create policy shop_isolation_refund_adjustments on public.refund_adjustments
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_staff_attendance on public.staff_attendance;
create policy shop_isolation_staff_attendance on public.staff_attendance
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_temp_batches on public.temp_batches;
create policy shop_isolation_temp_batches on public.temp_batches
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_expenses on public.expenses;
create policy shop_isolation_expenses on public.expenses
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_settlements on public.settlements;
create policy shop_isolation_settlements on public.settlements
  for all
  using (shop_id = public.current_shop_id())
  with check (shop_id = public.current_shop_id());

drop policy if exists shop_isolation_error_logs on public.error_logs;
create policy shop_isolation_error_logs on public.error_logs
  for all
  using (shop_id is null or shop_id = public.current_shop_id())
  with check (shop_id is null or shop_id = public.current_shop_id());
