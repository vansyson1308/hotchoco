# Quickstart cho người không rành kỹ thuật (LOW-TECH)

> Mục tiêu: làm bot chạy được trong 15-30 phút bằng copy/paste.

## Bước 1: Cài phần mềm
- Docker Desktop
- Node.js 20+
- ngrok

## Bước 2: Lấy source code
### Cách A (không cần Git)
- Download ZIP, giải nén.

### Cách B (dùng Git)
```bash
git clone <REPO_URL> hotchoco
cd hotchoco
```

## Bước 3: Tạo `.env`
### macOS/Linux
```bash
cp .env.example .env
```
### Windows PowerShell
```powershell
Copy-Item .env.example .env
```

Điền biến bắt buộc: `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_DB_URL`.

## Bước 4: Start Docker
```bash
docker compose -f infra/docker-compose.yml up -d
```

## Bước 5: Mở public URL (bắt buộc vì webhook)
```bash
ngrok http 5678
```
- Copy URL HTTPS.
- Dán vào `.env` -> `WEBHOOK_URL=...`.
- Restart docker.

## Bước 6: Import workflow n8n
- Mở `http://localhost:5678`.
- Import các file trong `n8n/workflows`.
- Activate `master.json` + các BG workflow.

## Bước 7: Chạy preflight
```bash
npm run doctor
npm run smoke
```

## Bước 8: Test Telegram
- Gửi `/start` vào bot.
- Nếu không phản hồi: xem `docs/troubleshooting.md`.

---

## Screenshot placeholders
- [Screenshot 1: Docker containers đang Up]
- [Screenshot 2: ngrok có URL HTTPS]
- [Screenshot 3: n8n workflow master đã Active]
- [Screenshot 4: Telegram /start có phản hồi]
