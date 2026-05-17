self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Purge any old corrupt caches to fix blank screen issues immediately
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // No-op fetch handler: satisfies PWA install criteria perfectly
  // without causing any stale assets or 404 cache out-of-sync bugs!
});
