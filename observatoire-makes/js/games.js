/* ============================================================
   GAMES.JS — Les aventures digitales des étapes 1 et 2.
   · Games.axe     (étape 1, espace Jaï Sing) : incliner l'arête d'un
     instrument « à la manière » du Samrat Yantra jusqu'à ce qu'elle vise le
     centre de rotation du ciel (pôle sud céleste, hauteur = latitude 21,2°).
   · Games.coupole (étape 2, petites coupoles) : tourner la coupole vers
     l'azimut d'un VRAI astre de ce soir (astronomy-engine), ouvrir la fente,
     lever le télescope à sa hauteur, regarder dans l'oculaire, allumer le suivi.
   · Games.cibleDuSoir(date) : choix de l'astre (Saturne, Jupiter, Lune, Mars, Vénus).
   Doigt, souris et clavier. Chaque jeu : { destroy(), solve(), state() }.
   ============================================================ */
(function () {
  "use strict";
  const RAD = Math.PI / 180, NS = "http://www.w3.org/2000/svg";
  const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dir8 = az => ["N", "NE", "E", "SE", "S", "SO", "O", "NO"][Math.round(((az % 360) + 360) % 360 / 45) % 8];
  function pt(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
  function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // =====================================================================
  // ÉTAPE 1 — L'axe du Monde
  // =====================================================================
  function axe(host, o) {
    const LAT = Math.abs(Sky.LAT), K = 5.1, HOR = 214, PX = 180, PY = HOR - LAT * K; // pôle dans le panneau « ciel vers le sud »
    const BX = 64, BY = 424, L = 182, MIN = 0, MAX = 60, TOL = 1.3;
    let fini = false, th = 45, done = false, raf = 0, rot = 0, lastT = 0, holdT = 0, drag = false;
    const r = rnd(21);
    // filés d'étoiles (pose longue vers le sud) : arcs concentriques autour du VRAI pôle
    let traces = "";
    for (let i = 0; i < 34; i++) {
      const rr = 14 + i * 7 + r() * 5, a0 = r() * 360, len = 26 + r() * 40, w = r() > .85 ? 2.2 : 1.3, op = (.35 + r() * .55).toFixed(2);
      const p = a => [PX + rr * Math.cos(a * RAD), PY + rr * Math.sin(a * RAD)];
      const s = p(a0), e = p(a0 + len);
      traces += '<path d="M' + s[0].toFixed(1) + ' ' + s[1].toFixed(1) + ' A ' + rr.toFixed(1) + ' ' + rr.toFixed(1) + ' 0 0 1 ' + e[0].toFixed(1) + ' ' + e[1].toFixed(1) + '" stroke="#cfe6ff" stroke-width="' + w + '" stroke-linecap="round" fill="none" opacity="' + op + '"/><circle cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="' + (w * .9) + '" fill="#fff" opacity="' + op + '"/>';
    }
    let grad = ""; for (let h = 0; h <= 40; h += 10) grad += '<path d="M14 ' + (HOR - h * K) + ' h10" stroke="#9fb4ff" stroke-width="1.5"/><text x="28" y="' + (HOR - h * K + 4) + '" class="ax-grad">' + h + '°</text>';
    let rap = '<path d="M' + (BX + 192) + ' ' + BY + ' A 192 192 0 0 0 ' + (BX + 192 * Math.cos(60 * RAD)).toFixed(1) + ' ' + (BY - 192 * Math.sin(60 * RAD)).toFixed(1) + '" fill="none" class="ax-arc-g"/>';
    for (let a = 0; a <= 60; a += 5) { const c = Math.cos(a * RAD), s = Math.sin(a * RAD), l = a % 10 ? 6 : 12; rap += '<path d="M' + (BX + 192 * c).toFixed(1) + ' ' + (BY - 192 * s).toFixed(1) + ' L' + (BX + (192 + l) * c).toFixed(1) + ' ' + (BY - (192 + l) * s).toFixed(1) + '" class="ax-tick"/>' + (a % 20 === 0 && a < 60 ? '<text x="' + (BX + 214 * c).toFixed(1) + '" y="' + (BY - 214 * s + 4).toFixed(1) + '" class="ax-rap" text-anchor="middle">' + a + '°</text>' : ""); }
    host.innerHTML =
      '<div class="jeu-axe"><svg class="ax-svg" viewBox="0 0 360 446" role="img" aria-label="Instrument à incliner et ciel vers le sud">' +
      '<defs><linearGradient id="ax-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030622"/><stop offset="1" stop-color="#1c2a78"/></linearGradient>' +
      '<linearGradient id="ax-pierre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d9b1"/><stop offset="1" stop-color="#c98f5e"/></linearGradient>' +
      '<radialGradient id="ax-halo"><stop offset="0" stop-color="#ffe27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="ax-clip"><rect x="8" y="8" width="344" height="' + (HOR - 8) + '" rx="20"/></clipPath></defs>' +
      // ---- panneau du haut : le ciel, face au sud ----
      '<rect x="8" y="8" width="344" height="232" rx="20" fill="url(#ax-ciel)"/>' +
      '<g clip-path="url(#ax-clip)"><g id="ax-rot">' + traces + '</g><circle id="ax-pole" cx="' + PX + '" cy="' + PY + '" r="5" fill="#ffe27a" opacity="0"/></g>' +
      '<path d="M8 ' + HOR + ' C 60 ' + (HOR - 14) + ', 110 ' + (HOR - 4) + ', 160 ' + (HOR - 12) + ' S 270 ' + (HOR - 2) + ', 352 ' + (HOR - 16) + ' V 240 H 8 Z" fill="#0a1030"/>' +
      '<rect x="8" y="8" width="344" height="232" rx="20" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/>' +
      grad + '<text x="180" y="234" text-anchor="middle" class="ax-card">S</text><text x="30" y="234" class="ax-card">E</text><text x="330" y="234" class="ax-card" text-anchor="end">O</text>' +
      '<text x="342" y="30" text-anchor="end" class="ax-leg">Pose longue vers le sud</text>' +
      '<g id="ax-mire"><circle r="15" fill="none" stroke="#ffd23f" stroke-width="3"/><path d="M-24 0h14M10 0h14M0 -24v14M0 10v14" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/><text y="-22" text-anchor="middle" class="ax-mire-t">ton axe</text></g>' +
      // ---- panneau du bas : l'instrument vu de profil ----
      '<rect x="8" y="252" width="344" height="190" rx="20" class="ax-sol"/>' +
      '<text x="22" y="276" class="ax-dir">← nord</text><text x="338" y="276" text-anchor="end" class="ax-dir">sud →</text>' +
      '<path id="ax-ext" d="" stroke="#ffd23f" stroke-width="2.5" stroke-dasharray="6 7" opacity=".9"/>' +
      '<path id="ax-mur" d="" fill="url(#ax-pierre)" stroke="#7a4a26" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path id="ax-marches" d="" stroke="#8a5a32" stroke-width="2" opacity=".7"/>' +
      '<g>' + rap + '</g><path id="ax-arc" d="" fill="rgba(255,210,63,.25)" stroke="#ffd23f" stroke-width="2"/>' +
      '<text id="ax-val" x="330" y="318" text-anchor="end" class="ax-val">45°</text><text x="330" y="336" text-anchor="end" class="ax-dir">inclinaison</text>' +
      '<path d="M18 ' + BY + ' H 342" stroke="#5b4630" stroke-width="3"/>' +
      '<g id="ax-poignee" tabindex="0" role="slider" aria-label="Inclinaison de l\'arête" aria-valuemin="0" aria-valuemax="60" aria-valuenow="45"><circle r="30" fill="transparent"/><circle r="22" fill="url(#ax-halo)"/><circle r="13" fill="#ffd23f" stroke="#7a4a26" stroke-width="3"/><path d="M-5 -2 l5 -5 5 5 M-5 3 l5 5 5 -5" stroke="#7a4a26" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>' +
      '</svg>' +
      '<div class="ax-ctrl"><button class="btn mini rond" data-g="moins" aria-label="Baisser d\'un degré">−</button><p class="ax-fb" id="ax-fb" aria-live="polite"></p><button class="btn mini rond" data-g="plus" aria-label="Monter d\'un degré">+</button></div></div>';
    const $ = s => host.querySelector(s), svg = $(".ax-svg"), poig = $("#ax-poignee");
    function maj() {
      const c = Math.cos(th * RAD), s = Math.sin(th * RAD), TX = BX + L * c, TY = BY - L * s;
      $("#ax-mur").setAttribute("d", "M" + BX + " " + BY + " L" + TX.toFixed(1) + " " + TY.toFixed(1) + " L" + TX.toFixed(1) + " " + BY + " Z");
      let m = ""; for (let i = 1; i < 9; i++) { const x = BX + L * c * i / 9, y = BY - L * s * i / 9; m += "M" + x.toFixed(1) + " " + y.toFixed(1) + " v" + (L * s / 9 * .6).toFixed(1) + " "; }
      $("#ax-marches").setAttribute("d", m);
      $("#ax-ext").setAttribute("d", "M" + TX.toFixed(1) + " " + TY.toFixed(1) + " L" + (TX + 120 * c).toFixed(1) + " " + (TY - 120 * s).toFixed(1));
      const a2 = [BX + 50 * c, BY - 50 * s];
      $("#ax-arc").setAttribute("d", "M" + BX + " " + BY + " L" + (BX + 50) + " " + BY + " A 50 50 0 0 0 " + a2[0].toFixed(1) + " " + a2[1].toFixed(1) + " Z");
      $("#ax-val").textContent = Math.round(th) + "°";
      poig.setAttribute("transform", "translate(" + TX.toFixed(1) + " " + TY.toFixed(1) + ")"); poig.setAttribute("aria-valuenow", Math.round(th));
      const my = HOR - th * K; $("#ax-mire").setAttribute("transform", "translate(" + PX + " " + Math.max(40, my).toFixed(1) + ")"); $("#ax-mire").classList.toggle("hors", my < 40);
      const d = th - LAT, fb = $("#ax-fb");
      if (done) fb.innerHTML = "<b>21°</b> · " + (o.lang === "en" ? "aligned with the pole!" : "pile sur le pôle !");
      else if (Math.abs(d) <= TOL) fb.innerHTML = o.lang === "en" ? "Hold it there…" : "Tiens bon…";
      else fb.innerHTML = (o.lang === "en" ? (d > 0 ? "Too high: the stars spin around a lower point." : "Too low: the stars spin around a higher point.") : (d > 0 ? "Trop haut : les étoiles tournent autour d'un point plus bas." : "Trop bas : les étoiles tournent autour d'un point plus haut."));
    }
    function regle(v, son) { if (done) return; const n = clamp(v, MIN, MAX); if (son && Math.round(n) !== Math.round(th)) Audio2.Sfx.clic(); th = n; maj(); }
    function gagne() {
      done = true; th = LAT; maj(); host.querySelector(".jeu-axe").classList.add("gagne");
      $("#ax-pole").setAttribute("opacity", "1"); Audio2.Sfx.trouve(); Audio2.vibre([60, 40, 120]);
      if (o.onWin) setTimeout(() => { if (!fini) o.onWin(); }, reduit() ? 200 : 900);
    }
    // glisser la poignée (ou n'importe où dans le panneau du bas)
    svg.addEventListener("pointerdown", e => { const p = pt(svg, e); if (p.y < 246 || done) return; drag = true; svg.setPointerCapture(e.pointerId); Audio2.Sfx.unlock(); bouge(e); });
    function bouge(e) { if (!drag) return; const p = pt(svg, e); regle(Math.atan2(BY - p.y, p.x - BX) / RAD, true); }
    svg.addEventListener("pointermove", bouge);
    svg.addEventListener("pointerup", () => { drag = false; }); svg.addEventListener("pointercancel", () => { drag = false; });
    poig.addEventListener("keydown", e => { const m = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (m) { e.preventDefault(); regle(th + m, true); } });
    host.querySelector(".ax-ctrl").addEventListener("click", e => { const b = e.target.closest("[data-g]"); if (b) { Audio2.Sfx.unlock(); regle(Math.round(th) + (b.dataset.g === "plus" ? 1 : -1), true); } });
    // rotation du ciel (sens horaire autour du pôle sud quand on regarde vers le sud) + maintien 0,6 s
    function boucle(ts) {
      raf = requestAnimationFrame(boucle);
      const dt = lastT ? Math.min(.1, (ts - lastT) / 1000) : 0; lastT = ts;
      rot = (rot + dt * (done ? 22 : 9) * (reduit() ? .15 : 1)) % 360;
      $("#ax-rot").setAttribute("transform", "rotate(" + rot.toFixed(2) + " " + PX + " " + PY.toFixed(1) + ")");
      if (!done) { if (Math.abs(th - LAT) <= TOL) { holdT += dt; if (holdT >= .6) gagne(); } else holdT = 0; }
    }
    maj(); raf = requestAnimationFrame(boucle);
    return { destroy() { fini = true; cancelAnimationFrame(raf); }, solve() { if (!done) gagne(); }, state: () => ({ th, done, lat: LAT }), regle };
  }

  // =====================================================================
  // ÉTAPE 2 — Ouvre la coupole
  // =====================================================================
  const NOMS = { Saturn: { fr: "Saturne", en: "Saturn" }, Jupiter: { fr: "Jupiter", en: "Jupiter" }, Moon: { fr: "la Lune", en: "the Moon" }, Mars: { fr: "Mars", en: "Mars" }, Venus: { fr: "Vénus", en: "Venus" } };
  // Astre de « ce soir » : le plus spectaculaire au-dessus de 20° de hauteur, à 21 h (puis 20 h, 22 h, 19 h 30, 23 h).
  function cibleDuSoir(date) {
    const prio = ["Saturn", "Jupiter", "Moon", "Mars", "Venus"], heures = [21, 20, 22, 19.5, 23];
    for (const h of heures) {
      const d = Sky.heureLocale(date, h); if (Sky.sunAlt(d) > -8) continue;
      for (const b of prio) { const p = Sky.bodyAltAz(b, d); if (p.alt >= 20) return Object.assign({ id: b, nom: NOMS[b], heure: h, date: d }, p); }
    }
    return { id: "komet", nom: { fr: "Ti-Komèt", en: "Ti-Komèt" }, heure: 21, date: Sky.heureLocale(date, 21), az: 120, alt: 40, fictif: true };
  }
  const hh = h => Math.floor(h) + " h" + (h % 1 ? " " + String(Math.round(h % 1 * 60)).padStart(2, "0") : "");

  // dessin de l'astre dans l'oculaire (SVG, centré en 0,0 ; champ de rayon ~120)
  function vueOculaire(c) {
    const A = window.Astronomy, t = A.MakeTime(c.date);
    if (c.id === "Saturn") {
      const B = A.Illumination("Saturn", t).ring_tilt, k = Math.max(.035, Math.abs(Math.sin(B * RAD))), Rx = 74, Ry = Rx * k;
      c.info = { tilt: Math.abs(B) };
      const anneau = (y0, y1) => '<g><ellipse cx="0" cy="0" rx="' + Rx + '" ry="' + Ry.toFixed(2) + '" fill="none" stroke="#d9c38f" stroke-width="7"/><ellipse cx="0" cy="0" rx="' + (Rx * .82) + '" ry="' + (Ry * .82).toFixed(2) + '" fill="none" stroke="#bfa66d" stroke-width="5"/><ellipse cx="0" cy="0" rx="' + (Rx * .69) + '" ry="' + (Ry * .69).toFixed(2) + '" fill="none" stroke="#8d7a52" stroke-width="2.5" opacity=".7"/></g>';
      return '<g class="astre" transform="rotate(-8)"><clipPath id="sat-arr"><rect x="-90" y="-60" width="180" height="60"/></clipPath><clipPath id="sat-av"><rect x="-90" y="0" width="180" height="60"/></clipPath>' +
        '<g clip-path="url(#sat-arr)">' + anneau() + '</g><circle r="31" fill="url(#oc-sat)"/><path d="M-30 -8 Q0 -4 30 -8 M-29 6 Q0 10 29 6" stroke="#b8925a" stroke-width="3" fill="none" opacity=".55"/>' +
        '<g clip-path="url(#sat-av)">' + anneau() + '</g></g>';
    }
    if (c.id === "Jupiter") {
      const L = A.GeoVector("Jupiter", t, true), n = Math.hypot(L.x, L.y, L.z), l = [L.x / n, L.y / n, L.z / n];
      const z = [0, 0, 1], e0 = [z[1] * l[2] - z[2] * l[1], z[2] * l[0] - z[0] * l[2], z[0] * l[1] - z[1] * l[0]], en = Math.hypot(...e0), E = e0.map(v => v / en);
      const N = [l[1] * E[2] - l[2] * E[1], l[2] * E[0] - l[0] * E[2], l[0] * E[1] - l[1] * E[0]];
      const M = A.JupiterMoons(t), RJ = 71492 / 149597870.7, s = 4.0 / RJ / 1; // 4 px par rayon de Jupiter (position des lunes à l'échelle)
      let lunes = ""; ["io", "europa", "ganymede", "callisto"].forEach(k => {
        const v = M[k], x = -(v.x * E[0] + v.y * E[1] + v.z * E[2]) * s, y = -(v.x * N[0] + v.y * N[1] + v.z * N[2]) * s;
        const devant = (v.x * l[0] + v.y * l[1] + v.z * l[2]) < 0; // plus proche de nous que Jupiter
        if (Math.hypot(x, y) < 17 && !devant) return; // cachée derrière le disque
        lunes += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6" fill="#fff8e6"/>';
      });
      return '<g class="astre"><circle r="17" fill="url(#oc-jup)"/><path d="M-16 -5 H16 M-16.5 3 H16.5 M-12 10 H12" stroke="#a4683e" stroke-width="2.4" opacity=".7"/><circle cx="6" cy="6" r="2.2" fill="#c4553a" opacity=".8"/>' + lunes + '</g>';
    }
    if (c.id === "Moon") {
      const f = A.Illumination("Moon", t).phase_fraction, R = 100, e = R * (1 - 2 * f); c.info = { pct: Math.round(f * 100) };
      return '<g class="astre"><circle r="' + R + '" fill="#1d2236"/><path d="M0 ' + (-R) + ' A ' + R + ' ' + R + ' 0 0 1 0 ' + R + ' A ' + Math.abs(e).toFixed(1) + ' ' + R + ' 0 0 ' + (e > 0 ? 0 : 1) + ' 0 ' + (-R) + ' Z" fill="url(#oc-lune)"/>' +
        '<g fill="#8d8a7e" opacity=".45"><ellipse cx="-20" cy="-30" rx="26" ry="18"/><ellipse cx="22" cy="-6" rx="20" ry="14"/><ellipse cx="-8" cy="30" rx="18" ry="12"/></g></g>';
    }
    if (c.id === "Mars") return '<g class="astre"><circle r="22" fill="url(#oc-mars)"/><ellipse cx="0" cy="-18" rx="8" ry="3" fill="#fff" opacity=".8"/><path d="M-14 2 Q -2 8 14 -2" stroke="#8a3a1c" stroke-width="5" fill="none" opacity=".5"/></g>';
    if (c.id === "Venus") { const f = A.Illumination("Venus", t).phase_fraction, R = 26, e = R * (1 - 2 * f); return '<g class="astre"><circle r="' + R + '" fill="#1a1a24"/><path d="M0 ' + (-R) + ' A ' + R + ' ' + R + ' 0 0 1 0 ' + R + ' A ' + Math.abs(e).toFixed(1) + ' ' + R + ' 0 0 ' + (e > 0 ? 0 : 1) + ' 0 ' + (-R) + ' Z" fill="#fff6dc"/></g>'; }
    return '<g class="astre" transform="translate(-70 -48) scale(.65)">' + Art.komet("fete").replace("<svg ", '<svg width="220" height="150" ') + '</g>';
  }

  function coupole(host, o) {
    const c = o.cible, en = o.lang === "en", AZ = Math.round(c.az), ALT = Math.round(c.alt), TAZ = 5, TALT = 3;
    let fini = false, h = (AZ + 150 + 360) % 360, a = 10, etape = 0, ouvert = false, drag = null, done = false, derive = null, suivi = false, raf = 0, holdAz = 0, lastMot = 0;
    const nom = c.nom[en ? "en" : "fr"];
    let ticks = ""; for (let d = 0; d < 360; d += 10) { const big = d % 30 === 0, r1 = big ? 150 : 154, s = Math.sin(d * RAD), co = Math.cos(d * RAD); ticks += '<path d="M' + (180 + r1 * s).toFixed(1) + ' ' + (180 - r1 * co).toFixed(1) + ' L' + (180 + 162 * s).toFixed(1) + ' ' + (180 - 162 * co).toFixed(1) + '" stroke="currentColor" stroke-width="' + (big ? 2.4 : 1.2) + '"/>'; if (big && d % 90) ticks += '<text x="' + (180 + 140 * s).toFixed(1) + '" y="' + (184 - 140 * co).toFixed(1) + '" text-anchor="middle" class="cp-deg">' + d + '</text>'; }
    const card = [["N", 0], ["E", 90], ["S", 180], ["O", 270]].map(x => '<text x="' + (180 + 136 * Math.sin(x[1] * RAD)).toFixed(1) + '" y="' + (187 - 136 * Math.cos(x[1] * RAD)).toFixed(1) + '" text-anchor="middle" class="cp-card">' + (en && x[0] === "O" ? "W" : x[0]) + '</text>').join("");
    const cs = Math.sin(AZ * RAD), cc = Math.cos(AZ * RAD);
    let joints = ""; for (let d = 30; d < 360; d += 30) joints += '<path d="M180 180 L' + (180 + 118 * Math.sin(d * RAD)).toFixed(1) + ' ' + (180 - 118 * Math.cos(d * RAD)).toFixed(1) + '" stroke="#9aa6c8" stroke-width="1.2" opacity=".55"/>';
    let etoilesFente = ""; const r = rnd(7); for (let i = 0; i < 14; i++) etoilesFente += '<circle cx="' + (168 + r() * 24).toFixed(1) + '" cy="' + (66 + r() * 110).toFixed(1) + '" r="' + (.6 + r() * 1.1).toFixed(1) + '" fill="#fff"/>';
    host.innerHTML =
      '<div class="jeu-cp"><ol class="cp-etapes" id="cp-et">' + [0, 1, 2, 3].map(i => '<li data-i="' + i + '"><span>' + (i + 1) + '</span></li>').join("") + '</ol>' +
      '<p class="cp-consigne" id="cp-cons" aria-live="polite"></p>' +
      '<svg class="cp-svg" viewBox="0 0 360 360" role="img" aria-label="Coupole vue de dessus, à tourner">' +
      '<defs><radialGradient id="cp-metal" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#dfe5f3"/><stop offset="1" stop-color="#a9b4d0"/></radialGradient>' +
      '<linearGradient id="cp-trappe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8c2dc"/><stop offset=".5" stop-color="#e9edf7"/><stop offset="1" stop-color="#b8c2dc"/></linearGradient></defs>' +
      '<circle cx="180" cy="180" r="170" class="cp-fond"/><g class="cp-ticks">' + ticks + '</g>' + card +
      '<g id="cp-cible" transform="translate(' + (180 + 158 * cs).toFixed(1) + ' ' + (180 - 158 * cc).toFixed(1) + ')"><circle r="15" class="cp-cible-o"/><circle r="6" class="cp-cible-p"/></g>' +
      '<g id="cp-dome"><circle cx="180" cy="180" r="120" fill="url(#cp-metal)" stroke="#7d89ad" stroke-width="3"/>' + joints +
      '<g id="cp-fente" class="cp-fente" tabindex="0" role="button" aria-label="Ouvrir la fente de la coupole"><rect x="146" y="52" width="68" height="136" fill="transparent"/><rect x="163" y="60" width="34" height="122" rx="4" fill="#0a0f2e"/><g id="cp-ciel-fente" opacity="0">' + etoilesFente + '</g>' +
      '<rect id="cp-volet" x="163" y="60" width="34" height="122" rx="4" fill="url(#cp-trappe)" stroke="#7d89ad" stroke-width="2"/><path id="cp-nerv" d="M163 90 h34 M163 120 h34 M163 150 h34" stroke="#8d98bb" stroke-width="1.5"/></g>' +
      '<circle cx="180" cy="180" r="14" fill="#c9d1e8" stroke="#7d89ad" stroke-width="2"/></g>' +
      '<text x="180" y="352" text-anchor="middle" class="cp-lect" id="cp-lect"></text></svg>' +
      '<div class="cp-profil" id="cp-profil" hidden><svg class="cp-svg2" viewBox="0 0 360 190" role="img" aria-label="Télescope à lever, vu de profil">' +
      '<path d="M40 176 H320" stroke="currentColor" stroke-width="3"/><path d="M60 176 A120 120 0 0 1 300 176" fill="none" stroke="#9aa6c8" stroke-width="10" stroke-dasharray="6 0" opacity=".5"/>' +
      '<path id="cp-rayon" d="" stroke="#ffd23f" stroke-width="2.5" stroke-dasharray="6 7"/><g id="cp-astre-p"><circle r="9" class="cp-cible-p"/></g>' +
      '<g id="cp-tube"><rect x="-6" y="-11" width="118" height="22" rx="5" fill="#f2f4fb" stroke="#56628a" stroke-width="2.5"/><rect x="104" y="-14" width="14" height="28" rx="3" fill="#2b3359"/><rect x="18" y="-18" width="16" height="8" rx="2" fill="#56628a"/></g>' +
      '<rect x="168" y="150" width="24" height="26" fill="#56628a"/><circle cx="180" cy="150" r="7" fill="#2b3359"/>' +
      '<g id="cp-poig" tabindex="0" role="slider" aria-label="Hauteur du télescope" aria-valuemin="0" aria-valuemax="90"><circle r="28" fill="transparent"/><circle r="13" fill="#ffd23f" stroke="#7a4a26" stroke-width="3"/></g>' +
      '<text x="24" y="28" class="cp-lect" id="cp-lect2"></text></svg>' +
      '<div class="ax-ctrl"><button class="btn mini rond" data-g="bas" aria-label="Baisser le télescope">−</button><p class="ax-fb" id="cp-fb2"></p><button class="btn mini rond" data-g="haut" aria-label="Lever le télescope">+</button></div></div>' +
      '<div class="cp-oculaire" id="cp-oc" hidden></div></div>';
    const $ = s => host.querySelector(s), svg = $(".cp-svg"), svg2 = $(".cp-svg2");
    function etapesUI() {
      host.querySelectorAll(".cp-etapes li").forEach((li, i) => { li.className = i < etape ? "fait" : i === etape ? "actif" : ""; });
      const E = Content.stations[1].etapes, L = x => x[en ? "en" : "fr"];
      $("#cp-cons").innerHTML = etape === 0 ? L(E[0]) + " <b>" + AZ + "° (" + (en ? dir8(AZ).replace("O", "W") : dir8(AZ)) + ")</b>." : etape === 1 ? L(E[1]) + "." : etape === 2 ? L(E[2]) + " <b>" + ALT + "°</b>." : L(E[3]);
    }
    function majDome() {
      $("#cp-dome").setAttribute("transform", "rotate(" + h.toFixed(1) + " 180 180)");
      const d = ((h - AZ + 540) % 360) - 180;
      $("#cp-lect").textContent = (en ? "Slit: " : "Fente : ") + Math.round((h + 360) % 360) + "° " + (en ? dir8(h).replace("O", "W") : dir8(h));
      svg.classList.toggle("aligne", Math.abs(d) <= TAZ);
    }
    function majTube() {
      const c2 = Math.cos(a * RAD), s2 = Math.sin(a * RAD);
      $("#cp-tube").setAttribute("transform", "translate(180 150) rotate(" + (-a).toFixed(1) + ")");
      $("#cp-poig").setAttribute("transform", "translate(" + (180 + 112 * c2).toFixed(1) + " " + (150 - 112 * s2).toFixed(1) + ")"); $("#cp-poig").setAttribute("aria-valuenow", Math.round(a));
      const ca = Math.cos(ALT * RAD), sa = Math.sin(ALT * RAD);
      $("#cp-rayon").setAttribute("d", "M180 150 L" + (180 + 168 * ca).toFixed(1) + " " + (150 - 168 * sa).toFixed(1));
      $("#cp-astre-p").setAttribute("transform", "translate(" + (180 + 172 * ca).toFixed(1) + " " + Math.max(12, 150 - 172 * sa).toFixed(1) + ")");
      $("#cp-lect2").textContent = (en ? "Altitude: " : "Hauteur : ") + Math.round(a) + "°";
      const d = a - ALT; $("#cp-fb2").textContent = Math.abs(d) <= TALT ? (en ? "Perfect!" : "Parfait !") : d > 0 ? (en ? "A bit lower" : "Un peu plus bas") : (en ? "A bit higher" : "Un peu plus haut");
      svg2.classList.toggle("aligne", Math.abs(d) <= TALT);
    }
    function passe(n) { etape = n; etapesUI(); Audio2.Sfx.ok(); Audio2.vibre(50); }
    function ouvre() {
      if (etape !== 1 || ouvert) return; ouvert = true; Audio2.Sfx.trappe();
      const v = $("#cp-volet"), nv = $("#cp-nerv"); v.classList.add("ouvre"); nv.classList.add("ouvre"); $("#cp-ciel-fente").setAttribute("opacity", "1");
      setTimeout(() => { passe(2); const p = $("#cp-profil"); p.hidden = false; majTube(); if (!o.demo) p.scrollIntoView({ behavior: reduit() ? "auto" : "smooth", block: "center" }); }, reduit() ? 50 : 700);
    }
    // ---- rotation de la coupole (glisser en tournant autour du centre) ----
    svg.addEventListener("pointerdown", e => {
      if (done) return; Audio2.Sfx.unlock();
      if (etape === 1) { ouvre(); return; } // toucher la trappe (ou la coupole) ouvre la fente
      if (etape !== 0) return;
      const p = pt(svg, e); drag = { a0: Math.atan2(p.x - 180, 180 - p.y) / RAD, h0: h }; svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", e => {
      if (!drag) return; const p = pt(svg, e), an = Math.atan2(p.x - 180, 180 - p.y) / RAD;
      h = (drag.h0 + an - drag.a0 + 720) % 360; majDome();
      const n = performance.now(); if (n - lastMot > 380) { lastMot = n; Audio2.Sfx.moteur(.4); }
    });
    const lacher = () => { drag = null; }; svg.addEventListener("pointerup", lacher); svg.addEventListener("pointercancel", lacher);
    $("#cp-fente").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ouvre(); } });
    svg.setAttribute("tabindex", "0");
    svg.addEventListener("keydown", e => { if (etape !== 0) return; const m = { ArrowLeft: -2, ArrowRight: 2, ArrowUp: 2, ArrowDown: -2 }[e.key]; if (m) { e.preventDefault(); h = (h + m + 360) % 360; majDome(); } });
    // ---- hauteur du tube ----
    let dragT = false;
    svg2.addEventListener("pointerdown", e => { if (etape !== 2) return; dragT = true; svg2.setPointerCapture(e.pointerId); bougeT(e); });
    function bougeT(e) { if (!dragT) return; const p = pt(svg2, e); a = clamp(Math.atan2(150 - p.y, p.x - 180) / RAD, 0, 90); majTube(); }
    svg2.addEventListener("pointermove", bougeT); svg2.addEventListener("pointerup", () => { dragT = false; }); svg2.addEventListener("pointercancel", () => { dragT = false; });
    $("#cp-poig").addEventListener("keydown", e => { const m = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key]; if (m && etape === 2) { e.preventDefault(); a = clamp(a + m, 0, 90); majTube(); } });
    $("#cp-profil").addEventListener("click", e => { const b = e.target.closest("[data-g]"); if (b && etape === 2) { a = clamp(Math.round(a) + (b.dataset.g === "haut" ? 1 : -1), 0, 90); Audio2.Sfx.clic(); majTube(); } });
    // ---- oculaire ----
    function oculaire() {
      const oc = $("#cp-oc"); oc.hidden = false;
      oc.innerHTML = '<div class="oc-champ"><svg viewBox="-130 -130 260 260" class="oc-svg" role="img" aria-label="' + nom + ' dans l\'oculaire"><defs>' +
        '<radialGradient id="oc-sat" cx=".4" cy=".35"><stop offset="0" stop-color="#fff0c8"/><stop offset="1" stop-color="#c99a58"/></radialGradient>' +
        '<radialGradient id="oc-jup" cx=".4" cy=".35"><stop offset="0" stop-color="#fff3df"/><stop offset="1" stop-color="#d4a072"/></radialGradient>' +
        '<radialGradient id="oc-mars" cx=".4" cy=".35"><stop offset="0" stop-color="#ffb27a"/><stop offset="1" stop-color="#b34a1f"/></radialGradient>' +
        '<radialGradient id="oc-lune" cx=".45" cy=".4"><stop offset="0" stop-color="#fbf8ea"/><stop offset="1" stop-color="#cfcab4"/></radialGradient>' +
        '<radialGradient id="oc-vign"><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></radialGradient>' +
        '<clipPath id="oc-clip"><circle r="124"/></clipPath></defs><g clip-path="url(#oc-clip)"><rect x="-130" y="-130" width="260" height="260" fill="#02030c"/>' +
        '<g id="oc-fond">' + (() => { let s = ""; const r2 = rnd(3); for (let i = 0; i < 26; i++) s += '<circle cx="' + ((r2() - .5) * 250).toFixed(1) + '" cy="' + ((r2() - .5) * 250).toFixed(1) + '" r="' + (.4 + r2() * .9).toFixed(1) + '" fill="#fff" opacity=".7"/>'; return s; })() + '</g>' +
        '<g id="oc-astre">' + vueOculaire(c) + '</g><circle r="124" fill="url(#oc-vign)"/></g><circle r="125" fill="none" stroke="#1d2340" stroke-width="6"/></svg>' +
        '<p class="oc-leg" id="oc-leg">' + nom + (c.fictif ? "" : (en ? " · tonight " : " · ce soir ") + hh(c.heure)) + '</p></div>' +
        '<button class="btn big" id="oc-suivi" hidden>' + (en ? "Switch on tracking" : "Allumer le suivi") + '</button>';
      Audio2.Sfx.repere(); Audio2.vibre([40, 30, 80]);
      const g = $("#oc-astre"), t0 = performance.now();
      setTimeout(() => { if (done || fini) return; derive = performance.now(); $("#oc-suivi").hidden = false; if (o.onDerive) o.onDerive(); }, reduit() ? 400 : 1600);
      $("#oc-suivi").onclick = allumer;
      function anim() {
        raf = requestAnimationFrame(anim);
        if (!derive || suivi) return;
        const s = (performance.now() - derive) / 1000, x = Math.min(170, s * 26), y = Math.min(80, s * 9);
        g.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")"); $("#oc-fond").setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")");
        if (x >= 170) $("#oc-leg").textContent = en ? "It has left the field of view!" : "Elle est sortie du champ !";
      }
      raf = requestAnimationFrame(anim);
      if (!o.demo) setTimeout(() => oc.scrollIntoView({ behavior: reduit() ? "auto" : "smooth", block: "center" }), 60);
    }
    function allumer() {
      if (suivi) return; suivi = true; Audio2.Sfx.moteur(.6);
      const g = $("#oc-astre"), f = $("#oc-fond"); g.classList.add("recentre"); f.classList.add("recentre"); g.setAttribute("transform", "translate(0 0)"); f.setAttribute("transform", "translate(0 0)");
      $("#oc-leg").textContent = nom + (en ? " · tracking on ✓" : " · suivi activé ✓"); $("#oc-suivi").hidden = true; $("#oc-suivi").disabled = true;
      setTimeout(() => { if (fini) return; done = true; Audio2.Sfx.trouve(); passe(4); if (o.onWin) o.onWin(c); }, reduit() ? 200 : 1300);
    }
    // ---- validation des étapes (maintien bref dans la tolérance) ----
    let lastT = 0;
    function boucle(ts) {
      raf = requestAnimationFrame(boucle); const dt = lastT ? Math.min(.1, (ts - lastT) / 1000) : 0; lastT = ts;
      if (etape === 0) { const d = ((h - AZ + 540) % 360) - 180; if (Math.abs(d) <= TAZ && !drag) { holdAz += dt; if (holdAz > .25) { h = AZ; majDome(); passe(1); } } else holdAz = 0; }
      else if (etape === 2 && !dragT && Math.abs(a - ALT) <= TALT) { a = ALT; majTube(); passe(3); cancelAnimationFrame(raf); setTimeout(oculaire, reduit() ? 50 : 500); }
    }
    etapesUI(); majDome(); raf = requestAnimationFrame(boucle);
    return {
      destroy() { fini = true; cancelAnimationFrame(raf); },
      solve() { // mode démo : tout s'enchaîne tout seul
        if (etape === 0) { h = AZ; majDome(); passe(1); }
        setTimeout(() => { ouvre(); setTimeout(() => { a = ALT; majTube(); }, 900); }, 400);
        const wait = setInterval(() => { const b = host.querySelector("#oc-suivi"); if (b && !b.hidden) { clearInterval(wait); setTimeout(allumer, 900); } }, 200);
      },
      state: () => ({ etape, h, a, AZ, ALT, ouvert, suivi, done })
    };
  }

  window.Games = { axe, coupole, cibleDuSoir, vueOculaire, hh, dir8 };
})();
