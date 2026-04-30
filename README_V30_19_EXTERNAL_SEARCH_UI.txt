ERP V30.19 - BỔ SUNG TÌM NGƯỜI NGOÀI BỘ PHẬN THEO UI ĐÃ CHỐT

NỀN GỐC:
- Kế thừa ERP_V30_18_PHONE_CACHE_FAST_LOGIN.
- Giữ nguyên Apps Script V30.18, chỉ bổ sung/điều chỉnh UI Vercel cho màn nhập liệu.

ĐÃ SỬA:
1) Màn Tăng ca / Vắng mặt / Biến động có thêm khu vực:
   - 1. Chọn nhân viên trong tổ
   - 2. Thêm nhân viên từ bộ phận khác

2) Tìm người ngoài bộ phận:
   - Một ô tìm duy nhất: Nhập tên, mã số (có dấu hoặc không dấu).
   - Bỏ dòng thừa: Tìm theo Tên / Mã số.
   - Gõ là gợi ý hiện ngay, không cần bấm Enter.
   - Tìm bằng cache điện thoại trước, có fallback gọi Apps Script searchNhanSu.

3) Dòng nhân viên đồng bộ:
   - Luôn có nút Chọn / Đã chọn.
   - Vắng mặt có thêm Có phép / Không phép.
   - Biến động có thêm Tăng / Giảm.
   - Người ngoài tổ có nhãn ngoài tổ và màu nền phân biệt nhẹ.

4) Bỏ phần danh sách đã chọn phía dưới:
   - Không render danh sách phụ.
   - Người đã chọn nằm ngay trong danh sách chính và được đưa lên đầu.

CÀI ĐẶT:
1) Vercel: upload toàn bộ source trong gói này.
2) Apps Script: có thể giữ Code.gs trong gói V30.18/V30.19 này. Nếu đã thay Code.gs của V30.18 thì không bắt buộc thay lại.
3) Deploy lại Vercel. Nếu điện thoại còn bản cũ, đóng PWA/trình duyệt rồi mở lại hoặc xóa cache.
