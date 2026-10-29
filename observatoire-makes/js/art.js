/* ============================================================
   ART.JS — Toutes les illustrations sont faites maison en SVG.
   (aucune image externe, aucun droit à gérer)
   ============================================================ */
(function () {
  "use strict";
  const f1 = n => Math.round(n * 10) / 10;

  function starPts(cx, cy, R, r, n, rotDeg) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (rotDeg + i * 180 / n) * Math.PI / 180, rad = i % 2 ? r : R;
      pts.push(f1(cx + rad * Math.cos(a)) + "," + f1(cy + rad * Math.sin(a)));
    }
    return pts.join(" ");
  }

  // ---------- Ti-Fil, l'étoile filante ----------
  // expr : 'content' | 'wow' | 'pense' | 'fete'
  let uid = 0;
  function tifilInner(expr) {
    const id = "tf" + (++uid);
    const bouche = {
      content: '<path d="M84 117 Q100 134 116 117" fill="#7a2230" stroke="#4b1020" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>',
      wow: '<ellipse cx="100" cy="124" rx="9" ry="11" fill="#7a2230" stroke="#4b1020" stroke-width="3.5"/>',
      pense: '<path d="M88 124 Q100 118 112 124" fill="none" stroke="#4b1020" stroke-width="4" stroke-linecap="round"/>',
      fete: '<path d="M80 114 Q100 142 120 114 Z" fill="#7a2230" stroke="#4b1020" stroke-width="3.5" stroke-linejoin="round"/><path d="M92 126 Q100 134 108 126 Q100 121 92 126Z" fill="#ff7b8e"/>'
    }[expr] || "";
    const sourcils = expr === "pense" ? '<path d="M70 82 L90 88 M130 82 L110 88" stroke="#4b1020" stroke-width="4" stroke-linecap="round"/>' : "";
    const yeux = expr === "fete"
      ? '<path d="M76 100 Q86 88 96 100 M104 100 Q114 88 124 100" fill="none" stroke="#2a1030" stroke-width="5" stroke-linecap="round"/>'
      : '<g class="oeil"><ellipse cx="85" cy="100" rx="8" ry="' + (expr === "wow" ? 11 : 9.5) + '" fill="#2a1030"/><circle cx="88" cy="96" r="3" fill="#fff"/></g>' +
        '<g class="oeil"><ellipse cx="115" cy="100" rx="8" ry="' + (expr === "wow" ? 11 : 9.5) + '" fill="#2a1030"/><circle cx="118" cy="96" r="3" fill="#fff"/></g>';
    return '<defs>' +
      '<linearGradient id="' + id + 'q" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7be0ff" stop-opacity=".95"/><stop offset="1" stop-color="#7be0ff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="' + id + 'c" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#fff2a8"/><stop offset=".55" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff9f1c"/></radialGradient>' +
      '</defs>' +
      '<g class="queue"><path d="M62 128 C 30 150 14 176 4 198 C 28 184 52 176 78 150 Z" fill="url(#' + id + 'q)"/>' +
      '<path d="M78 140 C 56 166 44 186 40 200 C 58 188 76 172 92 152 Z" fill="url(#' + id + 'q)" opacity=".7"/>' +
      '<circle cx="22" cy="172" r="3.4" fill="#fff"/><circle cx="48" cy="190" r="2.4" fill="#7be0ff"/></g>' +
      '<g class="corps"><polygon points="' + starPts(100, 104, 78, 40, 5, -90) + '" fill="url(#' + id + 'c)" stroke="#ffb703" stroke-width="12" stroke-linejoin="round"/>' +
      '<polygon points="' + starPts(100, 104, 78, 40, 5, -90) + '" fill="url(#' + id + 'c)" stroke="url(#' + id + 'c)" stroke-width="8" stroke-linejoin="round"/>' +
      yeux + sourcils + bouche +
      '<ellipse cx="68" cy="116" rx="9" ry="6" fill="#ff7b8e" opacity=".75"/><ellipse cx="132" cy="116" rx="9" ry="6" fill="#ff7b8e" opacity=".75"/></g>';
  }
  function tifil(expr, cls) {
    return '<div class="tifil ' + (cls || "") + '" aria-hidden="true"><svg viewBox="-6 6 212 200" role="img" focusable="false">' + tifilInner(expr || "content") + '</svg></div>';
  }

  // ---------- Croix du Sud : positions réelles relatives (nord en haut, est à gauche) ----------
  function cruxLayout(w, h, zoom) {
    const S = window.Sky.STARS, ks = ["acrux", "mimosa", "gacrux", "imai"];
    const ra0 = (S.acrux.ra + S.mimosa.ra + S.gacrux.ra + S.imai.ra) / 4, d0 = (S.acrux.dec + S.mimosa.dec + S.gacrux.dec + S.imai.dec) / 4;
    const k = zoom, out = {};
    ks.forEach(key => {
      out[key] = { x: w / 2 - (S[key].ra - ra0) * 15 * Math.cos(d0 * Math.PI / 180) * k, y: h / 2 - (S[key].dec - d0) * k };
    });
    return out;
  }
  // taille graphique relative (ordre de luminosité : Acrux > Mimosa > Gacrux > Imai)
  const TAILLE = { acrux: 15, mimosa: 14, gacrux: 12, imai: 9 };

  // ---------- Scène d'accueil ----------
  function homeScene() {
    const stars = [[30, 30, 1.6], [90, 60, 1.2], [150, 24, 1.8], [210, 70, 1.2], [320, 40, 1.8], [370, 90, 1.2], [60, 110, 1.2], [260, 18, 1.4], [350, 150, 1.4], [20, 170, 1.2]]
      .map(s => '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="#fff" opacity=".85"/>').join("");
    const L = cruxLayout(120, 130, 9), ox = 262, oy = 52;
    const cruxStars = Object.keys(L).map(k => '<polygon points="' + starPts(ox + L[k].x, oy + L[k].y, TAILLE[k] * .85, TAILLE[k] * .35, 4, -90) + '" fill="#fff6c2"/><circle cx="' + (ox + L[k].x) + '" cy="' + (oy + L[k].y) + '" r="' + (TAILLE[k] * 1.1) + '" fill="#ffd23f" opacity=".18"/>').join("");
    return '<svg viewBox="0 0 400 300" role="img" aria-label="Le ciel austral au-dessus de l\'Observatoire des Makes, avec la Croix du Sud et Ti-Fil l\'étoile filante">' +
      '<defs><linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040a22"/><stop offset=".6" stop-color="#14337c"/><stop offset="1" stop-color="#3a6fd0"/></linearGradient>' +
      '<linearGradient id="hm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2a2e"/><stop offset="1" stop-color="#04120f"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#hs)"/>' + stars + cruxStars +
      '<path d="M0 230 L40 196 L80 222 L128 176 L170 214 L214 186 L262 224 L310 182 L356 214 L400 190 L400 300 L0 300Z" fill="#0f3a46"/>' +
      '<path d="M0 252 L60 226 L110 246 L170 222 L240 250 L300 228 L360 248 L400 232 L400 300 L0 300Z" fill="url(#hm)"/>' +
      // coupole de l'observatoire (stylisée)
      '<g transform="translate(78 206)"><rect x="-26" y="14" width="52" height="30" rx="3" fill="#cfd9f2"/><path d="M-28 16 A28 26 0 0 1 28 16Z" fill="#eef3ff"/><rect x="-5" y="-12" width="10" height="26" fill="#0a1233" opacity=".8" transform="rotate(18 0 14)"/><rect x="-4" y="26" width="8" height="18" fill="#7be0ff" opacity=".7"/></g>' +
      '<g transform="translate(138 224) scale(.7)"><rect x="-26" y="14" width="52" height="30" rx="3" fill="#b9c6e6"/><path d="M-28 16 A28 26 0 0 1 28 16Z" fill="#dfe8ff"/></g>' +
      '<g transform="translate(18 40) scale(.62) rotate(-8)">' + tifilInner("content") + '</g>' +
      '</svg>';
  }

  // ---------- Cadran solaire (schéma d'un cadran équatorial) ----------
  // solaireMin : heure solaire en minutes ; si null → pas d'ombre
  function sundial(solaireMin) {
    const cx = 160, cy = 150, R = 118; let marks = "", nums = "";
    for (let h = 6; h <= 18; h++) {
      const a = (h - 12) * 15 * Math.PI / 180, x1 = cx + (R - 14) * Math.sin(a), y1 = cy - (R - 14) * Math.cos(a), x2 = cx + R * Math.sin(a), y2 = cy - R * Math.cos(a);
      marks += '<line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2) + '" y2="' + f1(y2) + '" stroke="#04102c" stroke-width="' + (h % 3 === 0 ? 5 : 3.5) + '" stroke-linecap="round"/>';
      const xn = cx + (R + 17) * Math.sin(a), yn = cy - (R + 17) * Math.cos(a) + 6;
      nums += '<text x="' + f1(xn) + '" y="' + f1(yn) + '" text-anchor="middle" font-size="18" font-weight="800" fill="#04102c">' + h + '</text>';
      if (h < 18) for (let q = 1; q < 4; q++) {
        const a2 = ((h - 12) * 15 + q * 3.75) * Math.PI / 180;
        marks += '<line x1="' + f1(cx + (R - 6) * Math.sin(a2)) + '" y1="' + f1(cy - (R - 6) * Math.cos(a2)) + '" x2="' + f1(cx + R * Math.sin(a2)) + '" y2="' + f1(cy - R * Math.cos(a2)) + '" stroke="#04102c" stroke-width="1.6"/>';
      }
    }
    let ombre = "";
    if (solaireMin != null) {
      const a = (solaireMin / 60 - 12) * 15 * Math.PI / 180, L = R - 4;
      const x = cx + L * Math.sin(a), y = cy - L * Math.cos(a);
      ombre = '<line id="ombre" x1="' + cx + '" y1="' + cy + '" x2="' + f1(x) + '" y2="' + f1(y) + '" stroke="#04102c" stroke-width="9" stroke-linecap="round" opacity=".78"/>' +
        '<line x1="' + cx + '" y1="' + cy + '" x2="' + f1(x) + '" y2="' + f1(y) + '" stroke="#04102c" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 8" opacity=".0"/>';
    }
    return '<svg viewBox="0 0 320 300" role="img" aria-label="Schéma d\'un cadran solaire : une plaque graduée de 6 à 18 heures, un style au centre et son ombre">' +
      '<defs><radialGradient id="pl" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#ffe9a8"/></radialGradient></defs>' +
      '<path d="M' + (cx - R - 10) + ' ' + cy + ' A' + (R + 10) + ' ' + (R + 10) + ' 0 0 1 ' + (cx + R + 10) + ' ' + cy + ' L' + (cx + R + 10) + ' ' + (cy + 8) + ' L' + (cx - R - 10) + ' ' + (cy + 8) + 'Z" fill="none"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + 6) + '" fill="url(#pl)" stroke="#04102c" stroke-width="5"/>' + marks + nums + ombre +
      '<circle cx="' + cx + '" cy="' + cy + '" r="9" fill="#04102c"/><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#ffd23f"/>' +
      '<text x="' + cx + '" y="292" text-anchor="middle" font-size="13" font-weight="700" fill="#04102c">Schéma simplifié (cadran équatorial)</text></svg>';
  }

  // ---------- Télescopes (illustrations schématiques) ----------
  function telescope(type) {
    const c1 = "#cfd9f2", c2 = "#7be0ff", dk = "#0a1233";
    const pied = '<path d="M60 112 L72 86 M84 112 L72 86" stroke="' + dk + '" stroke-width="5" stroke-linecap="round"/>';
    const t = {
      t60: '<g transform="rotate(-38 70 66)"><rect x="34" y="50" width="76" height="30" rx="6" fill="' + c1 + '" stroke="' + dk + '" stroke-width="4"/><ellipse cx="108" cy="65" rx="6" ry="15" fill="#223a7a" stroke="' + dk + '" stroke-width="3"/><rect x="20" y="56" width="16" height="18" rx="4" fill="#ffd23f" stroke="' + dk + '" stroke-width="3"/></g><rect x="52" y="86" width="40" height="10" rx="3" fill="' + dk + '"/><rect x="62" y="96" width="20" height="16" fill="' + dk + '"/>',
      ds16: '<g transform="rotate(-50 70 70)"><rect x="40" y="48" width="64" height="34" rx="4" fill="#e9b872" stroke="' + dk + '" stroke-width="4"/><ellipse cx="102" cy="65" rx="5" ry="16" fill="#223a7a" stroke="' + dk + '" stroke-width="3"/></g><rect x="46" y="86" width="52" height="26" rx="3" fill="#8a5a24" stroke="' + dk + '" stroke-width="4"/>',
      c8: '<g transform="rotate(-35 72 62)"><rect x="46" y="46" width="46" height="34" rx="12" fill="#f5a623" stroke="' + dk + '" stroke-width="4"/><circle cx="90" cy="63" r="14" fill="#223a7a" stroke="' + dk + '" stroke-width="3"/></g>' + pied,
      tele: '<g transform="rotate(-32 70 66)"><rect x="22" y="58" width="88" height="14" rx="5" fill="#fff" stroke="' + dk + '" stroke-width="4"/><rect x="102" y="54" width="14" height="22" rx="4" fill="' + dk + '"/></g>' + pied
    }[type] || "";
    return '<svg viewBox="0 0 140 120" aria-hidden="true">' + t + '</svg>';
  }

  // ---------- Carte du ciel autour du pôle sud céleste (fixe, positions réelles) ----------
  // Orientation : on regarde vers le sud, Croix en haut ; l'est est à gauche.
  function poleMap(opts) {
    opts = opts || {}; const S = window.Sky.STARS, W = 400, H = 400, cx = 200, cy = 190, k = 5.6;
    const raC = (S.acrux.ra + S.gacrux.ra) / 2;
    const P = key => { const d = ((S[key].ra - raC) * 15) * Math.PI / 180, r = (S[key].dec + 90) * k; return { x: cx - r * Math.sin(d), y: cy - r * Math.cos(d) }; };
    const ac = P("acrux"), ga = P("gacrux"), mi = P("mimosa"), im = P("imai"), al = P("acen"), ha = P("hadar");
    // prolongement 4,5× du grand axe (de Gacrux vers Acrux : mesuré depuis Acrux)
    const vx = ac.x - ga.x, vy = ac.y - ga.y, ex = ga.x + vx * 5.5, ey = ga.y + vy * 5.5; // Gacrux→Acrux = 1 ; Acrux + 4,5 = 5,5
    const star = (p, key) => '<polygon points="' + starPts(p.x, p.y, TAILLE[key] || 11, (TAILLE[key] || 11) * .4, 4, -90) + '" fill="#fff6c2"/>';
    const lab = (p, t, dx, dy, anchor) => '<text x="' + (p.x + dx) + '" y="' + (p.y + dy) + '" font-size="15" font-weight="800" fill="#ff9a8c" text-anchor="' + (anchor || "start") + '">' + t + '</text>';
    let ring = ""; [10, 20, 30, 40].forEach(d => { ring += '<circle cx="' + cx + '" cy="' + cy + '" r="' + d * k + '" fill="none" stroke="#7a1c1c" stroke-width="1.5" stroke-dasharray="3 6"/>'; });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Carte du ciel autour du pôle sud céleste : la Croix du Sud en haut, les deux Pointeurs à gauche, le pôle au centre">' +
      '<rect width="400" height="400" fill="#0b0000"/>' + ring +
      '<line class="ligne-croix' + (opts.axe ? " on" : "") + '" x1="' + f1(ga.x) + '" y1="' + f1(ga.y) + '" x2="' + f1(ex) + '" y2="' + f1(ey) + '" stroke="#ff5b4a" stroke-width="3.5" stroke-dasharray="10 8" style="stroke-dashoffset:0"/>' +
      (opts.pointeurs ? '<line x1="' + f1(al.x) + '" y1="' + f1(al.y) + '" x2="' + f1(ha.x) + '" y2="' + f1(ha.y) + '" stroke="#ff9a5a" stroke-width="2.5"/>' : '') +
      '<line x1="' + f1(ga.x) + '" y1="' + f1(ga.y) + '" x2="' + f1(ac.x) + '" y2="' + f1(ac.y) + '" stroke="#ff8e7e" stroke-width="2.5"/><line x1="' + f1(mi.x) + '" y1="' + f1(mi.y) + '" x2="' + f1(im.x) + '" y2="' + f1(im.y) + '" stroke="#ff8e7e" stroke-width="2.5"/>' +
      star(ac, "acrux") + star(ga, "gacrux") + star(mi, "mimosa") + star(im, "imai") + star(al, "acrux") + star(ha, "mimosa") +
      lab(ga, "Gacrux", 16, -6) + lab(ac, "Acrux", 16, 20) + lab(al, "α Centaure", 0, 28, "middle") + lab(ha, "Hadar", 0, -20, "middle") +
      '<g><circle cx="' + cx + '" cy="' + cy + '" r="9" fill="none" stroke="#ffd23f" stroke-width="3.5"/><circle cx="' + cx + '" cy="' + cy + '" r="2.5" fill="#ffd23f"/></g>' +
      '<text x="' + (cx + 14) + '" y="' + (cy + 5) + '" font-size="16" font-weight="900" fill="#ffd23f">pôle sud céleste</text>' +
      '</svg>';
  }

  // ---------- Récompense : la Croix du Sud qui se reconstitue ----------
  // got : {acrux:bool,...}
  function croix(got, tracer) {
    const L = cruxLayout(300, 300, 34), cl = { acrux: "#ffd23f", mimosa: "#7be0ff", gacrux: "#ff9ec4", imai: "#9dffb0" };
    const order = ["acrux", "mimosa", "gacrux", "imai"];
    const lignes = '<path class="ligne-croix' + (tracer ? " on" : "") + '" d="M' + f1(L.gacrux.x) + ' ' + f1(L.gacrux.y) + ' L' + f1(L.acrux.x) + ' ' + f1(L.acrux.y) + ' M' + f1(L.mimosa.x) + ' ' + f1(L.mimosa.y) + ' L' + f1(L.imai.x) + ' ' + f1(L.imai.y) + '" stroke="#fff6c2" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>';
    const st = order.map(k => {
      const p = L[k], on = got[k], r = TAILLE[k] * 1.9;
      return '<g class="croix-star' + (on ? " on" : "") + '" style="opacity:' + (on ? 1 : 0.28) + '"><circle cx="' + f1(p.x) + '" cy="' + f1(p.y) + '" r="' + f1(r * 1.5) + '" fill="' + cl[k] + '" opacity="' + (on ? .25 : .05) + '"/><polygon points="' + starPts(p.x, p.y, r, r * .42, 4, -90) + '" fill="' + (on ? cl[k] : "#6a7bb0") + '" stroke="#fff" stroke-width="' + (on ? 2.5 : 1.5) + '" stroke-linejoin="round"/></g>';
    }).join("");
    return '<svg viewBox="0 0 300 300" role="img" aria-label="La Croix du Sud, avec ' + order.filter(k => got[k]).length + ' étoile(s) retrouvée(s) sur 4">' + lignes + st + '</svg>';
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

  window.Art = { tifil, tifilInner, homeScene, sundial, telescope, poleMap, croix, fakeQR, starPts, cruxLayout, ICO };
})();
