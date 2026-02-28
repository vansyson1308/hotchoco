# Supabase Setup

## 1) Tạo project Supabase
- Lưu `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, DB password/URL.

## 2) Chạy migrations
Trong Supabase SQL Editor, chạy lần lượt:
- `supabase/migrations/001_init.sql`
- ...
- `supabase/migrations/012_platform_expansion.sql`

## 3) Verify tables
```sql
select table_name
from information_schema.tables
where table_schema='public'
order by table_name;
```

## 4) Verify RLS
```sql
select schemaname, tablename, policyname
from pg_policies
where schemaname='public'
order by tablename, policyname;
```

## 5) Storage buckets
- Tạo bucket media theo nhu cầu triển khai (nếu dùng upload media vào Supabase Storage).

## 6) Ghi chú bảo mật
- Không dùng service key ở frontend/public.
- Chỉ dùng server-side / n8n credential.
