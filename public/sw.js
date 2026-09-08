const CACHE_NAME = 'mdta-pwa-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// Install: cache hanya static assets, BUKAN halaman navigasi
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
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
  // Abaikan non-GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Abaikan non-http
  if (!url.protocol.startsWith('http')) return;

  // Abaikan HMR, API calls, Next.js internals — biarkan ke network
  if (
    url.pathname.includes('/_next/webpack-hmr') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.search.includes('_rsc')
  ) return;

  // Untuk request navigasi (pindah halaman) — SELALU network first, jangan cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Offline fallback: kembalikan halaman utama dari cache jika ada
        return caches.match('/') || new Response(
          '<html><body><h2>Sedang offline. Mohon periksa koneksi internet Anda.</h2></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Untuk static assets (icon, manifest, dll) — cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Semua request lain — network only (tidak di-cache)
  event.respondWith(fetch(event.request));
});
