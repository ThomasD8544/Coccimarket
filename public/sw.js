const CACHE_NAME = 'coccimarket-v1';
const URLS_TO_CACHE = ['/dashboard', '/lots', '/reception'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      return fetch(event.request);
    })
  );
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
