ERP V30.52 - UI V30.48 + PRELOAD DETAIL

Đã sửa:
1) Khôi phục giao diện card/tabs theo V30.48.
2) Tab Tổng hợp/Tăng ca/Biến động/Vắng mặt/Làm ngày lễ không còn đè lên số KPI.
3) Dòng sáng/trưa/chiều/đột xuất trong chi tiết nằm ngang, có thể vuốt ngang nếu màn hẹp.
4) Chi tiết Tổng hợp/Tăng ca/Biến động/Vắng mặt/Làm ngày lễ có vùng cuộn riêng giống Tăng ca.
5) Khi nhấp báo cáo tổng công ty -> chi tiết, app ưu tiên dữ liệu local đã lưu; nếu chưa có bundle thì tự đọc BAO_CAO_CHI_TIET qua Apps Script để có dữ liệu sẵn.
6) Giữ local-first, chống API cũ ghi đè dữ liệu vừa lưu.
7) Service Worker cache v52.

Cấu trúc upload Vercel/GitHub:
- public/logo-ph.png
- src/main.jsx
- src/styles.css
- index.html
- manifest.json
- package.json
- sw.js
- vercel.json

Không được để main.jsx hoặc styles.css ở ngoài root.

Apps Script:
- Dùng Code_V30_50_APPS_SCRIPT_STABLE.gs trong gói này.
- Deploy Web App: Execute as Me, Who has access Anyone.
