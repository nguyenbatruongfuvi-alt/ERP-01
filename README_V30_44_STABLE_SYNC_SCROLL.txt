ERP V30.44 - STABLE SYNC + SCROLL FIX

Sửa trên bộ file V30.43 người dùng gửi, không đụng package/npm.

Đã sửa:
1) Chi tiết vắng mặt: dữ liệu đang hiển thị từ máy sẽ không bị xóa khi đồng bộ nền trả rỗng/tạm lỗi.
2) Không ghi đè cache chi tiết bằng danh sách rỗng.
3) Đăng ký làm ngày lễ / Tăng ca / Biến động / Vắng mặt: mở modal là hiện ngay danh sách nhân sự lưu trên máy, không chờ API.
4) Thanh cuộn PickModal: chỉ giữ header + phần chọn giờ/ngày/tổ cố định; phần đã chọn, nhóm, tìm kiếm, danh sách nằm trong vùng cuộn.
5) Chọn nhân viên không đưa người đã chọn lên đầu; giữ nguyên vị trí để chọn người kế bên.
6) Service Worker đổi cache v44 để máy nhận bản mới.

Triển khai:
- Upload toàn bộ gói này lên Vercel.
- Sau deploy, đóng/mở lại PWA hoặc refresh 1-2 lần để nhận Service Worker mới.
