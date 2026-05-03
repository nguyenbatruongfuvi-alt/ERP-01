ERP V30.30 - SYNC TRUE FULL
- Giữ nguyên UI V30.29.
- Fix đồng bộ thật sau offline: tự sync khi có mạng lại, khi app focus/mở lại, khi tab visible, và kiểm tra nền mỗi 5 giây nếu còn hàng chờ.
- Có khóa chống chạy sync song song để tránh ghi trùng khi mạng chập chờn.
- Sau khi sync thành công sẽ refresh cache bộ phận để dữ liệu trên app cập nhật lại.
- Giữ Service Worker offline true từ V30.29.
- Giữ nút Zalo Web Share API + fallback copy link.
- Apps Script không đổi logic, kèm file Code_V30_30_COMPATIBLE_FULL.gs để đối chiếu/dán nếu cần.

Cách test sync:
1. Mở online, đăng nhập.
2. Tắt mạng, nhập dữ liệu và lưu.
3. Thoát màn/mở lại: dữ liệu vẫn còn trên máy.
4. Bật mạng lại, không bấm gì: trong vài giây queue tự đồng bộ.
5. Kiểm tra Google Sheet thấy dữ liệu đã lên.
