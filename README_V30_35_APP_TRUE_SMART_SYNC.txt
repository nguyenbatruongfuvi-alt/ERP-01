ERP V30.35 - APP TRUE / SMART SYNC
- Giữ nguyên UI V30.34.
- JSONP-first giữ nguyên để tránh CORS Apps Script.
- Báo cáo công ty đọc cache trước, mở tức thì.
- Smart refresh: tự cập nhật nền khi focus app, khi có mạng lại, và mỗi 60 giây.
- Sync queue có khóa chống chạy song song, giảm nguy cơ ghi trùng.
- Sau khi đồng bộ thành công, tự refresh dữ liệu hôm nay và báo cáo công ty.
- Service Worker đổi cache version V35 để trình duyệt nhận bản mới.
- Apps Script không cần sửa nếu đang dùng Code_V30_33_APPS_SCRIPT_FULL_JSONP_FINAL.gs.
- Cấu trúc upload Vercel giữ đúng cấu trúc cũ.
