ERP V30.23 FULL - HEADER + ĐIỀU ĐỘNG + SCROLL FIX

Đã sửa:
1) Giữ nguyên cấu trúc Vercel/Vite, không dùng API key.
2) Sửa phần đầu modal: header xanh gọn, dòng thống kê gọn, dòng 1/2 không còn dính chữ/số.
3) Sửa ô tìm kiếm: nằm đúng dưới dòng 2, không còn ký tự lệch bên trái.
4) Màn Điều động sang tổ khác: thêm ô Tổ chuyển đến.
   Ví dụ tổ hiện tại Đóng gói chuyển Nguyễn Văn A sang Trộn đường thì dữ liệu gửi lên có:
   - boPhanChuyenDen / toChuyenDen = Trộn đường
   - trạng thái = Điều động sang Trộn đường (hỗ trợ)
   Mục tiêu: ở tổ nhận hiển thị Nguyễn Văn A (hỗ trợ).
5) Fix vuốt mobile/PWA: bỏ khóa touch-action, chỉ vùng danh sách nhân viên cuộn; header và nút lưu cố định.
6) Bump service worker cache lên v23 để tránh dính bản cũ.

Cách upload Vercel:
- Upload toàn bộ nội dung trong thư mục này.
- Root Directory: ./
- Build Command: npm run build
- Output Directory: dist

Sau khi deploy:
- Đóng app/PWA mở lại.
- Nếu còn thấy giao diện cũ, gỡ PWA hoặc xóa cache trình duyệt.
