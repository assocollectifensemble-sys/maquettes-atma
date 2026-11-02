/* ART.JS — illustrations SVG maison : scène de lagon, Zouzou la zourite (personnage fictif), paddle. */
(function () {
  "use strict";
  const exprs = {
    triste: { b: '<path d="M44 66q6-5 12 0M64 66q6-5 12 0" stroke="#2a1530" stroke-width="2.4" fill="none" stroke-linecap="round"/>', o: 'M52 82q8-6 16 0' },
    clin: { b: '<circle cx="50" cy="64" r="5" fill="#fff"/><circle cx="51" cy="65" r="2.6" fill="#2a1530"/><path d="M64 64q6-5 12 0" stroke="#2a1530" stroke-width="2.6" fill="none" stroke-linecap="round"/>', o: 'M50 80q10 8 20 0' },
    content: { b: '<circle cx="50" cy="64" r="5" fill="#fff"/><circle cx="51" cy="65" r="2.6" fill="#2a1530"/><circle cx="70" cy="64" r="5" fill="#fff"/><circle cx="69" cy="65" r="2.6" fill="#2a1530"/>', o: 'M50 80q10 8 20 0' },
    fete: { b: '<path d="M44 66q6-8 12 0M64 66q6-8 12 0" stroke="#2a1530" stroke-width="2.6" fill="none" stroke-linecap="round"/>', o: 'M48 78q12 14 24 0z' }
  };
  function zouzou(expr, taille) {
    const e = exprs[expr] || exprs.content; taille = taille || 96;
    return '<svg class="zouzou" width="' + taille + '" height="' + taille + '" viewBox="0 0 120 120" role="img" aria-label="Zouzou la zourite">' +
      '<g fill="#f08a6b"><path d="M22 96c-8 6-2 16 6 12 6-3 6-9 12-10zM42 104c-4 8 4 14 10 8 3-3 2-8 4-10zM78 98c2 2 2 7 5 10 6 6 14 0 10-8zM98 96c6 3 6 8 12 10 8 4 14-6 6-12z"/><ellipse cx="60" cy="62" rx="38" ry="40"/></g>' +
      '<g fill="#f7a58a"><circle cx="40" cy="42" r="5"/><circle cx="58" cy="32" r="4"/><circle cx="80" cy="44" r="5"/></g>' + e.b +
      '<path d="' + e.o + '" stroke="#2a1530" stroke-width="2.6" fill="' + (expr === 'fete' ? '#7a2335' : 'none') + '" stroke-linecap="round"/></svg>';
  }
  function scene(clair) {
    return '<svg class="scene" viewBox="0 0 390 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<rect width="390" height="150" fill="' + (clair ? '#bfeef0' : '#0a5a6b') + '"/><circle cx="318" cy="38" r="22" fill="#ffd36e"/>' +
      '<path d="M0 78q40-12 80 0t80 0t80 0t80 0t80 0v72H0z" fill="#26b3b8"/><path d="M0 100q40-12 80 0t80 0t80 0t80 0t80 0v50H0z" fill="#1b8f9c"/>' +
      '<path d="M0 128q60-14 120 0t120 0t150 0v22H0z" fill="#f3e3b8"/>' +
      '<g fill="#ff7a6b"><path d="M40 120v-16m0 6l-9-9m9 14l10-10" stroke="#ff7a6b" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g stroke="#ff9e8e" stroke-width="5" stroke-linecap="round"><path d="M96 124v-20m0 8l-8-8m8 14l9-9"/></g>' +
      '<path d="M250 108q10-26 20 0z" fill="#fff" opacity=".9"/><path d="M260 108v10" stroke="#fff" stroke-width="2"/></svg>';
  }
  function paddle() { return '<svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true"><ellipse cx="20" cy="26" rx="16" ry="6" fill="#ffd36e"/><circle cx="20" cy="14" r="5" fill="#f08a6b"/><path d="M8 8l24 28" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>'; }
  window.Art = { zouzou, scene, paddle };
})();
