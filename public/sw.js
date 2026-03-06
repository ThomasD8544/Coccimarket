const CACHE_NAME = 'coccimarket-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Important: no offline/cache strategy for app pages/assets to avoid stale Next.js bundles
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'DLC', body: 'Alerte DLC' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'DLC', {
      body: data.body || 'Alerte DLC',
      icon: '/icon-192.png'
    })
  );
});
