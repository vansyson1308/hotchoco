# Hướng dẫn sử dụng Bot Hotchoco

Bot Telegram hỗ trợ quản lý bán hàng, ký gửi, và kế toán cho shop — kết nối trực tiếp với VJ-Pos.

---

## Bước 1: Kết nối tài khoản (chỉ làm 1 lần)

1. Mở Telegram, tìm bot **@hotchoco_bot**
2. Nhấn **Start**
3. Gửi lệnh link với mã PIN bạn đang dùng trên VJ-Pos:
   ```
   /link 1234
   ```
   (thay 1234 bằng PIN của bạn)
4. Bot xác nhận thành công → từ giờ bot nhận diện bạn tự động

**Nếu link thất bại:**
- Kiểm tra PIN đúng chưa (hỏi chủ shop)
- Tài khoản phải đang Active trên VJ-Pos

---

## Bước 2: Sử dụng hàng ngày

### Bán hàng

Nhắn mã SKU trên nhãn sản phẩm:
```
/sell SKU001
```
Bot hiện thông tin sản phẩm → chọn hình thức thanh toán (Tiền mặt / Chuyển khoản / MoMo / ZaloPay / Thẻ) → xong.

### Xem doanh số hôm nay
```
/sales
```

### Nhập hàng ký gửi mới

Gửi **ảnh sản phẩm** kèm caption theo mẫu:
```
SKU: SKU001
Tên: Áo len xanh
Giá: 150000
Ký gửi: ART001
```
Bot tự tạo sản phẩm trong hệ thống.

Nếu nhập nhiều sản phẩm liên tục, gõ `/receive` trước, gửi lần lượt, rồi `/done` khi xong.

### Chấm công

Gửi **1 video ngắn** trực tiếp cho bot (không cần lệnh). Bot tự ghi nhận giờ vào, tính phạt đi muộn nếu có.

---

## Bước 3: Các lệnh nâng cao (Quản lý / Chủ shop)

### Hoàn trả hàng
```
/refund MÃ_ĐƠN lý do
```
Ví dụ: `/refund ORD-20260317-001 khách đổi ý`

### Trả hàng cho người ký gửi
```
/return SKU001
```

### Ghi chi phí
```
/expense 50000 mua túi đựng
```

### Xem thông tin nhà ký gửi
```
/consignor ART001
```

### Quyết toán cho nhà ký gửi
```
/settle ART001
```
Bot tự tính: Tổng bán - Hoa hồng shop - Khấu trừ hoàn trả = Số tiền phải trả.

### Đặt tỷ lệ hoa hồng
```
/setrate ART001 30
```
Đặt 30% hoa hồng cho nhà ký gửi ART001.

### Báo cáo tài chính tháng
```
/bctc
```

### Phân tích
```
/analytics
```

### Xuất file Excel
```
/export
```

---

## Tổng hợp lệnh

| Lệnh | Công dụng | Ai dùng được |
|-------|-----------|--------------|
| `/link PIN` | Kết nối tài khoản | Tất cả |
| `/start` | Lời chào + hướng dẫn | Tất cả |
| `/help` | Xem danh sách lệnh | Tất cả |
| `/sell SKU` | Bán hàng | Tất cả |
| `/sales` | Doanh số hôm nay | Tất cả |
| `/receive` | Bắt đầu nhập hàng | Tất cả |
| `/done` | Kết thúc nhập hàng | Tất cả |
| `/refund MÃ_ĐƠN lý do` | Hoàn trả | Quản lý+ |
| `/return SKU` | Trả hàng ký gửi | Quản lý+ |
| `/expense SỐ_TIỀN ghi chú` | Ghi chi phí | Quản lý+ |
| `/consignor MÃ_KG` | Xem nhà ký gửi | Quản lý+ |
| `/export` | Xuất Excel | Quản lý+ |
| `/settle MÃ_KG` | Quyết toán ký gửi | Chủ shop |
| `/setrate MÃ_KG %` | Đặt hoa hồng | Chủ shop |
| `/bctc` | Báo cáo tài chính | Chủ shop |
| `/analytics` | Phân tích xu hướng | Chủ shop |

---

## Lưu ý quan trọng

- **Tất cả lệnh bắt đầu bằng `/`**
- **Chấm công** = gửi video (không cần lệnh)
- **Nhập hàng** = gửi ảnh + caption (không cần lệnh)
- Dữ liệu đồng bộ **tức thì** với VJ-Pos — bán trên bot, VJ-Pos thấy ngay và ngược lại
- Bot cần internet để hoạt động
- Nếu bot không phản hồi → liên hệ quản trị viên

---

## Câu hỏi thường gặp

**Bot không trả lời?**
→ Đợi vài giây thử lại. Nếu vẫn không được, liên hệ quản trị viên.

**"Bạn chưa được cấp quyền"?**
→ Chưa link tài khoản. Gõ `/link PIN` với mã PIN trên VJ-Pos.

**Tôi muốn đổi tài khoản?**
→ Gõ `/link PIN_MỚI` để link lại với tài khoản khác.

**Dữ liệu có an toàn không?**
→ Có. Dữ liệu lưu trên Google Sheets, được Google backup tự động.
