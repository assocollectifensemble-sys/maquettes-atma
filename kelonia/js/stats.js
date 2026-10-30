/* ============================================================
   STATS.JS — « Tableau de bord · Kélonia » (APERÇU, écran ?station=stats).
   Par défaut : VIDE (« en attente des premières visites ») — aucun faux chiffre.
   Interrupteur « Voir un exemple rempli » : données FICTIVES, signalées par un bandeau.
   Graphiques en HTML/CSS/SVG maison (aucune bibliothèque).
   Palette des séries (validée daltonisme) : sarcelle #00929f · corail #e0553f · indigo #3b5bb5.
   Les questions des bassins 1 et 4 sont celles de l'appli (content.js) ; 2, 3 et 5 sont PROPOSÉES,
   à réécrire avec le service éducatif.
   ============================================================ */
(function () {
  "use strict";
  const C = window.Content;
  const typo = s => String(s).replace(/ ([!?;:»])/g, " $1").replace(/« /g, "« ");
  const esc = s => typo(String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
  const SERIES = ["#00929f", "#e0553f", "#3b5bb5"];
  const SEUIL = 60; // en dessous : « notion à renforcer »
  const nb = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // ---------- questions « Ce que les visiteurs ont retenu » ----------
  const quizAppli = id => { const q = C.stations[id - 1].quiz; return { q: q.q.fr, ok: q.opts[q.ok].fr, faux: q.opts.filter((o, i) => i !== q.ok).map(o => o.fr), appli: true }; };
  const QUESTIONS = [
    Object.assign({ id: 1, notion: "La capture accidentelle par la pêche" }, quizAppli(1)),
    { id: 2, notion: "Le plastique, piège pour les tortues", q: "Pourquoi une tortue peut-elle avaler un sac plastique ?", ok: "Dans l'eau, il peut ressembler à une méduse", faux: ["Le plastique est une nourriture pour elle", "Elle s'en sert pour se cacher"] },
    { id: 3, notion: "La photo-identification", q: "Comment Kélonia reconnaît-elle une tortue sans la toucher ?", ok: "Au dessin des écailles de sa tête", faux: ["À la couleur de sa carapace", "À sa taille"] },
    Object.assign({ id: 4, notion: "La tortue marine est un reptile : elle respire avec des poumons" }, quizAppli(4)),
    { id: 5, notion: "La pollution lumineuse et les plages de ponte", q: "La nuit, près d'une plage de ponte, que faire des lumières ?", ok: "Les éteindre, ou une lumière jaune tournée vers le sol", faux: ["Les allumer plus fort pour guider les bébés", "Rien : elles ne gênent pas les tortues"] }
  ];

  // ---------- EXEMPLE FICTIF (montré seulement avec l'interrupteur) ----------
  const EX = {
    lancees: 1248, terminees: 812, duree: 34, horsLigne: 38, acces: [72, 28],
    jours: [22, 31, 28, 19, 35, 61, 74, 30, 26, 33, 24, 38, 66, 79, 27, 29, 36, 31, 42, 70, 88, 34, 30, 25, 37, 40, 72, 95, 33, 28],
    publics: [54, 28, 18], langues: [71, 17, 12],
    temps: [6.5, 7.8, 5.2, 4.6, 6.9],
    entonnoir: [100, 94, 89, 79, 76, 71, 65],
    heures: [4, 11, 15, 9, 6, 12, 18, 16, 9],
    reussite: [88, 47, 71, 54, 82], erreurs: [6, 31, 22, 34, 11], // % de la réponse fausse la plus choisie
    classes: 14, equipes: 61, notionsClasse: [76, 58],
    note: 4.6, avis: 183,
    mots: [["les enfants ont adoré", 5], ["Kawann", 4], ["la radio", 3], ["ludique", 3], ["en créole", 2], ["trop court", 2], ["bébés tortues", 2], ["sans réseau", 1]]
  };

  function html(o) {
    const ex = !!o.exemple, V = (v, suf) => ex ? '<span class="tb-val">' + v + (suf ? '<small>' + suf + '</small>' : "") + '</span>' : '<span class="tb-val vide" aria-label="pas encore de donnée">—</span>';
    const tete = (ico, titre, sous, cls) => '<header class="tb-ch' + (cls ? " " + cls : "") + '"><span class="tb-ico" aria-hidden="true">' + ico + '</span><div><h3>' + esc(titre) + '</h3><p>' + esc(sous) + '</p></div></header>';
    const kpi = (lab, val, sous) => '<div class="tb-kpi"><span class="tb-lab">' + esc(lab) + '</span>' + val + '<span class="tb-sous">' + (ex ? esc(sous) : "dès la première visite") + '</span></div>';
    // barre empilée 100 % + légende (étiquettes directes : jamais la couleur seule)
    const pile = (titre, labels, vals) => '<div class="tb-bloc"><h4>' + esc(titre) + '</h4><div class="tb-pile' + (ex ? "" : " vide") + '" role="img" aria-label="' + esc(titre) + (ex ? " : " + labels.map((l, i) => l + " " + vals[i] + " %").join(", ") : " : pas encore de donnée") + '">' +
      labels.map((l, i) => '<i style="flex:' + (ex ? vals[i] : 1) + ';--c:' + SERIES[i] + '" title="' + esc(l) + (ex ? " · " + vals[i] + " %" : "") + '"></i>').join("") + '</div>' +
      '<ul class="tb-leg">' + labels.map((l, i) => '<li><i style="--c:' + SERIES[i] + '"></i>' + esc(l) + ' <b>' + (ex ? vals[i] + " %" : "— %") + '</b></li>').join("") + '</ul></div>';
    const ligne = (lab, pct, val, cls) => '<div class="tb-ligne ' + (cls || "") + '"><span class="tb-ll">' + lab + '</span><span class="tb-piste"><i style="width:' + (ex ? pct : 0) + '%"></i></span><b>' + (ex ? val : "—") + '</b></div>';
    const jauge = pct => '<div class="tb-jauge' + (ex ? (pct < SEUIL ? " bas" : " haut") : " vide") + '" role="img" aria-label="' + (ex ? pct + " % de bonnes réponses" : "pas encore de réponse") + '"><span class="tb-piste"><i style="width:' + (ex ? pct : 0) + '%"></i><em style="left:' + SEUIL + '%" aria-hidden="true"></em></span><b>' + (ex ? (pct < SEUIL ? "⚠ " : "") + pct + " %" : "— %") + '</b></div>';
    const etoiles = n => { let s = ""; for (let i = 1; i <= 5; i++) { const f = ex ? Math.max(0, Math.min(1, n - i + 1)) : 0; s += '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="et' + i + '"><stop offset="' + f + '" stop-color="#e8a81c"/><stop offset="' + f + '" stop-color="transparent"/></linearGradient></defs><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" fill="url(#et' + i + ')" stroke="' + (ex ? "#c98a12" : "#b9cbcd") + '" stroke-width="1.6" stroke-linejoin="round"/></svg>'; } return s; };

    const titresB = C.stations.map(S => S.titre.fr);
    const maxJ = Math.max.apply(null, EX.jours), maxH = Math.max.apply(null, EX.heures);
    const fun = ["Départ", "Bassin 1", "Bassin 2", "Bassin 3", "Bassin 4", "Bassin 5", "Diplôme"];
    let pire = 1; for (let i = 2; i < EX.entonnoir.length; i++) if (EX.entonnoir[i - 1] - EX.entonnoir[i] > EX.entonnoir[pire - 1] - EX.entonnoir[pire]) pire = i;
    const faibles = QUESTIONS.map((q, i) => ({ q, p: EX.reussite[i] })).filter(x => x.p < SEUIL);

    return '<div class="tb' + (ex ? " rempli" : "") + '">' +
      // ---------- en-tête ----------
      '<section class="tb-tete">' +
      '<button class="tb-retour" data-act="go" data-r="' + o.retour.r + '">← ' + esc(o.retour.l) + '</button>' +
      '<span class="tb-kick">Aperçu · espace équipe</span><h1>Tableau de bord <span>· Kélonia</span></h1>' +
      '<div class="tb-puces"><span class="tb-periode">📅 Mois en cours</span><span class="tb-apercu">Aperçu — se remplira dès l\'ouverture au public</span></div>' +
      '<p class="tb-rgpd"><span aria-hidden="true">🔒</span> ' + esc("Données anonymes, sans compte, sans donnée personnelle (RGPD)") + '</p>' +
      '<div class="tb-etat"><span class="tb-point' + (ex ? " actif" : "") + '" aria-hidden="true"></span>' + (ex ? "Exemple affiché" : "En attente des premières visites") +
      '<button class="tb-switch" role="switch" aria-checked="' + ex + '" data-act="stexemple"><span class="tb-sw-l">Voir un exemple rempli</span><span class="tb-sw" aria-hidden="true"><i></i></span></button></div></section>' +
      (ex ? '<p class="tb-fictif" role="note"><b>EXEMPLE FICTIF</b> · chiffres inventés pour montrer le rendu, aucune visite réelle</p>' : "") +

      // ---------- d. ★ ce que les visiteurs ont retenu (mis en avant, en premier) ----------
      '<section class="tb-carte tb-star">' + '<span class="tb-ruban">★ Le cœur du tableau de bord</span>' +
      tete("🎯", "Ce que les visiteurs ont retenu", "Une question précise par bassin, posée dans l'appli", "") +
      '<p class="tb-promesse">' + esc("Chaque question est réécrite avec votre service éducatif : vous mesurez ce que votre médiation transmet vraiment.") + '</p>' +
      '<ol class="tb-questions">' + QUESTIONS.map((q, i) => '<li class="tb-q' + (ex && EX.reussite[i] < SEUIL ? " faible" : "") + '"><div class="tb-q-t"><span class="tb-num">' + q.id + '</span><div><b>' + esc(q.notion) + '</b><small>' + esc("Bassin " + q.id + " · " + titresB[i]) + '</small></div></div>' +
        '<blockquote>« ' + esc(q.q) + ' »</blockquote><p class="tb-rep"><span class="tb-tag ' + (q.appli ? "appli" : "propo") + '">' + (q.appli ? "Question de l'appli" : "Question proposée") + '</span> ✔ ' + esc(q.ok) + '</p>' +
        '<span class="tb-mini">% de bonnes réponses</span>' + jauge(EX.reussite[i]) +
        '<p class="tb-err">Erreur la plus fréquente : ' + (ex ? '<b>« ' + esc(q.faux[0]) + ' »</b> (' + EX.erreurs[i] + ' %)' : "—") + '</p></li>').join("") + '</ol>' +
      '<p class="tb-seuil"><span aria-hidden="true">┆</span> repère : seuil de ' + SEUIL + ' % de bonnes réponses</p>' +
      '<div class="tb-renfort' + (ex ? "" : " vide") + '"><h4>⚠️ Notions à renforcer</h4>' + (ex ? '<ul>' + faibles.map(x => '<li><b>' + x.p + ' %</b><span>' + esc("Bassin " + x.q.id + " · " + x.q.notion) + '</span></li>').join("") + '</ul><p>' + esc("À retravailler avec le service éducatif : consigne, panneau, médiation sur place.") + '</p>'
        : '<p>' + esc("Apparaîtront ici : les questions où moins de 60 % répondent juste.") + '</p>') + '</div></section>' +

      // ---------- a. fréquentation ----------
      '<section class="tb-carte">' + tete("👣", "Fréquentation", "Ce que font réellement les visiteurs") +
      '<div class="tb-kpis">' + kpi("Aventures lancées", V(nb(EX.lancees)), "+18 % vs mois dernier") + kpi("Parties terminées", V(Math.round(EX.terminees / EX.lancees * 100), " %"), nb(EX.terminees) + " diplômes") +
      kpi("Durée moyenne", V(EX.duree, " min"), "objectif : 30 à 40 min") + kpi("Usage hors connexion", V(EX.horsLigne, " %"), "des parties sans réseau") + '</div>' +
      '<div class="tb-bloc"><h4>Aventures lancées, jour par jour</h4><div class="tb-jours' + (ex ? "" : " vide") + '" role="img" aria-label="' + (ex ? "Histogramme par jour (exemple fictif)" : "Histogramme par jour : pas encore de donnée") + '">' + EX.jours.map((v, i) => '<i style="height:' + (ex ? Math.max(4, v / maxJ * 100) : 22) + '%"' + (ex ? ' title="Jour ' + (i + 1) + ' · ' + v + ' aventures"' : "") + '></i>').join("") + '</div><div class="tb-axe"><span>1</span><span>15</span><span>30</span></div></div>' +
      pile("Comment ils arrivent", ["QR code scanné", "Appli installée"], EX.acces) + '</section>' +

      // ---------- b. publics et langues ----------
      '<section class="tb-carte">' + tete("👨‍👩‍👧", "Publics et langues", "Qui joue, et dans quelle langue") +
      pile("Publics", ["Famille", "Classe", "Soirée"], EX.publics) + pile("Langue choisie", ["Français", "Kréol", "Anglais"], EX.langues) + '</section>' +

      // ---------- c. parcours ----------
      '<section class="tb-carte">' + tete("🗺️", "Le parcours, bassin par bassin", "Où l'on s'attarde, où l'on décroche") +
      '<div class="tb-bloc"><h4>Temps passé par bassin</h4>' + EX.temps.map((v, i) => ligne('<b>' + (i + 1) + '</b> ' + esc(titresB[i]), v / 10 * 100, String(v).replace(".", ",") + " min")).join("") + '</div>' +
      '<div class="tb-bloc"><h4>Où les visiteurs abandonnent</h4><ol class="tb-fun' + (ex ? "" : " vide") + '">' + fun.map((l, i) => '<li' + (ex && i === pire ? ' class="perte"' : "") + '><span class="tb-fl">' + esc(l) + '</span><span class="tb-fb"><i style="width:' + (ex ? EX.entonnoir[i] : 100 - i * 9) + '%"></i></span><b>' + (ex ? EX.entonnoir[i] + " %" : "— %") + '</b></li>').join("") + '</ol>' +
      '<p class="tb-note">' + (ex ? "↘ Plus forte perte : entre le " + fun[pire - 1].toLowerCase() + " et le " + fun[pire].toLowerCase() + " (−" + (EX.entonnoir[pire - 1] - EX.entonnoir[pire]) + " pts). Trajet trop long ? QR peu visible ?" : "La plus forte perte entre deux bassins sera signalée ici.") + '</p></div>' +
      '<div class="tb-bloc"><h4>Heures d\'affluence</h4><div class="tb-heures' + (ex ? "" : " vide") + '" role="img" aria-label="' + (ex ? "Affluence par heure, pic à 15 h (exemple fictif)" : "Affluence par heure : pas encore de donnée") + '">' + EX.heures.map((v, i) => '<span><i style="height:' + (ex ? v / maxH * 100 : 22) + '%"' + (ex && v === maxH ? ' class="pic"' : "") + (ex ? ' title="' + (9 + i) + ' h · ' + v + ' %"' : "") + '></i></span>').join("") + '</div><div class="tb-axe h">' + EX.heures.map((v, i) => '<span>' + (i % 2 ? "" : (9 + i) + " h") + '</span>').join("") + '</div><p class="tb-note">' + (ex ? "Pic d'affluence : " + (9 + EX.heures.indexOf(maxH)) + " h – " + (10 + EX.heures.indexOf(maxH)) + " h (en bleu)." : "Le pic d'affluence sera signalé ici.") + '</p></div></section>' +

      // ---------- e. classes ----------
      '<section class="tb-carte">' + tete("🎓", "Classes (cycle 3)", "Résultats par notion du programme, sans nom d'élève") +
      '<div class="tb-kpis">' + kpi("Classes accueillies", V(EX.classes), "CM1 · CM2 · 6e") + kpi("Équipes d'élèves", V(EX.equipes), "1 téléphone par équipe") + '</div>' +
      '<div class="tb-bloc"><h4>Bonnes réponses par notion du programme</h4>' +
      [["Écosystèmes", "bassins 1, 2 et 5"], ["Unité et diversité du vivant", "bassins 3 et 4"]].map((n, i) => '<div class="tb-notion"><span><b>' + esc(n[0]) + '</b><small>' + esc(n[1]) + '</small></span>' + jauge(EX.notionsClasse[i]) + '</div>').join("") + '</div></section>' +

      // ---------- f. avis ----------
      '<section class="tb-carte">' + tete("💬", "Avis des visiteurs", "Note et mots qui reviennent") +
      '<div class="tb-avis"><div class="tb-note-g">' + V(String(EX.note).replace(".", ","), " / 5") + '<span class="tb-etoiles" role="img" aria-label="' + (ex ? "note moyenne 4,6 sur 5" : "pas encore d'avis") + '">' + etoiles(EX.note) + '</span><span class="tb-sous">' + (ex ? EX.avis + " avis" : "— avis") + '</span></div></div>' +
      '<h4 class="tb-h4">Mots qui reviennent</h4><p class="tb-mots' + (ex ? "" : " vide") + '">' + (ex ? EX.mots.map(m => '<span class="p' + m[1] + '">' + esc(m[0]) + '</span>').join("") : [5, 3, 6, 4, 3, 5].map(w => '<span style="width:' + w * 14 + 'px" aria-hidden="true"></span>').join("") + '<span class="sr-only">pas encore d\'avis</span>') + '</p></section>' +

      // ---------- g. export ----------
      '<section class="tb-carte">' + tete("📤", "Exporter", "Pour vos bilans et vos tutelles") +
      '<div class="tb-export"><button class="btn sec tb-off" data-act="stexport" aria-disabled="true">📄 Rapport mensuel PDF</button><button class="btn sec tb-off" data-act="stexport" aria-disabled="true">⬇️ Exporter CSV</button></div>' +
      '<p class="tb-note">Comptages anonymes uniquement, sans cookie ni donnée personnelle : à valider avec la RMR et son DPO.</p></section></div>';
  }

  window.Tableau = { html, QUESTIONS };
})();
