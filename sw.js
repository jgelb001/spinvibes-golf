// SpinVibes — self-destroying service worker.
// The spinvibes.com PWA has been retired in favor of a welcome page that funnels
// to the guide (golf.spinvibes.com) and the app (app.spinvibes.com). This SW
// unregisters itself and clears all old caches so installed visitors land on the
// new page instead of a cached copy of the old app.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.navigate(c.url));
  })());
});

// Network-first while winding down, so nothing is served stale.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
