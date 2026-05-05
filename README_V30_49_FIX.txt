ERP V30.49 FIX - LOCAL DETAIL INSTANT

Lỗi tìm thấy:
1) main.jsx lưu được vào queue/local cho màn nhập liệu nhưng KHÔNG ghi vào cache chi tiết mà màn In báo cáo đang đọc.
2) Màn In báo cáo chỉ đọc cache key in_bao_cao_preview hoặc chờ Apps Script/Google Sheet trả dữ liệu mới, nên sau khi lưu phải chờ 5-20 giây vẫn có thể chưa thấy.
3) Key cache chưa chuẩn hóa bộ phận/loại báo cáo, dễ lệch Trộn đường / Trộn Đường / Tất cả.
4) Service Worker vẫn dùng cache version cũ v38, PWA điện thoại có thể giữ shell cũ.

Đã sửa:
- Thêm local detail cache v49.
- Sau khi lưu Tăng ca / Biến động / Vắng mặt / Làm ngày lễ, dữ liệu được ghi ngay vào cache chi tiết.
- Màn In báo cáo tự merge dữ liệu local + dữ liệu Apps Script, mở lại thấy ngay.
- Chuẩn hóa key cache.
- Đổi Service Worker cache version sang v49.

Cách dùng:
- Thay src/main.jsx bằng main.jsx trong gói này.
- Thay sw.js bằng sw.js trong gói này.
- Deploy lại Vercel.
- Trên điện thoại đóng/mở lại PWA hoặc refresh 1-2 lần để nhận Service Worker mới.
