/* ============================================================
   ART.JS — Illustrations SVG maison (aucune image externe).
   - Ti-Vent : jeune pétrel de Barau (Pterodroma baraui) à l'envol :
     dessus gris, calotte sombre, front et ventre blancs, bec noir
     crochu à narines en tube (signe des « tubinaires »), longues ailes
     étroites, pattes roses à palmures sombres.
   - Espèces disparues, silhouettes d'après les descriptions et
     reconstitutions citées dans SOURCES.md (à faire valider par
     l'équipe scientifique du Muséum) :
       · Solitaire de La Réunion = IBIS (Threskiornis solitarius) :
         plumage blanc, bouts d'ailes et plumes arrière noirs, bec
         court et presque droit pour un ibis (M36), corps trapu, pattes épaisses.
       · Dodo (Raphus cucullatus, Maurice) : gros pigeon, bec massif
         crochu, petites ailes, touffe de plumes à l'arrière.
       · Solitaire de Rodrigues (Pezophaps solitaria) : grand pigeon
         élancé, long cou, cousin du dodo.
       · Huppe de Bourbon (Fregilupus varius) : passereau élancé,
         huppe rabattue, bec jaune courbé.
       · Tortue de La Réunion (Cylindraspis indica) : tortue terrestre
         à carapace bombée.
   - Scènes : Muséum dans le Jardin de l'État de nuit, vitrine éclairée,
     plan schématique de l'étage, carte des Mascareignes, icônes.
   ============================================================ */
(function () {
  "use strict";

  // ---------- Ti-Vent ----------
  function yeux(expr) {
    switch (expr) {
      case "clin": return '<path d="M99 50.5 q4.5 -4 9 0" stroke="#1a1d21" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
      case "fete": return '<path d="M98.5 52 q5 -6.5 10 0" stroke="#1a1d21" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
      case "surpris": return '<circle cx="103.5" cy="49" r="5.2" fill="#15181c"/><circle cx="105.3" cy="47" r="1.9" fill="#fff"/>';
      case "pense": return '<circle cx="103.5" cy="49" r="4" fill="#15181c"/><circle cx="104.6" cy="46.6" r="1.5" fill="#fff"/>';
      default: return '<circle cx="103.5" cy="49.5" r="4.1" fill="#15181c"/><circle cx="105.1" cy="47.8" r="1.5" fill="#fff"/>';
    }
  }
  function tivent(expr, cls) {
    expr = expr || "content";
    const bec = expr === "surpris" || expr === "fete"
      ? '<path d="M112 56.5 L126 60 C123 64 117 64.5 112 62 Z" fill="#2a3036"/>'
      : '<path d="M112 56 L127 57 C124 60 118 60.5 112 59 Z" fill="#2a3036"/>';
    return '<svg class="tivent expr-' + expr + ' ' + (cls || "") + '" viewBox="0 0 140 120" aria-hidden="true">' +
      '<defs><radialGradient id="tvVentre" cx=".55" cy=".35" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3ddd2"/></radialGradient>' +
      '<linearGradient id="tvDos" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a939c"/><stop offset="1" stop-color="#5d666f"/></linearGradient></defs>' +
      '<ellipse class="tv-ombre" cx="66" cy="113" rx="34" ry="4.5" fill="#000" opacity=".18"/>' +
      '<g class="tv-corps">' +
      '<path class="tv-aile2" d="M70 62 C57 40 35 28 13 30 C29 41 44 56 57 72 Z" fill="#545c65"/>' +
      '<path d="M36 82 L9 91 L15 83 L9 75 L38 73 Z" fill="#59616a"/>' +
      '<g class="tv-pattes"><path d="M68 97 L66 106 M79 97 L80 106" stroke="#e7a2a4" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M60 107 L66 104 L72 107 Z M74 107 L80 104 L86 107 Z" fill="#30353b"/></g>' +
      '<ellipse cx="66" cy="79" rx="35" ry="22" fill="url(#tvVentre)" transform="rotate(-8 66 79)"/>' +
      '<path d="M38 72 C50 56 76 52 92 61 C82 68 64 71 44 82 Z" fill="url(#tvDos)"/>' +
      '<path class="tv-aile" d="M58 67 C75 62 90 69 92 80 C75 85 50 93 14 99 C29 88 44 75 58 67 Z" fill="#636b74" stroke="#4b525a" stroke-width="1.2"/>' +
      '<path d="M62 71 C72 69 82 72 86 78" stroke="#8e979f" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<circle cx="97" cy="52" r="19" fill="url(#tvVentre)"/>' +
      '<path d="M78 52 C79 35 99 28 111 40 C106 41 101 40 96 41.5 C88 43.5 82 47.5 78 52 Z" fill="#454c54"/>' +
      '<path d="M78 52 C76 60 79 66 84 69 C82 62 82 57 85 52 Z" fill="#6c747c" opacity=".85"/>' +
      yeux(expr) +
      (expr === "content" || expr === "fete" ? '<ellipse cx="100" cy="59" rx="4.5" ry="2.6" fill="#f2a6a0" opacity=".55"/>' : "") +
      '<path d="M111 46.5 C118 45 126 47.5 130.5 52 C132.6 54.6 131.6 58 128.6 57.2 C127 55.6 121 54.6 112 55.6 Z" fill="#1f242a"/>' +
      '<path d="M112.5 46.3 C116 44.6 120 44.8 122.6 47 L113.2 49.4 Z" fill="#3d454d"/>' +
      bec +
      (expr === "pense" ? '<g class="tv-pense" fill="#c99a3c"><circle cx="122" cy="26" r="3"/><circle cx="130" cy="18" r="3.8"/><circle cx="138" cy="9" r="4.6"/></g>' : "") +
      '</g></svg>';
  }

  // ---------- Espèces ----------
  const sol = (x1, x2, y) => '<ellipse cx="' + ((x1 + x2) / 2) + '" cy="' + y + '" rx="' + ((x2 - x1) / 2) + '" ry="4" fill="#000" opacity=".16"/>';
  function solitaire(cls) {
    // ibis trapu : corps horizontal, cou fin en S, petite tête, bec fin « comme celui de la bécasse, en plus gros » (Dubois, M36),
    // plumage blanc, bout des ailes et de la queue noirs (M35), pattes épaisses (M36)
    return '<svg class="espece solitaire ' + (cls || "") + '" viewBox="0 0 160 140" aria-hidden="true">' +
      '<defs><radialGradient id="soBl" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ddd5c3"/></radialGradient></defs>' +
      sol(40, 104, 133) +
      '<path d="M64 94 L61 129 M80 94 L84 129" stroke="#45403b" stroke-width="5.6" stroke-linecap="round"/>' +
      '<path d="M51 131 L60 128 L69 131 M77 131 L84 128 L93 131" stroke="#45403b" stroke-width="2.8" stroke-linecap="round" fill="none"/>' +
      '<path d="M34 72 C20 74 11 86 13 101 C19 93 25 91 31 93 C27 99 27 106 31 110 C35 99 40 93 47 90 Z" fill="#1f1c19"/>' +
      '<path d="M28 78 C30 61 54 54 80 55 C104 56 117 65 115 78 C113 92 94 99 68 98 C44 97 26 91 28 78 Z" fill="url(#soBl)"/>' +
      '<path d="M44 66 C64 58 92 60 102 72 C88 82 64 86 42 82 Z" fill="#f4f0e7"/>' +
      '<path d="M50 70 C66 66 84 67 94 72 M48 76 C64 74 80 75 90 78" stroke="#d8cfbb" stroke-width="1.4" fill="none"/>' +
      '<path d="M42 82 C33 82 26 77 23 70 C32 71 39 73 48 76 Z" fill="#1f1c19"/>' +
      '<path d="M101 66 C112 60 103 46 113 35" stroke="url(#soBl)" stroke-width="8.5" stroke-linecap="round" fill="none"/>' +
      '<circle cx="116" cy="30.5" r="8.2" fill="url(#soBl)"/>' +
      '<path d="M121 26.8 C129.5 27.2 136.5 30 142.5 35.6 C143.7 36.8 142.9 38.6 141.2 38.2 C135 35.2 128.5 33.8 121.4 33.8 Z" fill="#5a514a"/>' +
      '<path d="M122 30.2 C129 30.6 135 32.4 140 35.4" stroke="#3a332e" stroke-width=".8" fill="none" opacity=".7"/>' +
      '<circle cx="117.6" cy="28.6" r="1.9" fill="#211c19"/><circle cx="118.1" cy="28.1" r=".6" fill="#fff"/>' +
      '</svg>';
  }
  function dodo(cls) {
    return '<svg class="espece dodo ' + (cls || "") + '" viewBox="0 0 160 140" aria-hidden="true">' +
      '<defs><radialGradient id="doCo" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#a69d8f"/><stop offset="1" stop-color="#6f675c"/></radialGradient></defs>' +
      sol(38, 104, 134) +
      '<path d="M60 108 L57 130 M80 108 L83 130" stroke="#d6ad3e" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M48 132 L57 128 L66 132 M76 132 L84 128 L93 132" stroke="#c99c30" stroke-width="3.4" stroke-linecap="round" fill="none"/>' +
      '<path d="M32 70 C18 58 16 46 24 42 C26 52 31 58 38 64 Z M30 78 C16 74 10 64 15 58 C20 66 27 70 35 72 Z" fill="#ece5d2"/>' +
      '<ellipse cx="68" cy="84" rx="42" ry="33" fill="url(#doCo)"/>' +
      '<path d="M56 72 C68 64 84 70 86 82 C74 88 61 84 56 72 Z" fill="#c2b9a5"/>' +
      '<path d="M94 70 C100 60 104 54 108 50" stroke="url(#doCo)" stroke-width="22" stroke-linecap="round" fill="none"/>' +
      '<circle cx="112" cy="47" r="17" fill="#7a7368"/>' +
      '<ellipse cx="117" cy="44" rx="9" ry="7.5" fill="#d8d0bf"/>' +
      '<path d="M117 37 C138 35 153 44 153 57 C153 64 147.5 66 144.5 62 C142.5 58 136 57.5 127 59.5 C121 60.8 115 57.5 114 53 Z" fill="#cfc58f"/>' +
      '<path d="M144 50 C150 52 153 56 153 59 C152 64 147.5 66 144.5 62 C143.5 58 144.5 54 144 50 Z" fill="#a69c62"/>' +
      '<path d="M118 51 C126 50 136 50 146 54" stroke="#8f875c" stroke-width="1.4" fill="none"/>' +
      '<circle cx="116.5" cy="43.5" r="3.2" fill="#e8d36a"/><circle cx="116.8" cy="43.5" r="1.6" fill="#1d1a16"/>' +
      '</svg>';
  }
  function rodrigues(cls) {
    return '<svg class="espece rodrigues ' + (cls || "") + '" viewBox="0 0 160 140" aria-hidden="true">' +
      sol(46, 102, 134) +
      '<path d="M66 104 L62 131 M80 104 L84 131" stroke="#8a7a68" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M54 132 L62 129 L70 132 M78 132 L85 129 L92 132" stroke="#7a6b5a" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="72" cy="86" rx="32" ry="24" fill="#a59682"/>' +
      '<path d="M44 80 C38 74 36 68 40 64 C44 70 48 74 52 76 Z" fill="#8c7d6a"/>' +
      '<path d="M60 76 C70 70 82 74 84 84 C74 88 64 86 60 76 Z" fill="#8f806c"/><circle cx="62" cy="78" r="4" fill="#6f6252"/>' +
      '<path d="M92 76 C98 60 102 44 106 32" stroke="#a59682" stroke-width="13" stroke-linecap="round" fill="none"/>' +
      '<circle cx="109" cy="28" r="10" fill="#9a8b77"/>' +
      '<path d="M116 24 C126 24 131 29 131 33 C131 36 128 37 126.5 35 C124 33 120 33.5 116 34 Z" fill="#d9cdb3"/>' +
      '<circle cx="110.5" cy="25.5" r="2.1" fill="#1e1a16"/>' +
      '</svg>';
  }
  function huppe(cls) {
    return '<svg class="espece huppe ' + (cls || "") + '" viewBox="0 0 160 140" aria-hidden="true">' +
      '<path d="M8 118 C50 112 96 114 152 106" stroke="#6b4e33" stroke-width="7" stroke-linecap="round" fill="none"/>' +
      '<path d="M120 108 C126 98 134 94 142 94" stroke="#6b4e33" stroke-width="4" stroke-linecap="round" fill="none"/>' +
      '<path d="M48 90 L14 112 L20 117 L56 98 Z" fill="#8a7e70"/>' +
      '<path d="M74 98 L71 114 M84 98 L87 113" stroke="#d9b648" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse cx="76" cy="82" rx="32" ry="18" fill="#f1ede5" transform="rotate(-18 76 82)"/>' +
      '<path d="M48 88 C56 66 82 58 100 62 C90 72 72 82 52 94 Z" fill="#9b8f80"/>' +
      '<path d="M60 80 C72 70 88 68 96 70" stroke="#b6ab9c" stroke-width="2" fill="none"/>' +
      '<circle cx="104" cy="58" r="12.5" fill="#e3ddd2"/>' +
      '<path d="M96 50 C86 38 74 34 62 36 C72 41 80 46 90 54 Z" fill="#c9c1b4"/>' +
      '<path d="M100 47 C92 34 80 28 68 28 C78 34 86 40 94 50 Z" fill="#ede8df"/>' +
      '<path d="M104 46 C100 33 92 25 80 22 C88 30 94 38 98 48 Z" fill="#d4ccbf"/>' +
      '<path d="M68 28 L64 27 M62 36 L58 36 M80 22 L76 20" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M115 56 C125 58 133 64 137 73 C131 70 124 65 114 61 Z" fill="#e2c24f"/>' +
      '<circle cx="108.5" cy="56" r="2.5" fill="#1e1a16"/>' +
      '</svg>';
  }
  function tortue(cls) {
    return '<svg class="espece tortue ' + (cls || "") + '" viewBox="0 0 160 140" aria-hidden="true">' +
      sol(26, 132, 128) +
      '<path d="M44 104 L40 126 M64 108 L64 128 M100 108 L102 128 M118 102 L124 124" stroke="#6b6152" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M120 80 C132 62 140 50 146 46" stroke="#7d7262" stroke-width="12" stroke-linecap="round" fill="none"/>' +
      '<ellipse cx="149" cy="44" rx="10" ry="7.5" fill="#7d7262"/><circle cx="152" cy="42" r="1.8" fill="#1e1a16"/>' +
      '<path d="M22 102 C22 50 52 30 82 30 C112 30 134 54 134 102 Z" fill="#5f5546"/>' +
      '<path d="M22 102 C22 50 52 30 82 30 C112 30 134 54 134 102" fill="none" stroke="#3f382e" stroke-width="2.5"/>' +
      '<path d="M66 40 L98 40 L106 60 L92 76 L70 76 L58 60 Z M58 60 L36 62 M106 60 L126 64 M70 76 L58 100 M92 76 L102 100 M66 40 L58 33 M98 40 L106 34" fill="#776a58" stroke="#3f382e" stroke-width="2"/>' +
      '<path d="M22 100 H134" stroke="#3f382e" stroke-width="4"/>' +
      '</svg>';
  }
  // Le « dodo blanc » des tableaux du XVIIe siècle : UNIQUEMENT dans un cadre de tableau, étiqueté « légende ».
  function dodoBlanc(cls) {
    return '<svg class="espece dodoblanc ' + (cls || "") + '" viewBox="0 0 160 140" aria-hidden="true">' +
      '<path d="M60 108 L57 130 M80 108 L83 130" stroke="#d9b54a" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M32 70 C18 58 16 46 24 42 C26 52 31 58 38 64 Z" fill="#f6efd9"/>' +
      '<ellipse cx="68" cy="84" rx="44" ry="35" fill="#f3eee2"/>' +
      '<path d="M56 72 C68 64 84 70 86 82 C74 88 61 84 56 72 Z" fill="#e6dcc2"/>' +
      '<path d="M94 70 C100 60 104 54 108 50" stroke="#f3eee2" stroke-width="22" stroke-linecap="round" fill="none"/>' +
      '<circle cx="112" cy="47" r="17" fill="#efe8d8"/>' +
      '<path d="M117 37 C138 35 153 44 153 57 C153 64 147.5 66 144.5 62 C142.5 58 136 57.5 127 59.5 C121 60.8 115 57.5 114 53 Z" fill="#e5c25a"/>' +
      '<circle cx="116.5" cy="43.5" r="2.6" fill="#1d1a16"/>' +
      '</svg>';
  }
  const ESPECES = { solitaire, dodo, rodrigues, huppe, tortue };
  // imbrique un dessin dans une scène : taille explicite (sinon le SVG imbriqué prend 100 % de la scène)
  const emb = (svg, w, h) => svg.replace("<svg ", '<svg width="' + w + '" height="' + h + '" ');

  // ---------- Scène d'accueil : le Muséum dans le Jardin de l'État, une nuit d'envol ----------
  function etoiles(n, w, h, graine) {
    let s = "", x = graine || 7;
    const r = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
    for (let i = 0; i < n; i++) s += '<circle class="etoile" cx="' + (r() * w).toFixed(1) + '" cy="' + (r() * h).toFixed(1) + '" r="' + (.5 + r() * 1.3).toFixed(2) + '" style="animation-delay:' + (r() * 4).toFixed(2) + 's"/>';
    return s;
  }
  function facade(x, y, l) { // façade néo-classique stylisée (illustration libre, à comparer avec le bâtiment réel)
    const h = l * .42, col = 6, pas = l * .62 / (col - 1), x0 = x + l * .19;
    let c = "";
    for (let i = 0; i < col; i++) c += '<rect x="' + (x0 + i * pas - 3.4) + '" y="' + (y - h * .62) + '" width="6.8" height="' + (h * .62) + '" fill="#efe3c7"/>';
    let f = "";
    for (let i = 0; i < 5; i++) f += '<rect class="fenetre" x="' + (x0 + i * pas + pas * .22) + '" y="' + (y - h * .5) + '" width="' + pas * .56 + '" height="' + h * .34 + '" rx="' + pas * .28 + '" style="animation-delay:' + i * .7 + 's"/>';
    return '<g class="facade">' +
      '<rect x="' + x + '" y="' + (y - h * .7) + '" width="' + l + '" height="' + h * .7 + '" fill="#d9c9a5"/>' +
      '<rect x="' + x + '" y="' + (y - h * .7) + '" width="' + l + '" height="' + h * .7 + '" fill="url(#murOmbre)"/>' + f + c +
      '<rect x="' + (x + l * .14) + '" y="' + (y - h * .7) + '" width="' + l * .72 + '" height="5" fill="#f4ead2"/>' +
      '<path d="M' + (x + l * .12) + ' ' + (y - h * .7) + ' L' + (x + l / 2) + ' ' + (y - h * 1.02) + ' L' + (x + l * .88) + ' ' + (y - h * .7) + ' Z" fill="#e8dbbb" stroke="#f6eed9" stroke-width="2"/>' +
      '<circle cx="' + (x + l / 2) + '" cy="' + (y - h * .8) + '" r="' + l * .03 + '" fill="#b99a5c"/>' +
      '<rect x="' + (x - 4) + '" y="' + (y - 4) + '" width="' + (l + 8) + '" height="6" fill="#c7b38a"/></g>';
  }
  function palmier(x, y, h, s) {
    s = s || 1;
    return '<g class="palmier" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0 C2 -' + h * .5 + ' -2 -' + h * .8 + ' 3 -' + h + '" stroke="#0d1914" stroke-width="4" fill="none"/>' +
      '<g transform="translate(3 -' + h + ')" fill="#0d1914"><path d="M0 0 C-14 -10 -30 -6 -38 4 C-26 -2 -14 -2 0 2Z"/><path d="M0 0 C12 -12 30 -10 38 0 C26 -4 12 -2 0 2Z"/><path d="M0 0 C-6 -16 -2 -28 6 -32 C2 -20 4 -10 2 0Z"/><path d="M0 0 C-18 2 -28 14 -30 24 C-20 12 -10 6 0 2Z"/><path d="M0 0 C16 2 28 12 32 22 C20 12 10 6 0 2Z"/></g></g>';
  }
  function accueil() {
    return '<svg class="scene-accueil" viewBox="0 0 400 250" role="img" aria-label="La nuit, le Muséum dans le Jardin de l\'État ; Ti-Vent, jeune pétrel, vole des montagnes vers la mer.">' +
      '<defs><linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1424"/><stop offset=".65" stop-color="#1c2f45"/><stop offset="1" stop-color="#3a4a52"/></linearGradient>' +
      '<linearGradient id="murOmbre" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>' +
      '<radialGradient id="halo" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="400" height="250" fill="url(#ciel)"/>' +
      '<g class="etoiles" fill="#fff">' + etoiles(70, 400, 140, 11) + '</g>' +
      '<path d="M0 150 L40 118 L70 132 L120 76 L150 96 L176 70 L210 104 L250 94 L300 126 L340 112 L400 140 V250 H0Z" fill="#17263a"/>' +
      '<text x="176" y="62" class="sc-lbl" text-anchor="middle">Piton des Neiges</text>' +
      '<path d="M0 170 L60 150 L120 160 L190 140 L260 156 L330 146 L400 158 V250 H0Z" fill="#1d2f3a"/>' +
      '<path class="mer" d="M300 196 Q320 192 340 196 T380 196 T420 196 V250 H300Z" fill="#20435a"/>' +
      '<path class="vague" d="M300 204 Q320 200 340 204 T380 204 T420 204" stroke="#6fa3c0" stroke-width="1.5" fill="none" opacity=".6"/>' +
      '<text x="352" y="228" class="sc-lbl" text-anchor="middle">l\'océan</text>' +
      '<ellipse cx="150" cy="186" rx="120" ry="40" fill="url(#halo)" class="halo"/>' +
      facade(70, 214, 160) +
      palmier(42, 222, 70, 1) + palmier(262, 222, 82, 1.05) + palmier(292, 226, 56, .8) +
      '<rect x="0" y="214" width="400" height="36" fill="#0e1a15"/>' +
      '<path d="M120 76 C170 40 250 70 300 120 S 350 180 360 196" class="trajet" stroke="#ffe3a0" stroke-width="1.6" stroke-dasharray="3 6" fill="none" opacity=".75"/>' +
      '<g class="vol"><g transform="translate(236 70) rotate(12)">' + emb(tivent("content", "en-vol"), 62, 53) + '</g></g>' +
      '</svg>';
  }

  // ---------- « Le projet » : une vitrine de muséum éclairée ----------
  function vitrine() {
    const socle = (x, w) => '<rect x="' + x + '" y="186" width="' + w + '" height="22" rx="2" fill="#3a2d20"/><rect x="' + x + '" y="186" width="' + w + '" height="4" fill="#5a4630"/>';
    const cartel = (x, t) => '<g><rect x="' + (x - 44) + '" y="192" width="88" height="11" rx="1.5" fill="#f2e8cf"/><text x="' + x + '" y="200" text-anchor="middle" class="cartel">' + t + '</text></g>';
    return '<svg class="vitrine-art" viewBox="0 0 360 240" role="img" aria-label="Une vitrine éclairée : le Solitaire de La Réunion (un ibis), le dodo de Maurice et la Huppe de Bourbon.">' +
      '<defs><linearGradient id="vFond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4eedd"/><stop offset="1" stop-color="#b7cdb0"/></linearGradient>' +
      '<radialGradient id="vLum" cx=".5" cy="0" r="1"><stop offset="0" stop-color="#fff3cf" stop-opacity=".55"/><stop offset=".6" stop-color="#fff3cf" stop-opacity=".08"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="vVerre" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".1"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<rect x="10" y="8" width="340" height="216" rx="6" fill="#8a6a42"/>' +
      '<rect x="20" y="18" width="320" height="196" fill="url(#vFond)"/>' +
      '<rect class="v-lum" x="20" y="18" width="320" height="196" fill="url(#vLum)"/>' +
      '<g class="v-especes">' +
      '<g transform="translate(22 82) scale(.7)">' + emb(huppe(""), 160, 140) + '</g>' +
      '<g transform="translate(116 64) scale(.84)">' + emb(solitaire(""), 160, 140) + '</g>' +
      '<g transform="translate(222 72) scale(.82)">' + emb(dodo(""), 160, 140) + '</g></g>' +
      socle(30, 100) + socle(130, 100) + socle(230, 100) +
      cartel(80, "Huppe · La Réunion") + cartel(180, "Solitaire · La Réunion") + cartel(280, "Dodo · Maurice") +
      '<rect x="20" y="18" width="320" height="196" fill="url(#vVerre)" class="v-verre"/>' +
      '<rect x="10" y="208" width="340" height="16" fill="#76582f"/><rect x="10" y="8" width="340" height="10" fill="#76582f"/>' +
      '</svg>';
  }

  // ---------- Plan schématique de l'étage (À VALIDER avec le Muséum : aucun plan public) ----------
  // Ordre proposé : 1-2-3 salle Lacroix · 4 mezzanine · 5 salle Lantz · jardin
  const POS = { 1: [232, 66], 2: [262, 104], 3: [228, 132], 4: [151, 68], 5: [70, 98], jardin: [150, 168] };
  function plan(de, vers) {
    const p = k => POS[k], pin = (k, etat) => '<g class="pin ' + etat + '" transform="translate(' + p(k)[0] + ' ' + p(k)[1] + ')"><circle r="11"/><text y="4" text-anchor="middle">' + (k === "jardin" ? "★" : k) + '</text></g>';
    let pins = ""; Object.keys(POS).forEach(k => { pins += pin(k, String(k) === String(vers) ? "cible" : String(k) === String(de) ? "ici" : ""); });
    const a = p(de), b = p(vers);
    return '<svg class="plan" viewBox="0 0 300 190" role="img" aria-label="Plan schématique de l\'étage, à valider avec l\'équipe du Muséum">' +
      '<rect x="4" y="4" width="292" height="182" rx="10" fill="#f3e9d2" stroke="#b79c6c" stroke-width="1.5"/>' +
      '<g class="salles"><rect x="18" y="28" width="96" height="112" rx="5"/><rect x="122" y="28" width="58" height="56" rx="5"/><rect x="188" y="28" width="98" height="126" rx="5"/></g>' +
      '<g class="noms"><text x="66" y="44" text-anchor="middle">Salle Lantz</text><text x="151" y="44" text-anchor="middle">Mezzanine</text><text x="237" y="44" text-anchor="middle">Salle Lacroix</text></g>' +
      '<path d="M128 104 h16 v8 h8 v8 h8 v8" stroke="#8a6f45" stroke-width="2" fill="none"/><text x="128" y="98" class="petit">escalier</text>' +
      '<path d="M18 168 h270" stroke="#7da36a" stroke-width="6" stroke-linecap="round" opacity=".45"/><text x="176" y="183" class="petit">Jardin de l\'État</text>' +
      (a && b ? '<path class="chemin" d="M' + a[0] + ' ' + a[1] + ' Q ' + ((a[0] + b[0]) / 2 + 20) + ' ' + ((a[1] + b[1]) / 2) + ' ' + b[0] + ' ' + b[1] + '"/>' : "") +
      pins + '<text x="150" y="20" text-anchor="middle" class="petit avalider">plan schématique · à valider avec le Muséum</text></svg>';
  }

  // ---------- Carte des Mascareignes (simplifiée : îles agrandies, distances raccourcies) ----------
  const ILES = {
    reunion: { nom: "La Réunion", cx: 112, cy: 196, d: "M78 186 C80 166 102 156 122 160 C142 164 152 180 148 200 C144 220 124 232 104 228 C86 224 76 206 78 186 Z" },
    maurice: { nom: "Maurice", cx: 222, cy: 146, d: "M214 116 C226 112 238 122 240 138 C242 156 236 174 222 176 C208 178 202 162 204 146 C205 132 204 120 214 116 Z" },
    rodrigues: { nom: "Rodrigues", cx: 340, cy: 120, d: "M314 120 C318 112 334 110 350 112 C362 114 368 120 362 126 C352 132 330 132 318 128 C313 126 312 123 314 120 Z" }
  };
  function carte() {
    let iles = "";
    Object.keys(ILES).forEach(k => {
      const I = ILES[k];
      iles += '<g class="ile" data-ile="' + k + '"><path class="ile-halo" d="' + I.d + '"/><path class="ile-terre" d="' + I.d + '"/>' +
        '<text x="' + I.cx + '" y="' + (k === "rodrigues" ? I.cy + 30 : I.cy + (k === "reunion" ? 52 : 50)) + '" text-anchor="middle" class="ile-nom">' + I.nom + '</text></g>';
    });
    let vagues = "";
    for (let y = 30; y < 290; y += 26) vagues += '<path d="M0 ' + y + ' q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" />';
    return '<svg class="carte" viewBox="0 0 400 300" role="img" aria-label="Carte simplifiée des Mascareignes : La Réunion, Maurice et Rodrigues">' +
      '<defs><radialGradient id="mer" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#e9dcbc"/><stop offset="1" stop-color="#d6c39a"/></radialGradient></defs>' +
      '<rect width="400" height="300" rx="10" fill="url(#mer)"/>' +
      '<g class="vagues">' + vagues + '</g>' +
      '<g class="rose" transform="translate(52 52)"><circle r="20" fill="none" stroke="#8a6f45" stroke-width="1"/><path d="M0 -24 L5 0 L0 24 L-5 0Z" fill="#8a6f45"/><path d="M-24 0 L0 4 L24 0 L0 -4Z" fill="#b79c6c"/><text y="-28" text-anchor="middle">N</text></g>' +
      '<text x="200" y="22" text-anchor="middle" class="carte-titre">Les Mascareignes</text>' +
      iles +
      '<path d="M150 188 L201 160" class="distance"/><text x="154" y="164" class="petit">≈ 170 km</text>' +
      '<text x="200" y="290" text-anchor="middle" class="petit">carte simplifiée : îles agrandies, distances raccourcies</text></svg>';
  }

  // ---------- Icônes ----------
  const ICO = {
    plume: on => '<svg class="ico-plume ' + (on ? "on" : "") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3 C10 4 5 10 5 19 L7 17 C9 11 13 7 19 3 Z M5 19 L3 21" fill="' + (on ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/><path d="M8 13 L12 13 M10 10 L14 10" stroke="' + (on ? "var(--fond-plume, #1b2a24)" : "currentColor") + '" stroke-width="1.2" stroke-linecap="round"/></svg>',
    cadenas: '<svg class="ico-cadenas" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10.5" rx="3" fill="currentColor"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/><circle cx="12" cy="15.3" r="1.6" fill="#f5ecd7"/></svg>',
    loupe: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M14.5 14.5 L20 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    pin: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C12 22 5 14 5 9.5 a7 7 0 0 1 14 0 C19 14 12 22 12 22Z" fill="currentColor"/><circle cx="12" cy="9.5" r="2.6" fill="#f5ecd7"/></svg>',
    carnet: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 3 V21 M11.5 8 H16 M11.5 11.5 H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    os: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5 a2.5 2.5 0 1 0 -2 4 l10 10 a2.5 2.5 0 1 0 4 -2 a2.5 2.5 0 1 0 -2 -4 L7 3 a2.5 2.5 0 1 0 -4 2 a2.5 2.5 0 1 0 4 0Z" fill="currentColor"/></svg>',
    reglages: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7 H20 M4 17 H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="9" cy="7" r="2.6" fill="#f5ecd7" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="17" r="2.6" fill="#f5ecd7" stroke="currentColor" stroke-width="2"/></svg>'
  };

  // ---------- Tampon du carnet (encre rouge) ----------
  function tampon(texte, sous) {
    return '<svg class="tampon" viewBox="0 0 160 160" aria-hidden="true"><g transform="rotate(-12 80 80)">' +
      '<circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<path id="tpArc" d="M28 80 A52 52 0 0 1 132 80" fill="none"/><text class="tp-arc"><textPath href="#tpArc" startOffset="50%" text-anchor="middle">MUSÉUM · LA RÉUNION</textPath></text>' +
      '<text x="80" y="88" text-anchor="middle" class="tp-t">' + texte + '</text><text x="80" y="112" text-anchor="middle" class="tp-s">' + (sous || "") + '</text></g></svg>';
  }

  window.Art = { tivent, solitaire, dodo, rodrigues, huppe, tortue, dodoBlanc, ESPECES, accueil, vitrine, plan, carte, ILES, ICO, tampon };
})();
