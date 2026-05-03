const CACHE_VERSION = 'v38-cache-guard';
const CACHE_NAME = `erp-v30-ui-shell-${CACHE_VERSION}`;
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/logo-ph.png'];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    APP_SHELL.map(async (url) => {
      try {
        const fresh = await fetch(new Request(url, { cache: 'reload' }));
        if (fresh && fresh.ok) await cache.put(url, fresh.clone());
      } catch (err) {
        // Bỏ qua từng file để SW vẫn install được nếu 1 asset tạm lỗi.
      }
    })
  );
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(cacheAppShell());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('erp-v30') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirstThenCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(new Request(request, { cache: 'reload' }));
    if (fresh && fresh.ok) await cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return cache.match('/index.html');
    throw err;
  }
}

async function cacheFirstThenNetwork(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) await cache.put(request, fresh.clone());
  return fresh;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Apps Script/API không cache; frontend local-first tự xử lý khi mất mạng.
  if (url.href.includes('script.google.com') || url.href.includes('script.googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // HTML/app shell luôn network-first để tránh kẹt phiên bản cũ gây trắng màn hình.
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(networkFirstThenCache(event.request));
    return;
  }

  // JS/CSS cũng network-first; mất mạng mới dùng cache.
  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirstThenCache(event.request));
    return;
  }

  // Logo/manifest có thể cache-first để offline mở nhanh.
  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.json')) {
    event.respondWith(cacheFirstThenNetwork(event.request));
    return;
  }

  event.respondWith(networkFirstThenCache(event.request));
});
