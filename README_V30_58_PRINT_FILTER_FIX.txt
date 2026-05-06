ERP V30.58 - PRINT FILTER FIX

Sửa lỗi in báo cáo:
1) Chọn Biến động không còn lấy nhầm dữ liệu Tăng ca.
2) Chọn Chuyển bộ phận lọc đúng:
   - LOAI_BAO_CAO = Biến động nhân sự
   - CHI_TIET = Điều động sang tổ khác
3) Chọn Vắng mặt lọc đúng:
   - LOAI_BAO_CAO = Báo cáo vắng
   - CHI_TIET bắt đầu bằng Vắng
4) Làm ngày lễ lọc đúng:
   - LOAI_BAO_CAO = Làm ngày lễ hoặc CHI_TIET = Đăng ký làm ngày lễ
5) Tăng ca tự loại dòng trùng:
   - cùng Mã NV + Ngày + Loại tăng ca + Bắt đầu + Kết thúc chỉ hiện 1 dòng.
6) Thông báo xem trước hiển thị đúng tên báo cáo đang chọn, không còn báo “31 dòng Tăng ca” khi đang chọn Biến động/Vắng mặt/Chuyển bộ phận.
7) Xuất Excel dùng dữ liệu đã lọc ở client để tránh Apps Script cũ xuất nhầm tiêu đề “DANH SÁCH TĂNG CA”.

Giữ nguyên các sửa của V30.57:
- Báo cáo bộ phận đọc vắng từ local/preload ngay.
- Mật khẩu mới/nhập lại có con mắt.
- Giao việc quản lý ưu tiên cache tổ trưởng.
