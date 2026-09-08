const CACHE_NAME = 'mdta-pwa-v1';
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/mdta.ico',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE).catch((err) => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore non-http/https requests (e.g. chrome-extension://, data:)
  if (!url.protocol.startsWith('http')) return;

  // Ignore Webpack Hot Module Reloading (HMR) requests in development
  if (url.pathname.includes('/_next/webpack-hmr') || url.pathname.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch(async () => {
          if (event.request.mode === 'navigate') {
            const cache = await caches.open(CACHE_NAME);
            const fallback = await cache.match('/');
            if (fallback) return fallback;
          }
          return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
    })
  );
});
