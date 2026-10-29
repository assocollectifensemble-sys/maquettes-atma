/* Service worker : cache toute l'application pour un usage HORS CONNEXION. */
const VERSION = "makes-demo-v2";
const FICHIERS = [
  "./", "index.html", "manifest.json", "css/style.css", "assets/icon.svg",
  "js/astronomy.min.js", "js/sky.js", "js/storage.js", "js/sensors.js", "js/audio.js",
  "js/art.js", "js/content.js", "js/aim.js", "js/app.js"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // Fichiers audio facultatifs : réseau d'abord, mise en cache au passage
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(r => {
        if (r.ok && /\.(mp3|ogg|wav)$/.test(url.pathname)) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(e.request, cp)); }
        return r;
      }).catch(() => e.request.mode === "navigate" ? caches.match("index.html") : new Response("", { status: 504 }));
    })
  );
});
