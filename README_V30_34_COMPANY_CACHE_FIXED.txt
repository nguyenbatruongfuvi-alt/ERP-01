ERP V30.34 - COMPANY REPORT CACHE FIX
- Giữ nguyên UI V30.33.
- Vẫn dùng JSONP-first để tránh CORS.
- Fix riêng Báo cáo công ty: đọc cache trước, hiện ngay, không chờ API.
- Tương thích cache cũ + unified cache: erp_v30_unified_cache_v32, local_first_v27, preload_v27.
- Login online tự preload báo cáo công ty vào cache.
- Nếu cache còn mới trong 5 phút thì không gọi lại API; nếu cache cũ thì cập nhật nền.
- Cấu trúc upload Vercel giữ đúng cấu trúc cũ.
