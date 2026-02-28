# Telegram Setup (BotFather + webhook)

## 1) Tạo bot
1. Mở Telegram, tìm `@BotFather`.
2. Gõ `/newbot`.
3. Lưu token bot.

## 2) Vì sao cần webhook?
Repo này dùng **Telegram Trigger kiểu webhook** trong n8n.
- Nghĩa là Telegram phải gọi được vào URL công khai HTTPS của bạn.

## 3) Cấu hình bot token
- Điền `TELEGRAM_BOT_TOKEN` trong `.env`.

## 4) Kích hoạt workflow master
- Import `n8n/workflows/master.json`.
- Activate workflow.

## 5) Kiểm tra webhook
```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```
Expected: có URL đúng domain/tunnel của bạn.

## 6) Khi đổi ngrok URL
- Cập nhật `WEBHOOK_URL` trong `.env`.
- Restart docker.
- Tắt/bật lại `master.json` để Telegram đăng ký webhook mới.
