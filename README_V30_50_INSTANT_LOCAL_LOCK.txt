ERP V30.50 - INSTANT LOCAL LOCK

Bản này sửa đúng lỗi ảnh chụp:
- Mở chi tiết lần đầu thấy số cũ, chờ API mới nhảy số.
- Bỏ chọn nhân viên rồi Lưu, màn chi tiết/modal vẫn hiện số cũ trong 5-20 giây.
- Google Sheet/Apps Script trả dữ liệu cũ ghi đè lại local vừa lưu.

Thay đổi frontend:
1) Sau khi bấm Lưu, bundle local được khóa 10 phút bằng localDraftAt/cachedAt.
2) API getNhapLieuBundleV309 trả về trong lúc Google Sheet chưa kịp cập nhật sẽ KHÔNG được ghi đè local.
3) Áp dụng cho Tăng ca, Biến động nhân sự, Vắng mặt, Làm ngày lễ.
4) Service Worker đổi cache sang v50-instant-local-lock để PWA nhận bản mới.

Triển khai:
1) Upload toàn bộ thư mục này lên Vercel.
2) Apps Script: dùng file Code_V30_50_APPS_SCRIPT_STABLE.gs nếu bạn chưa cập nhật bản stable trước đó.
3) Deploy Vercel xong, trên điện thoại đóng hẳn PWA rồi mở lại/refresh 1-2 lần.
4) Test: chọn 5 -> bỏ 1 -> Lưu -> mở chi tiết phải còn 4 ngay, không chờ 20 giây.
