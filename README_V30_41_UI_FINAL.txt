ERP V30.41 - UI FINAL MENU + IN BÁO CÁO + NGÀY LỄ

Cấu trúc upload giữ đúng dạng cũ, chỉ có:
- index.html
- package.json
- manifest.json
- sw.js
- vercel.json
- src/main.jsx
- src/styles.css
- public/logo-ph.png
- public/logo-192.png
- public/logo-512.png

Nền giữ nguyên V30.40 API CALL FULL + CLEAN STRUCTURE.

Đã chỉnh theo giao diện đã thống nhất:
1. Menu NHẬP LIỆU thêm “Đăng ký làm ngày lễ” sau “Vắng mặt”, trước “Giao việc”.
2. Màn Đăng ký làm ngày lễ: chọn từ ngày/đến ngày, danh sách nhân viên trong tổ, thêm nhân viên ngoài tổ, bỏ dòng Giờ TC.
3. Menu TIỆN ÍCH đổi “In tăng ca” thành “In báo cáo”.
4. Màn In báo cáo dùng 1 form dynamic: Tăng ca / Làm ngày lễ / Chuyển bộ phận.
5. Chỉ hiện “Loại tăng ca” khi Loại báo cáo = Tăng ca.
6. Bỏ ghi chú kỹ thuật “Dữ liệu lấy từ BAO_CAO_CHI_TIET...”.
7. Báo cáo công ty: nhấp vào bộ phận để xem danh sách vắng theo bộ phận.
8. Giữ cache guard, API dedupe, PWA icon, service worker v41.

Lưu ý backend:
- Tăng ca dùng API hiện có: getDanhSachTangCaXemTruoc / exportTangCaExcel.
- Làm ngày lễ dùng action mới dự kiến: saveDangKyNgayLe, getDanhSachNgayLeXemTruoc, exportNgayLeExcel.
- Chuyển bộ phận dùng action mới dự kiến: getDanhSachChuyenBoPhanXemTruoc, exportChuyenBoPhanExcel.
- Danh sách vắng theo bộ phận dùng action dự kiến: getDanhSachVangTheoBoPhan. Nếu Apps Script chưa có action này, app vẫn hiện dữ liệu có trong cache/local trước.
