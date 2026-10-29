/* ============================================================
   SENSORS.JS — Orientation du téléphone (« Vise le ciel »)
   - Android/Chrome : événement `deviceorientationabsolute` (nord magnétique)
   - iOS : `deviceorientation` + `webkitCompassHeading`, permission demandée
           par un geste (DeviceOrientationEvent.requestPermission)
   - Repli sans capteurs (PC, refus) : on fait glisser le ciel (doigt/souris/flèches)
   Nécessite HTTPS (ou localhost) pour les capteurs.
   Sortie : une base orthonormée {f, r, u} dans le repère Est-Nord-Haut,
   AZIMUT VRAI (déclinaison magnétique corrigée).
   ============================================================ */
(function () {
  "use strict";
  const RAD = Math.PI / 180;
  const S = {
    mode: "aucun",         // 'abs' | 'rel' | 'ios' | 'glisse' | 'aucun'
    raison: "",            // pourquoi on est en repli (affiché à l'utilisateur)
    decl: window.Sky ? Sky.DECL : -19.6,
    recale: 0,             // correction manuelle (degrés d'azimut), via « Recaler »
    iosOff: null,          // décalage alpha→cap pour iOS
    vue: { az: 0, alt: 30 },  // vue en mode glisse
    basis: null,           // base lissée {f,r,u}
    brut: null,            // dernier relevé brut
    nEvents: 0, t0: 0, accuracy: null, spread: 0, last: null
  };

  const norm = v => { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const addAz = (v, deg) => { const d = deg * RAD, c = Math.cos(d), s = Math.sin(d); return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]]; };

  // Matrice W3C R = Rz(alpha)·Rx(beta)·Ry(gamma) → axes de l'appareil dans le repère Est-Nord-Haut
  function axes(alpha, beta, gamma) {
    const a = alpha * RAD, b = beta * RAD, g = gamma * RAD;
    const cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
    const r = [cA * cG - sA * sB * sG, cG * sA + cA * sB * sG, -cB * sG];   // X appareil (droite de l'écran)
    const u = [-cB * sA, cA * cB, sB];                                       // Y appareil (haut de l'écran)
    const z = [cA * sG + cG * sA * sB, sA * sG - cA * cG * sB, cB * cG];     // Z appareil (sort de l'écran)
    return { r, u, f: [-z[0], -z[1], -z[2]] };                               // f = DOS du téléphone (direction visée)
  }
  const azOf = v => ((Math.atan2(v[0], v[1]) / RAD) + 360) % 360;

  function basisDrag() { // base issue de (az, alt), sans roulis
    const { az, alt } = S.vue; const a = az * RAD, h = alt * RAD;
    const f = [Math.sin(a) * Math.cos(h), Math.cos(a) * Math.cos(h), Math.sin(h)];
    const r = [Math.cos(a), -Math.sin(a), 0];
    return { f, r, u: cross(r, f) };
  }

  function onOrient(e, absolute) {
    if (e.alpha == null || e.beta == null || e.gamma == null) return;
    S.nEvents++;
    let alpha = e.alpha;
    let mode = absolute ? "abs" : (e.absolute ? "abs" : "rel");
    if (typeof e.webkitCompassHeading === "number" && !isNaN(e.webkitCompassHeading)) {
      mode = "ios"; S.accuracy = e.webkitCompassAccuracy;
      // cap magnétique du dos de l'appareil ← on cale alpha (relatif) dessus quand l'appareil est assez vertical
      const ax = axes(alpha, e.beta, e.gamma);
      const hor = Math.hypot(ax.f[0], ax.f[1]);
      if (hor > 0.5) {
        const off = ((e.webkitCompassHeading - azOf(ax.f)) + 540) % 360 - 180;
        S.iosOff = S.iosOff == null ? off : S.iosOff + 0.15 * (((off - S.iosOff) + 540) % 360 - 180);
      }
      alpha = alpha - (S.iosOff || 0); // addAz = +off sur l'azimut ⇒ alpha − off
    }
    if (mode === "rel" && S.mode === "abs") return; // on garde l'absolu s'il existe
    S.mode = mode;
    const ax = axes(alpha, e.beta, e.gamma);
    const d = S.decl + S.recale;
    const raw = { f: norm(addAz(ax.f, d)), r: norm(addAz(ax.r, d)), u: norm(addAz(ax.u, d)) };
    // lissage (filtre passe-bas sur les vecteurs)
    const k = 0.28;
    if (!S.basis) S.basis = raw; else {
      const m = (a, b) => norm([a[0] + k * (b[0] - a[0]), a[1] + k * (b[1] - a[1]), a[2] + k * (b[2] - a[2])]);
      const f = m(S.basis.f, raw.f); let r = m(S.basis.r, raw.r);
      r = norm(cross(cross(f, r), f)); // ré-orthogonalise
      S.basis = { f, r, u: cross(r, f) };
    }
    // mesure de l'agitation pour le geste de calibration (« 8 »)
    if (S.last) { S.spread += Math.abs(((alpha - S.last.a + 540) % 360) - 180) + Math.abs(e.beta - S.last.b) + Math.abs(e.gamma - S.last.g); }
    S.last = { a: alpha, b: e.beta, g: e.gamma };
  }

  S.supported = () => typeof window.DeviceOrientationEvent !== "undefined";
  S.needsPermission = () => typeof window.DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function";

  let started = false, listeners = [];
  S.start = async function () {
    if (started) return S.mode;
    S.raison = "";
    if (!window.isSecureContext) { S.raison = "Les capteurs demandent une connexion sécurisée (HTTPS). Le site final sera en HTTPS."; return S.glisse(); }
    if (!S.supported()) { S.raison = "Ce navigateur n'a pas de capteur d'orientation."; return S.glisse(); }
    try {
      if (S.needsPermission()) {
        const rep = await DeviceOrientationEvent.requestPermission();
        if (rep !== "granted") { S.raison = "Accès aux capteurs refusé."; return S.glisse(); }
      }
    } catch (err) { S.raison = "Accès aux capteurs impossible."; return S.glisse(); }
    started = true; S.nEvents = 0; S.t0 = performance.now();
    const hAbs = e => onOrient(e, true), hRel = e => onOrient(e, false);
    window.addEventListener("deviceorientationabsolute", hAbs, true);
    window.addEventListener("deviceorientation", hRel, true);
    listeners = [["deviceorientationabsolute", hAbs], ["deviceorientation", hRel]];
    // si aucun relevé valide au bout de 1,5 s (PC) → repli
    await new Promise(res => setTimeout(res, 1500));
    if (S.nEvents === 0) { S.stop(); S.raison = "Aucun capteur détecté (ordinateur ?)."; return S.glisse(); }
    return S.mode;
  };
  S.stop = function () { listeners.forEach(([n, h]) => window.removeEventListener(n, h, true)); listeners = []; started = false; S.basis = null; };
  S.glisse = function () { S.stop(); S.mode = "glisse"; return "glisse"; };
  S.isSensor = () => S.mode === "abs" || S.mode === "rel" || S.mode === "ios";

  // Angle de rotation de l'écran (0 portrait, 90/270 paysage) : les axes « droite » et « haut »
  // de l'ÉCRAN ne sont plus ceux de l'APPAREIL quand le téléphone est tenu en paysage.
  function angleEcran() {
    const a = (screen.orientation && typeof screen.orientation.angle === "number") ? screen.orientation.angle : (typeof window.orientation === "number" ? window.orientation : 0);
    return ((a % 360) + 360) % 360;
  }
  // Base courante (capteurs ou glisse)
  S.get = function () {
    if (S.mode === "glisse" || !S.basis) return basisDrag();
    const th = angleEcran(); if (!th) return S.basis;
    const c = Math.cos(th * RAD), s = Math.sin(th * RAD), b = S.basis;
    // écran tourné de θ : droite_écran = r·cosθ − u·sinθ ; haut_écran = r·sinθ + u·cosθ
    const r = [0, 1, 2].map(i => b.r[i] * c - b.u[i] * s), u = [0, 1, 2].map(i => b.r[i] * s + b.u[i] * c);
    return { f: b.f, r, u };
  };
  S.setView = function (az, alt) { S.vue.az = ((az % 360) + 360) % 360; S.vue.alt = Math.max(-89, Math.min(89, alt)); };
  S.pointing = function () { const f = S.get().f; return { az: azOf(f), alt: Math.asin(Math.max(-1, Math.min(1, f[2]))) / RAD }; };

  // « Recaler » : l'enfant sait que sa visée actuelle correspond à (az, alt) → on corrige l'azimut
  S.recaleSur = function (azCible) {
    const cur = S.pointing().az; const delta = ((azCible - cur + 540) % 360) - 180;
    S.recale += delta; S.basis = null;
  };
  S.resetRecale = function () { S.recale = 0; S.basis = null; };

  window.Sensors = S;
  window.Vec = { norm, cross, dot, azOf };
})();
