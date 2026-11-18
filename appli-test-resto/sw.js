/* Service worker : tout le site en cache, l'appli s'ouvre hors-ligne. */
const VERSION = 'appli-test-resto-v3';
const FICHIERS = ['./', 'index.html', 'style.css?v=3', 'app.js?v=3', 'config.json', 'data/demo.json', 'manifest.json',
  'img/logo.png', 'img/icon-192.png', 'img/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Réseau d'abord pour les données (re-thème visible tout de suite), cache en relais
  e.respondWith(fetch(e.request).then(r => {
    const copie = r.clone();
    caches.open(VERSION).then(c => c.put(e.request, copie));
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('index.html'))));
});
