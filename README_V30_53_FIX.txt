# V30.53 Vercel + Apps Script schema sync

API Apps Script đang dùng:
https://script.google.com/macros/s/AKfycbxnxJRgtEyK6f92to3d2HTY5Cp7d7pZY5H4RfFM4KpmSQsf8uBDGArlN3b4uNn5lNei5w/exec

Các điểm đã sửa:
- Vercel đổi API_URL sang endpoint V30.51/V30.53 mới.
- Menu In báo cáo có đủ: Tăng ca, Làm ngày lễ, Chuyển bộ phận, Biến động nhân sự, Vắng mặt.
- Xuất Excel dùng đúng loại báo cáo và đúng CHI_TIET.
- Không đưa nhân viên đã chọn lên đầu khi bấm chọn, tránh nhảy dòng/reset khi vuốt.
- Service worker đổi cache version để Vercel/PWA nhận bản mới.
- Apps Script V30.53 hỗ trợ export/xem trước cho Vắng mặt và Biến động nhân sự, đồng thời bỏ dòng IS_ACTIVE=FALSE.

Sau khi deploy Apps Script, test:
?action=pingV353&api=1
hoặc:
?action=pingV349&api=1

Sau khi deploy Vercel, nên xóa cache trình duyệt/PWA một lần.
