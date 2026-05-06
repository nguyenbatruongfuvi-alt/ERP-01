ERP V30.57 - REPORT DEPARTMENT + PRINT EXPORT FIX

Đã sửa:
1) Báo cáo bộ phận:
   - Vắng sáng / Vắng chiều / Vắng cả ngày đọc ngay từ local/preload.
   - Không phải chờ 20 giây mới hiện.
   - Có lắng nghe cập nhật từ màn Vắng mặt giống cơ chế Tăng ca sáng.

2) In báo cáo:
   - Xuất Vắng mặt ra đúng tên: DANH SÁCH VẮNG MẶT.
   - Xuất Biến động ra đúng tên: DANH SÁCH BIẾN ĐỘNG.
   - Xuất Làm ngày lễ ra đúng tên: DANH SÁCH LÀM NGÀY LỄ.
   - Xuất Chuyển bộ phận ra đúng tên: DANH SÁCH CHUYỂN BỘ PHẬN.
   - Không để chọn Vắng mặt nhưng file lại ra DANH SÁCH TĂNG CA.
   - Client tự tạo file Excel .xls đúng loại báo cáo để tránh Apps Script cũ xuất sai mẫu.

3) Giữ lại các sửa tốt của V30.56:
   - Mật khẩu mới/nhập lại có con mắt, mặc định hiện.
   - Giao việc quản lý ưu tiên danh sách tổ trưởng cache.
   - Local-first cho các màn nhập liệu.

Service Worker cache v57.

Cấu trúc:
- public/logo-ph.png
- src/main.jsx
- src/styles.css
- index.html
- manifest.json
- package.json
- sw.js
- vercel.json
