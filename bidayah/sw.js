// Service Worker Al-Bidayah
// Menyimpan "app shell" (file aplikasi) supaya bisa dibuka offline.
// Data kitab sendiri (Firestore) ditangani terpisah lewat offline
// persistence Firestore, bukan lewat file ini.

const CACHE_NAME = 'albidayah-shell-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './libs/html2canvas.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://www.gstatic.com/firebasejs/11.2.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore-compat.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        APP_SHELL.map(url => cache.add(url).catch(err => {
          console.warn('[sw] gagal cache:', url, err);
        }))
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Strategi: tampilkan dari cache dulu (cepat, jalan offline),
// sambil diam-diam update cache dari jaringan kalau online.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      const jaringan = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const salinan = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, salinan));
          }
          return res;
        })
        .catch(() => cached);
      return cached || jaringan;
    })
  );
});
