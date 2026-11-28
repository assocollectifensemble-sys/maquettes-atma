/* ============================================================
   SW.JS — Croki v2 pilote : hors-ligne au parc (réseau capricieux)
   Stratégie : pré-cache de la coquille + images ; cache d'abord,
   réseau en secours. Vidéos : réseau d'abord (lourdes, plages HTTP).
   Changer VERSION à chaque mise à jour des fichiers.
   ============================================================ */
const VERSION = "crokiv2-pilote-1";

const COQUILLE = [
  "./", "index.html", "manifest.json", "css/style.css",
  "js/config.js", "js/storage.js", "js/audio.js", "js/sensors.js", "js/art.js", "js/games.js", "js/photo.js", "js/app.js",
  "fonts/fredoka.woff2", "fonts/nunito.woff2",
  "assets/audio/victoire.mp3",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/apple-touch-icon.png",
  "assets/img/plan-parc.webp",
  "assets/img/croki-a-toi-de-jouer.webp", "assets/img/croki-accueil-salut.webp", "assets/img/croki-appuye-malin.webp",
  "assets/img/croki-court.webp", "assets/img/croki-duo-pense.webp", "assets/img/croki-espoir-nuage.webp",
  "assets/img/croki-hesite.webp", "assets/img/croki-reflechit-pilier.webp", "assets/img/croki-safari.webp",
  "assets/img/croki-salut-4pattes.webp", "assets/img/croki-splash.webp", "assets/img/croki-victoire-medaille.webp",
  "assets/img/croki-victoire-peace.webp"
  // Voix enregistrées : ajouter ici "assets/audio/voix/<clé>.mp3" au fur et à mesure.
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(k => k.startsWith("crokiv2-") && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Vidéos (requêtes partielles) : on laisse le navigateur gérer
  if (url.pathname.endsWith(".mp4") || req.headers.has("range")) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(enCache => enCache || fetch(req).then(rep => {
      if (rep && rep.ok && rep.type === "basic") {
        const copie = rep.clone();
        caches.open(VERSION).then(c => c.put(req, copie)).catch(() => {});
      }
      return rep;
    }))
  );
});
