ERP V30.49 STABLE FULL

Đã sửa theo hướng:
- Frontend local-first: bấm Lưu là có dữ liệu ngay trên điện thoại.
- Offline-first: mất mạng vẫn giữ dữ liệu trong localStorage và queue đồng bộ.
- Instant update: báo cáo chi tiết đọc thêm cache local trước khi Apps Script trả về.
- Anti-lost-data: dữ liệu đã bấm lưu không bị refresh nền ghi đè.
- Mobile preload: sau login nạp sẵn dữ liệu hôm nay theo bộ phận.
- Apps Script stable: save/getData không dùng cache stale, save xong SpreadsheetApp.flush(), xóa cache liên quan và trả bootstrap mới.
- Service Worker: đổi cache version v49-stable để PWA nhận bản mới.

Cách triển khai:
1) Vercel: upload toàn bộ frontend như bản cũ.
2) Apps Script: mở Code.gs, thay bằng toàn bộ nội dung file Code_V30_49_APPS_SCRIPT_STABLE.gs, Deploy -> New deployment hoặc Manage deployments -> Edit -> New version.
3) Điện thoại: đóng hẳn PWA/app, mở lại hoặc refresh 1-2 lần để service worker v49-stable nhận cache mới.
4) Test: vào URL Apps Script /exec?api=1&action=pingV349&args=[] để kiểm tra bản stable.
