ERP V30.40 - API CALL FULL + CLEAN STRUCTURE

Cấu trúc upload giữ đúng dạng cũ, chỉ có:
- index.html
- package.json
- manifest.json
- sw.js
- vercel.json
- src/main.jsx
- src/styles.css
- public/logo-ph.png
- public/logo-192.png
- public/logo-512.png

Đã giữ nền V30.38 cache guard + V30.37 lọc tăng ca.
Đã thêm API call full: gom request trùng, giảm gọi lặp, giữ cache-first.
Không kèm node_modules, không kèm dist, không kèm package-lock để tránh quá nhiều thư mục/file.
Apps Script không cần cập nhật nếu đang dùng V30.37 lọc tăng ca.
