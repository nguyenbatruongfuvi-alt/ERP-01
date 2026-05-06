ERP V30.56 - FINAL REPORT / PRINT / PASSWORD EYE

Đã sửa trên nền V30.55:
1) Giữ phần đổi mật khẩu:
   - Mật khẩu mới có con mắt.
   - Nhập lại mật khẩu mới có con mắt.
   - Mặc định hiện mật khẩu.

2) Báo cáo bộ phận:
   - Áp dụng cơ chế local-first giống Tăng ca sáng.
   - Lưu xong cập nhật ngay trên máy.
   - Không để Apps Script trả chậm ghi đè giao diện vừa lưu.
   - Đồng thời cập nhật cache Báo cáo công ty theo dữ liệu local.

3) Các màn con từ Tăng ca đến Làm ngày lễ:
   - Màn mẹ đọc local/preload ngay sau khi lưu để giảm tình trạng trong 3 ngoài 2 trong vài giây đầu.

4) Giao việc vai trò Quản lý:
   - Cache danh sách tổ trưởng.
   - Vừa đăng nhập đã nạp nền danh sách tổ trưởng.
   - Mở Giao việc ưu tiên hiện danh sách đã cache, không phải chờ vài giây nếu đã có cache.

5) In báo cáo:
   - Thêm In báo cáo Biến động.
   - Thêm In báo cáo Vắng mặt.
   - Chỉnh tên khi xem trước/xuất Excel:
     + Báo cáo tăng ca
     + Báo cáo làm ngày lễ
     + Báo cáo chuyển bộ phận
     + Báo cáo biến động nhân sự
     + Báo cáo vắng mặt

6) Service Worker cache v56 để tránh trình duyệt giữ bản cũ.

Cấu trúc upload Vercel/GitHub:
- public/logo-ph.png
- src/main.jsx
- src/styles.css
- index.html
- manifest.json
- package.json
- sw.js
- vercel.json
