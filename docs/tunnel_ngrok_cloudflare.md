# Tunnel Guide: ngrok / Cloudflare Tunnel

## Tại sao phải dùng tunnel?
Vì Telegram webhook cần gọi từ internet vào n8n chạy local của bạn.

## A) ngrok (nhanh nhất)
```bash
ngrok http 5678
```
- Lấy URL HTTPS.
- Set vào `.env`:
```env
WEBHOOK_URL=https://xxxxx.ngrok-free.app/
```
- Restart docker và re-activate workflow master.

## B) Cloudflare Tunnel (ổn định)
1. Cài `cloudflared`.
2. Login và tạo tunnel.
3. Route hostname về `http://localhost:5678`.
4. Dùng hostname đó làm `WEBHOOK_URL`.

## Verify
- `getWebhookInfo` phải trả về URL tunnel/domain đúng.
