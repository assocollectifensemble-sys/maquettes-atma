/* Service worker : cache toute l'application pour un usage HORS CONNEXION.
   ⚠️ Incrémenter VERSION à CHAQUE livraison : c'est ce qui force les téléphones
   à retélécharger les fichiers (l'ancien cache est supprimé à l'activation). */
const VERSION = "makes-demo-v3";
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
  // Cache d'abord (démarrage instantané, hors connexion) ; en ligne, on rafraîchit le cache
  // en arrière-plan pour la visite suivante. Fichiers audio facultatifs : mis en cache au passage.
  e.respondWith(caches.open(VERSION).then(cache =>
    cache.match(e.request, { ignoreSearch: true }).then(hit => {
      const reseau = fetch(e.request).then(r => {
        if (r.ok && (hit || /\.(mp3|ogg|wav)$/.test(url.pathname))) cache.put(hit ? new Request(url.origin + url.pathname) : e.request, r.clone());
        return r;
      });
      if (hit) { e.waitUntil(reseau.catch(() => { })); return hit; }
      return reseau.catch(() => e.request.mode === "navigate" ? cache.match("index.html") : new Response("", { status: 504 }));
    })
  ));
});
