-- Expense/BCTC/BG03 compatibility updates

alter table public.expenses
  add column if not exists recorded_by uuid references public.staff(id);

update public.expenses
set recorded_by = coalesce(recorded_by, recorded_by_staff_id)
where recorded_by is null;

create index if not exists idx_expenses_shop_date
  on public.expenses (shop_id, expense_date desc);
