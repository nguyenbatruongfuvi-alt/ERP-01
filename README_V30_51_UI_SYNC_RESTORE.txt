ERP V30.51 - UI RESTORE + INSTANT REPORT SYNC

Bản này sửa theo phản hồi:
1) Khôi phục CSS giao diện báo cáo theo dạng card mobile giống mẫu:
   - Tabs Tổng hợp / Tăng ca / Biến động / Vắng mặt / Làm ngày lễ.
   - Card bộ phận đẹp, không còn giao diện thô.
   - Chi tiết có header cố định, thống kê, tab, danh sách cuộn riêng giống màn Tăng ca.
2) Đồng bộ local tức thì cho Tổng hợp bộ phận và Chi tiết:
   - Vắng mặt và Làm ngày lễ ghi local/preload giống Tăng ca.
   - Bỏ chọn/lưu xong cập nhật card và chi tiết ngay, không chờ Google Sheet.
   - API/Google Sheet trả chậm không được ghi đè dữ liệu vừa lưu trong 10 phút.
3) Giữ cấu trúc Vite/Vercel sạch:
   - /src/main.jsx
   - /src/styles.css
   - /public/logo-ph.png
   - không có main.jsx/styles.css ngoài root.

Cách upload:
- Xóa main.jsx/styles.css ngoài root nếu còn.
- Upload toàn bộ nội dung bên trong thư mục này lên root repo.
- Redeploy Vercel.
- Điện thoại đã cài PWA: gỡ PWA cũ hoặc clear site data, rồi mở lại/cài lại.

Apps Script:
- Nếu đã dùng Code_V30_50_APPS_SCRIPT_STABLE.gs thì không bắt buộc đổi.
- File .gs vẫn được đính kèm trong gói để copy lại khi cần.
