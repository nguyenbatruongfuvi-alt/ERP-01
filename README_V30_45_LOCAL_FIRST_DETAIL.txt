ERP V30.45 - LOCAL-FIRST DETAIL UPDATE

Sửa theo yêu cầu:
1) Sau khi lưu Tăng ca / Biến động / Vắng mặt / Làm ngày lễ, dữ liệu chi tiết được ghi ngay vào cache local.
2) Vừa lưu xong thoát ra xem chi tiết sẽ thấy danh sách ngay, không chờ 10-20 giây đồng bộ Google Sheet.
3) Đồng bộ Google Sheet vẫn chạy nền; dữ liệu local không bị ghi đè rỗng.
4) Báo cáo chi tiết nghe sự kiện local, tự cập nhật nếu đang mở.
5) Chọn nhân viên giữ nguyên vị trí, không nhảy lên đầu.
6) Không đụng package/npm.

File chỉnh:
- src/main.jsx
- sw.js cache v45

Triển khai:
- Upload toàn bộ gói lên Vercel.
- Sau deploy, đóng/mở lại PWA hoặc refresh 1-2 lần để nhận Service Worker v45.
