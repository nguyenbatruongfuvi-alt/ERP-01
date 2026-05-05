ERP V30.46 - LOCAL INSTANT DETAIL + SCROLL

Sửa theo yêu cầu mới:
1) Sau khi lưu Tăng ca / Biến động / Vắng mặt / Làm ngày lễ:
   - ghi ngay danh sách đã chọn vào cache chi tiết local theo key chuẩn hóa bộ phận
   - thoát ra mở chi tiết là thấy ngay, không chờ Google Sheet 5-20 giây
   - Google Sheet vẫn đồng bộ nền sau
2) Tăng độ ổn định khi tên bộ phận khác hoa/thường/dấu:
   - cache chi tiết dùng stripVietnamese cho bộ phận + loại báo cáo + tiêu đề
3) Bỏ câu ghi chú:
   "Dữ liệu chi tiết được ưu tiên lấy từ máy..."
4) Màn chi tiết có nhiều người:
   - danh sách tự cuộn riêng
   - header, thông tin bộ phận, tab và nút Đóng giữ cố định
5) Không đổi package.json / không thêm npm.
6) Service Worker cache version v46 để PWA nhận bản mới.

Sau khi deploy:
- đóng/mở lại PWA hoặc refresh 1-2 lần để nhận cache v46.
