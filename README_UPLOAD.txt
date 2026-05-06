ERP V30.53 UPLOAD CLEAN

Cấu trúc giữ đúng hiện tại:
- public/logo-ph.png
- src/main.jsx
- src/styles.css
- index.html
- manifest.json
- package.json
- sw.js
- vercel.json

Apps Script:
- File nằm riêng: apps_script/Code_V30_53_UNIFIED_STABLE.gs
- Không upload thư mục apps_script lên Vercel nếu bạn upload thủ công từng file.
- Copy toàn bộ nội dung file .gs này dán vào Code.gs của Apps Script rồi Deploy New Version.

Không có node_modules.
Không tách thêm module JS.
Không đổi cấu trúc src/public/root.
