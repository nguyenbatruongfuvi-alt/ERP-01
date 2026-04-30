ERP V30.16 - FAST DATA + SCROLL FIX

BẮT BUỘC THAY ĐỒNG BỘ:
1) Apps Script: thay toàn bộ Code.gs bằng apps_script/Code.gs
2) Vercel: thay toàn bộ source rồi deploy lại

ĐÃ SỬA:
- Chọn bộ phận ở màn đăng nhập sẽ tải sẵn dữ liệu gốc/ngày hôm nay trước khi đăng nhập.
- API mới getTodayBootstrapV316 đọc dữ liệu nhanh hơn: chỉ đọc sheet chi tiết 1 lần, không gọi lặp bundle 11 lần.
- Sửa lỗi menu báo Vắng/Tăng ca có SL nhưng mở vào không thấy người đã chọn: người đã chọn được đưa lên đầu danh sách.
- Sửa lỗi Tăng ca menu SL 30 nhưng mở modal thành 37: không ép tất cả dòng trong bundle thành selected.
- Sửa lỗi mất giờ tăng ca khi mở lại: lấy giờ từ dòng đã lưu.
- Sửa lỗi đơ màn hình/modal không vuốt được trên điện thoại: bỏ khóa touch-action toàn màn hình, chỉ khóa đúng vùng cần thiết.
- Sửa bảng Danh sách nhân sự / In tăng ca / Bảng tăng ca không kéo ngang: table-scroll hỗ trợ pan-x/pan-y.

SAU KHI DEPLOY:
- Apps Script: Deploy > Manage deployments > Edit > New version.
- Vercel: deploy lại.
- Trên điện thoại: đóng PWA/browser, mở lại. Nếu còn bản cũ thì gỡ PWA hoặc xóa cache trình duyệt.
