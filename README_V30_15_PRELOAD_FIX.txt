ERP V30.15 - PRELOAD THEO BỘ PHẬN + FIX SỐ NGƯỜI/GIỜ TĂNG CA

BẮT BUỘC thay đồng bộ 2 phần:
1) Apps Script: thay toàn bộ Code.gs bằng apps_script/Code.gs
2) Vercel: thay toàn bộ source bằng gói này rồi deploy lại

ĐÃ SỬA:
- Khi chọn Bộ phận ở màn hình đăng nhập, app tải sẵn dữ liệu hôm nay ngay từ đầu.
- Sau khi đăng nhập, màn hình dùng dữ liệu đã preload, giảm cảm giác trễ và tránh hiểu nhầm dữ liệu sai.
- Thêm API getTodayBootstrapV315: tải 1 lần nhân sự + counts + bundle nhập liệu hôm nay.
- Fix lỗi Tăng ca trưa ngoài menu 30 người nhưng vào modal thành 37 người:
  + Frontend chỉ tính dòng selected=true là dữ liệu đã lưu thật.
  + Dòng nhân sự trong tổ nhưng chưa chọn chỉ để hiển thị, không bị ép selected=true.
- Fix lỗi mở lại không hiện giờ tăng ca:
  + Lấy giờ từ dòng đã lưu thật có batDau/ketThuc/soGio.
- Fix draft local cũ ghi đè dữ liệu server:
  + Nếu server đã có dữ liệu thì không lấy draft cũ để đè số người/giờ.
- Fix Apps Script getCountsByLoai so bộ phận bằng sameBp_() để tránh lệch dấu/khoảng trắng.
- Fix hasSavedBefore: không còn coi toàn bộ danh sách nhân sự trong tổ là dữ liệu đã lưu.

LƯU Ý SAU DEPLOY:
- Deploy Apps Script New version.
- Deploy lại Vercel.
- Trên điện thoại/PWA: đóng app mở lại. Nếu vẫn thấy bản cũ thì gỡ PWA hoặc xóa cache trình duyệt.
