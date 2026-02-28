# n8n Import Workflows & Credentials

## 1) Mở n8n
- URL local: `http://localhost:5678`

## 2) Tạo credentials
- Telegram Bot API
- Postgres (Supabase DB URL)

## 3) Import workflows
- n8n UI → Workflows → Import from File.
- Import toàn bộ JSON trong `n8n/workflows/`.

## 4) Kích hoạt workflow
- Bắt buộc: `master.json` (chỉ 1 Telegram Trigger active).
- BG nên bật:
  - `bg_upload_worker.json`
  - `bg_session_cleanup_cron.json`
  - `bg_daily_report_21h.json`
  - `bg_expiry_warning_08h.json`

## 5) Kiểm tra nhanh
- Gửi `/start` từ Telegram.
- Xem Executions trong n8n có log mới.
