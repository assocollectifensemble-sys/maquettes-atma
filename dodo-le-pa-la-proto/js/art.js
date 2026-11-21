/* Dodo lé pa là — illustrations SVG dessinées à la main (encre sépia, aplats doux). */
(function () {
  const INK = '#3b2a1a';
  const A = {};
  A.INK = INK;
  A.svg = (vb, inner, cls = '', extra = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="${cls}" ${extra}>${inner}</svg>`;

  // ---------- le dodo ----------
  A.dodo = (cls = 'dodo') => A.svg('0 0 200 190', `
    <defs><radialGradient id="dbody" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#b9a48a"/><stop offset="1" stop-color="#7d6a55"/></radialGradient></defs>
    <ellipse cx="104" cy="178" rx="62" ry="7" fill="#000" opacity=".25"/>
    <path d="M86 150 l-6 24 m6-24 l2 24 m22-22 l-3 24 m3-24 l6 22" stroke="#c99a45" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M150 112 c18-8 30-2 34 8 c-10-2-16 2-20 8 c8 0 12 6 12 10 c-10-6-20-4-26 0z" fill="#efe4cf" stroke="${INK}" stroke-width="2"/>
    <path d="M58 92 c-6 40 18 66 56 66 c34 0 50-22 46-50 c-4-26-26-40-52-40 c-22 0-46 6-50 24z" fill="url(#dbody)" stroke="${INK}" stroke-width="2.6"/>
    <path d="M96 100 c14 4 30 14 34 30 c-14-4-26-6-38-2 c6-8 6-18 4-28z" fill="#9c8a72" stroke="${INK}" stroke-width="2"/>
    <path d="M104 108 c8 6 14 12 16 20 M100 116 c6 4 10 10 12 16" stroke="${INK}" stroke-width="1.3" fill="none" opacity=".7"/>
    <path d="M62 94 c-4-24 -2-46 14-60 c14-12 36-10 42 6 c4 12-4 22-14 28 c-8 6-10 16-8 26z" fill="#a8957c" stroke="${INK}" stroke-width="2.6"/>
    <path d="M76 40 c-14-6-36 0-44 14 c-6 10-2 22 6 28 c6 4 14 4 18 0 c-6-4-8-10-4-16 c6-8 18-10 28-8z" fill="#d6b067" stroke="${INK}" stroke-width="2.4"/>
    <path d="M36 60 c-8 4-10 14-4 20 c4 4 10 4 14 2" fill="#c38b3a" stroke="${INK}" stroke-width="2.2"/>
    <path d="M44 56 c8-4 20-4 28-2" stroke="${INK}" stroke-width="1.6" fill="none"/>
    <circle cx="86" cy="40" r="7" fill="#fff8e8" stroke="${INK}" stroke-width="2"/><circle cx="87.5" cy="40.5" r="3.4" fill="${INK}"/><circle cx="88.6" cy="39" r="1" fill="#fff"/>
    <path d="M90 22 c6-6 14-6 18-2 M96 20 c2-6 8-8 12-6" stroke="${INK}" stroke-width="1.6" fill="none"/>`, cls);

  A.egg = (cls = '') => A.svg('0 0 120 150', `
    <defs><radialGradient id="egg" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#efe0c2"/><stop offset="1" stop-color="#c8ad80"/></radialGradient></defs>
    <ellipse cx="60" cy="140" rx="40" ry="6" fill="#000" opacity=".25"/>
    <path d="M60 8 C28 8 12 62 12 92 c0 30 22 46 48 46 s48-16 48-46 C108 62 92 8 60 8z" fill="url(#egg)" stroke="${INK}" stroke-width="2.4"/>
    <g fill="#a88a5a" opacity=".55"><circle cx="44" cy="60" r="3"/><circle cx="70" cy="44" r="2.2"/><circle cx="80" cy="84" r="3.4"/><circle cx="50" cy="104" r="2.4"/><circle cx="74" cy="114" r="1.8"/></g>`, cls);

  // ---------- malles ----------
  const EMB = {
    ROUGE: `<path d="M-14 4 c4-12 18-16 26-8 l10-2 -6 6 c2 10-8 16-18 14 l-8 8 2-10 c-6-2-8-6-6-8z" fill="#f6e9cf" stroke="${INK}" stroke-width="1.6"/><circle cx="6" cy="-2" r="1.6" fill="${INK}"/>`,
    VERT: `<path d="M-14 -10 l28 20 M-12 -14 l-4 4 6 6 4-4z M10 6 l8 8" stroke="#f6e9cf" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="2" cy="2" r="10" fill="none" stroke="#f6e9cf" stroke-width="2"/>`,
    JAUNE: `<path d="M-5 -16 h10 v8 c8 3 12 9 12 15 c0 8-7 12-17 12 s-17-4-17-12 c0-6 4-12 12-15z" fill="#f6e9cf" stroke="${INK}" stroke-width="1.6"/><path d="M-12 6 c6 3 18 3 24 0 c0 6-6 9-12 9 s-12-3-12-9z" fill="#d9a52b"/>`,
    BLEU: `<circle r="14" fill="#f6e9cf" stroke="${INK}" stroke-width="1.6"/><path d="M0 -12 l4 12 -4 12 -4 -12z" fill="#b23a2e" stroke="${INK}" stroke-width="1"/><path d="M0 0 l4 0 -4 12 -4 -12z" fill="#2f5d95"/><circle r="2" fill="${INK}"/>`
  };
  A.emblem = (team) => EMB[team];
  A.malle = (team, color, open = false) => A.svg('0 0 220 150', `
    <defs><linearGradient id="wd${team}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a33"/><stop offset="1" stop-color="#5a371d"/></linearGradient></defs>
    <ellipse cx="110" cy="142" rx="96" ry="7" fill="#000" opacity=".35"/>
    ${open ? `<path d="M22 58 L36 14 h148 l14 44z" fill="#4a2c16" stroke="#21130a" stroke-width="2"/><path d="M40 52 l8-26 h124 l8 26z" fill="#2a180b"/>` :
      `<path d="M20 62 c0-34 20-46 90-46 s90 12 90 46z" fill="url(#wd${team})" stroke="#21130a" stroke-width="2.5"/>
       <path d="M30 40 c40-8 120-8 160 0" stroke="#3e2410" stroke-width="1.5" fill="none" opacity=".6"/>`}
    <rect x="18" y="60" width="184" height="76" rx="6" fill="url(#wd${team})" stroke="#21130a" stroke-width="2.5"/>
    <path d="M18 84 h184 M18 112 h184" stroke="#3e2410" stroke-width="1.2" opacity=".55"/>
    <path d="M26 66 c20 3 50 2 70 6 M120 96 c30-3 50 2 76 1 M30 124 c40-3 60 3 90-1" stroke="#a06a3c" stroke-width="1" fill="none" opacity=".45"/>
    <g fill="#b08a3e" stroke="#5b4214" stroke-width="1.5"><rect x="18" y="58" width="18" height="80" rx="3"/><rect x="184" y="58" width="18" height="80" rx="3"/>
      ${open ? '' : '<path d="M20 62 c0-18 6-30 16-38 v36z"/><path d="M200 62 c0-18-6-30-16-38 v36z"/>'}</g>
    <g fill="#e2c47a"><circle cx="27" cy="72" r="2"/><circle cx="27" cy="124" r="2"/><circle cx="193" cy="72" r="2"/><circle cx="193" cy="124" r="2"/></g>
    <g transform="translate(110 96)"><circle r="24" fill="${color}" stroke="#21130a" stroke-width="2"/><circle r="20" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>${EMB[team]}</g>
    <rect x="100" y="56" width="20" height="16" rx="3" fill="#c9a04a" stroke="#5b4214" stroke-width="1.5"/><circle cx="110" cy="64" r="2.6" fill="#21130a"/>`);

  // ---------- icônes d'objets (viewBox 64) ----------
  const st = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
  const I = {
    fiole: `<path d="M26 8h12v5h-2v11c9 3 15 10 15 19 0 10-8 15-19 15s-19-5-19-15c0-9 6-16 15-19V13h-2z" fill="#e9f0e6" ${st}/><path d="M15 44c4 2 10 2 17 0s13-2 17 0c0 8-7 12-17 12s-17-4-17-12z" fill="#d9a52b" opacity=".85"/><rect x="26" y="4" width="12" height="6" rx="2" fill="#a8743c" ${st}/>`,
    fiolecoeur: `<path d="M28 6h8v10c10-8 24 0 18 14-3 8-12 16-22 24C22 46 13 38 10 30 4 16 18 8 28 16z" fill="#f2c9c0" ${st}/><rect x="27" y="2" width="10" height="6" rx="2" fill="#a8743c" ${st}/>`,
    alambic: `<circle cx="24" cy="40" r="15" fill="#e9f0e6" ${st}/><path d="M24 25V12h8l22 20v6" fill="none" ${st}/><path d="M50 38h8v16h-8z" fill="#d9c9a0" ${st}/><path d="M12 44c6 3 18 3 24 0" stroke="#d9a52b" stroke-width="4" fill="none"/>`,
    mortier: `<path d="M10 30h44c0 14-10 22-22 22S10 44 10 30z" fill="#cbb48c" ${st}/><path d="M36 30L52 8l5 3-14 21" fill="#a8743c" ${st}/><path d="M18 56h28" ${st}/>`,
    sablier: `<path d="M16 6h32M16 58h32M20 6c0 16 24 18 24 26S20 42 20 58M44 6c0 16-24 18-24 26s24 10 24 26" fill="none" ${st}/><path d="M26 50c2-6 10-6 12 0z" fill="#d9a52b"/><path d="M28 18h8l-4 8z" fill="#d9a52b"/>`,
    dague: `<path d="M32 4l5 30h-10z" fill="#d8dde0" ${st}/><rect x="20" y="34" width="24" height="5" rx="2" fill="#a8743c" ${st}/><rect x="29" y="39" width="6" height="16" fill="#6a3f1f" ${st}/><circle cx="32" cy="58" r="3.5" fill="#b08a3e" ${st}/>`,
    creuset: `<path d="M12 20h40l-6 32H18z" fill="#9c6b48" ${st}/><path d="M32 26l8 10-8 10-8-10z" fill="#d9503a" ${st}/><path d="M8 20h48" ${st}/>`,
    livre: `<path d="M8 14c8-4 16-4 24 2 8-6 16-6 24-2v38c-8-4-16-4-24 2-8-6-16-6-24-2z" fill="#efe2c6" ${st}/><path d="M32 16v38" ${st}/><path d="M14 24h12M14 30h12M38 24h12M38 30h10" stroke="${INK}" stroke-width="1.2" opacity=".6"/>`,
    plume: `<path d="M50 6C30 10 16 26 14 48l4 2C24 34 36 20 50 6z" fill="#efe4cf" ${st}/><path d="M14 48L8 60" ${st}/><path d="M22 36c6-2 12-6 16-12M18 44c6-2 10-4 14-8" stroke="${INK}" stroke-width="1.2" fill="none"/>`,
    cage: `<path d="M14 54V26C14 14 22 8 32 8s18 6 18 18v28z" fill="none" ${st}/><path d="M23 54V12M32 54V8M41 54V12" stroke="${INK}" stroke-width="1.6"/><path d="M10 54h44v5H10z" fill="#a8743c" ${st}/><path d="M18 36h28" stroke="#a8743c" stroke-width="3"/><circle cx="32" cy="5" r="3" fill="none" ${st}/>`,
    nichoir: `<path d="M12 28L32 10l20 18v28H12z" fill="#b98a5a" ${st}/><circle cx="32" cy="36" r="6" fill="#3b2a1a"/><path d="M32 48v6" ${st}/><path d="M8 30L32 8l24 22" fill="none" stroke="#6a3f1f" stroke-width="4"/>`,
    jumelles: `<circle cx="20" cy="40" r="11" fill="#5d6f7a" ${st}/><circle cx="44" cy="40" r="11" fill="#5d6f7a" ${st}/><path d="M14 30l4-16h8l2 16M50 30l-4-16h-8l-2 16" fill="#3e4c55" ${st}/><rect x="28" y="26" width="8" height="10" fill="#3e4c55" ${st}/><circle cx="20" cy="40" r="5" fill="#a9c7d6"/><circle cx="44" cy="40" r="5" fill="#a9c7d6"/>`,
    loupe: `<circle cx="26" cy="26" r="16" fill="#dfeef2" ${st}/><path d="M38 38l16 16" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M20 26h12M26 20v12" stroke="#c0392b" stroke-width="2"/>`,
    oeufs: `<path d="M8 40c4 12 44 12 48 0" fill="#b98a5a" ${st}/><ellipse cx="24" cy="38" rx="7" ry="9" fill="#f3ead8" ${st}/><ellipse cx="38" cy="36" rx="7" ry="9" fill="#e6efe6" ${st}/><path d="M8 40c6-4 42-4 48 0" fill="none" stroke="#6a3f1f" stroke-width="2"/>`,
    walkman: `<rect x="8" y="14" width="48" height="36" rx="4" fill="#7d8d93" ${st}/><rect x="14" y="20" width="36" height="16" rx="2" fill="#2f3a40"/><circle cx="24" cy="28" r="4" fill="#cfd8dc"/><circle cx="40" cy="28" r="4" fill="#cfd8dc"/><path d="M14 42h8M26 42h8M38 42h8" stroke="${INK}" stroke-width="3"/>`,
    piege: `<path d="M8 44h48" ${st}/><path d="M12 44c0-14 8-22 20-22s20 8 20 22" fill="none" ${st}/><path d="M16 40l2-6 3 6 3-7 3 7 3-8 3 8 3-7 3 7 3-6 2 6" fill="none" stroke="${INK}" stroke-width="1.6"/><circle cx="32" cy="48" r="4" fill="#b08a3e" ${st}/>`,
    cartouche: `<rect x="22" y="8" width="20" height="38" rx="3" fill="#c0392b" ${st}/><rect x="20" y="44" width="24" height="12" rx="2" fill="#b08a3e" ${st}/><path d="M22 20h20M22 30h20" stroke="#7a1f16" stroke-width="1.4"/>`,
    couteau: `<path d="M10 40C24 24 40 14 56 10c-6 14-22 26-38 34z" fill="#d8dde0" ${st}/><path d="M18 44L8 54l4 4 10-10z" fill="#6a3f1f" ${st}/>`,
    gibeciere: `<path d="M10 22h44v28c0 4-4 8-8 8H18c-4 0-8-4-8-8z" fill="#8a6a3c" ${st}/><path d="M10 22c4-14 40-14 44 0" fill="none" ${st}/><path d="M10 22h44v12c-14 6-30 6-44 0z" fill="#6f5430" ${st}/><circle cx="32" cy="36" r="3" fill="#b08a3e"/>`,
    lanterne: `<path d="M22 14h20l4 8v26l-4 8H22l-4-8V22z" fill="#f2d48a" ${st}/><path d="M26 8h12v6H26z" fill="#6a3f1f" ${st}/><path d="M32 2v6" ${st}/><path d="M32 30c-4 6-2 10 0 12 2-2 4-6 0-12z" fill="#d9503a"/>`,
    chapeau: `<path d="M6 44c8 6 44 6 52 0-6-4-12-4-12-4V24c0-8-6-12-14-12s-14 4-14 12v16s-6 0-12 4z" fill="#6a5034" ${st}/><path d="M18 36c8 3 20 3 28 0" stroke="#b23a2e" stroke-width="4" fill="none"/>`,
    boussole: `<circle cx="32" cy="32" r="22" fill="#efe2c6" ${st}/><circle cx="32" cy="32" r="17" fill="none" stroke="${INK}" stroke-width="1"/><path d="M32 14l5 18-5 18-5-18z" fill="#b23a2e" ${st}/><path d="M32 32l5 0-5 18-5-18z" fill="#2f5d95"/><text x="32" y="12" font-size="7" text-anchor="middle" fill="${INK}">N</text>`,
    longuevue: `<path d="M6 40l34-20 4 7-34 20z" fill="#b08a3e" ${st}/><path d="M40 20l14-8 4 7-14 8z" fill="#8a6a3c" ${st}/><circle cx="9" cy="44" r="5" fill="#a9c7d6" ${st}/>`,
    compas: `<path d="M32 6v8M32 14L16 58M32 14l16 44" fill="none" ${st}/><circle cx="32" cy="14" r="4" fill="#b08a3e" ${st}/><path d="M22 40h20" ${st}/>`,
    rouleau: `<path d="M12 14h40v36H12z" fill="#efe2c6" ${st}/><ellipse cx="12" cy="32" rx="5" ry="18" fill="#d8c59c" ${st}/><ellipse cx="52" cy="32" rx="5" ry="18" fill="#d8c59c" ${st}/><path d="M20 24h24M20 32h20M20 40h22" stroke="${INK}" stroke-width="1.2" opacity=".6"/>`,
    encrier: `<path d="M16 30h32v22H16z" fill="#2b2f8f" ${st}/><path d="M22 22h20v8H22z" fill="#3b2a1a" ${st}/><path d="M40 22L56 4" ${st}/><path d="M54 6l4-4" stroke="#efe4cf" stroke-width="3"/>`,
    sextant: `<path d="M32 8L10 50h44z" fill="none" ${st}/><path d="M10 50c8 6 36 6 44 0" fill="none" ${st}/><circle cx="32" cy="8" r="4" fill="#b08a3e" ${st}/><path d="M32 8L40 50" stroke="#b23a2e" stroke-width="2"/>`,
    coquillage: `<path d="M32 54C16 52 8 36 12 22 18 10 46 10 52 22c4 14-4 30-20 32z" fill="#f2d7c4" ${st}/><path d="M32 54V16M32 54L18 20M32 54L46 20M32 54L12 30M32 54L52 30" stroke="${INK}" stroke-width="1.2"/>`,
    tabac: `<rect x="12" y="18" width="40" height="30" rx="5" fill="#a8743c" ${st}/><path d="M12 28h40" ${st}/><circle cx="32" cy="38" r="4" fill="#e2c47a" ${st}/>`,
    balle: `<path d="M28 10c4 0 6 6 6 12v26h-12V22c0-6 2-12 6-12z" fill="#b08a3e" ${st}/><rect x="22" y="44" width="12" height="10" fill="#c9a04a" ${st}/>`,
    pierre: `<path d="M14 40l10-24 22 2 8 20-14 14-20-2z" fill="#9aa3a8" ${st}/><path d="M24 16l6 18 16-16M30 34l-6 18M30 34l24 4" stroke="${INK}" stroke-width="1.2" fill="none"/>`
  };
  A.icon = (name, extra = '') => A.svg('0 0 64 64', I[name] || I.livre, '', extra);
  A.iconNames = Object.keys(I);

  // ---------- symboles des 18 coups (viewBox 20) ----------
  const SYM = [
    '<circle cx="10" cy="10" r="6.5"/>',
    '<rect x="4" y="4" width="12" height="12"/>',
    '<path d="M10 3l7.5 13h-15z"/>',
    '<path d="M10 2l7 8-7 8-7-8z"/>',
    '<path d="M10 2.5l2.2 5 5.4.4-4.1 3.5 1.3 5.3-4.8-2.9-4.8 2.9 1.3-5.3-4.1-3.5 5.4-.4z"/>',
    '<path d="M8 3h4v5h5v4h-5v5H8v-5H3V8h5z"/>',
    '<path d="M13 3a7.5 7.5 0 1 0 4 12A6 6 0 0 1 13 3z"/>',
    '<path d="M10 17s-7-4.5-7-9a3.6 3.6 0 0 1 7-1.4A3.6 3.6 0 0 1 17 8c0 4.5-7 9-7 9z"/>',
    '<path d="M10 2c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z"/>',
    '<path d="M10 2.5l6.5 3.75v7.5L10 17.5l-6.5-3.75v-7.5z"/>',
    '<circle cx="10" cy="10" r="6.5" fill="none" stroke-width="3"/>',
    '<rect x="4.5" y="4.5" width="11" height="11" fill="none" stroke-width="3"/>',
    '<path d="M10 4l6.5 11.5h-13z" fill="none" stroke-width="2.6"/>',
    '<path d="M3 10a7 7 0 0 1 14 0z"/>',
    '<path d="M4 4l12 12M16 4L4 16" fill="none" stroke-width="3.4" stroke-linecap="round"/>',
    '<path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" fill="none" stroke-width="1.8"/>',
    '<path d="M3 13c3-8 11-8 14 0" fill="none" stroke-width="3.4" stroke-linecap="round"/><circle cx="10" cy="15" r="2.2"/>',
    '<path d="M10 3v14M3 10h14" fill="none" stroke-width="3.2" stroke-linecap="round"/><circle cx="10" cy="10" r="3"/>'
  ];
  A.SYM_NAMES = ['rond', 'carré', 'triangle', 'losange', 'étoile', 'croix pleine', 'lune', 'cœur', 'goutte', 'hexagone',
    'anneau', 'cadre', 'triangle creux', 'demi-lune', 'croix de Saint-André', 'étoile creuse', 'arc pointé', 'boussole'];
  A.sym = (i, color) => `<svg class="sym" viewBox="0 0 20 20" fill="${color}" stroke="${color}">${SYM[i]}</svg>`;

  // ---------- pion ----------
  A.pionHTML = (n, color, extra = '') => `<span class="pion" style="background:${color}" ${extra}>${n}</span>`;

  // ---------- divers ----------
  A.arrow = (dir, color = INK, size = 40) => {
    const rot = { HAUT: 0, DROITE: 90, BAS: 180, GAUCHE: 270 }[dir];
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}"><g transform="rotate(${rot} 20 20)"><path d="M20 4l12 14h-7v18H15V18H8z" fill="${color}" stroke="${INK}" stroke-width="1.6"/></g></svg>`;
  };
  A.paperNoise = '';
  A.icons = { ui: {
    sac: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 9h14l-1 11H6z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z"/></svg>',
    lamp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/></svg>'
  } };
  window.ART = A;
})();
