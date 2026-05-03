ERP V30.38 - ADD REPORT + HOLIDAY UI

Giữ nguyên cấu trúc V30 cũ, chỉ bổ sung UI theo yêu cầu:
1. Báo cáo công ty: nhấn vào bộ phận trong Tổng hợp bộ phận để mở màn hình con Danh sách vắng - [Bộ phận].
2. Menu Nhập liệu: thêm Đăng ký làm ngày lễ dưới Vắng mặt. Màn hình mặc định chỉ load danh sách, không chọn sẵn nhân viên; khi phát sinh mới bấm Chọn.
3. Menu Tiện ích: đổi In tăng ca thành In báo cáo. Màn Xuất báo cáo hỗ trợ Tăng ca / Làm ngày lễ / Chuyển bộ phận; Loại tăng ca chỉ hiện khi chọn Tăng ca.
4. Service Worker đổi cache version V38 để trình duyệt nhận bản mới.

Lưu ý Apps Script cần có thêm action nếu muốn đồng bộ đầy đủ:
- getDanhSachVangBoPhan
- saveDangKyLamNgayLe
- getBaoCaoXemTruoc
- exportBaoCaoExcel
Các action cũ của tăng ca vẫn giữ nguyên.
