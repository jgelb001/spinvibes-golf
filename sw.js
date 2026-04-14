// SpinVibes Golf — Service Worker v10
// Strategy: network-first for HTML, cache-first for everything else

const CACHE = 'spinvibes-golf-v31';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/spinvibes_profile.svg',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap'
];

// Install: pre-cache all assets, activate immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: wipe all old caches, claim all clients immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   - Navigation (HTML page): network first → cache fallback
//   - Everything else: cache first → network fallback
self.addEventListener('fetch', e => {
  const isNavigation = e.request.mode === 'navigate' ||
    (e.request.method === 'GET' && e.request.headers.get('accept') &&
     e.request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    // Network-first: always try to get fresh HTML
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  // Cache-first for assets (fonts, icons, etc.)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});

// Listen for skipWaiting message from app
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
