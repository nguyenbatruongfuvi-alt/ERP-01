ERP V30.42 - STABLE PATCH TRÊN BẢN GỐC V30.38

Đã sửa theo đúng yêu cầu:
1) Giữ file gốc ổn định, không đổi package, không cài thêm npm.
2) Báo cáo công ty giữ giao diện bảng + modal chi tiết đẹp như mẫu đã chốt.
3) Nhấp bộ phận mở chi tiết ngay, ưu tiên dữ liệu đã lưu trên máy/localStorage/preload.
4) Không gọi API bắt buộc trước khi mở chi tiết; API chỉ đồng bộ nền.
5) Tăng ca / Biến động / Vắng mặt / Làm ngày lễ: chỉnh vùng cuộn.
   - Header xanh giữ cố định.
   - Tăng ca chỉ giữ dòng chọn giờ cố định.
   - Các phần đã chọn / nhóm / tìm kiếm / danh sách nằm trong vùng cuộn.
6) Đăng ký làm ngày lễ mở là có danh sách nhân viên từ cache/local giống Tăng ca, không phải chờ load API.
7) Chọn nhân viên không bị nhảy lên đầu; giữ nguyên vị trí để chọn người kế bên.
8) Fix save() hiển thị trạng thái Đang lưu.
9) Chặn refresh nền khi đang chọn nhân viên hoặc đang xem chi tiết.
10) Service Worker đổi cache v42 để điện thoại nhận bản mới.

Lưu ý:
- Không chạy npm trong quá trình chỉnh file này.
- Sau khi upload Vercel, trên điện thoại cần đóng/mở lại PWA hoặc xóa app cài lại nếu vẫn dính cache cũ.
