ERP V30.32 - UNIFIED CACHE + AUTO PRELOAD COMPANY REPORT
- Giữ nguyên cấu trúc Vercel/Vite gốc, không có node_modules, không có dist.
- Giữ nguyên UI V30.31.
- Thêm unified cache: erp_v30_unified_cache_v32.
- Cache login theo từng bộ phận được gom vào unified cache.
- Cache báo cáo công ty được gom vào unified cache và vẫn migrate dữ liệu cache cũ nếu có.
- Auto preload báo cáo công ty ngay sau khi đăng nhập online.
- Khi mở app/focus/online lại, queue sync xong sẽ preload báo cáo công ty nền.
- Báo cáo công ty local-first: có cache thì hiện ngay, API chỉ cập nhật nền theo TTL.
- Apps Script không cần sửa nếu đang dùng Code_V30_30_COMPATIBLE_FULL.gs hoặc bản compatible hiện tại.

Cấu trúc upload:
index.html
package.json
manifest.json
sw.js
vercel.json
logo-ph.png
public/logo-ph.png
src/main.jsx
src/styles.css
README_V30_32_UNIFIED_CACHE_PRELOAD_FULL.txt
