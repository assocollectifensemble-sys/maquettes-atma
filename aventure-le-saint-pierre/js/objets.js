/* ============================================================
   OBJETS.JS — Dessins SVG communs (chambre, objets du quotidien, plage).
   Chaque objet est dessiné centré sur (0,0), environ 70 × 70.
   Deux états pour les objets de chambre : « avant » (le défi) et « apres » (relevé).
   ============================================================ */
(function () {
  "use strict";
  const etincelle = (x, y, c) => '<g class="etincelle" transform="translate(' + x + ' ' + y + ')"><path d="M0 -14 L3 -3 L14 0 L3 3 L0 14 L-3 3 L-14 0 L-3 -3Z" fill="' + (c || "#ffd166") + '"/></g>';
  const coche = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><circle r="11" fill="#2fbf71" stroke="#fff" stroke-width="2.5"/><path d="M-5 0 l3.5 4 l6.5 -7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>';

  const O = {
    etincelle, coche,

    /* ---------- objets de chambre ---------- */
    robinet(e) {
      let s = '<rect x="-34" y="-46" width="68" height="40" rx="8" fill="#dff3f7" stroke="#b9d3db" stroke-width="2"/>' + // miroir
        '<path d="M-26 -38 l10 -6 M-20 -30 l16 -10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M-34 6 h68 l-6 14 a8 8 0 0 1 -8 6 h-40 a8 8 0 0 1 -8 -6z" fill="#fff" stroke="#b9d3db" stroke-width="2"/>' +
        '<rect x="-36" y="1" width="72" height="7" rx="3.5" fill="#f2f8fa" stroke="#b9d3db" stroke-width="2"/>' +
        '<path d="M-6 1 v-13 q0 -6 6 -6 h12 v7 h-9 v12z" fill="#9fb4c0"/>' +
        '<rect x="-13" y="-24" width="16" height="6" rx="3" fill="#7f97a5"/>';
      if (e === "avant") s += '<g class="goutte-anim"><path d="M9 -9 q4 6 0 9 q-4 -3 0 -9z" fill="#3aa7ff"/></g><g class="goutte-anim" style="animation-delay:-.55s"><path d="M9 -9 q4 6 0 9 q-4 -3 0 -9z" fill="#3aa7ff"/></g>';
      else s += etincelle(12, -6) + coche(26, -38);
      return s;
    },
    douche(e) {
      let s = '<path d="M-26 -38 h22 q8 0 8 8 v4" fill="none" stroke="#7f97a5" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M-14 -26 h36 l-6 10 h-24z" fill="#9fb4c0"/>' + '<rect x="-30" y="-44" width="6" height="74" rx="3" fill="#b9c9d2"/>';
      if (e === "avant") s += '<g fill="#3aa7ff" opacity=".85">' + [-8, -2, 4, 10, 16].map((x, i) => '<rect class="goutte-anim" style="animation-delay:-' + (i * .2) + 's" x="' + x + '" y="-14" width="3" height="16" rx="1.5"/>').join("") + '</g>';
      else s += '<g fill="#bfe6ff" stroke="#3aa7ff" stroke-width="1">' + [-6, 0, 6, 12].map((x, i) => '<circle class="goutte-anim" style="animation-delay:-' + (i * .27) + 's" cx="' + x + '" cy="-10" r="3"/>').join("") + '</g>' + etincelle(18, 2) + coche(26, -38);
      return s;
    },
    serviette(e, c) {
      c = c || "#ff8a5c";
      if (e === "avant") return '<path d="M-30 18 q-6 -14 8 -18 q6 -14 22 -8 q16 -8 24 6 q12 4 4 20 q-30 8 -58 0z" fill="' + c + '"/>' +
        '<path d="M-22 6 q10 6 22 0 q10 -6 22 2" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/><path d="M-26 14 q16 4 50 0" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="2"/>';
      return '<rect x="-26" y="-40" width="4" height="62" rx="2" fill="#a07a52"/><rect x="22" y="-40" width="4" height="62" rx="2" fill="#a07a52"/>' +
        '<rect x="-28" y="-40" width="56" height="5" rx="2.5" fill="#8a6440"/><rect x="-30" y="20" width="16" height="4" rx="2" fill="#8a6440"/><rect x="14" y="20" width="16" height="4" rx="2" fill="#8a6440"/>' +
        '<path d="M-20 -38 h40 v38 q-20 6 -40 0z" fill="' + c + '"/><path d="M-20 -14 h40 M-20 -8 h40" stroke="#fff" stroke-width="3" opacity=".7"/>' + etincelle(-14, -26) + coche(26, -44);
    },
    lampe(e) {
      // états : « avant » (allumée), « eteinte » (éteinte, sans coche), « apres » (éteinte + lune + coche)
      let s = '';
      if (e === "avant") s += '<circle class="halo-lampe" cx="0" cy="-18" r="34" fill="#ffe27a" opacity=".45"/>';
      s += '<path d="M-16 -34 h32 l8 22 h-48z" fill="' + (e === "avant" ? "#ffe9a8" : "#d9d2c3") + '" stroke="#c9b98f" stroke-width="2"/>' +
        '<rect x="-2" y="-12" width="4" height="22" fill="#8a7a63"/><ellipse cx="0" cy="12" rx="14" ry="4" fill="#8a7a63"/>';
      if (e === "apres") s += '<path d="M14 -40 a9 9 0 1 0 8 12 a7 7 0 1 1 -8 -12z" fill="#9fb4ff"/>' + coche(24, -2);
      if (e === "eteinte") s += '<rect x="14" y="-2" width="12" height="16" rx="3" fill="#e9e1cf" stroke="#8a7a63" stroke-width="1.5"/><rect x="17" y="6" width="6" height="5" rx="1.5" fill="#8a7a63"/>';
      return s;
    },
    carafe(e) {
      let s = '<path d="M-14 -36 h18 l-2 8 q14 10 14 30 v12 q0 6 -6 6 h-30 q-6 0 -6 -6 v-12 q0 -20 14 -30z" fill="rgba(220,240,250,.55)" stroke="#9cc7d9" stroke-width="2.5"/>' +
        '<path d="M4 -34 q10 0 10 10" fill="none" stroke="#9cc7d9" stroke-width="2.5"/>' +
        '<path d="M24 0 h16 l-2 20 h-12z" fill="rgba(220,240,250,.55)" stroke="#9cc7d9" stroke-width="2"/>';
      if (e === "apres") s += '<path class="remplit" d="M-22 -4 q12 -4 26 0 q8 2 14 0 v14 q0 6 -6 6 h-30 q-6 0 -6 -6z" fill="#5cc4f2" opacity=".85"/><path class="remplit" d="M25.5 6 h13 l-1.4 13 h-10.2z" fill="#5cc4f2" opacity=".85"/>' +
        '<path d="M-12 -2 v14" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>' + etincelle(-6, -20, "#bfe9ff") + coche(30, -30);
      else s += '<text x="-4" y="12" text-anchor="middle" font-size="16" font-weight="900" fill="#9cc7d9" font-family="system-ui,sans-serif">?</text>';
      return s;
    },
    tri(e) {
      let s = '<rect x="-24" y="-20" width="22" height="40" rx="4" fill="#ffd34d"/><rect x="2" y="-20" width="22" height="40" rx="4" fill="#4fae6b"/>' +
        '<rect x="-26" y="-26" width="26" height="7" rx="3" fill="#e6b52a"/><rect x="0" y="-26" width="26" height="7" rx="3" fill="#3d8f56"/>' +
        '<path d="M-13 -4 l4 7 h-8z M13 -6 a6 6 0 1 1 -0.1 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>';
      if (e === "avant") s += '<g transform="translate(36 16) rotate(15)"><path d="M-10 -6 l6 -4 l8 3 l7 -2 l-1 9 l-8 5 l-9 -2z" fill="#ff5f7e"/><path d="M-6 -2 l10 2" stroke="#fff" stroke-width="2"/></g>';
      else s += etincelle(-13, -30) + coche(30, -26);
      return s;
    },
    clim(e) {
      let s = '<rect x="-34" y="-34" width="68" height="22" rx="6" fill="#f4f7f9" stroke="#c4d0d8" stroke-width="2"/><rect x="-28" y="-18" width="56" height="3" rx="1.5" fill="#c4d0d8"/>' +
        '<circle cx="24" cy="-27" r="2.5" fill="' + (e === "avant" ? "#2fbf71" : "#c4d0d8") + '"/>' +
        '<rect x="-30" y="0" width="60" height="34" rx="3" fill="#bfe3f2" stroke="#8a6440" stroke-width="3"/>';
      if (e === "avant") s += '<path d="M0 0 v34" stroke="#8a6440" stroke-width="3"/><path d="M0 2 l22 -6 v38 l-22 -2z" fill="#d9f0f8" stroke="#8a6440" stroke-width="3"/>' +
        '<g fill="none" stroke="#7cc6ff" stroke-width="2.5" stroke-linecap="round" class="ressac"><path d="M-20 -8 q6 6 0 12"/><path d="M-6 -8 q6 6 0 12"/><path d="M8 -8 q6 6 0 12"/></g>';
      else s += '<path d="M0 0 v34" stroke="#8a6440" stroke-width="3"/>' + etincelle(-14, 16, "#bfe9ff") + coche(30, -38);
      return s;
    },

    /* ---------- déchets du jeu de tri (chambre) ---------- */
    papier() { return '<path d="M-14 -10 l8 -6 l9 4 l8 -5 l6 8 l-3 9 l5 8 l-9 7 l-8 -4 l-9 4 l-6 -9 l3 -7z" fill="#f4f1e8" stroke="#b8b09a" stroke-width="2" stroke-linejoin="round"/><path d="M-8 -4 l6 3 l7 -4 M-6 6 l7 -2 l6 4" fill="none" stroke="#cfc6ad" stroke-width="1.6"/>'; },
    epluchure() { return '<path d="M0 -14 q4 -4 6 0 q-2 8 -1 12 q8 2 12 12 q-8 0 -13 -6 q-2 10 -6 14 q-2 -8 0 -15 q-8 4 -14 2 q6 -10 14 -11 q2 -4 2 -8z" fill="#ffd34d" stroke="#d9a520" stroke-width="2" stroke-linejoin="round"/><circle cx="2" cy="-15" r="2" fill="#7a5a12"/>'; },

    /* ---------- objets de plage ---------- */
    bouteille() { return '<g transform="rotate(-25)"><rect x="-8" y="-18" width="16" height="34" rx="6" fill="#bfe8f6" stroke="#6fb3cc" stroke-width="2"/><rect x="-4" y="-25" width="8" height="8" rx="2" fill="#2a7fd4"/><rect x="-8" y="-4" width="16" height="9" fill="#ff7a59"/></g>'; },
    canette() { return '<g transform="rotate(70)"><rect x="-9" y="-15" width="18" height="30" rx="4" fill="#e8484b"/><rect x="-9" y="-15" width="18" height="5" rx="2" fill="#c9d1d6"/><path d="M-9 0 h18" stroke="#fff" stroke-width="3"/></g>'; },
    sac() { return '<path d="M-14 -6 q14 -10 28 0 l4 20 q-18 8 -36 0z" fill="rgba(245,250,255,.95)" stroke="#9fb7c6" stroke-width="2"/><path d="M-8 -8 q0 -10 6 -10 q6 0 6 10 M2 -8 q0 -10 6 -10 q6 0 6 10" fill="none" stroke="#9fb7c6" stroke-width="2"/>'; },
    emballage() { return '<g transform="rotate(-10)"><path d="M-16 -8 l6 -4 l8 4 l8 -4 l8 4 l2 14 l-8 6 l-8 -4 l-8 4 l-8 -6z" fill="#ff5f9e"/><path d="M-10 0 h20" stroke="#fff" stroke-width="2.5"/><circle cx="0" cy="0" r="3" fill="#ffd166"/></g>'; },
    bouchon() { return '<circle r="8" fill="#2a7fd4"/><circle r="5" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 2"/>'; },
    coquillage() { return '<path d="M0 -14 q16 6 14 18 q-14 6 -28 0 q-2 -12 14 -18z" fill="#ffd9c2" stroke="#e8a582" stroke-width="2"/><path d="M0 -12 v16 M-6 -9 l-4 13 M6 -9 l4 13" stroke="#e8a582" stroke-width="1.6"/>'; },
    bois() { return '<path d="M-24 4 q10 -10 26 -6 q14 2 22 -4 l2 4 q-8 8 -24 8 q-14 0 -24 4z" fill="#b08a63" stroke="#8a6440" stroke-width="1.5"/><circle cx="6" cy="1" r="2" fill="#8a6440"/>'; },
    crabe() { return '<g><ellipse cx="0" cy="0" rx="13" ry="9" fill="#ff7b3d"/><circle cx="-5" cy="-9" r="3" fill="#fff"/><circle cx="5" cy="-9" r="3" fill="#fff"/><circle cx="-5" cy="-9" r="1.5" fill="#222"/><circle cx="5" cy="-9" r="1.5" fill="#222"/><path d="M-12 -2 q-10 -8 -8 -14 M12 -2 q10 -8 8 -14 M-10 5 l-8 6 M10 5 l8 6 M-6 8 l-4 7 M6 8 l4 7" stroke="#ff7b3d" stroke-width="3" fill="none" stroke-linecap="round"/></g>'; },
    chateau() { return '<path d="M-22 14 v-16 h6 v-6 h5 v6 h6 v-12 h10 v12 h6 v-6 h5 v6 h6 v16z" fill="#e8c27e" stroke="#c99b55" stroke-width="2"/><path d="M-3 14 v-8 a3 3 0 0 1 6 0 v8z" fill="#c99b55"/><path d="M0 -20 v-10 l8 3 l-8 3" fill="#ff5f7e" stroke="#8a6440" stroke-width="1.2"/>'; },

    /* ---------- la chambre (fond du jeu « cherche ») ----------
       p = palette { mur, sol, drap, bois, accent } ; vue = SVG 140 × 120 du paysage à la fenêtre */
    chambre(p, vue) {
      let lames = "";
      for (let y = 316; y < 440; y += 22) lames += '<path d="M0 ' + y + ' H360" stroke="rgba(0,0,0,.08)" stroke-width="2"/>';
      for (let i = 0; i < 9; i++) lames += '<path d="M' + (i * 47 + (i % 2) * 20) + ' ' + (316 + (i % 5) * 22) + ' v22" stroke="rgba(0,0,0,.08)" stroke-width="2"/>';
      return '<rect width="360" height="440" fill="' + p.mur + '"/>' +
        '<rect y="300" width="360" height="140" fill="' + p.sol + '"/>' + lames + '<rect y="296" width="360" height="6" fill="rgba(0,0,0,.08)"/>' +
        // fenêtre avec la vue
        '<rect x="20" y="34" width="156" height="136" rx="6" fill="' + p.bois + '"/>' +
        '<svg x="28" y="42" width="140" height="120" viewBox="0 0 140 120">' + vue + '</svg>' +
        '<path d="M98 42 v120" stroke="' + p.bois + '" stroke-width="5"/><path d="M28 102 h140" stroke="' + p.bois + '" stroke-width="3" opacity=".5"/>' +
        '<path d="M14 30 q30 60 6 150 M182 30 q-30 60 -6 150" fill="' + p.accent + '" opacity=".85"/>' +
        '<rect x="10" y="24" width="176" height="8" rx="4" fill="' + p.bois + '"/>' +
        // coin salle d'eau
        '<rect x="216" y="20" width="136" height="170" rx="8" fill="#e8f4f6"/>' +
        '<g opacity=".5" stroke="#c9dfe4" stroke-width="2">' + [0, 1, 2, 3, 4, 5].map(i => '<path d="M216 ' + (44 + i * 26) + ' h136"/>').join("") + [0, 1, 2, 3].map(i => '<path d="M' + (250 + i * 34) + ' 20 v170"/>').join("") + '</g>' +
        '<rect x="212" y="16" width="144" height="178" rx="10" fill="none" stroke="' + p.bois + '" stroke-width="6"/>' +
        // bureau
        '<rect x="22" y="232" width="128" height="10" rx="4" fill="' + p.bois + '"/><rect x="30" y="242" width="8" height="58" fill="' + p.bois + '"/><rect x="134" y="242" width="8" height="58" fill="' + p.bois + '"/>' +
        // lit
        '<rect x="196" y="214" width="160" height="40" rx="12" fill="' + p.bois + '"/>' +
        '<rect x="200" y="246" width="156" height="66" rx="12" fill="#fff"/>' +
        '<ellipse cx="236" cy="252" rx="28" ry="12" fill="#f4f4f4" stroke="#e2e2e2"/><ellipse cx="306" cy="252" rx="28" ry="12" fill="#f4f4f4" stroke="#e2e2e2"/>' +
        '<path d="M200 270 h156 v42 q-78 10 -156 0z" fill="' + p.drap + '"/><path d="M200 278 h156" stroke="#fff" stroke-width="3" opacity=".6"/>' +
        // table de chevet
        '<rect x="160" y="250" width="34" height="50" rx="4" fill="' + p.bois + '"/><rect x="164" y="262" width="26" height="3" fill="rgba(0,0,0,.15)"/>' +
        // tapis
        '<ellipse cx="120" cy="380" rx="90" ry="22" fill="' + p.accent + '" opacity=".35"/>';
    }
  };
  window.Obj = O;
})();
