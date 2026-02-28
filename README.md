# HOT CHOCO – Hướng dẫn cài đặt cho người không rành kỹ thuật

## 0) Dự án này là gì?
HOT CHOCO là bot hỗ trợ quản lý bán hàng ký gửi trên Telegram. Hệ thống dùng **n8n** để chạy workflow tự động và **Supabase** để lưu dữ liệu (hàng hóa, bán hàng, hoàn hàng, báo cáo…). Bạn có thể chạy demo trên laptop hoặc triển khai lên VPS để dùng thật.

---

## 1) Tài liệu này dành cho ai?
- Chủ shop / vận hành không biết code.
- Người mới hoàn toàn với terminal.
- Nhân sự triển khai nội bộ cần “copy/paste là chạy”.

---

## 2) Bạn cần chuẩn bị gì? (Checklist)

### Tài khoản
- [ ] **Telegram Bot Token** (lấy từ BotFather).
- [ ] **Supabase project** (Cloud Supabase).
- [ ] (Tuỳ chọn) **Zalo OA** nếu muốn thử prototype Zalo.

### Phần mềm
- [ ] **Docker Desktop** (bắt buộc cho local demo).
- [ ] **Node.js 20+** (để chạy test / doctor / POS API).
- [ ] **Git** (tuỳ chọn; nếu không dùng thì tải ZIP).

### Giải thích dễ hiểu
- **n8n**: công cụ kéo-thả để tự động hoá (workflow).
- **Supabase**: nơi lưu dữ liệu (giống “database online”).
- **Redis**: hàng đợi tác vụ nền cho n8n queue mode.

---

## 3) Từ điển nhanh (Glossary)
- **Webhook**: “đường dây nhận tin” từ Telegram gửi vào hệ thống của bạn.
- **Public URL**: địa chỉ internet bên ngoài truy cập được (https://...).
- **Tunnel**: tạo cầu nối từ internet vào máy local (ví dụ ngrok/Cloudflare Tunnel).
- **ngrok**: công cụ tạo public URL nhanh cho máy local.
- **Cloudflare Tunnel**: tunnel ổn định hơn, phù hợp chạy lâu dài.
- **Reverse proxy**: lớp trung gian map domain HTTPS về app nội bộ.
- **Supabase**: PostgreSQL + API + auth/storage quản trị.
- **n8n**: nơi chạy logic bot.
- **Redis**: hàng đợi để worker xử lý nền.

---

## 4) Chọn cách cài đặt
- **OPTION A – Easiest Local Demo (khuyên dùng)**: chạy trên laptop + tunnel.
- **OPTION B – VPS / Production**: chạy server công khai với domain.
- **OPTION C – Advanced Dev**: dành cho dev muốn chỉnh sâu.

---

## 5) OPTION A — Local Demo (copy/paste từng bước)

## A1) Tải project
### Cách 1: Download ZIP
1. Vào trang repo.
2. Bấm **Code → Download ZIP**.
3. Giải nén vào thư mục ví dụ `C:\hotchoco` (Windows) hoặc `~/hotchoco` (macOS/Linux).

### Cách 2: Git clone
```bash
git clone <REPO_URL> hotchoco
cd hotchoco
```

## A2) Tạo file `.env` từ `.env.example`
### macOS/Linux
```bash
cp .env.example .env
```

### Windows PowerShell
```powershell
Copy-Item .env.example .env
```

Mở file `.env` và điền các giá trị thật (KHÔNG commit file này).

Ví dụ mẫu (giá trị giả):
```env
N8N_HOST=localhost
N8N_PROTOCOL=http
WEBHOOK_URL=https://abc123.ngrok-free.app/
N8N_ENCRYPTION_KEY=replace-with-32-char-secret
TELEGRAM_BOT_TOKEN=123456:ABCDEF_fake_token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_DB_URL=postgresql://postgres:password@host:5432/postgres
```

> ⚠️ **Bảo mật**: Tuyệt đối không dán token/key thật vào README hoặc commit Git.

## A3) Khởi động hạ tầng Docker
```bash
docker compose -f infra/docker-compose.yml up -d
```

Kiểm tra container:
```bash
docker ps
```

**Expected output**: thấy `n8n`, `redis`, `postgres` ở trạng thái `Up`.

Mở trình duyệt:
- n8n: `http://localhost:5678`

## A4) Cấu hình Supabase (Cloud)
1. Mở Supabase Dashboard → SQL Editor.
2. Chạy migration theo thứ tự:
   - `supabase/migrations/001_init.sql`
   - ...
   - `supabase/migrations/012_platform_expansion.sql`

Kiểm tra nhanh bảng:
```sql
select table_name
from information_schema.tables
where table_schema='public'
order by table_name;
```

## A5) Thiết lập n8n lần đầu
1. Vào `http://localhost:5678`.
2. Tạo owner account n8n.
3. Tạo credentials cần thiết trong n8n:
   - Telegram Bot API
   - Postgres/Supabase connection

## A6) CỰC KỲ QUAN TRỌNG: Public URL cho Telegram webhook
### Kết luận kỹ thuật của repo này
Repo hiện dùng **Telegram Trigger dạng webhook** (không polling).
- Bằng chứng: `n8n/workflows/master.json` có node `n8n-nodes-base.telegramTrigger`.

➡️ **Nếu chạy local mà không có public HTTPS URL, Telegram sẽ KHÔNG gọi được vào máy bạn.**

### Dùng ngrok (dễ nhất)
1. Cài ngrok: https://ngrok.com/download
2. Mở terminal mới:
```bash
ngrok http 5678
```
3. Copy URL dạng `https://xxxxx.ngrok-free.app`
4. Cập nhật `.env`:
```env
WEBHOOK_URL=https://xxxxx.ngrok-free.app/
```
5. Restart stack:
```bash
docker compose -f infra/docker-compose.yml down
docker compose -f infra/docker-compose.yml up -d
```
6. Mở lại n8n và re-activate workflow `master.json`.

### Cloudflare Tunnel (tuỳ chọn)
Xem hướng dẫn chi tiết: `docs/tunnel_ngrok_cloudflare.md`.

## A7) Import workflows
1. n8n UI → Workflows → Import from File.
2. Import các file trong `n8n/workflows/`.
3. Kích hoạt:
   - **Bắt buộc**: `master.json` (chỉ 1 Telegram Trigger).
   - BG workflows:
     - `bg_upload_worker.json`
     - `bg_session_cleanup_cron.json`
     - `bg_daily_report_21h.json`
     - `bg_expiry_warning_08h.json`

**Expected**: danh sách workflows hiển thị đúng tên, không lỗi parse JSON.

## A8) Cấu hình lệnh bot bằng BotFather
Xem chi tiết: `docs/telegram_setup.md`.

## A9) Chạy Doctor / Preflight
```bash
npm run doctor
```

**Expected**: phần lớn dòng là `✅`.

## A10) Manual Smoke Test Checklist (đầy đủ)
1. `/start`
2. user không có quyền gửi `/sales` → bị chặn
3. attendance bằng `video_note`
4. intake photo + caption → confirm/edit/cancel
5. `/sell {SKU}`
6. `/refund {SKU}`
7. `/settle`
8. `/expense`
9. `/bctc`
10. `/return {SKU}`
11. `/setrate THB 650`
12. `/export`
13. `/analytics 30d`
14. Trigger thủ công BG workflows trong n8n UI:
   - upload worker
   - cleanup cron
   - daily 21:00
   - expiry 08:00
15. Kiểm tra `healthcheck.json` và `alert_on_failure.json`

## A11) Nếu có lỗi
Xem `docs/troubleshooting.md`.

---

## 6) OPTION B — VPS / Production

### B1) Domain + reverse proxy
- Dùng VPS có domain công khai HTTPS.
- Mở port 80/443 công khai.
- Reverse proxy về n8n (5678).
- Set `.env`:
```env
N8N_HOST=bot.yourdomain.com
N8N_PROTOCOL=https
WEBHOOK_URL=https://bot.yourdomain.com/
```

### B2) Always-on tunnel
- Dùng Cloudflare Tunnel chạy service nền.
- Trỏ public hostname về `http://localhost:5678`.

### Safety checklist production
- [ ] HTTPS bắt buộc
- [ ] Firewall chỉ mở port cần thiết
- [ ] Đã set đầy đủ env
- [ ] Backup schedule chạy mỗi ngày
- [ ] Chỉ 1 Telegram Trigger active

---

## 7) An toàn dữ liệu & bảo mật (phi kỹ thuật)
- Không chia sẻ `SUPABASE_SERVICE_KEY`.
- Mỗi shop bị cô lập bởi RLS.
- Lỗi hệ thống lưu ở `error_logs` để truy vết.
- Áp dụng quyền tối thiểu cho người vận hành.

---

## 8) Backup & Restore
Xem: `docs/backup_restore.md`

---

## 9) Troubleshooting
Xem: `docs/troubleshooting.md`

---

## 10) FAQ cho người không rành kỹ thuật
**Q: Vì sao tôi cần ngrok/tunnel?**
A: Vì Telegram webhook cần gọi vào URL công khai HTTPS. Máy local không có URL công khai sẵn.

**Q: Bot không trả lời dù n8n đang chạy?**
A: Kiểm tra webhook + `WEBHOOK_URL` + tunnel + chỉ 1 Telegram Trigger active.

**Q: n8n chạy nhưng không nhận message?**
A: 90% là thiếu Public URL hoặc webhook chưa cập nhật.

**Q: Supabase báo permission denied?**
A: Kiểm tra RLS context/migrations và credentials.

**Q: Muốn reset hệ thống an toàn?**
A: Backup trước, sau đó mới reset DB/container. Luôn test lại bằng `npm run smoke`.

---

## Liên kết tài liệu chi tiết
- `docs/quickstart_lowtech.md`
- `docs/telegram_setup.md`
- `docs/tunnel_ngrok_cloudflare.md`
- `docs/n8n_import_and_credentials.md`
- `docs/supabase_setup.md`
- `docs/runbook.md`
- `docs/troubleshooting.md`
- `docs/backup_restore.md`
- `docs/operator_checklist.md`
