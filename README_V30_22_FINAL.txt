ERP V30.22 FINAL - SỬA GIAO DIỆN MODAL + CUỘN MOBILE

NỀN GỐC:
- Kế thừa ERP_V30_21_UI_FINAL_NO_EXTRA_STATUS.
- Không sửa Apps Script.
- Chỉ sửa Vercel: src/main.jsx, src/styles.css, sw.js.

ĐÃ CHỐT:
1) Tăng ca:
   - Chỉ có Chọn / Đã chọn.
   - Không có Có phép / Không phép.
   - Không có Tăng / Giảm.

2) Vắng mặt:
   - Có Chọn / Đã chọn.
   - Có Có phép / Không phép.

3) Biến động nhân sự:
   - Chỉ có Chọn / Đã chọn.
   - Không có Tăng / Giảm.

4) Giao diện đúng bố cục đã chốt:
   - Thanh tiêu đề.
   - Ô giờ tăng ca nếu là màn tăng ca.
   - Ô tổng đã chọn.
   - Dòng 1: Chọn nhân viên trong tổ.
   - Dòng 2: Thêm nhân viên từ bộ phận khác.
   - Một ô tìm kiếm duy nhất.
   - Danh sách nhân viên chính.
   - Nút lưu cố định dưới cùng.

5) Sửa đơ cuộn:
   - Chỉ vùng danh sách cuộn.
   - Header/ô thống kê/nút lưu cố định.
   - Hỗ trợ kéo trên điện thoại/PWA.

CÀI ĐẶT:
- Upload toàn bộ source này lên Vercel.
- Sau deploy, đóng app/PWA và mở lại.
- Nếu vẫn thấy bản cũ, gỡ PWA hoặc xóa cache trình duyệt.
