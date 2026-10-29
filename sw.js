/* Matrix CRM service worker: offline shell for the app chrome. Data lives in localStorage and IndexedDB, so no data sync here. */
var CACHE = 'matrix-matrix-shell-v12-31';
var SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './migrate-v12.js',
  './seed-data.js',
  './firebase-config.js',
  './matrix-cloud.js',
  './manifest.webmanifest',
  './icons/matrix-logo.svg',
  './icons/matrix-logo.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Network first for the shell so a deploy shows up on next load; cache fallback when offline.
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) { return hit || caches.match('./index.html'); });
    })
  );
});
