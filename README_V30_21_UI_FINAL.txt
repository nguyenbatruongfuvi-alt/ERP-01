ERP V30.21 UI FINAL - SỬA ĐÚNG THEO YÊU CẦU

NỀN GỐC:
- Kế thừa ERP_V30_19_EXTERNAL_SEARCH_UI + bản scroll đã kéo được.

ĐÃ SỬA:
1) Màn Tăng ca:
   - Chỉ còn nút Chọn / Đã chọn.
   - Bỏ mọi ô Có phép / Không phép nếu có phát sinh từ UI cũ.
   - Giữ giờ tăng ca theo khung giờ phía trên.

2) Màn Vắng mặt:
   - Giữ nút Chọn / Đã chọn.
   - Giữ ô Có phép / Không phép.

3) Màn Biến động nhân sự:
   - Chỉ còn nút Chọn / Đã chọn.
   - Bỏ ô Tăng / Giảm.
   - Khi lưu gửi trạng thái Đã chọn.

4) Không sửa Apps Script.

CÀI ĐẶT:
- Upload toàn bộ source này lên Vercel hoặc thay riêng src/main.jsx.
- Nếu thay riêng: đảm bảo styles.css đang là bản scroll đã sửa.
- Apps Script không cần thay.
