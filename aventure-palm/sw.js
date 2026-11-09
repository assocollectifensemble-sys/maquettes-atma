/* Service worker : tout le jeu en cache, il marche ensuite hors connexion. */
const CACHE = "aventure-palm-a67b340c";
const FICHIERS = ["./", "./index.html", "./manifest.json", "./css/style.css", "./assets/icone.svg", "./js/audio.js", "./js/art.js", "./js/objets.js", "./js/chambre.js", "./js/contenu.js", "./js/storage.js", "./js/games.js", "./js/app.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).catch(() => caches.match("./index.html"))));
});
