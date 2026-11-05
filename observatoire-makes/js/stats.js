/* ============================================================
   STATS.JS — « Tableau de bord · Observatoire des Makes » (APERÇU,
   écran ?station=stats). Deux vues :
   · « Exemple » (par défaut) : données FICTIVES DE DÉMONSTRATION, signalées
     par un bandeau collant — aucun chiffre réel de l'Observatoire.
   · « Ce téléphone » : les compteurs anonymes RÉELS enregistrés localement
     par cette démo (storage.js), rien n'est envoyé.
   Graphiques en HTML/CSS maison. Palette validée daltonisme :
   bleu #4c7dff · ambre #f5a524 · sarcelle #19b3a6.
   ============================================================ */
(function () {
  "use strict";
  const typo = s => String(s).replace(/ ([!?;:»])/g, " $1").replace(/« /g, "« ");
  const esc = s => typo(String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
  const nb = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const SEUIL = 60;
  const ETAPES = ["Jaï Sing · l'axe du Monde", "Coupoles · ouvre la coupole", "Newton · le bon télescope", "Ptolémée · l'ombre à l'envers", "Einstein · le système solaire", "Soirée · le ciel de Ti-Komèt"];
  const QUESTIONS = [
    { e: 1, n: "Hauteur du pôle = latitude du lieu", appli: true },
    { e: 2, n: "Le ciel tourne à cause de la rotation de la Terre", appli: true },
    { e: 3, n: "Plus le diamètre est grand, plus on capte de lumière", appli: false },
    { e: 4, n: "Heure solaire ≠ heure du téléphone", appli: false },
    { e: 5, n: "Distances dans le système solaire (échelle)", appli: false },
    { e: 6, n: "La pollution lumineuse cache les étoiles", appli: false }
  ];
  // EXEMPLE FICTIF : chiffres inventés pour montrer la forme du tableau de bord
  const EX = {
    periode: "Exemple · un mois de visites", sessions: 1240, classes: 18, eleves: 486, duree: "34 min", note: "4,7 / 5",
    publics: [["Familles", 52], ["Classes", 33], ["Soirées et vacances", 15]],
    langues: [["Français", 71], ["Kréol", 17], ["Anglais", 12]],
    etapes: [96, 91, 88, 84, 79, 64], durees: [6, 7, 6, 8, 7, 9],
    retenu: [82, 74, 69, 58, 66, 77],
    visee: [61, 39],
    heures: [12, 30, 26, 8, 4, 2, 3, 6, 18, 22, 14, 5] // 9 h → 23 h, par tranche
  };
  function barres(liste, couleur) {
    return '<ul class="tb-barres">' + liste.map((x, i) => '<li><span class="tb-l">' + esc(x[0]) + '</span><span class="tb-b"><i style="width:' + x[1] + '%;background:' + (couleur || ["#4c7dff", "#f5a524", "#19b3a6"][i % 3]) + '"></i></span><b>' + x[1] + ' %</b></li>').join("") + '</ul>';
  }
  function html(opts) {
    const reel = opts.vue === "telephone", S = Store.Stats.lire();
    const kpi = (v, l) => '<div class="tb-kpi"><b>' + v + '</b><small>' + esc(l) + '</small></div>';
    const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
    let corps;
    if (!reel) {
      corps = '<div class="tb-kpis">' + kpi(nb(EX.sessions), "parties lancées") + kpi(EX.classes, "classes") + kpi(EX.duree, "durée moyenne") + kpi(EX.note, "avis des familles") + '</div>' +
        '<section class="tb-carte"><h3>Qui joue ?</h3>' + barres(EX.publics) + '<h4>Langues choisies</h4>' + barres(EX.langues) + '</section>' +
        '<section class="tb-carte"><h3>Le parcours, étape par étape</h3><p class="tb-note">Part des joueurs qui terminent chaque étape · durée moyenne sur place.</p><ul class="tb-barres">' +
        ETAPES.map((e, i) => '<li><span class="tb-l">' + (i + 1) + ' · ' + esc(e) + '</span><span class="tb-b"><i style="width:' + EX.etapes[i] + '%;background:#4c7dff"></i></span><b>' + EX.etapes[i] + ' %</b><small class="tb-min">' + EX.durees[i] + ' min</small></li>').join("") + '</ul></section>' +
        '<section class="tb-carte"><h3>Ce que les visiteurs ont retenu</h3><p class="tb-note">Bonne réponse du premier coup. En dessous de ' + SEUIL + ' % : notion à renforcer avec l\'équipe.</p><ul class="tb-retenu">' +
        QUESTIONS.map((q, i) => { const v = EX.retenu[i]; return '<li class="' + (v < SEUIL ? "faible" : "") + '"><span><b>Étape ' + q.e + '</b> · ' + esc(q.n) + (q.appli ? "" : ' <em>(question proposée)</em>') + '</span><span class="tb-jauge"><i style="width:' + v + '%"></i></span><b>' + v + ' %</b></li>'; }).join("") + '</ul></section>' +
        '<section class="tb-carte"><h3>Visée du ciel</h3>' + barres([["Avec la boussole du téléphone", EX.visee[0]], ["En faisant glisser le ciel", EX.visee[1]]], "#19b3a6") + '</section>' +
        '<section class="tb-carte"><h3>Quand joue-t-on ?</h3><div class="tb-heures">' + EX.heures.map((v, i) => '<span style="height:' + (8 + v * 2.6) + 'px" title="' + (9 + i) + ' h"></span>').join("") + '</div><p class="tb-axe"><span>9 h</span><span>visite de jour</span><span>soirée</span><span>23 h</span></p></section>' +
        '<section class="tb-carte"><h3>Classes</h3><p>' + EX.classes + ' classes · ' + EX.eleves + ' élèves · cycle 3 : 11 · cycle 4 : 7</p><p class="tb-note">Préparation en classe avant la venue : 12 classes sur 18 (fiche « avant »).</p></section>';
    } else {
      const fin = k => S.fin[k] || 0, deb = k => S.debut[k] || 0;
      corps = '<div class="tb-kpis">' + kpi(S.sessions, "parties lancées") + kpi(fin(1) + fin(2), "étapes terminées") + kpi(S.findemo, "fins de démo") + kpi(S.capteurs + S.glisser, "visées réussies") + '</div>' +
        '<section class="tb-carte"><h3>Sur ce téléphone</h3><ul class="tb-barres">' +
        [1, 2].map(i => '<li><span class="tb-l">' + i + ' · ' + esc(ETAPES[i - 1]) + '</span><span class="tb-b"><i style="width:' + pct(fin(i), deb(i)) + '%;background:#4c7dff"></i></span><b>' + fin(i) + '/' + deb(i) + '</b><small class="tb-min">' + (fin(i) ? Math.round(S.duree[i] / fin(i) / 6) / 10 + " min" : "–") + '</small></li>').join("") + '</ul>' +
        '<h4>Bonne réponse du premier coup</h4><ul class="tb-barres">' + [1, 2].map(i => '<li><span class="tb-l">Étape ' + i + '</span><span class="tb-b"><i style="width:' + pct(S.quizOk1[i] || 0, S.quizN[i] || 0) + '%;background:#19b3a6"></i></span><b>' + (S.quizOk1[i] || 0) + '/' + (S.quizN[i] || 0) + '</b></li>').join("") + '</ul>' +
        '<h4>Publics et langues</h4><p>' + (Object.keys(S.publics).map(k => esc(k) + " : " + S.publics[k]).join(" · ") || "–") + '<br>' + (Object.keys(S.langues).map(k => k.toUpperCase() + " : " + S.langues[k]).join(" · ") || "–") + '</p>' +
        '<p class="tb-note">Compteurs anonymes, enregistrés seulement sur ce téléphone (aucun envoi). Dans l\'application complète : agrégés pour toute l\'Observatoire, sans donnée personnelle.</p>' +
        '<button class="btn sec" data-act="steffacer">Effacer ces compteurs</button></section>';
    }
    return (reel ? "" : '<div class="tb-fictif" role="note">DONNÉES FICTIVES DE DÉMONSTRATION</div>') + (opts.retour || "") +
      '<div class="tb"><span class="kicker">Aperçu · application complète</span><h2>Tableau de bord · Observatoire des Makes</h2>' +
      '<div class="seg tb-vue" role="group" aria-label="Vue"><button class="btn mini" data-act="stvue" data-v="exemple" aria-pressed="' + !reel + '">Exemple</button><button class="btn mini" data-act="stvue" data-v="telephone" aria-pressed="' + reel + '">Ce téléphone (réel)</button></div>' +
      '<p class="tb-per">' + (reel ? "Depuis l'ouverture de la démo sur ce téléphone" : esc(EX.periode) + " · chiffres inventés pour montrer la forme") + '</p>' + corps +
      '<section class="tb-carte tb-export"><h3>Exporter</h3><div class="rang-btn"><button class="btn sec" data-act="stexport">PDF mensuel</button><button class="btn sec" data-act="stexport">Tableur (CSV)</button></div><p class="tb-note">Disponible dans l\'application complète.</p></section></div>';
  }
  window.Tableau = { html };
})();
