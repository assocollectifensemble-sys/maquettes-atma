/* ============================================================
   ART.JS — Illustrations SVG faites maison (aucune image externe).
   Zouzou la zourite (5 expressions, animée : respiration, tentacules,
   clignement, regard), scène d'accueil du lagon (ciel, récif, ressac,
   reflets, banc de poissons, paille-en-queue), carte de la plage (hub),
   habitants du récif (carnet), objets des mini-jeux, icône.
   Toutes les animations sont en CSS (coupées si « moins d'animations »).
   ============================================================ */
(function () {
  "use strict";
  let uid = 0; const U = p => p + (++uid); // identifiants uniques (plusieurs dessins par écran)

  // ---------- ZOUZOU ----------
  const PEAU = ["#ffa585", "#ee6249", "#b8382b"];
  // tentacule pointant vers le bas, origine (0,0) = attache ; s'enroule vers la droite
  const TENT = "M-11 0 C-13 22 -7 42 6 54 C17 64 33 63 37 52 C40 43 32 37 25 41 C29 45 27 50 22 50 C13 50 8 40 6 28 C4 16 8 6 11 0 Z";
  const VENTOUSES = [[0, 18, 3.1], [3, 31, 2.8], [10, 42, 2.4], [19, 47, 2]];
  function tentacule(x, y, rot, miroir, delai, dur, idg) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')' + (miroir ? ' scale(-1 1)' : '') + '"><g class="tent" style="animation-delay:' + delai + 's;animation-duration:' + dur + 's">' +
      '<path d="' + TENT + '" fill="url(#' + idg + ')" stroke="#8f2a20" stroke-width="2.2" stroke-linejoin="round"/>' +
      VENTOUSES.map(v => '<circle cx="' + v[0] + '" cy="' + v[1] + '" r="' + v[2] + '" fill="#ffd9c8" stroke="#c7553f" stroke-width="1"/>').join("") + '</g></g>';
  }
  function zouzou(expr, cls) {
    expr = expr || "content";
    const g = U("zzp"), gt = U("zzt"), ce = U("zze"), cd = U("zzd");
    const oeil = (cx, cy, clip, ferme) => ferme
      ? '<path d="M' + (cx - 13) + ' ' + (cy + 2) + ' Q' + cx + ' ' + (cy - 9) + ' ' + (cx + 13) + ' ' + (cy + 2) + '" fill="none" stroke="#3b1410" stroke-width="3.4" stroke-linecap="round"/>'
      : '<clipPath id="' + clip + '"><ellipse cx="' + cx + '" cy="' + cy + '" rx="14.5" ry="16.5"/></clipPath>' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="14.5" ry="16.5" fill="#fff" stroke="#7d2219" stroke-width="2.4"/>' +
        '<g clip-path="url(#' + clip + ')"><g class="regard"><circle cx="' + (cx + (cx < 100 ? 2 : -2)) + '" cy="' + (cy + (expr === "triste" ? 4 : 2)) + '" r="8.4" fill="#1f1a33"/><circle cx="' + (cx + (cx < 100 ? 5 : 1)) + '" cy="' + (cy - 2) + '" r="3.2" fill="#fff"/><circle cx="' + (cx + (cx < 100 ? -1 : -5)) + '" cy="' + (cy + 6) + '" r="1.4" fill="#fff" opacity=".8"/></g>' +
        '<rect class="paupiere" x="' + (cx - 16) + '" y="' + (cy - 18) + '" width="32" height="36" fill="' + PEAU[1] + '"/></g>';
    const bouche = {
      content: '<path d="M90 111 Q100 121 110 111" fill="none" stroke="#3b1410" stroke-width="3.2" stroke-linecap="round"/>',
      triste: '<path d="M91 117 Q100 109 109 117" fill="none" stroke="#3b1410" stroke-width="3.2" stroke-linecap="round"/>',
      surpris: '<ellipse cx="100" cy="114" rx="5" ry="6.5" fill="#3b1410"/><ellipse cx="100" cy="116.5" rx="3" ry="2.6" fill="#ff8f8f"/>',
      clin: '<path d="M88 110 Q100 123 112 110" fill="none" stroke="#3b1410" stroke-width="3.2" stroke-linecap="round"/>',
      fete: '<path d="M86 108 Q100 128 114 108 Z" fill="#3b1410" stroke="#3b1410" stroke-width="2" stroke-linejoin="round"/><path d="M93 117 Q100 113 107 117 Q100 123 93 117Z" fill="#ff8f8f"/>'
    }[expr] || "";
    const sourcils = {
      triste: '<path d="M66 72 L89 66 M134 72 L111 66" stroke="#7d2219" stroke-width="3" stroke-linecap="round"/>',
      surpris: '<path d="M68 68 Q79 60 90 66 M132 68 Q121 60 110 66" fill="none" stroke="#7d2219" stroke-width="3" stroke-linecap="round"/>'
    }[expr] || "";
    const larme = expr === "triste" ? '<path class="larme" d="M68 104 Q64 111 68 114 Q72 111 68 104Z" fill="#9be7ff" stroke="#3aa6c9" stroke-width="1"/>' : "";
    const encre = expr === "surpris" ? '<g class="encre" opacity=".55"><circle cx="40" cy="150" r="14" fill="#3a2a4f"/><circle cx="26" cy="138" r="9" fill="#3a2a4f"/><circle cx="52" cy="166" r="8" fill="#3a2a4f"/></g>' : "";
    const etoiles = expr === "fete" ? '<g class="eclats" fill="#ffd23f" stroke="#c98a00" stroke-width="1"><path d="M30 34 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4Z"/><path d="M168 26 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z"/><path d="M176 92 l2.5 5.5 5.5 2.5 -5.5 2.5 -2.5 5.5 -2.5 -5.5 -5.5 -2.5 5.5 -2.5Z"/></g>' : "";
    return '<svg class="zouzou ' + (cls || "") + ' zz-' + expr + '" viewBox="0 0 200 190" role="img" aria-label="Zouzou la zourite">' +
      '<defs><radialGradient id="' + g + '" cx=".36" cy=".28" r=".85"><stop offset="0" stop-color="' + PEAU[0] + '"/><stop offset=".55" stop-color="' + PEAU[1] + '"/><stop offset="1" stop-color="' + PEAU[2] + '"/></radialGradient>' +
      '<linearGradient id="' + gt + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + PEAU[1] + '"/><stop offset="1" stop-color="#d84c39"/></linearGradient></defs>' +
      encre + etoiles +
      '<ellipse cx="100" cy="182" rx="58" ry="6" fill="#00303d" opacity=".14"/>' +
      '<g class="zz-corps">' +
      tentacule(64, 110, 34, true, -0.2, 3.2, gt) + tentacule(136, 110, -34, false, -1.4, 3.4, gt) +
      tentacule(78, 116, 12, true, -0.8, 2.8, gt) + tentacule(122, 116, -12, false, -2, 3, gt) +
      tentacule(92, 119, 2, true, -1.1, 2.6, gt) + tentacule(108, 119, -2, false, -0.4, 2.7, gt) +
      '<g class="zz-tete">' +
      '<path d="M100 10 C146 10 162 46 159 80 C157 106 140 126 100 126 C60 126 43 106 41 80 C38 46 54 10 100 10 Z" fill="url(#' + g + ')" stroke="#8f2a20" stroke-width="2.6"/>' +
      '<g fill="#b8382b" opacity=".45"><ellipse cx="72" cy="46" rx="6" ry="4.5"/><ellipse cx="128" cy="40" rx="5" ry="4"/><ellipse cx="140" cy="66" rx="4" ry="3.2"/><ellipse cx="60" cy="72" rx="3.6" ry="3"/><ellipse cx="112" cy="24" rx="3.5" ry="2.8"/><ellipse cx="90" cy="30" rx="2.8" ry="2.2"/></g>' +
      '<ellipse cx="80" cy="36" rx="17" ry="10" fill="#fff" opacity=".32" transform="rotate(-28 80 36)"/>' +
      '<ellipse cx="66" cy="104" rx="8" ry="5" fill="#ff7b95" opacity=".55"/><ellipse cx="134" cy="104" rx="8" ry="5" fill="#ff7b95" opacity=".55"/>' +
      sourcils + oeil(80, 90, ce, false) + oeil(120, 90, cd, expr === "clin") + bouche + larme +
      '</g></g></svg>';
  }

  // ---------- SCÈNE D'ACCUEIL : la plage, le lagon, le récif ----------
  function poisson(x, y, s, c) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0 C6 -6 16 -6 22 0 C16 6 6 6 0 0Z M22 0 L30 -6 L29 0 L30 6Z" fill="' + c + '"/><circle cx="5" cy="-1" r="1.2" fill="#fff"/></g>';
  }
  function filao(x, y, s, flip) { // filao (Casuarina) : tronc fin et penché, couronne légère et irrégulière
    const amas = [[0, -168, 26], [22, -150, 22], [-22, -150, 20], [8, -132, 24], [-30, -124, 16], [34, -126, 16], [-8, -110, 18], [20, -104, 13], [-2, -186, 16]];
    const fonce = amas.map(a => '<circle cx="' + a[0] + '" cy="' + a[1] + '" r="' + a[2] + '"/>').join("");
    const clair = amas.slice(0, 6).map(a => '<circle cx="' + (a[0] - 4) + '" cy="' + (a[1] - 5) + '" r="' + (a[2] * .62).toFixed(1) + '"/>').join("");
    let aig = ""; for (let i = 0; i < 16; i++) { const xx = -40 + i * 5.4, yy = -112 + Math.abs(i - 8) * 2.5; aig += '<path d="M' + xx.toFixed(1) + ' ' + yy.toFixed(1) + ' l' + (i % 2 ? 1.5 : -1.5) + ' ' + (9 + (i % 3) * 4) + '"/>'; }
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')" class="filao">' +
      '<path d="M0 0 C4 -50 -6 -96 4 -150" stroke="#4a3426" stroke-width="6" fill="none" stroke-linecap="round"/>' +
      '<g fill="#1d5440">' + fonce + '</g><g fill="#2f7a5a" opacity=".85">' + clair + '</g>' +
      '<g stroke="#1d5440" stroke-width="1.8" stroke-linecap="round">' + aig + '</g></g>';
  }
  function accueil() {
    const c = U("ac"), ciel = c + "c", mer = c + "m", lag = c + "l", sab = c + "s", sol = c + "o", clipL = c + "k";
    let reflets = "", caust = "";
    for (let i = 0; i < 16; i++) { const x = 228 + (i % 4) * 16 - (i % 3) * 7, y = 206 + Math.floor(i / 4) * 7 + (i % 2) * 2; reflets += '<rect class="scintille" style="animation-delay:' + (-(i * 0.37) % 2.4).toFixed(2) + 's" x="' + x + '" y="' + y + '" width="' + (10 - (i % 3) * 2) + '" height="1.6" rx=".8" fill="#fff"/>'; }
    for (let i = 0; i < 9; i++) caust += '<path d="M-40 ' + (262 + i * 16) + ' q25 -7 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" fill="none" stroke="#fff" stroke-width="1.6" opacity="' + (0.1 + (i % 3) * 0.05) + '"/>';
    const massif = (x, y, rx, ry, col) => { // contour irrégulier : 9 points bruités, lissés
      let d = "", pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, k = .78 + ((x * 7 + i * 13) % 10) / 22; pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]); }
      pts.forEach((p, i) => { const q = pts[(i + 1) % 9], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; d += (i ? " Q" : "M" + ((pts[8][0] + p[0]) / 2).toFixed(1) + " " + ((pts[8][1] + p[1]) / 2).toFixed(1) + " Q") + p[0].toFixed(1) + " " + p[1].toFixed(1) + " " + m[0].toFixed(1) + " " + m[1].toFixed(1); });
      let dots = ""; for (let i = 0; i < 6; i++) dots += '<circle cx="' + ((i - 2.5) * rx * .28).toFixed(1) + '" cy="' + (((i % 3) - 1) * ry * .3).toFixed(1) + '" r="' + (ry * .16).toFixed(1) + '" fill="#e9d8a8" opacity=".35"/>';
      return '<g transform="translate(' + x + ' ' + y + ')"><path d="' + d + 'Z" fill="' + col + '" opacity=".55" transform="scale(1.15)"/><path d="' + d + 'Z" fill="' + col + '" opacity=".85"/>' + dots + '<ellipse cx="' + (-rx * .2) + '" cy="' + (-ry * .35) + '" rx="' + rx * .45 + '" ry="' + ry * .3 + '" fill="#bff6ee" opacity=".18"/></g>'; };
    return '<svg class="scene-accueil" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="' + ciel + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e5d86"/><stop offset=".45" stop-color="#3fa9d3"/><stop offset=".82" stop-color="#b6e6f2"/><stop offset="1" stop-color="#ffefc9"/></linearGradient>' +
      '<linearGradient id="' + mer + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b4d78"/><stop offset="1" stop-color="#1683ad"/></linearGradient>' +
      '<linearGradient id="' + lag + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16a9c0"/><stop offset=".55" stop-color="#36cfcf"/><stop offset="1" stop-color="#9eeadd"/></linearGradient>' +
      '<linearGradient id="' + sab + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e6bd"/><stop offset="1" stop-color="#e6c084"/></linearGradient>' +
      '<radialGradient id="' + sol + '"><stop offset="0" stop-color="#fff8dc" stop-opacity=".95"/><stop offset=".4" stop-color="#fff2c0" stop-opacity=".45"/><stop offset="1" stop-color="#fff2c0" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + clipL + '"><path d="M0 238 Q100 232 200 238 T400 236 V412 Q300 404 200 410 T0 408Z"/></clipPath></defs>' +
      // ciel, soleil, nuages, paille-en-queue
      '<rect width="400" height="240" fill="url(#' + ciel + ')"/>' +
      '<circle class="halo-sol" cx="300" cy="150" r="90" fill="url(#' + sol + ')"/><circle cx="300" cy="150" r="22" fill="#fffaf0"/>' +
      '<g class="nuages"><g fill="#fff" opacity=".85"><ellipse cx="70" cy="182" rx="34" ry="7"/><ellipse cx="88" cy="177" rx="20" ry="8"/><ellipse cx="54" cy="180" rx="14" ry="6"/></g><g fill="#fff" opacity=".6"><ellipse cx="196" cy="170" rx="24" ry="5"/><ellipse cx="208" cy="166" rx="13" ry="6"/></g></g>' +
      '<g class="pailleenqueue"><g transform="translate(0 168)"><g class="ailes"><path d="M0 0 Q-10 -8 -20 -4 Q-10 -2 0 2 Q10 -2 20 -4 Q10 -8 0 0Z" fill="#fff"/></g><path d="M0 2 Q2 14 -2 30 M1 2 Q5 14 3 30" stroke="#fff" stroke-width="1.2" fill="none"/><circle cx="0" cy="0" r="2.4" fill="#fff"/></g></g>' +
      // océan au large + reflets du soleil
      '<path d="M0 200 H400 V242 H0Z" fill="url(#' + mer + ')"/>' +
      '<g opacity=".35" stroke="#bfefff" stroke-width="1"><path d="M10 212 h40 M80 220 h30 M150 214 h24 M330 222 h40 M360 210 h26 M60 230 h34"/></g>' + reflets +
      // barrière de corail : ressac
      '<path d="M0 238 Q100 232 200 238 T400 236 V412 Q300 404 200 410 T0 408Z" fill="url(#' + lag + ')"/>' +
      '<g class="ressac"><path d="M-10 238 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g class="ressac r2"><path d="M2 242 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke="#e8fbff" stroke-width="3" stroke-linecap="round" opacity=".85"/></g>' +
      // lagon : massifs de corail (zones sombres), sable (zones claires), reflets mouvants
      '<g clip-path="url(#' + clipL + ')">' +
      massif(46, 262, 30, 7, "#1f7480") + massif(150, 256, 22, 5, "#4c6f62") + massif(330, 266, 36, 8, "#1f7480") + massif(262, 284, 26, 7, "#6b5f48") +
      massif(64, 314, 46, 13, "#1d6f74") + massif(356, 334, 42, 14, "#5a5a48") + massif(118, 372, 34, 10, "#4a5f6e") + massif(300, 380, 24, 8, "#1f7480") +
      '<g class="caustiques">' + caust + '</g>' +
      '<g class="banc">' + poisson(0, 296, 1, "#0d6b78") + poisson(14, 302, .8, "#0d6b78") + poisson(-12, 304, .9, "#0d6b78") + poisson(6, 290, .7, "#0d6b78") + poisson(24, 294, .75, "#0d6b78") + '</g>' +
      '</g>' +
      // Zouzou qui sort de derrière sa patate de corail
      '<g class="zz-accueil"><g transform="translate(181 258) scale(.46)">' + zouzou("clin", "zz-scene").replace("<svg ", '<svg width="200" height="190" ') + '</g></g>' +
      '<g transform="translate(226 352)"><path d="M-62 4 C-60 -24 -36 -40 -6 -40 C26 -40 58 -26 62 4 C40 12 -40 12 -62 4Z" fill="#a0784e"/><path d="M-62 4 C-60 -24 -36 -40 -6 -40 C26 -40 58 -26 62 4" fill="none" stroke="#7a5638" stroke-width="2"/>' +
      '<g fill="#e7a76b"><circle cx="-38" cy="-18" r="3"/><circle cx="-24" cy="-28" r="2.6"/><circle cx="-8" cy="-33" r="3"/><circle cx="10" cy="-30" r="2.6"/><circle cx="28" cy="-24" r="3"/><circle cx="42" cy="-12" r="2.4"/><circle cx="-14" cy="-16" r="2.2"/><circle cx="18" cy="-12" r="2.4"/></g>' +
      '<g fill="#d96c8a"><path d="M-46 -10 c-4 -12 2 -20 6 -26 M-46 -10 c2 -10 10 -14 14 -16" stroke="#d96c8a" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M40 -8 c2 -12 -2 -18 -6 -24 M40 -8 c6 -8 12 -10 16 -10" stroke="#f0a64a" stroke-width="4" stroke-linecap="round" fill="none"/></g></g>' +
      '<g class="bulles-scene" fill="none" stroke="#e8fdff" stroke-width="1.6"><circle class="bl b1" cx="214" cy="300" r="3.5"/><circle class="bl b2" cx="222" cy="306" r="2.4"/><circle class="bl b3" cx="208" cy="310" r="2"/></g>' +
      // rivage : écume qui va et vient
      '<path d="M0 408 Q100 400 200 406 T400 402 V500 H0Z" fill="url(#' + sab + ')"/>' +
      '<path class="lechee" d="M0 406 Q60 398 120 405 T240 403 T400 400 V414 Q320 418 240 412 T120 416 T0 416Z" fill="#fff" opacity=".7"/>' +
      '<path d="M0 414 Q100 420 200 414 T400 412 V422 Q300 428 200 422 T0 424Z" fill="#d9b67e" opacity=".55"/>' +
      // plage : traces de pas, coquillages, panneau QR
      '<g fill="#d6ad70" opacity=".8"><ellipse cx="128" cy="452" rx="4" ry="6.5" transform="rotate(-12 128 452)"/><ellipse cx="142" cy="440" rx="4" ry="6.5" transform="rotate(-12 142 440)"/><ellipse cx="150" cy="468" rx="4" ry="6.5" transform="rotate(-12 150 468)"/><ellipse cx="164" cy="456" rx="4" ry="6.5" transform="rotate(-12 164 456)"/><ellipse cx="172" cy="484" rx="4" ry="6.5" transform="rotate(-12 172 484)"/><ellipse cx="186" cy="472" rx="4" ry="6.5" transform="rotate(-12 186 472)"/></g>' +
      '<g transform="translate(268 446)"><path d="M0 0 C-6 -10 0 -18 8 -16 C16 -14 18 -4 12 2 Z" fill="#fff3e3" stroke="#d99a6c" stroke-width="1.2"/><path d="M3 -12 L10 -1 M6 -14 L12 -4" stroke="#d99a6c" stroke-width="1"/></g>' +
      '<g transform="translate(232 474)"><path d="M0 0 l5 -9 5 9 9 2 -7 6 2 9 -9 -4 -9 4 2 -9 -7 -6Z" fill="#f2c4a0" opacity=".9"/></g>' +
      '<g transform="translate(330 418)"><rect x="-3" y="0" width="6" height="58" rx="2" fill="#7a5638"/><rect x="-24" y="-30" width="48" height="38" rx="5" fill="#fffaf0" stroke="#7a5638" stroke-width="3"/>' +
      '<g fill="#063b4c"><rect x="-17" y="-24" width="9" height="9"/><rect x="8" y="-24" width="9" height="9"/><rect x="-17" y="-3" width="9" height="9"/><rect x="-4" y="-22" width="4" height="4"/><rect x="2" y="-12" width="4" height="4"/><rect x="-4" y="-6" width="4" height="4"/><rect x="8" y="-3" width="4" height="4"/><rect x="13" y="2" width="4" height="4"/><rect x="-6" y="0" width="4" height="4"/></g>' +
      '<g fill="#fffaf0"><rect x="-15" y="-22" width="5" height="5"/><rect x="10" y="-22" width="5" height="5"/><rect x="-15" y="-1" width="5" height="5"/></g></g>' +
      filao(10, 500, .95, false) + filao(398, 488, .7, true) +
      '</svg>';
  }

  // ---------- CARTE DE LA PLAGE (hub), vue du ciel ----------
  const POS = { 1: [62, 246], 2: [142, 196], 3: [222, 258], 4: [262, 140], 5: [312, 96] };
  function carte(etats) { // etats[id] = "fait" | "ouvert" | "verrou" | "suivant"
    const c = U("cp");
    const pin = id => {
      const [x, y] = POS[id], e = etats[id];
      const fond = e === "fait" ? "#1c8a4e" : e === "verrou" ? "#8aa3a8" : "#e0553f";
      const contenu = e === "fait" ? '<path d="M-6 0 l4 4.5 8 -9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        : e === "verrou" ? '<rect x="-5.5" y="-1.5" width="11" height="8.5" rx="2" fill="#fff"/><path d="M-3.4 -1.5 v-2.4 a3.4 3.4 0 0 1 6.8 0 v2.4" fill="none" stroke="#fff" stroke-width="2"/>'
          : '<text x="0" y="5.5" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">' + id + '</text>';
      const actif = e !== "verrou";
      return '<g class="pin pin-' + e + '"' + (actif ? ' data-act="station" data-id="' + id + '" role="button" tabindex="0" aria-label="Étape ' + id + '"' : ' aria-label="Étape ' + id + ' verrouillée"') + ' transform="translate(' + x + ' ' + y + ')">' +
        (e === "suivant" ? '<circle class="onde" r="16" fill="none" stroke="#e0553f" stroke-width="3"/>' : "") +
        '<circle r="25" cy="-1" fill="#fff" fill-opacity="0"/><ellipse cx="0" cy="17" rx="9" ry="3" fill="#00303d" opacity=".25"/><path d="M0 18 L-7 6 A14 14 0 1 1 7 6Z" fill="' + fond + '" stroke="#fff" stroke-width="2.5"/>' +
        '<g transform="translate(0 -4)">' + contenu + '</g></g>';
    };
    const chemin = "M62 246 C90 230 110 210 142 196 C170 186 190 230 222 258 C250 280 270 190 262 140 C258 116 290 104 312 96";
    return '<svg class="carte-plage" viewBox="0 0 360 300" role="img" aria-label="Carte de la plage et des 5 étapes">' +
      '<defs><linearGradient id="' + c + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1aa7bd"/><stop offset="1" stop-color="#7fe0d6"/></linearGradient>' +
      '<linearGradient id="' + c + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e2b6"/><stop offset="1" stop-color="#ead09a"/></linearGradient></defs>' +
      '<rect width="360" height="300" fill="#0d5b86"/>' +
      '<g stroke="#4fa8d0" stroke-width="1.2" opacity=".5"><path d="M20 18 q10 -4 20 0 M120 30 q10 -4 20 0 M250 14 q10 -4 20 0 M300 40 q10 -4 20 0"/></g>' +
      '<path d="M0 62 Q90 50 180 60 T360 52 V230 Q260 210 180 218 T0 214Z" fill="url(#' + c + 'l)"/>' +
      '<path class="ressac-carte" d="M0 62 Q90 50 180 60 T360 52" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="14 8" stroke-linecap="round" opacity=".9"/>' +
      '<g fill="#25747a" opacity=".7"><ellipse cx="40" cy="96" rx="26" ry="11"/><ellipse cx="110" cy="120" rx="20" ry="9"/><ellipse cx="200" cy="96" rx="30" ry="12"/><ellipse cx="320" cy="140" rx="24" ry="13"/><ellipse cx="80" cy="170" rx="18" ry="8"/><ellipse cx="200" cy="160" rx="22" ry="9"/></g>' +
      '<g fill="#7a5a3a" opacity=".55"><ellipse cx="312" cy="80" rx="22" ry="12"/></g>' +
      '<g class="carte-caust" fill="none" stroke="#fff" stroke-width="1.2" opacity=".18"><path d="M0 110 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/><path d="M0 150 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/><path d="M0 190 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"/></g>' +
      '<path d="M0 214 Q90 222 180 218 T360 230 V300 H0Z" fill="url(#' + c + 's)"/>' +
      '<path d="M0 214 Q90 222 180 218 T360 230" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>' +
      '<g fill="#2a6f52">' + [[20, 288], [56, 296], [110, 292], [160, 298], [250, 296], [300, 290], [344, 298], [196, 284]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15"/><circle cx="' + (p[0] + 9) + '" cy="' + (p[1] - 6) + '" r="10" fill="#3a8a66"/>').join("") + '</g>' +
      '<g transform="translate(262 140)"><circle r="20" fill="#ffd23f" opacity=".18"/></g>' +
      '<path d="' + chemin + '" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 9" stroke-linecap="round" opacity=".95"/>' +
      '<g font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="#063b4c" opacity=".7"><text x="300" y="282" text-anchor="end">LA PLAGE</text><text x="20" y="206">LE LAGON</text></g>' +
      '<g font-family="system-ui,sans-serif" font-size="9" font-weight="800" fill="#cfefff" opacity=".85"><text x="20" y="40">LE RÉCIF · L\'OCÉAN</text></g>' +
      [1, 2, 3, 4, 5].map(pin).join("") + '</svg>';
  }

  // ---------- HABITANTS DU RÉCIF (cartes du carnet) ----------
  const habitants = {
    bernard: () => '<svg viewBox="0 0 120 90" class="hab" aria-hidden="true"><ellipse cx="60" cy="80" rx="44" ry="6" fill="#00303d" opacity=".12"/>' +
      '<path d="M52 62 C38 64 34 40 52 30 C72 20 94 34 90 56 C88 70 66 74 52 62Z" fill="#f6d9b0" stroke="#a5703f" stroke-width="2.5"/>' +
      '<path d="M58 56 C50 52 52 40 62 38 C74 36 80 48 72 56 M64 50 C62 46 66 44 68 47" fill="none" stroke="#a5703f" stroke-width="2.5" stroke-linecap="round"/>' +
      '<g stroke="#d94a2e" stroke-width="4" stroke-linecap="round" fill="none"><path d="M44 62 l-12 10 M48 66 l-8 12 M54 68 l-2 12"/></g>' +
      '<path d="M40 56 C30 52 24 56 22 62 C28 66 34 64 40 60Z" fill="#e8553a" stroke="#a22a18" stroke-width="2"/>' +
      '<g stroke="#a22a18" stroke-width="2" stroke-linecap="round"><path d="M42 52 l-6 -16 M46 52 l-2 -18"/></g><circle cx="36" cy="35" r="4" fill="#1f1a33"/><circle cx="44" cy="33" r="4" fill="#1f1a33"/><circle cx="37" cy="34" r="1.3" fill="#fff"/><circle cx="45" cy="32" r="1.3" fill="#fff"/></svg>',
    corail: () => '<svg viewBox="0 0 120 90" class="hab" aria-hidden="true"><ellipse cx="60" cy="82" rx="46" ry="6" fill="#00303d" opacity=".12"/>' +
      '<g stroke="#e88a5c" stroke-width="9" stroke-linecap="round" fill="none"><path d="M60 82 V50 M60 62 L40 44 V26 M60 58 L80 40 V20 M40 44 L28 36 M80 40 L94 30 M60 50 L62 30"/></g>' +
      '<g stroke="#f7b08a" stroke-width="4" stroke-linecap="round" fill="none"><path d="M60 82 V50 M60 62 L40 44 V26 M60 58 L80 40 V20"/></g>' +
      '<g fill="#fff3e6">' + [[40, 24], [80, 18], [28, 35], [94, 29], [62, 28], [40, 34], [80, 30], [60, 46], [50, 54], [70, 50]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.3"/>').join("") + '</g>' +
      '<g stroke="#fff3e6" stroke-width="1" fill="none">' + [[40, 24], [80, 18], [62, 28]].map(p => '<path d="M' + (p[0] - 3) + ' ' + (p[1] - 3) + ' l3 3 3 -3 M' + p[0] + ' ' + (p[1] - 4) + ' v4"/>').join("") + '</g></svg>',
    baliste: () => '<svg viewBox="0 0 120 90" class="hab" aria-hidden="true"><ellipse cx="60" cy="82" rx="42" ry="5" fill="#00303d" opacity=".12"/>' +
      '<path d="M18 46 C26 22 66 18 88 34 L104 26 L100 46 L106 64 L88 58 C66 74 28 70 18 46Z" fill="#efe6cf" stroke="#3a3a3a" stroke-width="2.2"/>' +
      '<path d="M48 26 C54 38 54 56 48 68 L62 70 C68 56 68 38 62 24Z" fill="#1d1d1d"/><path d="M66 26 C72 38 72 54 66 68 L76 64 C80 52 80 40 76 30Z" fill="#3a74b8"/>' +
      '<path d="M34 50 C40 46 46 48 48 52" stroke="#f0b429" stroke-width="3" fill="none"/><path d="M78 36 L90 34 M78 44 L90 44 M78 52 L90 54" stroke="#3a3a3a" stroke-width="2.4"/>' +
      '<path d="M18 46 L26 48 L19 52Z" fill="#f0b429"/><circle cx="34" cy="38" r="4.5" fill="#1f1a33"/><circle cx="35.5" cy="36.5" r="1.4" fill="#fff"/><path d="M30 30 L40 46" stroke="#3a74b8" stroke-width="2"/>' +
      '<path d="M44 22 L52 10 L56 24" fill="#efe6cf" stroke="#3a3a3a" stroke-width="2"/></svg>'
  };

  // ---------- OBJETS DES MINI-JEUX ----------
  // plage : chaque objet centré sur (0,0), environ 40 × 40
  const objets = {
    canette: '<g transform="rotate(70)"><rect x="-9" y="-16" width="18" height="32" rx="4" fill="#d8333a"/><rect x="-9" y="-16" width="18" height="5" rx="2" fill="#c9c9c9"/><rect x="-9" y="11" width="18" height="5" rx="2" fill="#c9c9c9"/><path d="M-5 -6 h10 M-5 2 h10" stroke="#fff" stroke-width="2.4"/></g>',
    bouteille: '<g transform="rotate(-62)"><path d="M-8 -8 C-8 -14 -4 -16 -4 -20 V-24 H4 V-20 C4 -16 8 -14 8 -8 V20 Q8 24 4 24 H-4 Q-8 24 -8 20Z" fill="#bfe8f5" fill-opacity=".85" stroke="#4a9fbd" stroke-width="2"/><rect x="-5" y="-29" width="10" height="6" rx="2" fill="#2f74c0"/><rect x="-8" y="0" width="16" height="9" fill="#5cb85c" opacity=".8"/></g>',
    megot: '<g transform="rotate(-18)"><rect x="-10" y="-3" width="13" height="6" rx="1.5" fill="#f2f0ea" stroke="#bbb" stroke-width="1"/><rect x="3" y="-3" width="8" height="6" rx="1.5" fill="#e3a052"/><circle cx="-10" cy="0" r="2.6" fill="#555"/></g>',
    gobelet: '<g transform="rotate(100)"><path d="M-11 -14 H11 L7 16 H-7Z" fill="#fff" stroke="#9fb3bb" stroke-width="2"/><path d="M-10 -6 H10" stroke="#e0553f" stroke-width="3"/></g>',
    chips: '<g transform="rotate(14)"><path d="M-14 -16 L14 -16 L12 -12 L14 16 L-14 16 L-12 12Z" fill="#ffcc33" stroke="#c98a00" stroke-width="2"/><circle cx="0" cy="0" r="7" fill="#e85d2c"/><path d="M-10 -12 h20" stroke="#c98a00" stroke-width="1.5"/></g>',
    sac: '<g><path d="M-16 -8 C-18 -20 -8 -22 -6 -14 M16 -8 C18 -20 8 -22 6 -14" fill="none" stroke="#e7f1f4" stroke-width="3"/><path d="M-18 -8 Q0 -14 18 -8 L14 18 Q0 24 -14 18Z" fill="#f4fbfd" fill-opacity=".9" stroke="#9ec4d0" stroke-width="2"/><path d="M-8 0 q8 6 16 0" stroke="#9ec4d0" stroke-width="1.5" fill="none"/></g>',
    coquillage: '<g><path d="M0 14 C-16 10 -18 -6 -8 -14 C0 -18 8 -18 14 -10 C20 0 12 12 0 14Z" fill="#fff0e0" stroke="#d9946a" stroke-width="2"/><path d="M0 12 L-6 -12 M0 12 L2 -15 M0 12 L9 -11 M0 12 L-12 -4" stroke="#e6ad86" stroke-width="1.6"/></g>',
    corailmort: '<g stroke="#f4efe6" stroke-width="6" stroke-linecap="round" fill="none"><path d="M-12 12 L0 0 L12 -10 M0 0 L-2 -14 M6 -5 L16 0"/><path d="M-12 12 L0 0 L12 -10" stroke="#ddd3c3" stroke-width="2"/></g>',
    bernard: '<g transform="scale(.5) translate(-60 -50)">' + '<path d="M52 62 C38 64 34 40 52 30 C72 20 94 34 90 56 C88 70 66 74 52 62Z" fill="#f6d9b0" stroke="#a5703f" stroke-width="3"/><path d="M58 56 C50 52 52 40 62 38 C74 36 80 48 72 56" fill="none" stroke="#a5703f" stroke-width="3"/><path d="M40 56 C30 52 24 56 22 62 C28 66 34 64 40 60Z" fill="#e8553a"/><g stroke="#d94a2e" stroke-width="5" stroke-linecap="round"><path d="M44 62 l-12 10 M48 66 l-8 12"/></g><circle cx="36" cy="35" r="5" fill="#1f1a33"/><circle cx="46" cy="33" r="5" fill="#1f1a33"/><path d="M42 52 l-6 -16 M46 52 l-2 -18" stroke="#a22a18" stroke-width="3"/></g>',
    chateau: '<g><path d="M-18 14 V-4 H-12 V-10 H-6 V-4 H6 V-10 H12 V-4 H18 V14Z" fill="#e9c98b" stroke="#c7a062" stroke-width="2"/><rect x="-4" y="-22" width="8" height="12" fill="#e9c98b" stroke="#c7a062" stroke-width="2"/><path d="M0 -22 V-32 L9 -29 L0 -26" fill="#e0553f" stroke="#a83a26" stroke-width="1"/><path d="M-4 14 V6 a4 4 0 0 1 8 0 V14" fill="#c7a062"/></g>'
  };
  // sac de plage : icônes 80 × 80
  const sacIco = {
    chapeau: '<svg viewBox="0 0 80 80"><ellipse cx="40" cy="52" rx="34" ry="10" fill="#e8c27a" stroke="#a07a3a" stroke-width="2.5"/><path d="M20 50 C20 26 60 26 60 50" fill="#f0d08e" stroke="#a07a3a" stroke-width="2.5"/><path d="M21 44 C30 48 50 48 59 44" stroke="#e0553f" stroke-width="5" fill="none"/></svg>',
    pain: '<svg viewBox="0 0 80 80"><g transform="rotate(-30 40 40)"><rect x="8" y="30" width="64" height="20" rx="10" fill="#e0a456" stroke="#9a6224" stroke-width="2.5"/><path d="M22 34 l6 12 M36 34 l6 12 M50 34 l6 12" stroke="#f6d39a" stroke-width="3" stroke-linecap="round"/></g><g fill="#0d6b78"><path d="M58 64 c4 -4 10 -4 14 0 c-4 4 -10 4 -14 0z M72 64 l5 -4 v8z"/></g></svg>',
    lycra: '<svg viewBox="0 0 80 80"><path d="M28 14 L16 18 L4 40 L14 46 L22 32 V68 H58 V32 L66 46 L76 40 L64 18 L52 14 C50 20 30 20 28 14Z" fill="#2fa7c4" stroke="#14637a" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 44 H58" stroke="#fff" stroke-width="3" opacity=".7"/></svg>',
    epuisette: '<svg viewBox="0 0 80 80"><path d="M12 72 L46 30" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><ellipse cx="56" cy="22" rx="16" ry="12" fill="none" stroke="#e0553f" stroke-width="4" transform="rotate(-40 56 22)"/><path d="M44 30 C46 46 62 46 68 30" fill="none" stroke="#999" stroke-width="1.5" stroke-dasharray="3 3"/></svg>',
    creme: '<svg viewBox="0 0 80 80"><rect x="26" y="16" width="28" height="50" rx="7" fill="#fffaf0" stroke="#d9946a" stroke-width="2.5"/><rect x="31" y="8" width="18" height="10" rx="3" fill="#19b3c4"/><circle cx="40" cy="38" r="9" fill="#ffd23f"/><text x="40" y="58" text-anchor="middle" font-size="8" font-weight="900" fill="#0b7480" font-family="system-ui,sans-serif">MINÉRALE</text></svg>',
    seau: '<svg viewBox="0 0 80 80"><path d="M18 30 H62 L56 68 H24Z" fill="#ff8a5c" stroke="#b44a26" stroke-width="2.5"/><path d="M18 30 C18 10 62 10 62 30" fill="none" stroke="#b44a26" stroke-width="2.5"/><path d="M30 30 c-4 -8 4 -12 8 -6 M46 30 c0 -8 10 -8 10 0" fill="#fff0e0" stroke="#d9946a" stroke-width="2"/></svg>',
    dechets: '<svg viewBox="0 0 80 80"><path d="M20 26 Q40 18 60 26 L56 68 Q40 74 24 68Z" fill="#3c4b52" stroke="#1d2a30" stroke-width="2.5"/><path d="M32 22 C34 10 46 10 48 22" fill="none" stroke="#1d2a30" stroke-width="3"/><path d="M32 44 l5 5 10 -12" stroke="#7fe0a0" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
    lunettes: '<svg viewBox="0 0 80 80"><path d="M6 36 H74" stroke="#222" stroke-width="3"/><rect x="10" y="32" width="26" height="18" rx="8" fill="#2a3a5a" stroke="#111" stroke-width="2.5"/><rect x="44" y="32" width="26" height="18" rx="8" fill="#2a3a5a" stroke="#111" stroke-width="2.5"/><path d="M16 38 l8 -2" stroke="#fff" stroke-width="2" opacity=".6"/></svg>',
    sacplage: '<svg viewBox="0 0 160 110" aria-hidden="true"><path d="M50 30 C50 4 110 4 110 30" fill="none" stroke="#a5703f" stroke-width="7"/><path d="M14 30 H146 L134 104 H26Z" fill="#f4e1b5" stroke="#a5703f" stroke-width="3.5" stroke-linejoin="round"/><path d="M20 52 H140 M23 72 H137" stroke="#e0553f" stroke-width="8" opacity=".85"/><path d="M14 30 H146" stroke="#a5703f" stroke-width="5"/></svg>'
  };

  // ---------- petites icônes ----------
  const ICO = {
    pip: on => '<svg class="pip' + (on ? " on" : "") + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 C17 2 21 6 21 11 C21 17 16 21 12 22 C8 21 3 17 3 11 C3 6 7 2 12 2Z" fill="currentColor"/><path d="M12 21 L8 5 M12 21 L12 3.5 M12 21 L16 5" stroke="#fff" stroke-width="1.2" opacity=".7"/></svg>',
    marque: () => '<svg viewBox="0 0 200 190" aria-hidden="true"><path d="M100 10 C146 10 162 46 159 80 C157 106 140 126 100 126 C60 126 43 106 41 80 C38 46 54 10 100 10 Z" fill="#ee6249"/><g fill="#ee6249"><path d="M60 110 C40 140 30 160 50 176 C56 160 70 140 80 120Z"/><path d="M140 110 C160 140 170 160 150 176 C144 160 130 140 120 120Z"/><path d="M88 120 C84 150 80 170 96 182 C98 160 100 140 104 122Z"/></g><circle cx="80" cy="90" r="14" fill="#fff"/><circle cx="120" cy="90" r="14" fill="#fff"/><circle cx="82" cy="92" r="7" fill="#1f1a33"/><circle cx="118" cy="92" r="7" fill="#1f1a33"/></svg>',
    cadenas: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10.5" rx="3" fill="currentColor"/><path d="M8.2 10.5V8a3.8 3.8 0 0 1 7.6 0v2.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>',
    etoile: on => '<svg viewBox="0 0 24 24" class="etoile' + (on ? " on" : "") + '" aria-hidden="true"><path d="M12 2.5 l2.9 6.1 6.6.8 -4.9 4.6 1.3 6.6 L12 17.3 6.1 20.6 7.4 14 2.5 9.4 l6.6 -.8Z"/></svg>'
  };

  // ---------- icône de l'appli (générée en PNG par tests/generer-icones.py) ----------
  function icone(arrondi, echelle) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
      '<defs><radialGradient id="ic-mer" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#3ad6d6"/><stop offset=".55" stop-color="#0b8796"/><stop offset="1" stop-color="#05384a"/></radialGradient></defs>' +
      '<clipPath id="ic-cl"><rect width="512" height="512" rx="' + arrondi + '"/></clipPath><g clip-path="url(#ic-cl)"><rect width="512" height="512" fill="url(#ic-mer)"/>' +
      '<path d="M-20 430 Q64 410 148 430 T316 430 T484 430 T652 430 V520 H-20Z" fill="#f4e1b5"/>' +
      '<g fill="none" stroke="#e8fdff" stroke-width="7" opacity=".7"><circle cx="418" cy="110" r="16"/><circle cx="446" cy="66" r="9"/></g>' +
      '<g transform="translate(256 262) scale(' + echelle + ') translate(-100 -100)">' + zouzou("content", "").replace(/<svg[^>]*>/, "").replace("</svg>", "").replace(/<rect class="paupiere"[^>]*\/>/g, "") + '</g></g></svg>';
  }

  window.Art = { zouzou, accueil, carte, habitants, objets, sacIco, ICO, icone };
})();
