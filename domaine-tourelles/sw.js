/* Service worker : met l'aventure en cache pour jouer hors connexion */
const CACHE = "domaine-tourelles-v2";
const FICHIERS = ["./", "index.html", "css/style.css", "js/storage.js", "js/audio.js", "js/contenu.js", "js/art.js", "js/app.js", "manifest.webmanifest", "assets/icone.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    const copie = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); return res;
  })));
});
