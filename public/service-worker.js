const CACHE_NAME = 'watersight-static-v2';
const PRECACHE_URLS = [
  '/manifest.json',
  '/icon.png',
  '/favicon.ico',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((error) => {
        console.error('Service Worker: Precache failed', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  try {
    return new URL(url, self.location.origin).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      (request.headers.get('accept') || '').includes('text/html'))
  );
}

function shouldBypassCache(requestUrl) {
  const { pathname } = new URL(requestUrl, self.location.origin);
  if (pathname === '/' || pathname === '/index.html') return true;
  if (pathname === '/service-worker.js') return true;
  if (pathname.startsWith('/api')) return true;
  if (pathname.startsWith('/assets/')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !isSameOrigin(request.url)) {
    return;
  }

  if (isNavigationRequest(request) || shouldBypassCache(request.url)) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
      });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification('WaterSight', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
