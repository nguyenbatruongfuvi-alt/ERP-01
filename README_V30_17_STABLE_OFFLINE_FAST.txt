ERP V30.17 STABLE OFFLINE FAST

NỀN: V30.16 đã ổn định, bản này sửa tiếp để dùng thực tế.

ĐÃ SỬA:
1) Vắng mặt:
   - Người đã chọn hiển thị đồng thời Có phép/Không phép và nút Đã chọn.
   - Bấm Đã chọn hoặc bấm dòng để bỏ chọn.

2) Lưu dữ liệu:
   - Nút lưu đổi màu theo trạng thái:
     Xanh: sẵn sàng
     Cam: đang lưu / offline lưu tạm
     Xanh lá sáng: đã lưu thành công
     Đỏ: lỗi, chưa lưu
   - Chống bấm lưu liên tục.
   - Giữ requestId để chống ghi trùng.

3) Mở app nhanh hơn:
   - Có màn splash cố định để chống nhảy giao diện.
   - Khi mở app sẽ tải danh sách bộ phận và tự preload bộ phận gần nhất.
   - Khi chọn bộ phận sẽ preload dữ liệu hôm nay ngay trước khi đăng nhập.

4) Online/offline:
   - Có cache local.
   - Offline vẫn lưu tạm vào queue.
   - Online tự đồng bộ.

CÀI ĐẶT:
1) Apps Script: thay toàn bộ Code.gs bằng apps_script/Code.gs.
2) Deploy Apps Script > Manage deployments > Edit > New version.
3) Vercel: upload toàn bộ source, build npm run build, output dist.
4) Điện thoại: đóng app/PWA rồi mở lại. Nếu còn bản cũ, gỡ PWA hoặc xóa cache.
