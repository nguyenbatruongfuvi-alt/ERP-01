ERP V30.31 - OFFLINE/ONLINE STRUCTURE SYNC LOCKED
- Giữ nguyên UI V30.30.
- Đồng bộ cấu trúc offline/online: đăng nhập online sẽ lưu cache đăng nhập riêng theo từng bộ phận.
- Đăng xuất không xóa cache đăng nhập offline theo bộ phận.
- Khi offline: chọn đúng bộ phận + mật khẩu đã đăng nhập online trước đó sẽ vào được app.
- Báo cáo công ty chuyển sang local-first: hiện dữ liệu cache trước, API cập nhật nền sau.
- Auto sync queue mỗi 5 giây, khi online/focus/visible.
- Apps Script không cần sửa nếu đang dùng Code_V30_30_COMPATIBLE_FULL.gs.
