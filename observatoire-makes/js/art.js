/* ============================================================
   ART.JS — Toutes les illustrations sont faites maison en SVG.
   (aucune image externe, aucun droit à gérer)
   Fidélité : les instruments suivent la page « le matériel » de l'Observatoire
   (voir SOURCES.md) ; ce sont des dessins, pas des photos : à faire valider.
   ============================================================ */
(function () {
  "use strict";
  const f1 = n => Math.round(n * 10) / 10;
  let uid = 0;
  const nid = p => p + (++uid);

  function starPts(cx, cy, R, r, n, rotDeg) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (rotDeg + i * 180 / n) * Math.PI / 180, rad = i % 2 ? r : R;
      pts.push(f1(cx + rad * Math.cos(a)) + "," + f1(cy + rad * Math.sin(a)));
    }
    return pts.join(" ");
  }
  // générateur pseudo-aléatoire déterministe (mêmes étoiles à chaque affichage)
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  // ---------- Ti-Fil, l'étoile filante ----------
  // expr : 'content' | 'wow' | 'pense' | 'fete'
  function tifilInner(expr) {
    const id = nid("tf");
    const pupille = expr === "pense" ? [3, -3] : [0, 0]; // « pense » : regarde en haut à droite (curieux, pas fâché)
    const ry = expr === "wow" ? 13 : 11;
    const oeil = (cx) => '<g class="oeil"><ellipse cx="' + cx + '" cy="98" rx="9.5" ry="' + ry + '" fill="#2a1030"/>' +
      '<circle cx="' + (cx + 3 + pupille[0]) + '" cy="' + (93 + pupille[1]) + '" r="3.6" fill="#fff"/><circle cx="' + (cx - 3 + pupille[0]) + '" cy="' + (103 + pupille[1]) + '" r="1.6" fill="#fff" opacity=".8"/></g>';
    const yeux = expr === "fete"
      ? '<path d="M75 100 Q85 86 95 100 M105 100 Q115 86 125 100" fill="none" stroke="#2a1030" stroke-width="5.5" stroke-linecap="round"/>'
      : oeil(85) + oeil(115);
    const sourcils = {
      pense: '<path d="M74 79 Q84 71 94 77 M106 77 Q116 71 126 79" fill="none" stroke="#7a3b10" stroke-width="4" stroke-linecap="round"/>',
      wow: '<path d="M74 78 Q84 70 94 77 M106 77 Q116 70 126 78" fill="none" stroke="#7a3b10" stroke-width="4" stroke-linecap="round"/>'
    }[expr] || "";
    const bouche = {
      content: '<path d="M86 118 Q100 133 114 118" fill="#7a2230" stroke="#4b1020" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M93 124 Q100 129 107 124" fill="#ff8a9c"/>',
      wow: '<ellipse cx="100" cy="124" rx="8" ry="10" fill="#7a2230" stroke="#4b1020" stroke-width="3.5"/>',
      pense: '<ellipse cx="106" cy="123" rx="5.5" ry="6.5" fill="#7a2230" stroke="#4b1020" stroke-width="3"/>',
      fete: '<path d="M80 113 Q100 142 120 113 Z" fill="#7a2230" stroke="#4b1020" stroke-width="3.5" stroke-linejoin="round"/><path d="M90 126 Q100 135 110 126 Q100 120 90 126Z" fill="#ff7b8e"/>'
    }[expr] || "";
    const corps = starPts(100, 104, 78, 40, 5, -90), coeur = starPts(100, 104, 60, 31, 5, -90);
    return '<defs>' +
      '<linearGradient id="' + id + 'q" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff3ff" stop-opacity=".95"/><stop offset=".45" stop-color="#7be0ff" stop-opacity=".55"/><stop offset="1" stop-color="#7be0ff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + id + 'c" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffe066"/><stop offset=".8" stop-color="#ffb627"/><stop offset="1" stop-color="#ff9417"/></radialGradient>' +
      '<radialGradient id="' + id + 'h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c2" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c2" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<circle cx="100" cy="104" r="98" fill="url(#' + id + 'h)" class="halo"/>' +
      '<g class="queue"><path d="M58 126 C 30 148 12 176 0 200 C 26 186 52 174 76 148 Z" fill="url(#' + id + 'q)"/>' +
      '<path d="M76 142 C 56 166 44 186 38 202 C 58 188 76 172 92 152 Z" fill="url(#' + id + 'q)" opacity=".65"/>' +
      '<path d="M50 118 C 30 128 16 140 4 152 C 22 146 40 138 58 130 Z" fill="url(#' + id + 'q)" opacity=".45"/>' +
      '<polygon points="' + starPts(22, 172, 6, 2, 4, -90) + '" fill="#fff"/><circle cx="46" cy="190" r="2.6" fill="#bff3ff"/><circle cx="12" cy="150" r="2" fill="#fff"/></g>' +
      '<g class="corps"><polygon points="' + corps + '" fill="url(#' + id + 'c)" stroke="#f29b00" stroke-width="9" stroke-linejoin="round"/>' +
      '<polygon points="' + coeur + '" fill="#fff6c2" opacity=".22" stroke="none"/>' +
      '<ellipse cx="72" cy="58" rx="9" ry="16" transform="rotate(32 72 58)" fill="#fff" opacity=".55"/>' +
      yeux + sourcils + bouche +
      '<ellipse cx="68" cy="116" rx="9" ry="5.5" fill="#ff7b8e" opacity=".7"/><ellipse cx="132" cy="116" rx="9" ry="5.5" fill="#ff7b8e" opacity=".7"/></g>';
  }
  function tifil(expr, cls) {
    return '<div class="tifil ' + (cls || "") + '" aria-hidden="true"><svg viewBox="-6 6 212 200" focusable="false">' + tifilInner(expr || "content") + '</svg></div>';
  }

  // ---------- Croix du Sud : positions réelles relatives (nord en haut, est à gauche) ----------
  function cruxLayout(w, h, zoom, keys) {
    const S = window.Sky.STARS, ks = ["acrux", "mimosa", "gacrux", "imai"];
    const ra0 = (S.acrux.ra + S.mimosa.ra + S.gacrux.ra + S.imai.ra) / 4, d0 = (S.acrux.dec + S.mimosa.dec + S.gacrux.dec + S.imai.dec) / 4;
    const out = {};
    (keys || ks).forEach(key => {
      out[key] = { x: w / 2 - (S[key].ra - ra0) * 15 * Math.cos(d0 * Math.PI / 180) * zoom, y: h / 2 - (S[key].dec - d0) * zoom };
    });
    return out;
  }
  // taille graphique relative (ordre de luminosité : Acrux > Mimosa > Gacrux > Imai)
  const TAILLE = { acrux: 15, mimosa: 14, gacrux: 12, imai: 9, acen: 15, hadar: 13 };

  // Coupole d'observatoire (réutilisée) : x,y = centre du bas de la coupole, w = largeur
  function coupole(x, y, w, opts) {
    opts = opts || {}; const id = nid("cp"), h = w * 0.55, r = w / 2;
    const fente = opts.ouverte ? '<path d="M' + f1(x - w * .07) + ' ' + f1(y - h * .98) + ' L' + f1(x + w * .07) + ' ' + f1(y - h * .98) + ' L' + f1(x + w * .09) + ' ' + f1(y - 2) + ' L' + f1(x - w * .09) + ' ' + f1(y - 2) + 'Z" fill="#081233"/>' +
      (opts.tube ? '<rect x="' + f1(x - w * .045) + '" y="' + f1(y - h * 1.15) + '" width="' + f1(w * .09) + '" height="' + f1(h * .7) + '" rx="2" fill="#cfd9f2" transform="rotate(20 ' + f1(x) + ' ' + f1(y - h * .5) + ')"/>' : '') : "";
    const cotes = [-.62, -.3, .3, .62].map(k => '<path d="M' + f1(x + r * k) + ' ' + f1(y) + ' Q' + f1(x + r * k * .55) + ' ' + f1(y - h * .85) + ' ' + f1(x) + ' ' + f1(y - h) + '" fill="none" stroke="#9fb0d6" stroke-width="1" opacity=".6"/>').join("");
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e3eaf8"/><stop offset="1" stop-color="#a9b8da"/></linearGradient></defs>' +
      '<rect x="' + f1(x - r * 1.04) + '" y="' + f1(y) + '" width="' + f1(w * 1.04) + '" height="' + f1(w * (opts.haut || .5)) + '" fill="' + (opts.mur || "#d7deef") + '"/>' +
      '<rect x="' + f1(x - r * 1.1) + '" y="' + f1(y - 2) + '" width="' + f1(w * 1.1) + '" height="5" rx="2" fill="#8f9cc0"/>' +
      '<path d="M' + f1(x - r) + ' ' + f1(y) + ' A' + f1(r) + ' ' + f1(h) + ' 0 0 1 ' + f1(x + r) + ' ' + f1(y) + 'Z" fill="url(#' + id + ')"/>' + cotes + fente;
  }

  // ---------- Scène d'accueil (animée en CSS) ----------
  function homeScene() {
    const R = rng(1991);
    let stars = "";
    for (let i = 0; i < 70; i++) {
      const x = R() * 400, y = R() * 190, r = R() < .12 ? 1.6 + R() : .5 + R() * .9;
      stars += '<circle class="tw" style="animation-delay:' + f1(R() * 4) + 's;animation-duration:' + f1(2.2 + R() * 3) + 's" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r) + '" fill="#fff"/>';
    }
    // Croix du Sud + Pointeurs à leurs positions RÉELLES relatives (nord en haut, est à gauche)
    const L = cruxLayout(110, 120, 7.2, ["acrux", "mimosa", "gacrux", "imai", "acen", "hadar"]), ox = 250, oy = 22;
    const croix = '<g class="croix-home">' +
      '<path d="M' + f1(ox + L.gacrux.x) + ' ' + f1(oy + L.gacrux.y) + ' L' + f1(ox + L.acrux.x) + ' ' + f1(oy + L.acrux.y) + ' M' + f1(ox + L.mimosa.x) + ' ' + f1(oy + L.mimosa.y) + ' L' + f1(ox + L.imai.x) + ' ' + f1(oy + L.imai.y) + '" stroke="#bfe3ff" stroke-width="1.2" opacity=".45"/>' +
      Object.keys(L).map(k => '<circle cx="' + f1(ox + L[k].x) + '" cy="' + f1(oy + L[k].y) + '" r="' + f1(TAILLE[k] * .9) + '" fill="#ffe9a8" opacity=".14"/><polygon points="' + starPts(ox + L[k].x, oy + L[k].y, TAILLE[k] * .5, TAILLE[k] * .14, 4, -90) + '" fill="#fff6c2"/>').join("") + '</g>';
    // relief (silhouettes de montagnes) et brume
    const montagnes = '<path d="M0 214 L22 196 L40 204 L66 168 L84 180 L104 150 L122 172 L146 160 L170 186 L196 176 L222 196 L250 172 L272 182 L300 150 L322 168 L350 160 L376 184 L400 176 L400 300 L0 300Z" fill="#12305a"/>' +
      '<path d="M0 236 L40 220 L78 230 L120 206 L160 228 L210 214 L252 232 L300 210 L346 230 L400 216 L400 300 L0 300Z" fill="#0d2442"/>' +
      '<rect y="214" width="400" height="30" fill="url(#hbr)" opacity=".5"/>' +
      '<path d="M0 262 Q100 244 200 252 T400 248 L400 300 L0 300Z" fill="url(#hsol)"/>';
    // arbres coniques (silhouettes)
    const arbre = (x, y, s) => '<path d="M' + x + ' ' + y + ' l' + (-7 * s) + ' ' + (16 * s) + ' h' + (4 * s) + ' l' + (-6 * s) + ' ' + (12 * s) + ' h' + (18 * s) + ' l' + (-6 * s) + ' ' + (-12 * s) + ' h' + (4 * s) + 'Z" fill="#06150f"/>';
    const arbres = arbre(28, 236, 1.2) + arbre(44, 244, .9) + arbre(330, 232, 1.3) + arbre(352, 240, 1) + arbre(372, 236, 1.15);
    // observatoire : grande coupole ouverte + deux petites coupoles + bâtiment
    const obs = '<g class="obs">' +
      '<rect x="128" y="246" width="150" height="24" rx="3" fill="#c9d3ea"/><rect x="128" y="246" width="150" height="5" fill="#eef3ff"/>' +
      [150, 176, 230, 256].map(x => '<rect x="' + x + '" y="256" width="9" height="8" rx="1" fill="#ffd27a" opacity=".85"/>').join("") +
      coupole(203, 248, 58, { ouverte: true, tube: true, haut: .02 }) +
      coupole(146, 247, 30, { haut: .02 }) + coupole(260, 247, 30, { haut: .02 }) + '</g>';
    return '<svg viewBox="0 0 400 300" role="img" aria-label="Nuit sur l\'Observatoire des Makes : la grande coupole ouverte, deux petites coupoles, la Croix du Sud et ses Pointeurs dans le ciel, et Ti-Fil l\'étoile filante">' +
      '<defs><linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020617"/><stop offset=".55" stop-color="#0f2a6b"/><stop offset=".85" stop-color="#3b5bb0"/><stop offset="1" stop-color="#e58a6b"/></linearGradient>' +
      '<linearGradient id="hbr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb7ff" stop-opacity="0"/><stop offset=".5" stop-color="#9fb7ff" stop-opacity=".35"/><stop offset="1" stop-color="#9fb7ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="hsol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1f1a"/><stop offset="1" stop-color="#020806"/></linearGradient>' +
      '<linearGradient id="hfil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#hs)"/>' + stars + croix +
      '<g class="filante"><line x1="0" y1="0" x2="70" y2="0" stroke="url(#hfil)" stroke-width="2.4" stroke-linecap="round"/></g>' +
      montagnes + arbres + obs +
      '<g class="tifil-home"><g transform="translate(14 30) scale(.6) rotate(-8)">' + tifilInner("content") + '</g></g>' +
      '</svg>';
  }

  // ---------- Jaï Sing : instrument « à la manière » du Samrat Yantra de Jai Singh ----------
  // Vue de côté : nord à gauche, sud à droite. L'arête (hypoténuse) est inclinée de la LATITUDE
  // des Makes (21°) : elle est parallèle à l'axe de la Terre et vise le pôle sud céleste.
  function jaiSing() {
    const lat = Math.abs(window.Sky.LAT), a = lat * Math.PI / 180;
    const x0 = 46, y0 = 196, L = 250, x1 = x0 + L * Math.cos(a), y1 = y0 - L * Math.sin(a);
    const marches = []; for (let i = 1; i < 12; i++) { const t = i / 12, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; marches.push('<path d="M' + f1(x) + ' ' + f1(y) + ' v4 h' + f1(L * Math.cos(a) / 12) + '" fill="none" stroke="#b07a52" stroke-width="1.6"/>'); }
    const ext = 1.45, xp = x0 + L * ext * Math.cos(a), yp = y0 - L * ext * Math.sin(a);
    // arc de la mesure de l'angle
    const ra = 70, arc = 'M' + (x0 + ra) + ' ' + y0 + ' A' + ra + ' ' + ra + ' 0 0 0 ' + f1(x0 + ra * Math.cos(a)) + ' ' + f1(y0 - ra * Math.sin(a));
    return '<svg viewBox="0 0 400 240" role="img" aria-label="Un grand instrument de pierre en forme de triangle : son arête est inclinée de 21 degrés et vise le pôle sud céleste, comme l\'axe du Monde">' +
      '<defs><linearGradient id="js-ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6fd0"/><stop offset="1" stop-color="#bfe0ff"/></linearGradient>' +
      '<linearGradient id="js-mur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3c9a0"/><stop offset="1" stop-color="#d79b6c"/></linearGradient></defs>' +
      '<rect width="400" height="240" fill="url(#js-ciel)"/>' +
      '<circle cx="70" cy="46" r="16" fill="#fff4b8"/><circle cx="70" cy="46" r="26" fill="#fff4b8" opacity=".25"/>' +
      '<rect y="196" width="400" height="44" fill="#6c9a52"/><rect y="196" width="400" height="4" fill="#4f7a3a"/>' +
      // quadrants (arcs de l'échelle équatoriale), vus en biais derrière le mur
      '<path d="M170 196 A60 60 0 0 1 230 136" fill="none" stroke="#e8b48a" stroke-width="12"/><path d="M170 196 A60 60 0 0 1 230 136" fill="none" stroke="#8a5a36" stroke-width="1.5" stroke-dasharray="2 6"/>' +
      // le mur triangulaire (gnomon) avec ses marches
      '<path d="M' + x0 + ' ' + y0 + ' L' + f1(x1) + ' ' + f1(y1) + ' L' + f1(x1) + ' ' + y0 + 'Z" fill="url(#js-mur)" stroke="#8a5a36" stroke-width="2.5" stroke-linejoin="round"/>' +
      marches.join("") +
      '<rect x="' + f1(x1 - 26) + '" y="' + f1(y1 + 30) + '" width="16" height="22" rx="8" fill="#8a5a36" opacity=".55"/>' +
      // prolongement : l'axe du Monde
      '<line class="axe-trace" x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(xp) + '" y2="' + f1(yp) + '" stroke="#ffd23f" stroke-width="4" stroke-dasharray="9 7" stroke-linecap="round"/>' +
      '<g transform="translate(' + f1(xp) + ' ' + f1(yp) + ')"><circle r="13" fill="none" stroke="#ffd23f" stroke-width="3.5"/><circle r="3.5" fill="#ffd23f"/></g>' +
      '<text x="' + f1(xp - 4) + '" y="' + f1(yp - 22) + '" text-anchor="end" font-size="15" font-weight="900" fill="#04102c">pôle sud céleste</text>' +
      '<path d="' + arc + '" fill="none" stroke="#04102c" stroke-width="2.5"/>' +
      '<text x="' + (x0 + ra + 8) + '" y="' + (y0 - 9) + '" font-size="16" font-weight="900" fill="#04102c">' + Math.round(lat) + '°</text>' +
      '<text x="12" y="226" font-size="15" font-weight="900" fill="#fff">N</text><text x="378" y="226" font-size="15" font-weight="900" fill="#fff">S</text>' +
      '<text x="200" y="226" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">horizon</text>' +
      '</svg>';
  }

  // ---------- Cadran solaire HORIZONTAL réglé pour les Makes (vu de dessus, nord en haut) ----------
  // Lignes horaires : Sky.ombreAzimut (tan θ = sin(lat) × tan H). L'ombre tourne dans le sens
  // inverse des aiguilles d'une montre (hémisphère sud). solaireMin : heure solaire (min).
  const DIAL = { cx: 160, cy: 100 };
  function dirAz(az, r) { const a = az * Math.PI / 180; return [DIAL.cx + r * Math.sin(a), DIAL.cy - r * Math.cos(a)]; }
  // le cadran est rectangulaire en bas (plaque) : rayon jusqu'au bord d'un rectangle arrondi
  function bord(az) { const a = az * Math.PI / 180, sx = Math.sin(a), cy = -Math.cos(a); const kx = 140 / Math.max(1e-6, Math.abs(sx)), ky = (cy > 0 ? 144 : 80) / Math.max(1e-6, Math.abs(cy)); return Math.min(kx, ky); }
  function sundialShadow(solaireMin) {
    const az = window.Sky.ombreAzimut(solaireMin), r = bord(az) - 22, p = dirAz(az, r);
    return { x2: f1(p[0]), y2: f1(p[1]), az };
  }
  function sundial(solaireMin) {
    const { cx, cy } = DIAL; let lignes = "", nums = "";
    for (let m = 6 * 60; m <= 18 * 60; m += 30) {
      const az = window.Sky.ombreAzimut(m), plein = m % 60 === 0, r = bord(az) - 22;
      const p1 = dirAz(az, plein ? 26 : r - 12), p2 = dirAz(az, r);
      lignes += '<line x1="' + f1(p1[0]) + '" y1="' + f1(p1[1]) + '" x2="' + f1(p2[0]) + '" y2="' + f1(p2[1]) + '" stroke="#3b2a12" stroke-width="' + (plein ? (m % 180 === 0 ? 3.2 : 2.2) : 1.2) + '" opacity="' + (plein ? .85 : .5) + '" stroke-linecap="round"/>';
      // chiffres : près de midi les lignes se resserrent (latitude basse) ; on n'écrit que les heures lisibles
      if (plein && [6, 7, 8, 9, 12, 15, 16, 17, 18].includes(m / 60)) { const q = dirAz(az, r + 12); nums += '<text x="' + f1(q[0]) + '" y="' + f1(q[1] + 5) + '" text-anchor="middle" font-size="' + (m === 720 ? 17 : 14) + '" font-weight="900" fill="#3b2a12">' + (m / 60) + '</text>'; }
    }
    let ombre = "";
    if (solaireMin != null) {
      const s = sundialShadow(solaireMin);
      ombre = '<g id="ombre-g"><line id="ombre" x1="' + cx + '" y1="' + cy + '" x2="' + s.x2 + '" y2="' + s.y2 + '" stroke="#1d1408" stroke-width="10" stroke-linecap="round" opacity=".55"/></g>';
    }
    // flèche « sens de rotation de l'ombre » (sens inverse des aiguilles d'une montre)
    const fl = (() => { const a1 = dirAz(236, 92), a2 = dirAz(124, 92); return '<path d="M' + f1(a1[0]) + ' ' + f1(a1[1]) + ' A80 80 0 0 0 ' + f1(a2[0]) + ' ' + f1(a2[1]) + '" fill="none" stroke="#c0392b" stroke-width="3.5" stroke-dasharray="1 7" stroke-linecap="round" marker-end="url(#fl-sd)"/>'; })();
    return '<svg viewBox="0 0 320 292" role="img" aria-label="Cadran solaire horizontal réglé pour les Makes, vu de dessus, nord en haut. Midi est en bas, vers le sud. Le matin, l\'ombre est à gauche, côté ouest ; l\'après-midi à droite, côté est. L\'ombre tourne dans le sens inverse des aiguilles d\'une montre.">' +
      '<defs><radialGradient id="sd-pl" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#fff6dc"/><stop offset="1" stop-color="#e6cf98"/></radialGradient>' +
      '<marker id="fl-sd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="#c0392b"/></marker></defs>' +
      '<rect x="12" y="6" width="296" height="262" rx="26" fill="#bfa36a"/><rect x="18" y="12" width="284" height="250" rx="22" fill="url(#sd-pl)" stroke="#8a6b30" stroke-width="2"/>' +
      lignes + nums + fl + ombre +
      // style (gnomon) vu de dessus : une lame le long de la ligne de midi, qui monte vers le sud
      '<path d="M' + cx + ' ' + (cy - 4) + ' L' + (cx + 5) + ' ' + (cy + 70) + ' L' + (cx - 5) + ' ' + (cy + 70) + 'Z" fill="#5b4320"/><circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#5b4320"/>' +
      // petite rose des vents (coin haut gauche) : nord en haut, est à DROITE (vue de dessus)
      '<g transform="translate(46 40)" font-size="11" font-weight="900" fill="#7a1f12" text-anchor="middle"><circle r="21" fill="#fff8e6" stroke="#8a6b30" stroke-width="1.5"/><path d="M0 -15 L4 0 L0 15 L-4 0Z" fill="#7a1f12"/><text y="-23">N</text><text y="33">S</text><text x="-29" y="4">O</text><text x="29" y="4">E</text></g>' +
      '<text x="160" y="285" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">Cadran horizontal des Makes (21° S), vu de dessus</text></svg>';
  }

  // ---------- Télescopes (d'après la page « le matériel » de l'Observatoire) ----------
  // tele : lunette Telementor 63/840, motorisée, taches solaires en PROJECTION (écran blanc)
  // c8   : Schmidt-Cassegrain 203 mm sur monture équatoriale (Sphinx) et trépied
  // c11  : Schmidt-Cassegrain 280 mm, pare-buée, monture azimutale à fourche sur trépied alu
  // t60  : Ritchey-Chrétien 600 mm, tube ouvert (treillis), monture à berceau, sous coupole
  function telescope(type) {
    const dk = "#0a1233", id = nid("tl");
    const tripode = (x, y, h) => '<path d="M' + x + ' ' + y + ' L' + (x - 22) + ' ' + (y + h) + ' M' + x + ' ' + y + ' L' + (x + 22) + ' ' + (y + h) + ' M' + x + ' ' + y + ' L' + (x + 3) + ' ' + (y + h + 4) + '" stroke="#9aa6c4" stroke-width="4" stroke-linecap="round"/>';
    const defs = '<defs><linearGradient id="' + id + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9c4de"/></linearGradient>' +
      '<linearGradient id="' + id + 'n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5574"/><stop offset="1" stop-color="#1b2238"/></linearGradient>' +
      '<radialGradient id="' + id + 's" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffb43a"/></radialGradient></defs>';
    const t = {
      tele: tripode(66, 84, 30) +
        '<g transform="rotate(-28 66 74)"><rect x="12" y="66" width="104" height="13" rx="4" fill="url(#' + id + 'b)" stroke="' + dk + '" stroke-width="2.5"/>' +
        '<rect x="106" y="62" width="22" height="21" rx="3" fill="#e9eef9" stroke="' + dk + '" stroke-width="2.5"/>' +
        '<rect x="2" y="69" width="12" height="7" rx="2" fill="' + dk + '"/><line x1="-2" y1="72.5" x2="-14" y2="72.5" stroke="#9aa6c4" stroke-width="2"/></g>' +
        '<rect x="56" y="76" width="20" height="10" rx="2" fill="#8e9ab8" stroke="' + dk + '" stroke-width="2"/>' +
        // écran de projection et image du Soleil avec 2 taches
        '<rect x="2" y="88" width="34" height="30" rx="2" fill="#fff" stroke="' + dk + '" stroke-width="2"/><circle cx="19" cy="103" r="10" fill="url(#' + id + 's)"/><circle cx="16" cy="100" r="1.6" fill="#5a3a10"/><circle cx="23" cy="106" r="1.2" fill="#5a3a10"/>',
      c8: tripode(78, 92, 26) +
        '<rect x="70" y="80" width="16" height="14" rx="3" fill="#f2f4fa" stroke="' + dk + '" stroke-width="2.5"/>' +
        '<line x1="78" y1="86" x2="100" y2="104" stroke="#9aa6c4" stroke-width="3"/><rect x="96" y="100" width="12" height="12" rx="2" fill="#6b7697" stroke="' + dk + '" stroke-width="2"/>' +
        '<g transform="rotate(-35 78 64)"><rect x="40" y="48" width="66" height="34" rx="8" fill="url(#' + id + 'n)" stroke="' + dk + '" stroke-width="2.5"/>' +
        '<rect x="100" y="46" width="8" height="38" rx="3" fill="#c8cfe0" stroke="' + dk + '" stroke-width="2"/><rect x="34" y="58" width="8" height="14" rx="2" fill="#c8cfe0"/><rect x="24" y="61" width="12" height="8" rx="2" fill="' + dk + '"/></g>',
      c11: tripode(74, 94, 24) +
        '<path d="M54 96 L54 62 M94 96 L94 62" stroke="#3a4462" stroke-width="7" stroke-linecap="round"/><rect x="50" y="90" width="48" height="10" rx="4" fill="#3a4462"/>' +
        '<g transform="rotate(-40 74 64)"><rect x="36" y="44" width="70" height="40" rx="9" fill="url(#' + id + 'n)" stroke="' + dk + '" stroke-width="2.5"/>' +
        '<rect x="102" y="42" width="24" height="44" rx="3" fill="#2b3350" stroke="' + dk + '" stroke-width="2.5"/><rect x="30" y="56" width="8" height="16" rx="2" fill="#c8cfe0"/></g>' +
        '<circle cx="74" cy="64" r="5" fill="#c8cfe0" stroke="' + dk + '" stroke-width="2"/>',
      t60: '<path d="M8 120 L8 70 A62 54 0 0 1 132 70 L132 120Z" fill="#dfe6f6" stroke="' + dk + '" stroke-width="2.5"/>' +
        '<path d="M60 18 L80 18 L84 120 L56 120Z" fill="#0b1638"/>' +
        '<circle cx="66" cy="30" r="1.4" fill="#fff"/><circle cx="74" cy="44" r="1" fill="#fff"/>' +
        '<path d="M44 120 L52 92 L88 92 L96 120Z" fill="#6b7697" stroke="' + dk + '" stroke-width="2"/>' +
        '<path d="M48 92 Q70 112 92 92" fill="none" stroke="#4a5574" stroke-width="6"/>' +
        '<g transform="rotate(-14 70 72)"><rect x="54" y="80" width="32" height="12" rx="3" fill="#2b3350" stroke="' + dk + '" stroke-width="2"/>' +
        '<path d="M57 80 L62 34 M83 80 L78 34 M57 80 L78 34 M83 80 L62 34" stroke="#c8cfe0" stroke-width="2.4"/>' +
        '<rect x="58" y="26" width="24" height="9" rx="2" fill="#2b3350" stroke="' + dk + '" stroke-width="2"/></g>'
    }[type] || "";
    return '<svg viewBox="0 0 140 124" aria-hidden="true">' + defs + t + '</svg>';
  }

  // ---------- Coupole ouverte sur le ciel, T60 à l'intérieur (brief station 3) ----------
  function domeScene() {
    const R = rng(60); let st = ""; for (let i = 0; i < 40; i++) st += '<circle cx="' + f1(R() * 400) + '" cy="' + f1(R() * 120) + '" r="' + f1(.5 + R() * 1.1) + '" fill="#fff" opacity="' + f1(.4 + R() * .6) + '"/>';
    return '<svg viewBox="0 0 400 220" role="img" aria-label="Une coupole d\'observatoire ouverte la nuit ; à l\'intérieur, le grand télescope T60 en tube ouvert pointé vers le ciel">' +
      '<defs><linearGradient id="dm-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030b26"/><stop offset="1" stop-color="#1c3f8f"/></linearGradient></defs>' +
      '<rect width="400" height="220" fill="url(#dm-c)"/>' + st +
      '<path d="M0 200 L400 200 L400 220 L0 220Z" fill="#071a12"/>' +
      '<g transform="translate(130 40) scale(1.5)">' + telescope("t60").replace(/<svg[^>]*>|<\/svg>/g, "") + '</g>' +
      '<path d="M206 40 L340 6" stroke="#ffd23f" stroke-width="2" stroke-dasharray="4 6" opacity=".7"/>' +
      '<polygon points="' + starPts(346, 4, 9, 3, 4, -90) + '" fill="#fff6c2"/>' +
      '</svg>';
  }

  // ---------- Carte du ciel autour du pôle sud céleste (fixe, positions réelles) ----------
  // Orientation : on regarde vers le sud, Croix au-dessus du pôle ; l'est est à gauche.
  // Cadrage automatique pour que Croix, Pointeurs et pôle tiennent dans le carré.
  function poleMap(opts) {
    opts = opts || {}; const S = window.Sky.STARS, W = 400, H = 400;
    const raC = (S.acrux.ra + S.gacrux.ra) / 2;
    const P0 = key => { const d = ((S[key].ra - raC) * 15) * Math.PI / 180, r = (S[key].dec + 90); return { x: -r * Math.sin(d), y: -r * Math.cos(d) }; };
    const ks = ["acrux", "gacrux", "mimosa", "imai", "acen", "hadar"], raw = {}; ks.forEach(k => raw[k] = P0(k));
    const xs = ks.map(k => raw[k].x).concat([0]), ys = ks.map(k => raw[k].y).concat([0]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const k = Math.min((W - 110) / (maxx - minx), (H - 120) / (maxy - miny));
    const ox = W / 2 - k * (minx + maxx) / 2, oy = H / 2 - k * (miny + maxy) / 2 + 6;
    const P = key => ({ x: ox + k * raw[key].x, y: oy + k * raw[key].y });
    const ac = P("acrux"), ga = P("gacrux"), mi = P("mimosa"), im = P("imai"), al = P("acen"), ha = P("hadar"), pc = { x: ox, y: oy };
    const vx = ac.x - ga.x, vy = ac.y - ga.y, ex = ga.x + vx * 5.5, ey = ga.y + vy * 5.5; // Gacrux→Acrux = 1 ; Acrux + 4,5 = 5,5
    let graduations = ""; for (let i = 1; i <= 4; i++) { const x = ac.x + vx * i, y = ac.y + vy * i; graduations += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="4" fill="#ff5b4a"/><text x="' + f1(x + 10) + '" y="' + f1(y + 5) + '" font-size="13" font-weight="800" fill="#ff8e7e">×' + i + '</text>'; }
    const star = (p, key) => '<circle cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + TAILLE[key] + '" fill="#fff6c2" opacity=".14"/><polygon points="' + starPts(p.x, p.y, TAILLE[key] * .85, TAILLE[key] * .3, 4, -90) + '" fill="#fff6c2"/>';
    const lab = (p, t, dx, dy, anchor) => '<text x="' + f1(p.x + dx) + '" y="' + f1(p.y + dy) + '" font-size="15" font-weight="800" fill="#ff9a8c" text-anchor="' + (anchor || "start") + '">' + t + '</text>';
    let ring = ""; [5, 10, 15, 20, 25, 30, 35].forEach(d => { ring += '<circle cx="' + f1(pc.x) + '" cy="' + f1(pc.y) + '" r="' + f1(d * k) + '" fill="none" stroke="#5a1414" stroke-width="1.2" stroke-dasharray="3 6"/>'; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Carte du ciel autour du pôle sud céleste : la Croix du Sud en haut, les deux Pointeurs à gauche ; on prolonge le grand axe de la Croix 4,5 fois pour arriver près du pôle">' +
      '<rect width="400" height="400" fill="#0b0000"/>' + ring +
      '<line class="ligne-croix' + (opts.axe ? " on" : "") + '" x1="' + f1(ga.x) + '" y1="' + f1(ga.y) + '" x2="' + f1(ex) + '" y2="' + f1(ey) + '" stroke="#ff5b4a" stroke-width="3" stroke-dasharray="10 8"/>' +
      graduations +
      (opts.pointeurs ? '<line x1="' + f1(al.x) + '" y1="' + f1(al.y) + '" x2="' + f1(ha.x) + '" y2="' + f1(ha.y) + '" stroke="#ff9a5a" stroke-width="2.5"/>' : '') +
      '<line x1="' + f1(ga.x) + '" y1="' + f1(ga.y) + '" x2="' + f1(ac.x) + '" y2="' + f1(ac.y) + '" stroke="#ff8e7e" stroke-width="2.5"/><line x1="' + f1(mi.x) + '" y1="' + f1(mi.y) + '" x2="' + f1(im.x) + '" y2="' + f1(im.y) + '" stroke="#ff8e7e" stroke-width="2.5"/>' +
      star(ac, "acrux") + star(ga, "gacrux") + star(mi, "mimosa") + star(im, "imai") + star(al, "acen") + star(ha, "hadar") +
      lab(ga, "Gacrux", 14, -4) + lab(ac, "Acrux", 16, 18) + lab(mi, "Mimosa", -14, -14, "end") + lab(im, "Imai", 13, 4) +
      lab(al, "α Centaure", 0, 30, "middle") + lab(ha, "Hadar (β)", -12, -14, "end") +
      '<g><circle cx="' + f1(pc.x) + '" cy="' + f1(pc.y) + '" r="10" fill="none" stroke="#ffd23f" stroke-width="3.5"/><circle cx="' + f1(pc.x) + '" cy="' + f1(pc.y) + '" r="2.5" fill="#ffd23f"/></g>' +
      '<text x="' + f1(pc.x + 16) + '" y="' + f1(pc.y + 5) + '" font-size="16" font-weight="900" fill="#ffd23f">pôle sud céleste</text>' +
      '</svg>';
  }

  // ---------- Récompense : la Croix du Sud qui se reconstitue ----------
  // got : {acrux:bool,...} ; nouvelle : clé de l'étoile qu'on vient de gagner (animation)
  const NOMS = { acrux: "Acrux", mimosa: "Mimosa", gacrux: "Gacrux", imai: "Imai" };
  const COUL = { acrux: "#ffd23f", mimosa: "#7be0ff", gacrux: "#ff9ec4", imai: "#9dffb0" };
  function croix(got, tracer, nouvelle) {
    const L = cruxLayout(300, 272, 26), order = ["acrux", "mimosa", "gacrux", "imai"], id = nid("cx");
    const lignes = '<path class="ligne-croix' + (tracer ? " on" : "") + '" d="M' + f1(L.gacrux.x) + ' ' + f1(L.gacrux.y) + ' L' + f1(L.acrux.x) + ' ' + f1(L.acrux.y) + ' M' + f1(L.mimosa.x) + ' ' + f1(L.mimosa.y) + ' L' + f1(L.imai.x) + ' ' + f1(L.imai.y) + '" stroke="#fff6c2" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>';
    const st = order.map(k => {
      const p = L[k], on = got[k], r = TAILLE[k] * 1.7;
      const lab = '<text x="' + f1(p.x) + '" y="' + f1(p.y + r + 20) + '" text-anchor="middle" font-size="15" font-weight="900" fill="' + (on ? "#fff" : "#8796c8") + '">' + (on ? NOMS[k] : "?") + '</text>';
      return '<g class="croix-star' + (on ? " on" : "") + (k === nouvelle ? " nouvelle" : "") + '"><circle cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r * 1.7) + '" fill="url(#' + id + k + ')" opacity="' + (on ? 1 : .0) + '"/>' +
        '<polygon points="' + starPts(p.x, p.y, r, r * .36, 4, -90) + '" fill="' + (on ? COUL[k] : "none") + '" stroke="' + (on ? "#fff" : "#8796c8") + '" stroke-width="' + (on ? 2.5 : 2) + '" stroke-dasharray="' + (on ? "none" : "4 4") + '" stroke-linejoin="round"/>' + lab + '</g>';
    }).join("");
    const defs = '<defs>' + order.map(k => '<radialGradient id="' + id + k + '"><stop offset="0" stop-color="' + COUL[k] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + COUL[k] + '" stop-opacity="0"/></radialGradient>').join("") + '</defs>';
    return '<svg viewBox="0 0 300 300" role="img" aria-label="La Croix du Sud, avec ' + order.filter(k => got[k]).length + ' étoile(s) retrouvée(s) sur 4">' + defs + lignes + st + '</svg>';
  }

  // ---------- Sceau du brevet (texte sur un cercle + Croix du Sud) ----------
  function sceau() {
    const id = nid("sc"), L = cruxLayout(60, 64, 4.6);
    return '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="' + id + '" d="M60 60 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0"/>' +
      '<radialGradient id="' + id + 'g" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#d99a00"/></radialGradient></defs>' +
      '<circle cx="60" cy="60" r="58" fill="url(#' + id + 'g)"/><circle cx="60" cy="60" r="52" fill="none" stroke="#7a5200" stroke-width="1.5"/><circle cx="60" cy="60" r="34" fill="#0a1a4a"/>' +
      '<text font-size="9.4" font-weight="900" fill="#5a3c00" letter-spacing="1.2"><textPath href="#' + id + '">OBSERVATOIRE DES MAKES · LA RÉUNION ·</textPath></text>' +
      Object.keys(L).map(k => '<polygon points="' + starPts(30 + L[k].x, 28 + L[k].y, TAILLE[k] * .45, TAILLE[k] * .16, 4, -90) + '" fill="#fff6c2"/>').join("") + '</svg>';
  }

  // ---------- Faux QR (simulation du scan) ----------
  function fakeQR(seed) {
    let s = seed * 9301 + 49297, out = ""; const n = 21;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const finder = (x, y) => '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#000"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#000"/>';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inF && rnd() > .52) out += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#000"/>';
    }
    return '<svg viewBox="-2 -2 25 25" aria-hidden="true"><rect x="-2" y="-2" width="25" height="25" fill="#fff"/>' + out + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + '</svg>';
  }

  // Icônes
  const ICO = {
    pip: '<svg class="pip" viewBox="0 0 100 100" aria-hidden="true"><path d="M' + starPts(50, 52, 40, 18, 5, -90).replace(/ /g, " L") + 'Z"/></svg>',
    eight: '<svg class="figure8" viewBox="0 0 260 140" aria-hidden="true"><path d="M130 70 C 130 20, 30 20, 30 70 C 30 120, 130 120, 130 70 C 130 20, 230 20, 230 70 C 230 120, 130 120, 130 70" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="10"/><path class="trace" d="M130 70 C 130 20, 30 20, 30 70 C 30 120, 130 120, 130 70 C 130 20, 230 20, 230 70 C 230 120, 130 120, 130 70" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4 L88 58 L64 58 L64 92 L36 92 L36 58 L12 58 Z" fill="#ffd23f" stroke="#04102c" stroke-width="6" stroke-linejoin="round"/></svg>',
    badgeStar: '<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="' + starPts(50, 52, 44, 20, 5, -90) + '" fill="#ffd23f" stroke="#0a1233" stroke-width="5" stroke-linejoin="round"/></svg>'
  };

  window.Art = { tifil, tifilInner, homeScene, jaiSing, sundial, sundialShadow, telescope, domeScene, poleMap, croix, sceau, fakeQR, starPts, cruxLayout, ICO, NOMS };
})();
