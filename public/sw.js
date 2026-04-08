// App7i Service Worker - enables PWA install on Android/iOS
// Cache version is busted by deploy timestamp appended during build
const CACHE = 'app7i-v3';

self.addEventListener('install', e => {
  // Skip waiting to activate immediately on update
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete ALL old caches on activate
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for navigation — only fall back to cache when offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
  }
});

// Push notification handling
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const title = data.notification?.title || 'App7i';
  const options = {
    body: data.notification?.body || 'You have a new notification',
    icon: '/logo192.png',
    badge: '/favicon-32.png',
    data: data.data || {}
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      if (windowClients.length > 0) {
        windowClients[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
