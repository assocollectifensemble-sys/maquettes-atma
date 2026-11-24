/* Service worker : mise en cache de la maquette pour un usage hors connexion. */
const CACHE = "maquette-formations-v3";
const FILES = [
  "./", "./index.html", "./manifest.json", "./css/styles.css",
  "./js/config.js", "./js/data.js", "./js/icons.js", "./js/store.js", "./js/ui.js", "./js/router.js", "./js/docai.js", "./js/app.js",
  "./js/views/public.js", "./js/views/inscription.js", "./js/views/aide.js", "./js/views/espace.js", "./js/views/formateur.js",
  "./js/views/bureau.js", "./js/views/retroplanning.js", "./js/views/federal.js", "./js/views/coulisses.js",
  "./assets/icon.svg", "./assets/icon-192.png", "./assets/icon-512.png"
];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((res) => {
    const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res;
  })));
});
