ERP V30.50 FULL DEPLOY - API ĐÃ CÀI SẴN

API_URL đã được thay sẵn trong src/main.jsx:
https://script.google.com/macros/s/AKfycby0VCyaEdk0BGqFVflht1sGPdgH8uNgHcga1QXzEldTyMQGyqyTnjw_84z01puO6YrqvA/exec

Cấu trúc đúng để upload GitHub/Vercel:
- public/logo-ph.png
- src/main.jsx
- src/styles.css
- index.html
- manifest.json
- package.json
- sw.js
- vercel.json
- Code_V30_50_APPS_SCRIPT_STABLE.gs

Lưu ý:
1) Không upload cả thư mục bọc ngoài. Hãy upload các file/thư mục bên trong lên root repo.
2) Root không được có main.jsx hoặc styles.css.
3) Apps Script vẫn phải deploy riêng: copy Code_V30_50_APPS_SCRIPT_STABLE.gs vào script.google.com, deploy Web App.
4) Sau khi Vercel deploy xong, trên điện thoại nên gỡ PWA cũ hoặc clear site data/cache rồi cài lại.
