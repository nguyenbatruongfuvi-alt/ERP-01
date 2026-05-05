ERP V30.48 - LOCAL DETAIL INSTANT FIX

Sửa đúng vấn đề còn lại:
1) Sau khi lưu Tăng ca / Biến động / Vắng mặt / Làm ngày lễ:
   - Ghi ngay vào cache chi tiết với key chuẩn hóa.
   - Mở báo cáo chi tiết thấy ngay, không chờ Google Sheet 5-20 giây.
2) Sửa lệch key bộ phận:
   - Trộn đường / Trộn Đường / TRỘN_ĐƯỜNG đều đọc cùng một cache.
3) Bỏ dòng ghi chú/trạng thái trong màn chi tiết.
4) Danh sách chi tiết có vùng cuộn riêng, giống màn Tăng ca.
5) Giữ logic local-first; Google Sheet đồng bộ nền sau.
6) Không đụng package/npm.

Lưu ý triển khai:
- Upload toàn bộ gói lên Vercel.
- Sau deploy, đóng/mở lại PWA hoặc refresh 1-2 lần để Service Worker v48 nhận cache mới.
