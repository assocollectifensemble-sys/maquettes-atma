/* Service worker : met toute l'aventure en cache pour un usage HORS CONNEXION.
   ⚠️ Incrémenter VERSION à CHAQUE livraison : c'est ce qui force les téléphones
   à retélécharger les fichiers (l'ancien cache est supprimé à l'activation).
   Voix enregistrées : ajouter ici leurs chemins (ex. "assets/audio/intro0.fr.mp3"). */
const VERSION = "kelonia-kawann-v5"; // v5 : tableau de bord Kélonia (?station=stats, js/stats.js) // v4 : voix coupées // v3 : version démo (écran « Le projet », bassin 1 seul) + icônes PNG
const FICHIERS = [
  "./", "index.html", "manifest.json", "css/style.css", "assets/icon.svg",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/icon-maskable-512.png", "assets/icons/apple-touch-icon-180.png",
  "js/storage.js", "js/audio.js", "js/qr.js", "js/art.js", "js/content.js", "js/games.js", "js/stats.js", "js/app.js"
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
  if (url.origin !== location.origin) return; // liens externes (parrainage) : laissés au navigateur
  // Cache d'abord (démarrage instantané, hors connexion) ; en ligne, rafraîchissement en arrière-plan.
  // ignoreSearch : « ?station=3 » sert le même index.html que la page d'accueil.
  e.respondWith(caches.open(VERSION).then(cache =>
    cache.match(e.request, { ignoreSearch: true }).then(hit => {
      const reseau = fetch(e.request).then(r => {
        if (r.ok && (hit || /\.(mp3|ogg|m4a)$/.test(url.pathname))) cache.put(hit ? new Request(url.origin + url.pathname) : e.request, r.clone());
        return r;
      });
      if (hit) { e.waitUntil(reseau.catch(() => { })); return hit; }
      return reseau.catch(() => e.request.mode === "navigate" ? cache.match("index.html") : new Response("", { status: 504 }));
    })
  ));
});
