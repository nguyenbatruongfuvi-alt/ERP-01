ERP V30.43 - STABLE DETAIL PATCH

- Làm trên file gốc ổn định, không đụng npm/package.
- Bỏ ô tìm kiếm trong giao diện chi tiết.
- Chi tiết báo cáo đọc dữ liệu từ BAO_CAO_CHI_TIET qua getBaoCaoChiTietXemTruoc, có cache local trước rồi đồng bộ nền.
- Vắng mặt/Tổng hợp tự nhảy sang tab có dữ liệu đầu tiên.
- Card bộ phận và modal chi tiết có CSS đúng, không bị HTML thô.
- Chọn nhân viên không nhảy lên đầu, giữ vị trí hiện tại.
- Chặn refresh nền khi đang xem chi tiết/chọn nhân viên.
- Service Worker cache v43 để PWA nhận bản mới.
