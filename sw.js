const CACHE_NAME = 'erp-v30-ui-shell-v35-app-true-smart-sync';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/logo-ph.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirstThenCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
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
  if (fresh && fresh.ok) cache.put(request, fresh.clone());
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

  // Chỉ xử lý tài nguyên cùng domain Vercel.
  if (url.origin !== self.location.origin) return;

  // Navigation: ưu tiên mạng, offline thì trả index.html đã cache.
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstThenCache(event.request));
    return;
  }

  // JS/CSS/assets: cache-first để offline mở lại vẫn chạy.
  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.json')) {
    event.respondWith(cacheFirstThenNetwork(event.request));
    return;
  }

  event.respondWith(networkFirstThenCache(event.request));
});
