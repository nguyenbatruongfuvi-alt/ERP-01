ERP V30.29 - OFFLINE TRUE FULL
- Giữ nguyên UI V30.28.
- Fix offline thật: Service Worker cache runtime JS/CSS/assets của Vite.
- Cho đăng nhập offline bằng session/cache đã từng lưu trên máy.
- Khi mất mạng, app vẫn mở được sau khi đã từng mở online ít nhất 1 lần và service worker đã cài.
- Lưu local-first + queue đồng bộ nền giữ nguyên từ V30.27/V30.28.
- Nút Zalo giữ Web Share API + fallback copy link.

Cách dùng:
1. Upload đúng cấu trúc gốc lên GitHub/Vercel.
2. Sau khi deploy, mở app online 1 lần để Service Worker cache tài nguyên.
3. Đăng nhập 1 lần online để máy có session/cache.
4. Sau đó tắt mạng: mở lại app vẫn vào được bằng dữ liệu đã lưu.
