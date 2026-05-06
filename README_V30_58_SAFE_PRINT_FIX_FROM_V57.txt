ERP V30.58 SAFE - PRINT FIX FROM V30.57 GỐC

Làm lại trực tiếp từ file gốc V30.57 anh gửi lại.

Đã sửa an toàn:
1) In báo cáo không dùng message sai từ Apps Script nữa.
   - Chọn Biến động sẽ không hiện “Đã tải ... Tăng ca”.
   - Chọn Vắng mặt / Chuyển bộ phận / Làm ngày lễ hiển thị đúng tên báo cáo.

2) Lọc đúng theo BAO_CAO_CHI_TIET:
   - Tăng ca: LOAI_BAO_CAO = Tăng ca, có lọc loại tăng ca.
   - Vắng mặt: LOAI_BAO_CAO = Báo cáo vắng hoặc CHI_TIET bắt đầu bằng Vắng.
   - Biến động: LOAI_BAO_CAO = Biến động nhân sự.
   - Chuyển bộ phận: LOAI_BAO_CAO = Biến động nhân sự + CHI_TIET = Điều động sang tổ khác.
   - Làm ngày lễ: LOAI_BAO_CAO = Làm ngày lễ hoặc CHI_TIET = Đăng ký làm ngày lễ.

3) Tăng ca bỏ trùng:
   - Cùng Mã NV + Ngày + Loại tăng ca + Bắt đầu + Kết thúc chỉ còn 1 dòng.

4) Có thử build thành công trước khi gửi.

Giữ nguyên toàn bộ sửa ổn định của V30.57:
- Báo cáo bộ phận đọc vắng ngay từ local/preload.
- Mật khẩu mới/nhập lại có con mắt.
- Giao việc quản lý ưu tiên cache tổ trưởng.
