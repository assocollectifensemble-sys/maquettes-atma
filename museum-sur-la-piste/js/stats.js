/* ============================================================
   STATS.JS — Aperçu du tableau de bord du Muséum (?station=stats).
   Deux vues :
   - « Exemple » (par défaut) : DONNÉES FICTIVES DE DÉMONSTRATION,
     bandeau collant sur tout l'écran ;
   - « Ce téléphone » : les vrais compteurs anonymes enregistrés
     localement par storage.js (Store.Stats).
   L'application complète regroupera ces compteurs de façon anonyme
   (zéro donnée personnelle, zéro compte).
   ============================================================ */
(function () {
  "use strict";
  let exemple = true;
  const FICTIF = {
    departs: 1240, fins: 860, duree: 38,
    publics: [["Familles", 58], ["Classes (tablette de groupe)", 31], ["Événements (Nuit des musées)", 11]],
    langues: [["Français", 71], ["Kréol", 17], ["English", 12]],
    etapes: [["1 · L'énigme du Solitaire", 96, 9], ["2 · Les îles sœurs", 91, 8], ["3 · De la montagne au lagon", 84, 7], ["4 · À chaque bec son repas", 79, 6], ["5 · Le poisson venu des fossiles", 74, 7], ["★ · Éteins la ville !", 69, 6]],
    retenu: [["Le Solitaire était un ibis", 88], ["Le dodo vivait à Maurice", 93], ["Éteindre les lumières aide les pétrels", 81]],
    heures: [12, 26, 41, 38, 22, 34, 48, 44, 19]
  };
  function barres(liste, unite) {
    return '<ul class="sb-barres">' + liste.map(x => '<li><span class="sb-l">' + x[0] + '</span><span class="sb-rail"><i style="width:' + Math.min(100, x[1]) + '%"></i></span><b>' + x[1] + (unite || " %") + '</b></li>').join("") + '</ul>';
  }
  function vueExemple() {
    const F = FICTIF;
    return '<div class="sb-kpi"><div><b>' + F.departs.toLocaleString("fr-FR") + '</b><small>départs d\'aventure</small></div><div><b>' + Math.round(F.fins / F.departs * 100) + ' %</b><small>vont jusqu\'au bout</small></div><div><b>' + F.duree + ' min</b><small>durée moyenne</small></div></div>' +
      '<section class="card"><h3>Publics</h3>' + barres(F.publics) + '</section>' +
      '<section class="card"><h3>Langues choisies</h3>' + barres(F.langues) + '</section>' +
      '<section class="card"><h3>Parcours étape par étape</h3><p class="small dim">Part des visiteurs qui terminent l\'étape · temps moyen</p><ul class="sb-barres">' + F.etapes.map(x => '<li><span class="sb-l">' + x[0] + '</span><span class="sb-rail"><i style="width:' + x[1] + '%"></i></span><b>' + x[1] + ' % · ' + x[2] + ' min</b></li>').join("") + '</ul></section>' +
      '<section class="card"><h3>Ce que les visiteurs ont retenu</h3><p class="small dim">Bonnes réponses du premier coup</p>' + barres(F.retenu) + '</section>' +
      '<section class="card"><h3>Affluence dans la journée</h3><div class="sb-heures">' + F.heures.map((h, i) => '<span style="height:' + h * 1.6 + 'px" title="' + (9 + i) + ' h"><small>' + (9 + i) + 'h</small></span>').join("") + '</div></section>';
  }
  function vueLocale() {
    const s = Store.Stats.lire(), pc = (a, b) => b ? Math.round(a / b * 100) : 0, q = id => s.quiz[id] || { ok: 0, n: 0 };
    const tot = o => Object.values(o).reduce((a, b) => a + b, 0);
    const liste = (o, noms) => { const t = tot(o); return Object.keys(o).length ? barres(Object.keys(o).map(k => [noms[k] || k, pc(o[k], t)])) : '<p class="small dim">En attente des premières parties sur ce téléphone.</p>'; };
    return '<div class="sb-kpi"><div><b>' + s.lancements + '</b><small>ouvertures de l\'appli</small></div><div><b>' + s.departs + '</b><small>départs d\'aventure</small></div><div><b>' + s.fins + '</b><small>fins de démo</small></div></div>' +
      '<section class="card"><h3>Étapes terminées</h3>' + barres([["1 · L'énigme du Solitaire", s.etapes["1"] || 0], ["2 · Les îles sœurs", s.etapes["2"] || 0]], " fois") +
      '<p class="small dim">Durée moyenne : étape 1 ≈ ' + (s.etapes["1"] ? Math.round(s.durees["1"] / s.etapes["1"] / 60 * 10) / 10 : "–") + ' min · étape 2 ≈ ' + (s.etapes["2"] ? Math.round(s.durees["2"] / s.etapes["2"] / 60 * 10) / 10 : "–") + ' min</p></section>' +
      '<section class="card"><h3>Bonnes réponses du premier coup</h3>' + barres([["Étape 1 · os → ibis", pc(q("1").ok, q("1").n)], ["Étape 2 · cousin du dodo", pc(q("2").ok, q("2").n)]]) + '</section>' +
      '<section class="card"><h3>Langues</h3>' + liste(s.langues, { fr: "Français", kr: "Kréol", en: "English" }) + '</section>' +
      '<section class="card"><h3>Publics</h3>' + liste(s.publics, { famille: "Familles", classe: "Classes", "classe-tablette": "Classes · tablette de groupe" }) + '</section>';
  }
  function ecran(h) {
    return h.flecheRetour("projet") + '<div class="stats-ecran' + (exemple ? " fictif" : "") + '">' + (exemple ? '<div class="bandeau-fictif" role="note">DONNÉES FICTIVES DE DÉMONSTRATION</div>' : "") +
      '<span class="kicker">Tableau de bord · Muséum d\'histoire naturelle</span><h2>Aperçu des statistiques</h2>' +
      '<div class="seg sb-seg" role="group" aria-label="Vue"><button class="btn mini" data-act="stexemple" aria-pressed="' + exemple + '">Exemple (fictif)</button><button class="btn mini" data-act="stexemple" aria-pressed="' + !exemple + '">Ce téléphone (réel)</button></div>' +
      (exemple ? '<p class="small dim">' + h.esc("Chiffres inventés, pour montrer à quoi ressemblera le tableau de bord une fois l'appli en service.") + '</p>' : '<p class="small dim">' + h.esc("Compteurs anonymes enregistrés sur ce téléphone pendant la démo.") + '</p>') +
      (exemple ? vueExemple() : vueLocale()) +
      '<p class="small dim center">' + h.esc("Anonyme par conception : zéro compte, zéro donnée personnelle. Exports PDF et tableur dans l'application complète.") + '</p></div>';
  }
  window.Stats = { ecran, basculer() { exemple = !exemple; }, exemple: () => exemple };
})();
