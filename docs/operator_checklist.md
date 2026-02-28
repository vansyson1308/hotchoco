# Operator Checklist (hằng ngày)

## Mỗi ngày
- [ ] Bot phản hồi `/start`.
- [ ] Kiểm tra `error_logs` có spike bất thường không.
- [ ] Kiểm tra BG workflows chạy đúng lịch:
  - expiry warning 08:00
  - daily report 21:00
- [ ] Kiểm tra queue/backlog Redis.
- [ ] Kiểm tra backup hôm nay đã tạo thành công.

## Mỗi tuần
- [ ] Test restore nhanh trên môi trường thử.
- [ ] Rà soát token/key rotation plan.
- [ ] Kiểm tra báo cáo bctc/sales có logic ổn định.
