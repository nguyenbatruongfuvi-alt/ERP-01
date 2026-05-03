ERP V30.38 - CACHE GUARD / FIX TRẮNG MÀN HÌNH
- Nền: V30.37 OVERTIME FILTER, giữ nguyên UI và logic nghiệp vụ.
- Sửa Service Worker sang v38-cache-guard.
- HTML/JS/CSS dùng network-first để tránh kẹt bản cũ gây màn trắng/logo phóng to.
- Khi deploy bản mới, main.jsx tự kiểm tra APP_VERSION và xóa Cache Storage cũ.
- KHÔNG xóa localStorage nghiệp vụ: session, offline_queue, preload, unified cache vẫn giữ.
- Service Worker register với updateViaCache='none' và tự check update mỗi 30 giây.
- vercel.json thêm header no-cache cho /sw.js, /index.html, /manifest.json.
- Apps Script giữ nguyên bản V30.37 nếu đã cập nhật lọc tăng ca.
