const CACHE = 'inch-calc-v1'; // increment to refresh cache

// List of local resources we always want cached
const ASSETS = [
  '/',
  '/tapemeasurememory.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/styles.css',
  '/script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
