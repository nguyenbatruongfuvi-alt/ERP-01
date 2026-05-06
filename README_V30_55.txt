V30.55 STAFF CACHE SYNC FIX

Đã sửa:
1. API_URL trỏ đúng Apps Script mới:
   https://script.google.com/macros/s/AKfycbxnxJRgtEyK6f92to3d2HTY5Cp7d7pZY5H4RfFM4KpmSQsf8uBDGArlN3b4uNn5lNei5w/exec

2. Đổi cache hệ thống sang v55 để app tự bỏ cache cũ mà KHÔNG cần người dùng xóa PWA:
   - session/cache/preload/boot/local save đều dùng key v55.
   - offline queue cũ vẫn giữ để không mất dữ liệu chờ đồng bộ.

3. Tăng ca / Biến động / Vắng mặt / Ngày lễ:
   - Nếu cache nhân sự rỗng thì tự gọi getClientCache từ Apps Script.
   - Không sort lại danh sách sau khi chọn, tránh nhân viên nhảy lên đầu.
   - Tìm nhân viên gọi searchNhanSuV355.

4. Báo cáo bộ phận:
   - Online ưu tiên dữ liệu mới từ Google Sheet.
   - Chỉ dùng cache local khi offline/lỗi mạng.

5. Chặn kéo xuống làm mới trên điện thoại:
   - Thêm JS touch guard.
   - Thêm CSS overscroll-behavior.

Cách triển khai:
1. Apps Script: dán Code_app_script_V30_55_STAFF_CACHE_SYNC_FIX.txt vào Code.gs và Deploy phiên bản mới.
2. Vercel: upload toàn bộ thư mục/zip này.
3. Test Apps Script:
   /exec?action=pingV355&api=1
   phải thấy bridge/version: V30.55_STAFF_CACHE_SYNC_FIX.
