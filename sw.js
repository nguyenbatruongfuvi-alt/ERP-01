const CACHE_VERSION = 'v41-ui-final-menu-report-holiday';
const CACHE_NAME = `erp-v30-ui-shell-${CACHE_VERSION}`;
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/logo-ph.png', '/logo-192.png', '/logo-512.png'];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    APP_SHELL.map(async (url) => {
      try {
        const fresh = await fetch(new Request(url, { cache: 'reload' }));
        if (fresh && fresh.ok) await cache.put(url, fresh.clone());
      } catch (err) {}
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

  if (url.href.includes('script.google.com') || url.href.includes('script.googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(networkFirstThenCache(event.request));
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(networkFirstThenCache(event.request));
    return;
  }

  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.json')) {
    event.respondWith(cacheFirstThenNetwork(event.request));
    return;
  }

  event.respondWith(networkFirstThenCache(event.request));
});
