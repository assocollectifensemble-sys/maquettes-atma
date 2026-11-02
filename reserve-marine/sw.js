/* Service worker : aventure en cache pour un usage HORS CONNEXION. Incrémenter VERSION à chaque livraison. */
const VERSION = "reserve-marine-lagon-v2";
const FICHIERS = ["./", "index.html", "manifest.json", "css/style.css",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/icon-maskable-512.png", "assets/icons/apple-touch-icon-180.png",
  "js/storage.js", "js/audio.js", "js/qr.js", "js/art.js", "js/content.js", "js/games.js", "js/app.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Cache d'abord (rapide, hors ligne), mise à jour en arrière-plan ; les adresses ?station=… servent index.html.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(cache => cache.match(e.request, { ignoreSearch: true }).then(hit => {
    const reseau = fetch(e.request).then(r => { if (r.ok && hit) cache.put(new Request(url.origin + url.pathname), r.clone()); return r; });
    if (hit) { e.waitUntil(reseau.catch(() => {})); return hit; }
    return reseau.catch(() => e.request.mode === "navigate" ? cache.match("index.html") : new Response("", { status: 504 }));
  })));
});
