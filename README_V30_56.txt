V30.56_BASELINE_RESTORE_STAFF_LOGIN

Bản này lấy lại cấu trúc gốc Vercel, chỉ sửa các điểm cần thiết:
- API_URL = https://script.google.com/macros/s/AKfycbxnxJRgtEyK6f92to3d2HTY5Cp7d7pZY5H4RfFM4KpmSQsf8uBDGArlN3b4uNn5lNei5w/exec
- đổi cache hệ thống sang v56 để không dùng dữ liệu cũ bị lệch
- giữ nguyên giao diện/luồng cũ
- chặn pull-to-refresh bằng CSS
- bắt đăng nhập online nạp lại dữ liệu mới

Không đưa file Code_app_script vào Vercel.
