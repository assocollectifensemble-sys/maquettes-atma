/* ============================================================
   ART.JS — Décors SVG paramétrés par l'hôtel (aucune image externe).
   Art.scene(H.decor, perso)  : paysage animé (accueil, page projet, intro)
   Art.carte(H)               : carte illustrée des lieux de l'hôtel
   Art.badge(H)               : médaille de fin
   Les personnages et les détails propres à chaque hôtel sont dans contenu/<hotel>.js (H.perso, H.decor.extra…).
   ============================================================ */
(function () {
  "use strict";
  let uid = 0;
  const id = p => p + (++uid);

  function palmier(x, y, h, sens) {
    const s = sens || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ' 1)">' +
      '<path d="M0 0 q' + (-6) + ' ' + (-h / 2) + ' ' + 8 + ' ' + (-h) + '" fill="none" stroke="#8a6440" stroke-width="7" stroke-linecap="round"/>' +
      '<g class="palme" transform="translate(8 ' + (-h) + ')"><g fill="#2f9e5a">' +
      '<path d="M0 0 q-30 -18 -52 4 q24 -8 52 -4z"/><path d="M0 0 q-14 -32 -44 -30 q26 8 44 30z"/><path d="M0 0 q16 -30 44 -26 q-26 6 -44 26z"/><path d="M0 0 q32 -12 52 10 q-24 -8 -52 -10z"/><path d="M0 0 q4 -30 -6 -44 q12 18 6 44z"/></g>' +
      '<circle cx="-3" cy="4" r="4" fill="#7a5230"/><circle cx="4" cy="5" r="4" fill="#7a5230"/></g></g>';
  }
  function nuage(x, y, s) { return '<g class="nuage" style="animation-delay:-' + (x / 10) + 's"><g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="#fff" opacity=".9"><ellipse cx="0" cy="0" rx="26" ry="11"/><ellipse cx="16" cy="-6" rx="16" ry="11"/><ellipse cx="-14" cy="-4" rx="12" ry="9"/></g></g>'; }
  function oiseau(x, y) { return '<g class="vole" style="animation-delay:-' + x / 30 + 's"><path transform="translate(0 ' + y + ')" d="M0 0 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#28414d" stroke-width="2.2" stroke-linecap="round"/></g>'; }
  function poisson(c, y, d) { return '<g class="nage" style="animation-delay:' + d + 's"><g transform="translate(0 ' + y + ')"><path d="M0 0 q10 -8 20 0 q-10 8 -20 0z M18 0 l8 -6 v12z" fill="' + c + '"/><circle cx="5" cy="-1" r="1.4" fill="#123"/></g></g>'; }

  /* ---------- paysage ----------
     d = { ciel:[haut,bas], soleil, montagne, mer:"lagon"|"large", merC:[..], recif:true, sable, sableC2, palmiers:[[x,y,h,sens]], extraFond, extra } */
  function scene(d, perso, opts) {
    opts = opts || {};
    const W = 360, Hh = opts.h || 330;
    const g1 = id("ciel"), g2 = id("mer"), g3 = id("sab");
    const horizon = d.horizon || 120, plage = d.plage || 230;
    let s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + (opts.label || "Décor de l'aventure") + '" preserveAspectRatio="xMidYMid slice">' +
      '<defs><linearGradient id="' + g1 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + d.ciel[0] + '"/><stop offset="1" stop-color="' + d.ciel[1] + '"/></linearGradient>' +
      '<linearGradient id="' + g2 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + d.merC[0] + '"/><stop offset="1" stop-color="' + d.merC[1] + '"/></linearGradient>' +
      '<linearGradient id="' + g3 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + d.sable + '"/><stop offset="1" stop-color="' + (d.sableC2 || d.sable) + '"/></linearGradient></defs>' +
      '<rect width="' + W + '" height="' + Hh + '" fill="url(#' + g1 + ')"/>' +
      '<g class="tourne-lent"><circle cx="' + (d.soleilX || 290) + '" cy="52" r="34" fill="#fff4c2" opacity=".45"/></g><circle cx="' + (d.soleilX || 290) + '" cy="52" r="22" fill="' + (d.soleil || "#ffd166") + '"/>' +
      nuage(60, 40, 1) + nuage(200, 70, .7) + oiseau(40, 64) + oiseau(120, 84);
    if (d.montagne) s += '<path d="' + d.montagne + '" fill="' + (d.montagneC || "#4f8a6b") + '"/>';
    s += '<rect y="' + horizon + '" width="' + W + '" height="' + (Hh - horizon) + '" fill="url(#' + g2 + ')"/>';
    if (d.mer === "lagon") {
      // barrière de corail avec les vagues qui déferlent, puis le lagon turquoise
      s += '<path d="M0 ' + (horizon + 18) + ' q30 -6 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 v8 h-360z" fill="#fff" opacity=".85" class="ressac"/>' +
        '<path d="M-10 ' + (horizon + 26) + ' q30 -5 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#fff" stroke-width="2" opacity=".6" class="vague-anim"/>' +
        '<rect y="' + (horizon + 28) + '" width="' + W + '" height="' + (plage - horizon - 28) + '" fill="' + d.lagon + '" opacity=".85"/>';
      if (d.recif) s += [[40, 170], [110, 190], [190, 175], [265, 195], [320, 168]].map(p => '<g opacity=".7" transform="translate(' + p[0] + ' ' + (p[1] - 120 + horizon) + ')"><ellipse rx="22" ry="7" fill="#c46f8a"/><ellipse cx="12" cy="-2" rx="10" ry="5" fill="#e3a14a"/><ellipse cx="-10" cy="2" rx="8" ry="4" fill="#7c5bb0"/></g>').join("");
      s += poisson("#ffb703", horizon + 60, -2) + poisson("#fb5607", horizon + 84, -6);
    } else {
      s += [0, 1, 2, 3].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-20 ' + (horizon + 18 + i * 22) + ' q20 -7 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#fff" stroke-width="2" opacity="' + (.35 + i * .1) + '"/>').join("");
    }
    s += (d.extraFond || "");
    // plage
    s += '<path d="M0 ' + (plage + 6) + ' q90 -18 180 -6 t180 -4 V' + Hh + ' H0z" fill="url(#' + g3 + ')"/>' +
      '<path class="ressac" d="M0 ' + (plage + 6) + ' q90 -18 180 -6 t180 -4" fill="none" stroke="#fff" stroke-width="5" opacity=".8"/>';
    (d.palmiers || []).forEach(p => { s += palmier(p[0], p[1], p[2], p[3]); });
    s += (d.extra || "");
    if (perso) s += '<g transform="translate(' + (opts.px || 104) + ' ' + (opts.py || (Hh - 176)) + ') scale(' + (opts.ps || .8) + ')"><g class="flotte">' + perso + '</g></g>';
    return s + '</svg>';
  }

  /* ---------- carte des lieux ----------  H.carte = { fond (svg string), lieux: [{x,y,etape}] } */
  function carte(H, faits) {
    const C = H.carte;
    let s = '<svg viewBox="0 0 360 440" role="img" aria-label="Carte des lieux de l\'aventure">' + C.fond;
    const pts = H.etapes.map(e => [e.x, e.y]);
    s += '<path d="M' + pts.map(p => p.join(" ")).join(" L") + '" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="2 10" stroke-linecap="round" opacity=".95"/>';
    H.etapes.forEach((e, i) => {
      const n = i + 1, ok = faits[e.id], jouable = !!e.jeu;
      const coul = ok ? "#2fbf71" : jouable ? H.couleurs.c2 : "#8f9aa3";
      s += '<g class="pin" data-act="etape" data-id="' + e.id + '" tabindex="0" role="button" aria-label="Étape ' + n + ' : ' + e.lieu + '">' +
        (jouable && !ok ? '<circle class="halo" cx="' + e.x + '" cy="' + e.y + '" r="22" fill="' + coul + '" opacity=".5"/>' : "") +
        '<circle cx="' + e.x + '" cy="' + e.y + '" r="19" fill="' + coul + '" stroke="#fff" stroke-width="4"/>' +
        '<text x="' + e.x + '" y="' + (e.y + 6) + '" text-anchor="middle" font-size="17" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">' + (ok ? "✓" : jouable ? n : "🔒") + '</text>' +
        '<g transform="translate(' + e.x + ' ' + (e.y + 39) + ')"><rect x="' + (-e.lieuCourt.length * 3.6 - 8) + '" y="-11" width="' + (e.lieuCourt.length * 7.2 + 16) + '" height="20" rx="10" fill="rgba(255,255,255,.92)"/><text y="4" text-anchor="middle" font-size="12" font-weight="800" fill="#16323c" font-family="system-ui,sans-serif">' + e.lieuCourt + '</text></g></g>';
    });
    if (C.perso) s += C.perso;
    return s + '</svg>';
  }

  /* ---------- badge final ---------- */
  function badge(H) {
    const c = H.couleurs, g = id("bd");
    let rayons = "";
    for (let i = 0; i < 16; i++) rayons += '<path d="M100 100 L' + (100 + 98 * Math.cos(i * Math.PI / 8 - .1)) + ' ' + (100 + 98 * Math.sin(i * Math.PI / 8 - .1)) + ' L' + (100 + 98 * Math.cos(i * Math.PI / 8 + .1)) + ' ' + (100 + 98 * Math.sin(i * Math.PI / 8 + .1)) + 'z" fill="#fff" opacity=".18"/>';
    return '<svg class="badge-svg" viewBox="0 0 200 200" role="img" aria-label="Badge ' + H.badge.titre + '"><defs><radialGradient id="' + g + '"><stop offset="0" stop-color="' + c.clair + '"/><stop offset="1" stop-color="' + c.c1 + '"/></radialGradient></defs>' +
      '<g class="tourne-lent">' + rayons + '</g>' +
      '<path d="M62 150 l-14 44 l20 -8 l12 16 l10 -40z M138 150 l14 44 l-20 -8 l-12 16 l-10 -40z" fill="' + c.c2 + '"/>' +
      '<circle cx="100" cy="96" r="70" fill="' + c.accent + '"/><circle cx="100" cy="96" r="62" fill="url(#' + g + ')" stroke="#fff" stroke-width="4"/>' +
      '<g transform="translate(57 50) scale(.43)">' + H.perso("joie") + '</g>' +
      '<path d="M30 132 q70 22 140 0 l-6 22 q-64 18 -128 0z" fill="' + c.c2 + '" stroke="#fff" stroke-width="3"/>' +
      '<text x="100" y="152" text-anchor="middle" font-size="13.5" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">' + H.badge.court + '</text></svg>';
  }

  window.Art = { scene, carte, badge, palmier, nuage, poisson };
})();
