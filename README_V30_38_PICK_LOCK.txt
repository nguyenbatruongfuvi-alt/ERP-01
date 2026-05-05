ERP V30.38 - PICK MODAL LOCK FIX

Mục tiêu:
- Sửa lỗi người dùng đang chọn nhân viên thì app tự refresh dữ liệu nền làm mất lựa chọn chưa lưu.
- Giữ nguyên giao diện, cấu trúc component, CSS và flow hiện tại.

Thay đổi trong src/main.jsx:
1) Thêm cờ window.__ERP_PICKING_ACTIVE__ khi mở PickModal.
2) Auto refresh nền bỏ qua preload/smart refresh khi đang mở PickModal.
3) PickModal không còn phụ thuộc cache trong dependency load dữ liệu nên cache đổi không reset rows.
4) Khi bấm Chọn/Đã chọn, đổi trạng thái, thêm nhân sự ngoài tổ, đổi giờ tăng ca/tổ chuyển đến/ngày lễ: ghi nháp ngay vào localStorage.
5) Khi mở lại modal, ưu tiên nháp local trước dữ liệu preload/API.

Thay đổi trong sw.js:
- Đổi cache version sang v38-pick-lock để trình duyệt/PWA nhận bản mới.

Triển khai:
- Upload toàn bộ thư mục này lên Vercel.
- Sau deploy, trên điện thoại nên đóng/mở lại PWA hoặc refresh 1-2 lần để Service Worker mới nhận cache v38.
