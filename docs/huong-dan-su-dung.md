# HOTCHOCO x VJ-Pos — Hướng dẫn cài đặt & sử dụng

> Bot Telegram quản lý ký gửi + kế toán, kết nối trực tiếp với app POS (VJ-Pos) qua Google Sheets.
> Thời gian cài đặt: khoảng 20-30 phút.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Tạo Google Service Account](#2-tạo-google-service-account)
3. [Chuẩn bị Google Sheets (VJ-Pos)](#3-chuẩn-bị-google-sheets-vj-pos)
4. [Tạo Telegram Bot](#4-tạo-telegram-bot)
5. [Cài đặt trên máy (hoặc VPS)](#5-cài-đặt-trên-máy-hoặc-vps)
6. [Liên kết tài khoản Telegram](#6-liên-kết-tài-khoản-telegram)
7. [Các lệnh bot](#7-các-lệnh-bot)
8. [Cách dùng hàng ngày](#8-cách-dùng-hàng-ngày)
9. [Câu hỏi thường gặp](#9-câu-hỏi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Thứ cần có | Ghi chú |
|------------|---------|
| **Máy tính hoặc VPS** | Windows / Mac / Linux đều được |
| **Docker Desktop** | Tải tại https://docker.com/products/docker-desktop |
| **Node.js 20+** | Tải tại https://nodejs.org |
| **ngrok** (nếu chạy local) | Tải tại https://ngrok.com — để Telegram gọi được vào máy bạn |
| **Tài khoản Google** | Để tạo Service Account truy cập Google Sheets |
| **Tài khoản Telegram** | Để tạo bot |

---

## 2. Tạo Google Service Account

Đây là bước quan trọng nhất — cho phép bot đọc/ghi vào bảng tính VJ-Pos.

### Bước 2.1: Vào Google Cloud Console
1. Mở https://console.cloud.google.com
2. Tạo project mới (hoặc dùng project có sẵn)
3. Đặt tên project, ví dụ: `hotchoco-bot`

### Bước 2.2: Bật Google Sheets API
1. Vào menu **APIs & Services** → **Library**
2. Tìm **Google Sheets API**
3. Bấm **Enable**

### Bước 2.3: Tạo Service Account
1. Vào **APIs & Services** → **Credentials**
2. Bấm **Create Credentials** → **Service Account**
3. Đặt tên: `hotchoco-sheets`
4. Bấm **Done**

### Bước 2.4: Tạo Key
1. Bấm vào service account vừa tạo
2. Tab **Keys** → **Add Key** → **Create new key**
3. Chọn **JSON** → **Create**
4. File JSON sẽ tự tải về máy — **giữ file này an toàn, không chia sẻ**

### Bước 2.5: Lấy email Service Account
- Ở trang Credentials, copy email dạng: `hotchoco-sheets@hotchoco-bot.iam.gserviceaccount.com`
- **Ghi nhớ email này** — sẽ dùng ở bước tiếp theo

---

## 3. Chuẩn bị Google Sheets (VJ-Pos)

### Bước 3.1: Chia sẻ bảng tính cho Service Account
1. Mở bảng tính VJ-Pos trên Google Sheets
2. Bấm **Share** (Chia sẻ)
3. Dán email Service Account (bước 2.5) vào
4. Chọn quyền **Editor** (Trình chỉnh sửa)
5. Bấm **Send**

### Bước 3.2: Lấy Spreadsheet ID
Từ URL bảng tính:
```
https://docs.google.com/spreadsheets/d/1ABC123XYZ_đây-là-spreadsheet-id/edit
```
Phần giữa `/d/` và `/edit` chính là **Spreadsheet ID**. Copy lại.

### Bước 3.3: Chạy script tạo sheets cho Hotchoco
Script này sẽ tự động thêm các sheet và cột mới cần thiết vào bảng tính VJ-Pos.
Dữ liệu hiện tại của VJ-Pos **KHÔNG bị ảnh hưởng**.

```bash
# Chuyển file JSON key thành base64
# Windows PowerShell:
$json = Get-Content "path\toi\file-key.json" -Raw
$base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
$env:GOOGLE_SERVICE_ACCOUNT_JSON = $base64
$env:GOOGLE_SHEETS_SPREADSHEET_ID = "spreadsheet-id-cua-ban"
node tools/setup-sheets.ts

# Mac/Linux:
export GOOGLE_SERVICE_ACCOUNT_JSON=$(base64 -w0 path/toi/file-key.json)
export GOOGLE_SHEETS_SPREADSHEET_ID="spreadsheet-id-cua-ban"
node tools/setup-sheets.ts
```

Kết quả thành công sẽ hiện:
```
✅ Created HC_Settlements with 10 columns
✅ Created HC_Refund_Adj with 8 columns
✅ Created HC_Attendance with 7 columns
✅ Created HC_Expenses with 7 columns
✅ Created HC_Temp_Batches with 6 columns
✅ Created HC_Config with 2 columns
✅ Added 1 columns to Admin_Staff: Telegram_User_ID
✅ Added 11 columns to Admin_Products: Consignor_Code, ...
✅ Schema setup complete!
```

---

## 4. Tạo Telegram Bot

1. Mở Telegram, tìm **@BotFather**
2. Gõ `/newbot`
3. Đặt tên bot (ví dụ: `VJ POS Bot`)
4. Đặt username bot (ví dụ: `vjpos_bot`)
5. BotFather sẽ gửi cho bạn **Bot Token** dạng:
   ```
   7123456789:AAF1234567890abcdefghijklmnop
   ```
6. **Copy token này** — sẽ dùng ở bước tiếp

---

## 5. Cài đặt trên máy (hoặc VPS)

### Bước 5.1: Tải source code
```bash
git clone https://github.com/vansyson1308/hotchoco.git
cd hotchoco
npm install
```

### Bước 5.2: Tạo file .env
```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Mac/Linux:
cp .env.example .env
```

### Bước 5.3: Điền thông tin vào .env

Mở file `.env` bằng Notepad (hoặc bất kỳ text editor nào) và điền:

```env
# Token bot Telegram (bước 4)
TELEGRAM_BOT_TOKEN=7123456789:AAF1234567890abcdefghijklmnop

# Spreadsheet ID (bước 3.2)
GOOGLE_SHEETS_SPREADSHEET_ID=1ABC123XYZ_spreadsheet-id

# Base64 của file JSON key (bước 3.3)
GOOGLE_SERVICE_ACCOUNT_JSON=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50...

# Giữ nguyên các giá trị khác
```

**Cách lấy base64 của file JSON key:**
```bash
# Windows PowerShell:
$json = Get-Content "C:\path\toi\file-key.json" -Raw
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))

# Mac/Linux:
base64 -w0 path/toi/file-key.json
```

### Bước 5.4: Chạy ngrok (nếu chạy local)
```bash
ngrok http 5678
```
Copy URL HTTPS (ví dụ: `https://abc123.ngrok-free.app`), điền vào `.env`:
```env
WEBHOOK_URL=https://abc123.ngrok-free.app/
```

**Nếu dùng VPS** với domain riêng (ví dụ: `bot.vjpos.vn`):
```env
WEBHOOK_URL=https://bot.vjpos.vn/
```

### Bước 5.5: Khởi động
```bash
docker compose -f infra/docker-compose.yml up -d
```

Kiểm tra đã chạy:
```bash
docker compose -f infra/docker-compose.yml ps
```
Phải thấy `n8n`, `redis`, `pos-api` đều **Up**.

### Bước 5.6: Import workflows vào n8n
1. Mở trình duyệt: http://localhost:5678
2. Tạo tài khoản n8n (lần đầu)
3. **Thêm credentials Google Sheets:**
   - Settings → Credentials → Add Credential
   - Chọn **Google Sheets API**
   - Upload file JSON key (bước 2.4)
   - Đặt tên: `Google Sheets Service Account`
4. **Import workflows:**
   - Bấm **Add Workflow** → **Import from file**
   - Import file `n8n/workflows/master.json` **trước tiên**
   - Sau đó import các file còn lại trong `n8n/workflows/`
5. **Activate workflow master** (bật toggle)
6. Gửi tin nhắn `/start` cho bot trên Telegram để test

---

## 6. Liên kết tài khoản Telegram

Mỗi nhân viên cần liên kết Telegram với tài khoản trên VJ-Pos.

### Cách liên kết:
1. Mở Telegram, tìm bot (ví dụ: @vjpos_bot)
2. Gõ lệnh:
   ```
   /link 1234
   ```
   (thay `1234` bằng **mã PIN** của nhân viên trên VJ-Pos)

3. Bot sẽ trả lời:
   ```
   ✅ Liên kết thành công! Xin chào Lan, bạn đã được kết nối với vai trò STAFF.
   ```

### Nếu link thất bại:
- Kiểm tra PIN đúng chưa (xem sheet `Admin_Staff` trong Google Sheets)
- Kiểm tra cột `Active` = `TRUE`
- Mỗi nhân viên chỉ cần link **1 lần**

---

## 7. Các lệnh bot

### Lệnh cho TẤT CẢ nhân viên

| Lệnh | Mô tả | Ví dụ |
|-------|--------|-------|
| `/link <PIN>` | Liên kết Telegram với tài khoản | `/link 1234` |
| `/start` | Xem lời chào + hướng dẫn | `/start` |
| `/help` | Danh sách lệnh | `/help` |
| `/sell <SKU>` | Ghi nhận bán hàng | `/sell RING-A1B2C3` |
| `/sales` | Xem báo cáo bán hàng hôm nay | `/sales` |
| `/receive` | Bắt đầu nhập hàng mới | `/receive` |
| `/done` | Hoàn tất nhập hàng | `/done` |

### Lệnh cho QUẢN LÝ (MGR) trở lên

| Lệnh | Mô tả | Ví dụ |
|-------|--------|-------|
| `/refund <SKU>` | Hoàn trả hàng | `/refund RING-A1B2C3` |
| `/return <SKU>` | Trả hàng cho ký gửi | `/return RING-A1B2C3` |
| `/expense` | Ghi chi phí | `/expense` |
| `/ks` | Xem danh sách nhà ký gửi | `/ks` |
| `/export` | Xuất Excel | `/export 2026-03-01 2026-03-16` |

### Lệnh cho CHỦ SHOP (OWNER) only

| Lệnh | Mô tả | Ví dụ |
|-------|--------|-------|
| `/settle` | Quyết toán cho nhà ký gửi | `/settle` |
| `/bctc` | Báo cáo tài chính tháng | `/bctc` |
| `/setrate` | Đặt tỷ lệ hoa hồng | `/setrate` |
| `/analytics` | Phân tích xu hướng | `/analytics` |
| `/settings` | Cài đặt shop | `/settings` |

---

## 8. Cách dùng hàng ngày

### 📦 Nhập hàng ký gửi mới
1. Gõ `/receive` trong bot
2. Chụp ảnh sản phẩm + ghi caption theo mẫu:
   ```
   KS01 - Nhẫn bạc - 350.000 - 500.000
   ```
   (Mã ký gửi - Loại - Giá nhập - Giá bán)
3. Bot sẽ hiện xác nhận → Bấm **Confirm**
4. Khi nhập xong, gõ `/done`

### 💰 Ghi nhận bán hàng
1. Gõ `/sell <SKU>` (SKU ghi trên nhãn sản phẩm)
2. Bot hiện thông tin sản phẩm + chọn phương thức thanh toán
3. Bấm: **Tiền mặt** / **Chuyển khoản** / **MoMo** / **ZaloPay** / **Thẻ**
4. Done! Đơn hàng tự động ghi vào Google Sheets

### 🔄 Hoàn trả hàng
1. Gõ `/refund <SKU>`
2. Bot tự xử lý:
   - Nếu chưa quyết toán → hoàn trực tiếp
   - Nếu đã quyết toán → tạo khấu trừ kỳ sau

### 📊 Xem báo cáo
- **Hôm nay**: `/sales`
- **Tháng này**: `/bctc`
- **Xuất Excel**: `/export 2026-03-01 2026-03-16`

### 💵 Quyết toán cho nhà ký gửi
1. Gõ `/settle`
2. Bot tính toán: Tổng bán - Hoa hồng shop - Khấu trừ hoàn = Số tiền trả
3. Xác nhận → Done!

---

## 9. Câu hỏi thường gặp

### Bot không phản hồi?
1. Kiểm tra Docker có chạy không: `docker compose -f infra/docker-compose.yml ps`
2. Kiểm tra ngrok còn chạy không (nếu dùng local)
3. Kiểm tra webhook: mở http://localhost:5678 → xem workflow master có bật không

### "Bạn chưa được cấp quyền sử dụng bot"?
- Chưa link tài khoản → gõ `/link <PIN>`
- PIN sai → kiểm tra sheet `Admin_Staff`

### Dữ liệu có đồng bộ với VJ-Pos không?
**Có!** Cả hai dùng chung Google Sheets. Khi bot ghi bán hàng, VJ-Pos sẽ thấy ngay trên app.

### Tôi có thể dùng cả VJ-Pos và bot cùng lúc không?
**Có.** VJ-Pos quản lý qua app, bot quản lý qua Telegram. Dữ liệu chung 1 bảng tính.

### Giới hạn?
- Google Sheets API: 300 lần đọc/phút, 60 lần ghi/phút
- Đủ cho 1 shop bán ~50-100 đơn/ngày. Không lo bị giới hạn.

### Mất mạng thì sao?
- Bot cần internet để hoạt động
- Dữ liệu trên Google Sheets an toàn (Google backup)
- Khi có mạng lại, bot tự hoạt động bình thường

### Làm sao để tắt/bật bot?
```bash
# Tắt
docker compose -f infra/docker-compose.yml down

# Bật lại
docker compose -f infra/docker-compose.yml up -d
```

---

## Liên hệ hỗ trợ

Nếu gặp vấn đề, liên hệ team kỹ thuật hoặc xem thêm:
- `docs/troubleshooting.md` — Xử lý lỗi thường gặp
- `docs/telegram_setup.md` — Cài đặt Telegram chi tiết
- `docs/n8n_import_and_credentials.md` — Import workflows n8n
