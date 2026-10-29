/* ============================================================
   ART.JS — Illustrations SVG maison (aucune image externe).
   Kawann (tortue caouanne : carapace brun-rouge, grosse tête),
   Jo le soigneur, scènes (lagon, plage de nuit, relâcher), espèces,
   diplôme. Animations en CSS (respiration, clignement, nage),
   désactivées si l'utilisateur préfère moins de mouvement.
   ============================================================ */
(function () {
  "use strict";
  let uid = 0; const U = p => p + (++uid); // identifiants uniques (dégradés)

  // ---------------- KAWANN ----------------
  // Vue de profil, tête vers la droite qui regarde le visiteur.
  // expr : content | triste | soulagee | fete | clin | surprise ; opts.pansement : bandage à la nageoire
  function kawannInner(expr, opts) {
    opts = opts || {};
    const g1 = U("kc"), g2 = U("kp");
    const yeux = {
      ferme: '<path d="M0 0 q7 6 14 0" stroke="#2a160b" stroke-width="3.4" fill="none" stroke-linecap="round"/>',
      ouvert: '<g class="oeil"><ellipse cx="7" cy="0" rx="7.6" ry="9" fill="#fff"/><circle cx="8.6" cy="1.4" r="5.4" fill="#2a160b"/><circle cx="10.6" cy="-1.4" r="2" fill="#fff"/><rect class="paupiere" x="-1" y="-10" width="17" height="0" fill="#c98b4f"/></g>'
    };
    const oeilG = expr === "fete" ? yeux.ferme : yeux.ouvert;
    const oeilD = (expr === "clin" || expr === "fete") ? yeux.ferme : yeux.ouvert;
    const bouches = {
      content: '<path d="M150 104 q12 10 24 0" stroke="#2a160b" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
      soulagee: '<path d="M151 104 q11 8 22 0" stroke="#2a160b" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
      fete: '<path d="M148 101 q14 18 28 0 z" fill="#7a2a1a" stroke="#2a160b" stroke-width="2.6" stroke-linejoin="round"/><path d="M155 108 q7 5 14 0" fill="#ff8f80"/>',
      clin: '<path d="M151 103 q12 11 24 -1" stroke="#2a160b" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
      triste: '<path d="M152 108 q10 -8 20 0" stroke="#2a160b" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
      surprise: '<ellipse cx="162" cy="106" rx="5" ry="6" fill="#7a2a1a" stroke="#2a160b" stroke-width="2.4"/>'
    };
    const sourcils = expr === "triste" ? '<path d="M140 66 l12 -5 M166 61 l12 5" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/>' :
      expr === "surprise" ? '<path d="M140 62 q7 -6 14 -2 M166 60 q7 -4 14 2" stroke="#5a3418" stroke-width="3" fill="none" stroke-linecap="round"/>' : "";
    const joues = '<ellipse cx="146" cy="98" rx="6" ry="3.6" fill="#ff8f6b" opacity=".55"/><ellipse cx="180" cy="97" rx="5" ry="3.4" fill="#ff8f6b" opacity=".55"/>';
    const pans = opts.pansement ? '<g transform="rotate(28 120 130)"><rect x="104" y="124" width="26" height="12" rx="4" fill="#fff" stroke="#c9d6dc" stroke-width="1.5"/><path d="M114 126 v8 M120 126 v8" stroke="#e05a4f" stroke-width="2.4"/></g>' : "";
    const fete = expr === "fete" ? '<g class="eclats" fill="#ffd166"><path d="M30 20 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M196 18 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/><circle cx="186" cy="44" r="3"/><circle cx="18" cy="56" r="2.6"/></g>' : "";
    // Anatomie de tortue MARINE (et non terrestre) : carapace basse et profilée en cœur,
    // longues nageoires antérieures en palette (sans doigts séparés), petite nageoire postérieure,
    // grosse tête large de caouanne avec bec corné, 5 paires d'écailles costales.
    const peau = "#d6a062", trait = "#6e3f1c";
    return '<defs><radialGradient id="' + g1 + '" cx=".45" cy=".2" r=".9"><stop offset="0" stop-color="#e8a564"/><stop offset=".55" stop-color="#b8612b"/><stop offset="1" stop-color="#7a3714"/></radialGradient>' +
      '<linearGradient id="' + g2 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7e2b4"/><stop offset="1" stop-color="#e2b877"/></linearGradient></defs>' +
      fete +
      // nageoire antérieure du côté caché (plus sombre, derrière le corps)
      '<path d="M118 92 C130 74 150 62 176 58 C184 58 184 64 178 66 C156 74 140 86 130 100z" fill="#b98049" stroke="' + trait + '" stroke-width="2" stroke-linejoin="round" opacity=".9"/>' +
      '<g class="k-nage-ar"><path d="M34 100 C22 104 10 114 4 128 C16 130 30 122 42 110z" fill="' + peau + '" stroke="' + trait + '" stroke-width="2.5" stroke-linejoin="round"/></g>' +
      '<g class="k-souffle">' +
      // plastron (dessous clair), puis carapace basse et profilée
      '<path d="M22 102 C64 114 116 110 150 92 L148 102 C114 120 62 124 26 112z" fill="url(#' + g2 + ')" stroke="' + trait + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M16 102 C22 74 58 50 104 48 C134 47 154 62 158 86 C152 92 140 98 124 102 C88 110 46 110 16 102z" fill="url(#' + g1 + ')" stroke="#5a2a0e" stroke-width="3" stroke-linejoin="round"/>' +
      // écailles : vertébrales (dos), 5 costales, marginales (bord)
      '<g fill="none" stroke="#6b3313" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" opacity=".85">' +
      '<path d="M30 92 C46 70 76 58 106 57 C128 57 144 66 150 82"/>' +
      '<path d="M44 76 L36 100 M66 64 L60 104 M90 59 L88 106 M114 58 L116 104 M136 64 L140 96"/>' +
      '<path d="M30 92 C60 100 110 102 150 88" opacity=".6"/></g>' +
      '<path d="M40 70 C60 56 84 50 108 51" stroke="#f6c58c" stroke-width="4.5" fill="none" stroke-linecap="round" opacity=".55"/>' +
      '</g>' +
      // grande nageoire antérieure en palette, rabattue vers l'arrière (nage)
      '<g class="k-nage-av"><path d="M128 94 C122 118 100 144 60 160 C50 164 46 158 52 152 C82 132 100 114 108 96z" fill="' + peau + '" stroke="' + trait + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M114 108 l-8 -2 M100 126 l-8 -2 M84 142 l-8 -1" stroke="#a86d3a" stroke-width="2" stroke-linecap="round" opacity=".8"/>' + pans + '</g>' +
      // cou + grosse tête de caouanne (bec corné), qui regarde le visiteur
      '<g class="k-tete"><path d="M126 76 C134 72 144 76 146 86 C146 98 138 106 128 104z" fill="' + peau + '" stroke="' + trait + '" stroke-width="2.5"/>' +
      '<path d="M132 82 q5 6 2 14 M138 80 q4 8 1 16" stroke="#a86d3a" stroke-width="1.6" fill="none" opacity=".7"/>' +
      '<path d="M134 82 C134 60 154 50 176 52 C196 54 208 68 206 86 C205 102 194 114 176 116 C156 118 136 108 134 82z" fill="' + peau + '" stroke="' + trait + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M146 60 l12 -4 14 2 M172 54 l4 10 14 2 M190 60 l2 10" stroke="#a86d3a" stroke-width="1.8" fill="none" stroke-linejoin="round" opacity=".4"/>' +
      '<path d="M184 110 C196 106 203 98 205 88" stroke="#8a5428" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>' +
      '<g transform="translate(142 78)">' + oeilG + '</g><g transform="translate(168 76)">' + oeilD + '</g>' + sourcils + joues + (bouches[expr] || bouches.content) + '</g>';
  }
  function kawann(expr, cls, opts) {
    return '<svg class="kawann ' + (cls || "") + '" viewBox="0 0 210 172" role="img" aria-label="Kawann, la tortue caouanne">' + kawannInner(expr, opts) + '</svg>';
  }

  // ---------------- JO, LE SOIGNEUR ----------------
  function joInner(expr, nuit) {
    const lampe = '<circle cx="74" cy="38" r="7" fill="#ff3b2f"/><circle cx="74" cy="38" r="16" fill="#ff3b2f" opacity=".25" class="halo"/>';
    const bouche = expr === "fier" ? '<path d="M62 78 q12 12 24 0 z" fill="#7a2a1a"/>' : expr === "clin" ? '<path d="M63 77 q11 8 22 -1" stroke="#3b1f12" stroke-width="3" fill="none" stroke-linecap="round"/>' : '<path d="M64 76 q10 9 20 0" stroke="#3b1f12" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse class="j-parle" cx="74" cy="79" rx="5" ry="2.5" fill="#7a2a1a"/>';
    const oeilD = expr === "clin" ? '<path d="M80 60 q6 4 12 0" stroke="#3b1f12" stroke-width="3" fill="none" stroke-linecap="round"/>' : '<ellipse cx="86" cy="60" rx="4" ry="5" fill="#3b1f12"/>';
    return '<path d="M20 170 q4 -46 54 -50 q50 4 54 50z" fill="#0f8a96" stroke="#06505a" stroke-width="3"/>' +
      '<path d="M58 122 l16 18 16 -18" fill="#e8f7f8" stroke="#06505a" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<g transform="translate(92 140) scale(.55)"><path d="M0 0 c0 -12 20 -12 20 0 c0 8 -20 8 -20 0z" fill="#ffd9a8"/><circle cx="23" cy="-1" r="4" fill="#ffd9a8"/></g>' +
      '<rect x="64" y="100" width="20" height="20" fill="#8a5636"/>' +
      '<ellipse cx="74" cy="66" rx="30" ry="34" fill="#a8693f"/>' +
      // cheveux courts ; la lampe frontale (lumière ROUGE, discrète) n'apparaît qu'en soirée
      '<path d="M44 60 C38 30 58 22 74 24 C94 22 112 32 104 60 C100 46 90 38 74 38 C58 38 48 46 44 60z" fill="#2b1a10"/>' +
      (nuit ? '<path d="M44 44 q30 -10 60 0" stroke="#1d2b31" stroke-width="6" fill="none" stroke-linecap="round"/>' + lampe : "") +
      '<ellipse cx="62" cy="60" rx="4" ry="5" fill="#3b1f12"/>' + oeilD +
      '<path d="M56 50 q6 -3 12 0 M80 50 q6 -3 12 0" stroke="#3b1f12" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="54" cy="72" rx="5" ry="3" fill="#e0785f" opacity=".45"/><ellipse cx="94" cy="72" rx="5" ry="3" fill="#e0785f" opacity=".45"/>' + bouche;
  }
  function jo(expr, nuit, cls) {
    return '<svg class="jo ' + (cls || "") + '" viewBox="10 0 130 172" role="img" aria-label="Jo, le soigneur">' + joInner(expr, nuit) + '</svg>';
  }

  // ---------------- SCÈNE D'ACCUEIL (lagon de jour / plage de nuit) ----------------
  function accueil(nuit) {
    const ciel = U("ac"), mer = U("am");
    let etoiles = "";
    if (nuit) for (let i = 0; i < 40; i++) { const x = (i * 97) % 400, y = (i * 53) % 120; etoiles += '<circle cx="' + x + '" cy="' + (y + 6) + '" r="' + (i % 3 ? 1 : 1.8) + '" fill="#ffe2b0" class="scint" style="animation-delay:' + (i % 7) * .4 + 's"/>'; }
    const bulles = [60, 120, 230, 300, 350].map((x, i) => '<circle class="bulle" cx="' + x + '" cy="250" r="' + (3 + i % 3 * 2) + '" fill="none" stroke="#dff7ff" stroke-width="1.6" style="animation-delay:' + i * .9 + 's"/>').join("");
    return '<svg class="scene-accueil" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Kawann nage dans le lagon">' +
      '<defs><linearGradient id="' + ciel + '" x1="0" y1="0" x2="0" y2="1">' + (nuit ? '<stop offset="0" stop-color="#160b05"/><stop offset="1" stop-color="#3a1d0a"/>' : '<stop offset="0" stop-color="#7fd6e6"/><stop offset="1" stop-color="#d9f4f2"/>') + '</linearGradient>' +
      '<linearGradient id="' + mer + '" x1="0" y1="0" x2="0" y2="1">' + (nuit ? '<stop offset="0" stop-color="#3b220e"/><stop offset="1" stop-color="#120804"/>' : '<stop offset="0" stop-color="#19b3c4"/><stop offset=".6" stop-color="#0a7b93"/><stop offset="1" stop-color="#064a63"/>') + '</linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + ciel + ')"/>' + etoiles +
      (nuit ? '<circle cx="320" cy="34" r="18" fill="#ffd9a0"/><circle cx="328" cy="28" r="16" fill="#2a1508"/>' : '<circle cx="334" cy="30" r="20" fill="#fff4c2"/><circle cx="334" cy="30" r="34" fill="#fff4c2" opacity=".35"/>') +
      // relief de l'Ouest en fond
      '<path d="M0 66 q60 -34 120 -18 q50 -30 110 -6 q60 -26 170 8 v24 h-400z" fill="' + (nuit ? "#2b1607" : "#5fa58f") + '" opacity=".75"/>' +
      '<rect y="70" width="400" height="230" fill="url(#' + mer + ')"/>' +
      '<g class="vagues"><path d="M-40 74 q20 -7 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 v7 h-480z" fill="' + (nuit ? "#5a3414" : "#bff1f5") + '" opacity=".7"/></g>' +
      // reflets dansants sous la surface + rayons de lumière
      (nuit ? "" : '<g class="caustiques" stroke="#e8fdff" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"><path d="M10 92 q14 -6 28 0 t28 0"/><path d="M120 98 q12 -5 24 0 t24 0"/><path d="M250 90 q14 -6 28 0 t28 0 t28 0"/><path d="M60 112 q10 -4 20 0 t20 0"/><path d="M300 116 q10 -4 20 0 t20 0"/></g>' +
        '<g opacity=".2" fill="#fff" class="rayons"><path d="M70 70 l-34 230 h26z"/><path d="M190 70 l-12 230 h34z"/><path d="M310 70 l34 230 h-22z"/></g>') +
      // banc de petits poissons
      '<g class="banc" fill="' + (nuit ? "#7a4a1e" : "#e9fbff") + '" opacity=".75">' + [[34, 128], [52, 120], [48, 138], [68, 130], [64, 146], [84, 138]].map(p => '<path d="M' + p[0] + ' ' + p[1] + ' q6 -4 12 0 q-6 4 -12 0z m-1 0 l-4 -3 v6z"/>').join("") + '</g>' +
      '<g class="nage-scene"><g transform="translate(112 70) scale(.68)">' + kawannInner("content") + '</g></g>' + bulles +
      // herbier et sable
      '<path d="M0 270 q100 -26 200 -6 q100 16 200 -4 v40 h-400z" fill="' + (nuit ? "#4a2a10" : "#f4e1b5") + '"/>' +
      '<g stroke="' + (nuit ? "#6a3e14" : "#3f8f63") + '" stroke-width="4" stroke-linecap="round" fill="none" class="algues"><path d="M30 276 q-8 -20 4 -40"/><path d="M42 278 q10 -22 -2 -44"/><path d="M362 272 q-8 -18 4 -36"/><path d="M374 274 q8 -16 -2 -30"/></g>' +
      '</svg>';
  }

  // ---------------- SCÈNE DE RELÂCHER ----------------
  function relacher(nuit) {
    const ciel = U("rc");
    return '<svg class="scene-relacher" viewBox="0 0 400 260" role="img" aria-label="Kawann retourne à la mer">' +
      '<defs><linearGradient id="' + ciel + '" x1="0" y1="0" x2="0" y2="1">' + (nuit ? '<stop offset="0" stop-color="#140a04"/><stop offset="1" stop-color="#3a1d0a"/>' : '<stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#ffe9c9"/>') + '</linearGradient></defs>' +
      '<rect width="400" height="260" fill="url(#' + ciel + ')"/>' +
      (nuit ? '<circle cx="80" cy="46" r="16" fill="#ffd9a0"/>' : '<circle cx="80" cy="70" r="30" fill="#ff9a5c"/>') +
      '<rect y="92" width="400" height="80" fill="' + (nuit ? "#3b220e" : "#1aa6b8") + '"/>' +
      '<path d="M0 92 h400" stroke="' + (nuit ? "#6b3e18" : "#bdf1f5") + '" stroke-width="2"/>' +
      '<g class="ressac"><path d="M-40 168 q25 -14 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 v20 h-460z" fill="' + (nuit ? "#7a4a1e" : "#e9fbfc") + '"/></g>' +
      '<rect y="176" width="400" height="84" fill="' + (nuit ? "#4a2a10" : "#f2d79f") + '"/>' +
      '<g fill="' + (nuit ? "#3a1f0a" : "#d9b878") + '" opacity=".7"><ellipse cx="260" cy="230" rx="6" ry="2"/><ellipse cx="300" cy="212" rx="5" ry="2"/><ellipse cx="330" cy="240" rx="6" ry="2"/></g>' +
      '<g class="trace" stroke="' + (nuit ? "#2b1607" : "#c9a565") + '" stroke-width="3" stroke-dasharray="4 8" fill="none"><path d="M330 250 q-40 -30 -110 -70"/></g>' +
      // Kawann regarde vers la mer (image en miroir) : elle avance tête la première
      '<g class="kawann-part"><g transform="translate(352 162) scale(-.56 .56)">' + kawannInner("fete") + '</g></g>' +
      '<g class="silhouettes" fill="' + (nuit ? "#1a0c04" : "#6f5a44") + '" opacity=".85"><circle cx="350" cy="196" r="7"/><path d="M342 206 h16 l4 34 h-24z"/><circle cx="372" cy="200" r="6"/><path d="M365 209 h14 l3 30 h-20z"/><circle cx="24" cy="204" r="5"/><path d="M18 212 h12 l3 24 h-18z"/></g>' +
      '</svg>';
  }

  // ---------------- ESPÈCES (carnet) ----------------
  function espece(id, couleur, verrou) {
    // silhouette de tortue MARINE (carapace basse, nageoires en palette) ; détails propres à chaque espèce
    const c = verrou ? "#8aa3ab" : couleur, ombre = "rgba(0,0,0,.38)";
    const luth = id === "luth", tg = { caouanne: 1.18, verte: .86, imbriquee: .95, olivatre: .95, luth: 1 }[id] || 1;
    const dos = luth
      ? '<path d="M30 66 C56 46 96 40 128 50 M34 74 C62 58 100 54 130 60" stroke="#dfe7ee" stroke-width="2.2" fill="none" opacity=".8"/><g fill="#dfe7ee" opacity=".7"><circle cx="70" cy="58" r="1.8"/><circle cx="96" cy="52" r="1.6"/><circle cx="110" cy="66" r="1.8"/><circle cx="58" cy="70" r="1.5"/></g>'
      : '<path d="M30 74 C52 52 92 42 124 50 M46 64 L40 82 M68 52 L64 84 M92 47 L92 84 M116 48 L118 80" stroke="' + ombre + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        (id === "imbriquee" ? '<path d="M24 82 l6 -6 6 6 6 -6 6 6 6 -6 6 6" stroke="' + ombre + '" stroke-width="2" fill="none"/>' : "");
    const bec = id === "imbriquee" ? '<path d="M158 58 C166 60 168 66 160 70z" fill="' + c + '" stroke="' + ombre + '" stroke-width="2"/>' : "";
    return '<svg viewBox="0 0 170 110" class="espece-svg" aria-hidden="true">' +
      '<path d="M26 80 C16 84 8 92 4 102 C14 102 24 96 34 86z" fill="' + c + '" opacity=".85"/>' +
      '<path d="M104 80 C98 96 82 106 52 108 C44 108 44 102 50 100 C72 96 86 88 92 78z" fill="' + c + '" opacity=".9" stroke="' + ombre + '" stroke-width="1.6"/>' +
      '<path d="M16 82 C22 56 56 36 96 36 C122 36 136 50 138 70 C128 78 108 84 84 86 C56 88 32 88 16 82z" fill="' + c + '" stroke="' + ombre + '" stroke-width="3" stroke-linejoin="round"/>' + dos +
      '<g transform="translate(136 64) scale(' + tg + ') translate(-136 -64)"><path d="M126 64 C126 50 140 44 152 48 C164 52 166 66 158 74 C150 80 134 78 128 72z" fill="' + c + '" stroke="' + ombre + '" stroke-width="3"/>' + bec +
      (verrou ? "" : '<circle cx="148" cy="58" r="3.4" fill="#1b0f08"/><circle cx="149" cy="57" r="1" fill="#fff"/>') + '</g>' +
      (verrou ? '<text x="78" y="72" text-anchor="middle" font-size="30" fill="#fff" font-weight="900">?</text>' : "") + '</svg>';
  }

  // ---------------- PICTOS ----------------
  const ICO = {
    coquille: on => '<svg class="pip ' + (on ? "on" : "") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 C5 3 2 9 3 15 l9 6 9 -6 C22 9 19 3 12 3z" fill="currentColor"/><path d="M12 5 v14 M7 6 l3 12 M17 6 l-3 12" stroke="rgba(0,0,0,.35)" stroke-width="1.4"/></svg>',
    tortue: '<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M9 30 q-6 2 -8 8 q6 0 11 -5z M38 30 C36 38 28 44 16 46 q-4 0 -2 -3 C24 40 30 35 32 29z" fill="#d6a062" stroke="#6e3f1c" stroke-width="1.4"/><path d="M5 31 C8 20 22 12 36 12 C46 12 51 18 52 26 C46 31 36 33 26 34 C16 34 9 33 5 31z" fill="#b8612b" stroke="#5a2a0e" stroke-width="2.2" stroke-linejoin="round"/><path d="M48 24 C48 16 56 13 61 17 C65 21 63 29 57 30 C52 31 48 29 48 24z" fill="#d6a062" stroke="#6e3f1c" stroke-width="1.8"/><circle cx="57" cy="21" r="2" fill="#2a160b"/></svg>'
  };

  // ---------------- DIPLÔME (SVG autonome : imprimable et exportable en image) ----------------
  function diplome(o) {
    // o : { nom, date, public, tampons:[bool×5], langue }
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const T = { fr: ["Diplôme de", "Soigneur junior", "décerné à", "pour avoir mené l'enquête du dossier Kawann", "et aidé une tortue à retrouver la mer."], en: ["Certificate of", "Junior Keeper", "awarded to", "for solving the Kawann file", "and helping a turtle back to the sea."], kr: ["Diplom", "Ti soignèr", "pou", "pou lankèt lo dosié Kawann", "é pou la ède in tortu artrouv la mèr."] }[o.langue] || null;
    const t = T || ["Diplôme de", "Soigneur junior", "décerné à", "pour avoir mené l'enquête du dossier Kawann", "et aidé une tortue à retrouver la mer."];
    const tampons = o.tampons.map((ok, i) => '<g transform="translate(' + (250 + i * 75) + ' 452)"><circle r="26" fill="' + (ok ? "#0f8a96" : "#e8eef0") + '" stroke="' + (ok ? "#06505a" : "#b8c8cc") + '" stroke-width="3"/><text y="9" text-anchor="middle" font-size="24" font-weight="900" fill="' + (ok ? "#fff" : "#9fb3b8") + '">' + (ok ? "✓" : (i + 1)) + '</text></g>').join("");
    return '<svg xmlns="http://www.w3.org/2000/svg" class="diplome-svg" viewBox="0 0 800 560" role="img" aria-label="Diplôme de soigneur junior">' +
      '<rect width="800" height="560" fill="#fffaf0"/>' +
      '<rect x="18" y="18" width="764" height="524" rx="22" fill="none" stroke="#0f8a96" stroke-width="6"/>' +
      '<rect x="32" y="32" width="736" height="496" rx="14" fill="none" stroke="#e8b04a" stroke-width="2" stroke-dasharray="2 6"/>' +
      '<path d="M18 470 q120 -40 250 0 t260 0 t254 -6 v78 h-764z" fill="#bfe9ec" opacity=".6"/>' +
      '<g transform="translate(48 100) scale(.56)">' + kawannInner("fete") + '</g>' +
      '<text x="400" y="78" text-anchor="middle" font-family="system-ui,Segoe UI,Roboto,sans-serif" font-size="16" letter-spacing="3" fill="#06505a" font-weight="700">KÉLONIA · L\'OBSERVATOIRE DES TORTUES MARINES</text>' +
      '<text x="400" y="132" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#5e2d10">' + esc(t[0]) + '</text>' +
      '<text x="400" y="186" text-anchor="middle" font-family="Georgia,serif" font-size="54" font-weight="700" fill="#e05a3c">' + esc(t[1]) + '</text>' +
      '<text x="400" y="232" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" fill="#06505a">' + esc(t[2]) + '</text>' +
      '<text x="400" y="292" text-anchor="middle" font-family="\'Segoe Script\',\'Brush Script MT\',cursive" font-size="50" fill="#063b4c">' + esc(o.nom || "…") + '</text>' +
      '<line x1="220" y1="306" x2="580" y2="306" stroke="#e8b04a" stroke-width="2"/>' +
      '<text x="400" y="346" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" fill="#2a3b40">' + esc(t[3]) + '</text>' +
      '<text x="400" y="374" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" fill="#2a3b40">' + esc(t[4]) + '</text>' +
      tampons +
      '<text x="400" y="404" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" fill="#06505a">Saint-Leu, La Réunion · ' + esc(o.date) + '</text>' +
      '<g transform="translate(696 214) scale(.86)"><circle r="56" fill="#e8b04a"/><circle r="46" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 4"/><g transform="translate(-34 -26) scale(.33)">' + kawannInner("content") + '</g><text y="40" text-anchor="middle" font-size="12" font-weight="800" fill="#5e2d10" font-family="system-ui,sans-serif">APTE · 5/5</text></g>' +
      '<text x="400" y="536" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#6a7d82">Prototype de démonstration · non officiel</text>' +
      '</svg>';
  }

  window.Art = { kawann, kawannInner, jo, joInner, accueil, relacher, espece, ICO, diplome };
})();
