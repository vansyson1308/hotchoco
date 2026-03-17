# Quickstart cho người không rành kỹ thuật (LOW-TECH)

> Mục tiêu: làm bot chạy được trong 15-30 phút bằng copy/paste.
> **Hướng dẫn đầy đủ chi tiết hơn**: xem `docs/huong-dan-su-dung.md`

## Bước 1: Cài phần mềm
- Docker Desktop (https://docker.com/products/docker-desktop)
- Node.js 20+ (https://nodejs.org)
- ngrok (https://ngrok.com) — nếu chạy trên máy cá nhân

## Bước 2: Lấy source code
### Cách A (không cần Git)
- Download ZIP từ GitHub, giải nén.

### Cách B (dùng Git)
```bash
git clone https://github.com/vansyson1308/hotchoco.git
cd hotchoco
npm install
```

## Bước 3: Tạo Google Service Account
1. Vào https://console.cloud.google.com
2. Tạo project → Bật **Google Sheets API**
3. Tạo **Service Account** → Tải file JSON key
4. Mở bảng tính VJ-Pos → **Share** cho email của Service Account (quyền Editor)

Chi tiết: xem `docs/huong-dan-su-dung.md` mục 2.

## Bước 4: Chuẩn bị bảng tính
```bash
# Chuyển file JSON key thành base64 rồi chạy script setup
# Windows PowerShell:
$json = Get-Content "path\toi\file-key.json" -Raw
$env:GOOGLE_SERVICE_ACCOUNT_JSON = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
$env:GOOGLE_SHEETS_SPREADSHEET_ID = "spreadsheet-id-cua-ban"
node tools/setup-sheets.ts
```

## Bước 5: Tạo `.env`
### macOS/Linux
```bash
cp .env.example .env
```
### Windows PowerShell
```powershell
Copy-Item .env.example .env
```

Điền biến bắt buộc:
- `TELEGRAM_BOT_TOKEN` — lấy từ @BotFather trên Telegram
- `GOOGLE_SHEETS_SPREADSHEET_ID` — lấy từ URL bảng tính
- `GOOGLE_SERVICE_ACCOUNT_JSON` — base64 của file JSON key

## Bước 6: Start Docker
```bash
docker compose -f infra/docker-compose.yml up -d
```

## Bước 7: Mở public URL (bắt buộc vì webhook)
```bash
ngrok http 5678
```
- Copy URL HTTPS.
- Dán vào `.env` → `WEBHOOK_URL=https://abc123.ngrok-free.app/`
- Restart docker:
```bash
docker compose -f infra/docker-compose.yml restart
```

## Bước 8: Import workflow n8n
- Mở `http://localhost:5678`.
- Thêm credential **Google Sheets** (upload file JSON key).
- Import `n8n/workflows/master.json` trước, sau đó các file còn lại.
- Activate workflow `master`.

## Bước 9: Chạy preflight
```bash
npm run doctor
npm run smoke
```

## Bước 10: Test Telegram
1. Mở bot trên Telegram
2. Gõ `/link <PIN>` để liên kết tài khoản
3. Gõ `/start` — nếu bot phản hồi là thành công!

---

Nếu không phản hồi: xem `docs/troubleshooting.md`.
Hướng dẫn đầy đủ lệnh bot: xem `docs/huong-dan-su-dung.md` mục 7-8.
