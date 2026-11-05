/* ============================================================
   ART.JS — Illustrations SVG maison (aucune image externe).
   · Ti-Komèt, la petite comète (6 expressions, animée en CSS)
   · Ciel austral de l'accueil : Voie lactée, scintillement, Croix du Sud
     et Pointeurs à leurs positions RELATIVES réelles (sky.js), étoile filante,
     observatoire avec la grande coupole et deux petites coupoles (d'après la
     description du site ; À VALIDER d'après photos).
   · Plan schématique du parcours (« Rejoins le prochain espace »), icônes.
   Toutes les couleurs passent en rouge seul en thème « nuit rouge » (filtre global).
   ============================================================ */
(function () {
  "use strict";
  let uid = 0; const U = p => p + "-" + (++uid); // identifiants de dégradés uniques (plusieurs dessins par page)
  function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // ---------------- Ti-Komèt ----------------
  // expr : content | wow | pense | fete | inquiete | clin
  function komet(expr, cls, opts) {
    opts = opts || {}; expr = expr || "content";
    const c = U("tkc"), n = U("tkn"), q1 = U("tkq"), q2 = U("tki"), gl = U("tkg");
    const yeux = {
      content: '<g class="tk-yeux"><ellipse cx="128" cy="74" rx="8.5" ry="10.5" fill="#fff"/><ellipse cx="154" cy="74" rx="8.5" ry="10.5" fill="#fff"/><circle cx="130" cy="76" r="5.6" fill="#1b1f4a"/><circle cx="156" cy="76" r="5.6" fill="#1b1f4a"/><circle cx="132" cy="73.5" r="2" fill="#fff"/><circle cx="158" cy="73.5" r="2" fill="#fff"/></g>',
      wow: '<g class="tk-yeux"><ellipse cx="128" cy="72" rx="9.5" ry="12" fill="#fff"/><ellipse cx="154" cy="72" rx="9.5" ry="12" fill="#fff"/><circle cx="128" cy="73" r="5.4" fill="#1b1f4a"/><circle cx="154" cy="73" r="5.4" fill="#1b1f4a"/><circle cx="130" cy="70.5" r="2.2" fill="#fff"/><circle cx="156" cy="70.5" r="2.2" fill="#fff"/></g>',
      pense: '<g class="tk-yeux"><ellipse cx="128" cy="74" rx="8.5" ry="10" fill="#fff"/><ellipse cx="154" cy="74" rx="8.5" ry="10" fill="#fff"/><circle cx="131" cy="70" r="5.2" fill="#1b1f4a"/><circle cx="157" cy="70" r="5.2" fill="#1b1f4a"/><circle cx="133" cy="68" r="1.8" fill="#fff"/><circle cx="159" cy="68" r="1.8" fill="#fff"/></g>',
      fete: '<g><path d="M120 76 Q128 66 136 76" stroke="#1b1f4a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M146 76 Q154 66 162 76" stroke="#1b1f4a" stroke-width="4" fill="none" stroke-linecap="round"/></g>',
      inquiete: '<g class="tk-yeux"><ellipse cx="128" cy="75" rx="8" ry="9.5" fill="#fff"/><ellipse cx="154" cy="75" rx="8" ry="9.5" fill="#fff"/><circle cx="128" cy="77" r="5" fill="#1b1f4a"/><circle cx="154" cy="77" r="5" fill="#1b1f4a"/><circle cx="130" cy="75" r="1.8" fill="#fff"/><circle cx="156" cy="75" r="1.8" fill="#fff"/></g>',
      clin: '<g><ellipse cx="128" cy="74" rx="8.5" ry="10.5" fill="#fff"/><circle cx="130" cy="76" r="5.6" fill="#1b1f4a"/><circle cx="132" cy="73.5" r="2" fill="#fff"/><path d="M146 76 Q154 70 162 76" stroke="#1b1f4a" stroke-width="4" fill="none" stroke-linecap="round"/></g>'
    }[expr] || "";
    const sourcils = {
      content: "", fete: "", clin: "",
      wow: '<path d="M119 57 Q128 51 136 56 M146 56 Q154 51 163 57" stroke="#2a2f66" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
      pense: '<path d="M120 61 Q128 58 136 61 M146 57 Q154 52 162 56" stroke="#2a2f66" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
      inquiete: '<path d="M120 63 Q127 58 135 60 M147 60 Q155 58 162 63" stroke="#2a2f66" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
    }[expr] || "";
    const bouche = {
      content: '<path d="M133 91 Q141 99 149 91" stroke="#1b1f4a" stroke-width="3.6" fill="none" stroke-linecap="round"/>',
      clin: '<path d="M132 90 Q141 100 150 90" stroke="#1b1f4a" stroke-width="3.6" fill="none" stroke-linecap="round"/>',
      wow: '<ellipse cx="141" cy="94" rx="5.5" ry="7" fill="#1b1f4a"/><ellipse cx="141" cy="97" rx="3.4" ry="2.6" fill="#ff8fa8"/>',
      pense: '<path d="M134 94 Q140 91 148 93" stroke="#1b1f4a" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
      fete: '<path d="M130 88 Q141 104 152 88 Z" fill="#1b1f4a"/><path d="M135 95 Q141 100 147 95" fill="#ff8fa8"/>',
      inquiete: '<path d="M133 95 Q137 91 141 94 T149 94" stroke="#1b1f4a" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
    }[expr] || "";
    return '<svg class="tk ' + (cls || "") + ' tk-' + expr + '" viewBox="0 0 220 150" role="img" aria-label="Ti-Komèt, la petite comète">' +
      '<defs><radialGradient id="' + c + '" cx=".64" cy=".5" r=".5"><stop offset="0" stop-color="#e9fbff" stop-opacity=".95"/><stop offset=".35" stop-color="#9fe3ff" stop-opacity=".45"/><stop offset="1" stop-color="#5ab8ff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + n + '" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#d4f1ff"/><stop offset="1" stop-color="#8fc6ea"/></radialGradient>' +
      '<linearGradient id="' + q1 + '" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff1c4" stop-opacity=".95"/><stop offset=".5" stop-color="#ffd37a" stop-opacity=".45"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + q2 + '" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#b9ecff" stop-opacity=".9"/><stop offset="1" stop-color="#4aa8ff" stop-opacity="0"/></linearGradient>' +
      '<filter id="' + gl + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>' +
      // queues : poussières (courbe, dorée) et ions (droite, bleue) — toujours à l'opposé du Soleil (clin d'œil scientifique)
      '<g class="tk-queues">' +
      '<path class="tk-q tk-q1" d="M118 66 C 80 40, 40 34, 2 18 L 4 34 C 44 52, 82 70, 118 84 Z" fill="url(#' + q1 + ')"/>' +
      '<path class="tk-q tk-q2" d="M116 72 L 0 70 L 0 80 L 116 80 Z" fill="url(#' + q2 + ')" opacity=".8"/>' +
      '<path class="tk-q tk-q3" d="M120 80 C 86 96, 50 112, 10 122 L 16 130 C 56 120, 90 104, 122 88 Z" fill="url(#' + q1 + ')" opacity=".55"/></g>' +
      '<g class="tk-corps"><circle cx="141" cy="76" r="64" fill="url(#' + c + ')" class="tk-coma"/>' +
      '<circle cx="141" cy="76" r="40" fill="#bfeaff" opacity=".55" filter="url(#' + gl + ')"/>' +
      '<path d="M107 70 C 106 48, 126 36, 146 38 C 168 40, 180 56, 178 78 C 177 100, 160 114, 139 113 C 118 112, 106 94, 107 70 Z" fill="url(#' + n + ')" stroke="#6fa9d6" stroke-width="2.2"/>' +
      '<ellipse cx="163" cy="98" rx="6" ry="4" fill="#8fb4d4" opacity=".55"/><ellipse cx="115" cy="95" rx="4" ry="3" fill="#8fb4d4" opacity=".5"/><circle cx="170" cy="62" r="3" fill="#8fb4d4" opacity=".45"/>' +
      '<ellipse cx="126" cy="52" rx="11" ry="6" fill="#fff" opacity=".8" transform="rotate(-25 126 52)"/>' +
      '<g class="tk-visage">' + sourcils + yeux + '<ellipse cx="118" cy="88" rx="6" ry="3.6" fill="#ff9fb8" opacity=".75"/><ellipse cx="166" cy="88" rx="6" ry="3.6" fill="#ff9fb8" opacity=".75"/>' + bouche + '</g>' +
      (expr === "fete" || opts.etincelles ? '<g class="tk-etinc" fill="#fff6c8"><path d="M196 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M186 120 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M100 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/></g>' : "") +
      '</g></svg>';
  }

  // ---------------- Croix du Sud : positions relatives réelles ----------------
  function croixRel() { // offsets en degrés (est à gauche, nord en haut), centrés sur la Croix
    const S = window.Sky ? Sky.STARS : null; if (!S) return null;
    const ra0 = 12.5, de0 = -60, cd = Math.cos(de0 * Math.PI / 180), o = {};
    Object.keys(S).forEach(k => { o[k] = { x: -(S[k].ra - ra0) * 15 * cd, y: -(S[k].dec - de0) }; });
    return o;
  }

  // ---------------- Ciel de l'accueil ----------------
  // opts.court : version compacte (bandeau) ; opts.komet : avec Ti-Komèt
  function ciel(opts) {
    opts = opts || {};
    const r = rnd(1986), W = 400, H = opts.court ? 300 : 460, sky = U("sk"), mw = U("mw"), bl = U("bl"), gr = U("gr"), dm = U("dm"), glow = U("glw"), haze = U("hz");
    let etoiles = "";
    for (let i = 0; i < 110; i++) {
      const x = r() * W, y = r() * (H * 0.72), m = r(), rr = m > .96 ? 1.9 : m > .8 ? 1.3 : .8, tw = r() > .6 ? ' class="tw tw' + (1 + Math.floor(r() * 3)) + '"' : "";
      etoiles += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rr + '" fill="#fff"' + tw + ' opacity="' + (.45 + r() * .55).toFixed(2) + '"/>';
    }
    // Voie lactée : bande diagonale de poussière lumineuse + amas de petites étoiles
    let amas = "";
    for (let i = 0; i < 160; i++) {
      const t = r(), x = -20 + t * (W + 40), y = H * .62 - t * H * .55 + (r() - .5) * 46;
      amas += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (.35 + r() * .7).toFixed(2) + '" fill="#f4f0ff" opacity="' + (.3 + r() * .6).toFixed(2) + '"/>';
    }
    // Croix du Sud + Pointeurs (échelle 7,5 px/°), placée à gauche de la Voie lactée
    const cr = croixRel(); let croix = "";
    if (cr) {
      const k = 7.5, cx = 108, cy = H * .3, P = s => [cx + cr[s].x * k, cy + cr[s].y * k];
      const mag = { acrux: 3.4, mimosa: 3.1, gacrux: 2.9, imai: 2.2, acen: 3.6, hadar: 3.1 };
      croix = '<g class="croix" aria-hidden="true">' +
        '<path d="M' + P("gacrux") + ' L' + P("acrux") + ' M' + P("mimosa") + ' L' + P("imai") + '" stroke="#9fd8ff" stroke-width="1" opacity=".35" stroke-dasharray="2 4"/>' +
        Object.keys(mag).map((s, i) => { const p = P(s); return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (mag[s] * 2.6) + '" fill="url(#' + glow + ')" class="tw tw' + (1 + i % 3) + '"/><circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (mag[s] * .55) + '" fill="#fff"/>'; }).join("") + '</g>';
    }
    const fil = '<g class="filante" aria-hidden="true"><path d="M0 0 L -90 34" stroke="url(#' + bl + ')" stroke-width="2.4" stroke-linecap="round"/><circle r="2.2" fill="#fff"/></g>';
    // relief des Makes (silhouettes) + observatoire
    const gy = H - 34;
    const montagnes =
      '<path d="M0 ' + (gy - 70) + ' C 40 ' + (gy - 120) + ', 80 ' + (gy - 150) + ', 120 ' + (gy - 110) + ' S 200 ' + (gy - 160) + ', 250 ' + (gy - 120) + ' S 340 ' + (gy - 175) + ', 400 ' + (gy - 105) + ' V ' + H + ' H 0 Z" fill="#141c4a" opacity=".9"/>' +
      '<path d="M0 ' + (gy - 30) + ' C 60 ' + (gy - 62) + ', 110 ' + (gy - 40) + ', 170 ' + (gy - 58) + ' S 300 ' + (gy - 30) + ', 400 ' + (gy - 64) + ' V ' + H + ' H 0 Z" fill="#0d1336"/>';
    const domeG = (x, y, rr, fente) => '<g><rect x="' + (x - rr) + '" y="' + y + '" width="' + rr * 2 + '" height="' + rr * .9 + '" fill="#2a3470"/><path d="M' + (x - rr - 2) + ' ' + y + ' A ' + (rr + 2) + ' ' + (rr + 2) + ' 0 0 1 ' + (x + rr + 2) + ' ' + y + ' Z" fill="url(#' + dm + ')"/>' +
      (fente ? '<path d="M' + (x - rr * .16) + ' ' + y + ' L ' + (x - rr * .12) + ' ' + (y - rr * .98) + ' L ' + (x + rr * .12) + ' ' + (y - rr * .98) + ' L ' + (x + rr * .16) + ' ' + y + ' Z" fill="#ff5b4a" class="fente"/>' : '<path d="M' + x + ' ' + (y - rr) + ' V ' + y + '" stroke="#9aa6d8" stroke-width="1.4" opacity=".6"/>') + '</g>';
    const obs = '<g class="obs">' +
      '<rect x="168" y="' + (gy - 26) + '" width="118" height="40" rx="3" fill="#202a62"/><rect x="176" y="' + (gy - 16) + '" width="10" height="9" fill="#ffcf6b" opacity=".85"/><rect x="194" y="' + (gy - 16) + '" width="10" height="9" fill="#ffcf6b" opacity=".55"/><rect x="250" y="' + (gy - 16) + '" width="10" height="9" fill="#ff5b4a" opacity=".7"/>' +
      domeG(228, gy - 26, 30, true) + domeG(316, gy - 8, 15, false) + domeG(354, gy - 4, 13, false) +
      '<rect x="300" y="' + (gy - 8) + '" width="70" height="24" fill="#1b2457"/>' +
      '<path class="faisceau" d="M224 ' + (gy - 50) + ' L 150 ' + (gy - 260) + ' L 176 ' + (gy - 266) + ' Z" fill="url(#' + haze + ')" opacity=".22"/></g>';
    const arbres = (() => { let s = ""; for (let i = 0; i < 9; i++) { const x = 8 + i * 18 + r() * 6, h = 26 + r() * 22; s += '<path d="M' + x + ' ' + (gy + 4) + ' L ' + (x + 7) + ' ' + (gy + 4 - h) + ' L ' + (x + 14) + ' ' + (gy + 4) + ' Z" fill="#070b24"/>'; } return s; })();
    return '<svg class="ciel' + (opts.court ? " court" : "") + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + sky + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030622"/><stop offset=".55" stop-color="#0b1650"/><stop offset=".85" stop-color="#2a2a78"/><stop offset="1" stop-color="#5a3a7a"/></linearGradient>' +
      '<linearGradient id="' + mw + '" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#b9a6ff" stop-opacity="0"/><stop offset=".3" stop-color="#c9b8ff" stop-opacity=".34"/><stop offset=".55" stop-color="#ffe3c2" stop-opacity=".42"/><stop offset=".8" stop-color="#a9c8ff" stop-opacity=".3"/><stop offset="1" stop-color="#a9c8ff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + bl + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + dm + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef2ff"/><stop offset="1" stop-color="#9aa6d8"/></linearGradient>' +
      '<linearGradient id="' + haze + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff8a7a"/><stop offset="1" stop-color="#ff8a7a" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + glow + '"><stop offset="0" stop-color="#cfe9ff" stop-opacity=".9"/><stop offset="1" stop-color="#cfe9ff" stop-opacity="0"/></radialGradient>' +
      '<filter id="' + gr + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#' + sky + ')"/>' +
      '<g class="plan-loin"><path d="M-40 ' + (H * .74) + ' L ' + (W + 40) + ' ' + (H * .02) + ' L ' + (W + 40) + ' ' + (H * .2) + ' L -40 ' + (H * .92) + ' Z" fill="url(#' + mw + ')" filter="url(#' + gr + ')"/>' +
      '<path d="M40 ' + (H * .6) + ' C 140 ' + (H * .44) + ', 220 ' + (H * .36) + ', 330 ' + (H * .16) + '" stroke="#1a1240" stroke-width="16" fill="none" opacity=".55" filter="url(#' + gr + ')"/>' + amas + '</g>' +
      '<g class="plan-moyen">' + etoiles + croix + '</g>' + fil +
      (opts.komet !== false ? '<g transform="translate(' + (opts.court ? 196 : 170) + ' ' + (H * (opts.court ? .1 : .34)) + ') scale(' + (opts.court ? .82 : 1) + ')"><g class="vol">' + komet(opts.expr || "content", "tk-ciel").replace("<svg ", '<svg width="220" height="150" ') + '</g></g>' : "") +
      '<g class="plan-proche">' + montagnes + arbres + obs + '<rect x="0" y="' + (gy + 4) + '" width="' + W + '" height="80" fill="#060a20"/></g></svg>';
  }

  // ---------------- Plan schématique du parcours ----------------
  // de, vers : numéros d'espaces (1…6). Plan inventé : À VALIDER avec l'Observatoire.
  function plan(de, vers) {
    const P = { 1: [70, 210], 2: [150, 110], 3: [250, 90], 4: [312, 190], 5: [230, 262], 6: [116, 268] };
    const nom = { 1: "Jaï Sing", 2: "Coupoles", 3: "Newton", 4: "Ptolémée", 5: "Einstein", 6: "Terrasse" };
    const ordre = [1, 2, 3, 4, 5, 6]; let chemin = "";
    for (let i = 0; i < ordre.length - 1; i++) { const a = P[ordre[i]], b = P[ordre[i + 1]]; chemin += '<path d="M' + a + ' Q ' + ((a[0] + b[0]) / 2 + 18) + ' ' + ((a[1] + b[1]) / 2 - 16) + ' ' + b + '" class="pl-ch' + (ordre[i] === de && ordre[i + 1] === vers ? " actif" : "") + '"/>'; }
    const pts = ordre.map(k => {
      const p = P[k], etat = k === vers ? "cible" : k <= de ? "fait" : k > 2 ? "verrou" : "";
      return '<g class="pl-pt ' + etat + '" transform="translate(' + p + ')">' + (k === vers ? '<circle r="26" class="pl-onde"/>' : "") +
        '<circle r="16"/><text y="5.5" text-anchor="middle">' + (k === 6 ? "☾" : k) + '</text><text class="pl-nom" y="' + (k === 2 || k === 3 || k === 6 ? -24 : 32) + '" text-anchor="middle">' + nom[k] + '</text></g>';
    }).join("");
    return '<svg class="plan" viewBox="0 0 380 340" role="img" aria-label="Plan schématique du parcours de la visite, de l\'espace ' + nom[de] + ' vers ' + nom[vers] + '">' +
      '<rect x="6" y="6" width="368" height="328" rx="22" class="pl-fond"/>' +
      '<path d="M20 320 C 90 280, 60 160, 140 40 L 360 30 L 360 320 Z" class="pl-herbe"/>' +
      '<g class="pl-nord" transform="translate(340 44)"><path d="M0 -14 L 7 6 L 0 2 L -7 6 Z"/><text y="22" text-anchor="middle">N</text></g>' +
      chemin + pts + '<text x="190" y="326" text-anchor="middle" class="pl-legende">Plan schématique · emplacements à valider</text></svg>';
  }

  // ---------------- Icônes (traits, couleur = currentColor) ----------------
  const I = (d, extra) => '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + (extra || "") + '</svg>';
  const ICO = {
    cadenas: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10.5" rx="3" fill="currentColor"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><circle cx="12" cy="15.3" r="1.6" class="ic-trou"/></svg>',
    etoile: I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" stroke="none"/>'),
    etoileVide: I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    reglages: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    son: I('<path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
    retour: I('<path d="M15 18l-6-6 6-6"/>'),
    suite: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    play: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
    check: I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    boussole: I('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor"/>'),
    coupole: I('<path d="M3 20h18M5 20v-5a7 7 0 0 1 14 0v5"/><path d="M11 8.2l1.2-.2 1.6 6.8"/>'),
    telescope: I('<path d="M3.5 12.5l11-5.5 2 4-11 5.5z"/><path d="M16.5 7l3-1.5 1.5 3-3 1.5M9 15l-2.5 6M10.5 14.2l3 6.8"/>'),
    cadran: I('<path d="M3 17a9 9 0 0 1 18 0z"/><path d="M12 17V8M12 17l-5-4"/>'),
    planetes: I('<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)"/>'),
    croix: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="12" cy="3.5" r="1.8"/><circle cx="12" cy="20.5" r="2.3"/><circle cx="5" cy="11" r="2"/><circle cx="18.5" cy="12.5" r="1.4"/><path d="M12 5.5v13M6.8 11.2l10.4 1.2" stroke="currentColor" stroke-width="1" opacity=".5"/></svg>',
    brevet: I('<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5"/><path d="M12 6.5l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" fill="currentColor" stroke="none"/>'),
    ecole: I('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>'),
    famille: I('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0M13 20a4 4 0 0 1 8 0"/>'),
    lune: I('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="currentColor" stroke="none"/>'),
    langue: I('<path d="M4 5h16v11H11l-5 4v-4H4z"/><path d="M8.5 10.5h7"/>'),
    horsligne: I('<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1.2" fill="currentColor"/><path d="M2 8.5a15 15 0 0 1 20 0"/>'),
    qr: I('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>'),
    stats: I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    crayon: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    oeil: I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    imprimer: I('<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>'),
    installer: I('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3M10 18.5h4"/>'),
    maison: I('<path d="M3 11l9-7 9 7M5.5 9.5V20h13V9.5"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'),
    carte: I('<path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5z"/><path d="M9 4v13M15 6.5v13"/>'),
    pin: I('<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>'),
    main: I('<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7.5-6.5 7.5-3 0-4.3-1.6-5.8-4L3.5 14a1.5 1.5 0 0 1 2.4-1.8L8 14.5"/>'),
    recommencer: I('<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5"/><path d="M3.5 3.5v5h5"/>'),
    soleil: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'),
    oeilRouge: I('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'),
    partage: I('<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>'),
    vacances: I('<path d="M4 20h16M7 20c0-6 2-11 6-13M13 7c3 0 6 2 7 5-3-1-5-1-7 0M13 7c-3-1-6 0-8 2 3 0 5 0 8 1"/>'),
    asteroide: I('<path d="M7 5.5l6-1.5 5 3.5 1.5 6-3 5-6 1.5-5-3-2-6z"/><circle cx="10" cy="10" r="1.3"/><circle cx="14.5" cy="14" r="1.8"/>'),
    loupe: I('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>'),
    arrow: '<svg viewBox="0 0 90 90"><path d="M45 4 L74 52 L54 46 L54 86 L36 86 L36 46 L16 52 Z" fill="#ffd23f" stroke="#0a1233" stroke-width="5" stroke-linejoin="round"/></svg>',
    eight: '<svg viewBox="0 0 120 70" width="140" height="80"><path d="M60 35 C 30 0, 0 15, 15 40 C 28 62, 50 50, 60 35 C 70 20, 92 8, 105 30 C 120 55, 90 70, 60 35 Z" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-dasharray="10 8"/></svg>'
  };

  window.Art = { komet, ciel, plan, croixRel, ICO };
})();
