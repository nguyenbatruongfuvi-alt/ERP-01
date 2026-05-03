ERP V30.28 - FIX NÚT GỬI LINK QUA ZALO
- Giữ nguyên UI đã chốt.
- Chỉ sửa nút “Gửi link qua Zalo”.
- Không dùng zalo.me/share nữa vì Android/Xiaomi có thể mở GetApps, iPhone cũng không ổn định.
- Dùng navigator.share() để mở bảng chia sẻ hệ thống trên Android/iPhone.
- Nếu máy không hỗ trợ share: tự copy link để dán vào Zalo.
- Cấu trúc sạch để upload Vercel: không node_modules, không dist.
