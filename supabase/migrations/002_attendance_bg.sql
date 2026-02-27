-- Attendance + background processing enhancements (Sprint 2)

alter table public.staff_attendance
  add column if not exists attendance_date date,
  add column if not exists clock_in_time timestamptz,
  add column if not exists clock_out_time timestamptz,
  add column if not exists penalty_rule text,
  add column if not exists upload_status public.media_status not null default 'PENDING_UPLOAD',
  add column if not exists storage_url text;

update public.staff_attendance
set attendance_date = coalesce(attendance_date, (check_at at time zone 'Asia/Ho_Chi_Minh')::date),
    clock_in_time = coalesce(clock_in_time, check_at),
    penalty_rule = coalesce(penalty_rule, 'ON_TIME')
where attendance_date is null or clock_in_time is null or penalty_rule is null;

alter table public.staff_attendance
  alter column attendance_date set not null,
  alter column clock_in_time set not null,
  alter column penalty_rule set not null;

create unique index if not exists uq_staff_attendance_staff_date
  on public.staff_attendance (staff_id, attendance_date);

-- temp_batches statuses use ACTIVE/CANCELLED in cleanup cron
update public.temp_batches
set status = 'ACTIVE'
where status = 'OPEN';
