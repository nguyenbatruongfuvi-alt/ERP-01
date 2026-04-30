ERP V30.14 - FIX TRẠNG THÁI LƯU / LẤY DỮ LIỆU

BẮT BUỘC THAY ĐỒNG BỘ 2 PHẦN:
1) Apps Script: thay toàn bộ Code.gs bằng apps_script/Code.gs
2) Vercel: upload đúng các file/thư mục ở gốc gói này lên repo/Vercel

CẤU TRÚC VERCEL:
- index.html
- package.json
- manifest.json
- sw.js
- vercel.json
- src/main.jsx
- src/styles.css
- public/logo-ph.png

ĐÃ SỬA:
- Khi bấm Lưu: hiện ngay "Đang lưu...", khóa nút để tránh bấm nhiều lần.
- Lưu thành công: hiện rõ "ĐÃ LƯU THÀNH CÔNG" kèm thời gian savedAt trả về từ Apps Script.
- Lỗi Apps Script: báo rõ "CHƯA LƯU", không đưa nhầm vào offline queue.
- Offline thật: mới lưu tạm vào hàng chờ đồng bộ.
- Service Worker không cache request tới script.google.com / script.googleusercontent.com.
- Apps Script saveBaoCaoTong có LockService + SpreadsheetApp.flush() để lưu xong đọc lại thấy ngay.
- Apps Script trả savedAt/requestId cho saveBaoCaoTong, saveNhapLieu, saveChiTietVang.

SAU KHI DEPLOY:
- Deploy Apps Script thành New version.
- Execute as: Me.
- Who has access: Anyone.
- Deploy lại Vercel.
- Trên điện thoại: đóng PWA/app, mở lại. Nếu còn bản cũ thì gỡ PWA/clear cache.
