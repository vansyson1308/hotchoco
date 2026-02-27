-- Inventory intake async photo upload compatibility
alter table public.inventory
  add column if not exists photo_status public.media_status not null default 'PENDING_UPLOAD',
  add column if not exists storage_url text;

update public.inventory
set photo_status = media_status,
    storage_url = coalesce(storage_url, media_storage_path)
where photo_status is null or storage_url is null;
