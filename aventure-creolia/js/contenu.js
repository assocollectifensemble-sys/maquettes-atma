/* ============================================================
   CONTENU — Hôtel Exsel Créolia (Saint-Denis, Montgaillard) · « Ti Kalou et les fleurs de Montgaillard »
   Faits utilisés (sources lues le 13/11/2026) :
   - Écolabel européen FR/051/121, AFNOR, « HOTEL CREOLIA », 14 rue du Stade 97400 Saint-Denis (base ADEME
     data.ademe.fr, jeu « ecolabel-hebergement-touristique »).
   - L'ancien « Mercure Créolia » s'appelle Hôtel Exsel Créolia depuis janvier 2024 : fin de la franchise Mercure (Accor),
     groupe Exsel Hôtels (exsel.re/sortie-daccor-et-de-mercure-au-creolia ; exclusif.re, 19/02/2024).
   - 4 étoiles, perché à Montgaillard sur les hauteurs de Saint-Denis, vue sur l'océan Indien ; piscine à débordement
     avec vue panoramique sur Saint-Denis ; 109 chambres ; 5 salles de séminaire ; espace bien-être Créolia Bien-Être ;
     restaurant Le Kaloupilé (cuisine métissée, buffet du dimanche) ; petit-déjeuner 12 €/enfant ; journée détente
     25 €/enfant (3-12 ans) ; Écolabel européen et label d'État Destination d'Excellence (exsel.re/hotel/creolia/).
   - Bar La Varangue (menu de exsel.re/hotel/creolia/nos-services/).
   - Exsel Nature, depuis 2016 : limiter l'énergie, préserver l'eau, réduire et trier les déchets, protéger la
     biodiversité ; sensibiliser touristes, clients locaux et scolaires aux patrimoines de La Réunion
     (exsel.re/groupe-exsel-authentic-hotels/).
   Offre enfants : seuls les tarifs enfants sont affirmés. Tout le reste est une PROPOSITION.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#2f8a5b", c2: "#e8743b", fond: "#123a2c", fond2: "#1f5a44", accent: "#ffd166", clair: "#eef8f1" };

  /* ---------- Ti Kalou, la petite feuille de caloupilé ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M76 112 q9 -10 18 0 M106 112 q9 -10 18 0" stroke="#173d22" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="85" cy="110" rx="9" ry="11" fill="#fff"/><ellipse cx="115" cy="110" rx="9" ry="11" fill="#fff"/><circle cx="87" cy="113" r="6" fill="#173d22"/><circle cx="117" cy="113" r="6" fill="#173d22"/><circle cx="89" cy="109.5" r="2.2" fill="#fff"/><circle cx="119" cy="109.5" r="2.2" fill="#fff"/></g>';
    const bouche = pose === "parle"
      ? '<ellipse cx="100" cy="136" rx="8" ry="6.5" fill="#6b2a1f"/><ellipse cx="100" cy="139" rx="4.5" ry="2.4" fill="#ff8fa3"/>'
      : '<path d="M88 130 q12 13 24 0z" fill="#6b2a1f" stroke="#6b2a1f" stroke-width="3" stroke-linejoin="round"/><path d="M94 135 q6 3.5 12 0" fill="#ff8fa3"/>';
    const bras = leve
      ? '<path d="M52 118 q-20 -10 -24 -36" stroke="#2f7a3f" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M148 118 q20 -10 24 -36" stroke="#2f7a3f" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="28" cy="80" r="7" fill="#7fcf6a"/><circle cx="172" cy="80" r="7" fill="#7fcf6a"/>'
      : '<path d="M52 124 q-20 8 -24 26" stroke="#2f7a3f" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M148 124 q20 8 24 26" stroke="#2f7a3f" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="28" cy="152" r="7" fill="#7fcf6a"/><circle cx="172" cy="152" r="7" fill="#7fcf6a"/>';
    return '<ellipse cx="100" cy="192" rx="46" ry="7" fill="#000" opacity=".12"/>' +
      // la feuille (le corps), sa nervure, sa tige
      '<g class="balance"><path d="M100 14 q66 50 52 116 q-12 46 -52 52 q-40 -6 -52 -52 q-14 -66 52 -116z" fill="#4fae55" stroke="#2f7a3f" stroke-width="4"/>' +
      '<path d="M100 26 v148" stroke="#8fd47f" stroke-width="3" opacity=".7"/><path d="M100 60 l-22 -14 M100 60 l22 -14 M100 160 l-26 -14 M100 160 l26 -14" stroke="#8fd47f" stroke-width="2.6" opacity=".7" stroke-linecap="round"/>' +
      '<path d="M100 182 v12" stroke="#2f7a3f" stroke-width="6" stroke-linecap="round"/></g>' +
      '<ellipse cx="72" cy="126" rx="7" ry="4.5" fill="#ff9aa8" opacity=".8"/><ellipse cx="128" cy="126" rx="7" ry="4.5" fill="#ff9aa8" opacity=".8"/>' +
      yeux + bouche + bras +
      '<g transform="translate(130 40)"><circle r="9" fill="#ffd166"/>' + [0, 72, 144, 216, 288].map(a => '<ellipse cx="0" cy="-12" rx="5" ry="7" fill="#fff" transform="rotate(' + a + ')"/>').join("") + '<circle r="6" fill="#ffd166"/></g>';
  }

  /* ---------- décor : les hauts de Montgaillard, Saint-Denis en contrebas, l'océan ---------- */
  const immeubles = (y) => [[8, 18], [30, 26], [56, 14], [76, 30], [104, 20], [128, 24], [154, 16], [176, 28], [204, 18], [228, 22], [252, 14]].map(b => '<rect x="' + b[0] + '" y="' + (y - b[1]) + '" width="18" height="' + b[1] + '" fill="#e9e1d2" stroke="#c9bda6" stroke-width="1.5"/>').join("");
  const fleur = (x, y, c) => '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 0 v-14" stroke="#3e8e41" stroke-width="3"/>' + [0, 72, 144, 216, 288].map(a => '<ellipse cx="0" cy="-20" rx="3.5" ry="5" fill="' + c + '" transform="rotate(' + a + ' 0 -14)"/>').join("") + '<circle cx="0" cy="-14" r="3" fill="#ffd166"/></g>';
  const decor = { ciel: ["#6cc2ee", "#e6f6ff"], merC: ["#0f5a95", "#2a8fc8"], mer: "large", sable: "#7fb069", sableC2: "#5f9450", horizon: 104, plage: 176,
    montagne: "M0 112 q30 -60 80 -64 q40 0 60 40 L150 114 H0z", montagneC: "#3f7a4a",
    extraFond: '<rect x="0" y="168" width="360" height="10" fill="#d9cfbd"/>' + immeubles(176) +
      '<path d="M0 200 q90 -26 180 -20 t180 -14 V240 H0z" fill="#6aa35a"/>',
    palmiers: [[340, 300, 96, -1]],
    extra: '<g transform="translate(150 262)"><rect width="150" height="40" rx="14" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><path d="M14 20 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#fff" stroke-width="2" fill="none" class="reflet"/></g>' +
      fleur(40, 320, "#ff7aa2") + fleur(70, 330, "#fff") + fleur(110, 318, "#ff9f43") + fleur(250, 340, "#fff") + fleur(290, 330, "#ff7aa2") };

  const vue = '<rect width="140" height="120" fill="#a7dcf6"/><rect y="38" width="140" height="40" fill="#2a8fc8"/><path d="M0 48 q20 -5 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="3" fill="none" class="vague-anim"/>' +
    '<rect y="74" width="140" height="8" fill="#d9cfbd"/>' + [[4, 12], [24, 18], [46, 10], [64, 20], [88, 14], [110, 18]].map(b => '<rect x="' + b[0] + '" y="' + (82 - b[1]) + '" width="14" height="' + b[1] + '" fill="#e9e1d2" stroke="#c9bda6"/>').join("") +
    '<path d="M0 92 q70 -14 140 -6 V120 H0z" fill="#6aa35a"/><circle cx="118" cy="18" r="10" fill="#ffd166"/>';

  /* ---------- la carte (illustrée, non contractuelle) ---------- */
  const carteFond = '<rect width="360" height="440" fill="#a9d68f"/>' +
    '<path d="M0 0 h360 v70 H0z" fill="#2a8fc8"/>' +
    [0, 1].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-10 ' + (18 + i * 26) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".45"/>').join("") +
    '<rect x="0" y="70" width="360" height="54" fill="#e3dccd"/>' + [[6, 90], [40, 100], [80, 86], [120, 104], [170, 92], [214, 100], [258, 88], [300, 98], [334, 90]].map(b => '<rect x="' + b[0] + '" y="' + b[1] + '" width="22" height="' + (124 - b[1]) + '" fill="#f3eee4" stroke="#c9bda6" stroke-width="1.5"/>').join("") +
    '<text x="352" y="84" text-anchor="end" font-size="11" font-weight="800" fill="#7a6a4a" font-family="system-ui,sans-serif">Saint-Denis, en contrebas</text>' +
    '<path d="M0 124 q90 20 180 8 t180 6 v10 q-90 4 -180 8 t-180 -6z" fill="#7fb069"/>' +
    '<path d="M90 320 q40 -60 100 -70 t110 -30 M190 250 q-20 -40 -100 -60 M190 250 q10 60 -20 120" stroke="#f3e2bd" stroke-width="11" fill="none" stroke-linecap="round"/>' +
    // la grande piscine à débordement
    '<g transform="translate(196 160)"><rect width="130" height="52" rx="18" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><path d="M14 26 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0" stroke="#fff" stroke-width="2" fill="none" class="reflet"/></g>' +
    // Le Kaloupilé
    '<g transform="translate(232 262)"><rect width="88" height="46" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h100 l-12 -14 h-76z" fill="#e8743b"/>' + [0, 1, 2].map(i => '<g transform="translate(' + (18 + i * 26) + ' 28)"><circle r="8" fill="#fff" stroke="#d6c19a" stroke-width="2"/><circle r="4" fill="#ffd166"/></g>').join("") + '</g>' +
    // l'hôtel (chambres) et l'accueil
    '<g transform="translate(24 300)"><rect width="130" height="66" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h142 l-12 -14 h-118z" fill="#2f8a5b"/>' + [0, 1, 2, 3].map(i => '<rect x="' + (12 + i * 30) + '" y="14" width="18" height="16" rx="3" fill="#9fdcf0"/><rect x="' + (12 + i * 30) + '" y="40" width="18" height="16" rx="3" fill="#9fdcf0"/>').join("") + '</g>' +
    // le jardin de la terrasse
    '<g transform="translate(40 186)">' + fleur(0, 0, "#ff7aa2") + fleur(22, 6, "#fff") + fleur(44, -2, "#ff9f43") + fleur(66, 4, "#ff7aa2") + '</g>' +
    Art.palmier(340, 420, 44, -1) + Art.palmier(178, 404, 36, 1) +
    '<g transform="translate(286 360) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  /* ---------- le jeu des tuyaux : de la pluie des hauts aux fleurs de la terrasse ---------- */
  const decorHaut = '<path d="M0 60 q40 -46 90 -40 q30 4 50 40z" fill="#3f7a4a"/><g transform="translate(40 14)"><ellipse cx="30" cy="10" rx="30" ry="12" fill="#fff"/><ellipse cx="12" cy="14" rx="16" ry="10" fill="#fff"/></g>' +
    '<g class="pluie" stroke="#5cc0ff" stroke-width="2.4" stroke-linecap="round"><line x1="40" y1="26" x2="37" y2="38"/><line x1="62" y1="30" x2="59" y2="42"/><line x1="84" y1="26" x2="81" y2="38"/></g>' +
    '<rect x="64" y="52" width="16" height="44" fill="#9fb4c0"/><path d="M64 92 h16 v12 h-16z" fill="#7f97a5"/>' +
    '<text x="160" y="40" font-size="13" font-weight="900" fill="#2f6b4a" font-family="system-ui,sans-serif">La pluie des hauts…</text>' +
    '<g transform="translate(300 52) scale(.24)">' + perso("parle") + '</g>';
  const decorBas = '<rect x="0" y="400" width="360" height="40" fill="#6aa35a"/><text x="12" y="425" font-size="13" font-weight="900" fill="#fffbe8" font-family="system-ui,sans-serif">…les fleurs ont soif !</text>' +
    '<path id="sortie" d="M288 392 v10" stroke="#3aa7ff" stroke-width="16" opacity="0" style="transition:opacity .4s"/>' +
    [214, 244, 274, 304, 334].map((x, i) => '<g transform="translate(' + x + ' 410)"><g class="plante">' + fleur(0, 0, i % 2 ? "#ff7aa2" : "#fff") + '</g></g>').join("");

  return {
    id: "creolia", nom: "Hôtel Exsel Créolia", nomCourt: "Créolia", titre: "Ti Kalou et les fleurs de Montgaillard",
    couleurs: C, perso, perso_nom: "Ti Kalou", decor,
    accroche: "Une aventure en famille, de ta chambre à la piscine qui regarde Saint-Denis.",
    accueilBulle: "Bonjour ! Moi, c'est <b>Ti Kalou</b>, une petite feuille de caloupilé. Tu viens explorer le Créolia avec moi ?",
    boutonDepart: "🌿 Je pars avec Ti Kalou !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Le Créolia a l'<b>Écolabel européen</b> : son symbole est une fleur, celle des hôtels qui prennent soin de l'eau, de l'énergie et de la nature."],
      ["coucou", "J'ai caché <b>5 fleurs Écolabel</b> dans l'hôtel : dans ta chambre, sur la terrasse, au Kaloupilé…"],
      ["joie", "Retrouve-les avec moi, et une <b>vraie récompense</b> t'attend. On y va ?", "🗺️ Voir la carte"]
    ],
    carteTitre: "La carte du Créolia", carteBulle: "On commence par la terrasse fleurie ? Touche l'étape <b>1</b> !",
    gain: { icone: "🌼", nomPluriel: "Les fleurs Écolabel" },
    carte: { fond: carteFond },
    etapes: [
      { id: "terrasse", lieu: "La terrasse fleurie", lieuCourt: "La terrasse", titre: "Le chemin de l'eau", resume: "Guide la pluie jusqu'aux fleurs", duree: "3 min", x: 78, y: 176,
        mission: "La pluie tombe sur les hauts de Montgaillard. Fais-la voyager dans les tuyaux jusqu'aux <b>fleurs de la terrasse</b>, et que chaque goutte arrive à bon port !",
        regle: ["Dessine un rond avec ton doigt sur un tuyau gris pour le faire tourner.", "L'eau part en haut à gauche et file vers la flèche jaune.", "Moins de tours = plus d'étoiles ⭐"],
        boutonJeu: "💧 Je guide la pluie !",
        jeu: { type: "tuyaux", titreBarre: "💧 Le chemin de l'eau", coupsMini: 7, decorHaut, decorBas,
          tuiles: [["L", 0, 3, 1], ["L", 2, 1, 1], ["T", 0, 1], ["I", 0, 1],
                   ["L", 0, 2], ["L", 0, 3, 1], ["I", 1, 0, 1], ["L", 2, 1, 1],
                   ["T", 0, 2], ["I", 0, 0], ["L", 0, 1], ["I", 0, 1, 1],
                   ["I", 0, 1], ["T", 0, 3], ["L", 0, 0], ["I", 0, 1, 1]],
          msgDebut: "Fais tourner avec ton doigt : dessine un rond sur un tuyau gris. L'eau part des hauts (en haut à gauche) et file vers la flèche jaune 💧",
          msgAide: "Astuce de Ti Kalou : l'eau sort en haut à gauche et descend vers le coin en bas à droite.",
          msgGagne: "Plouf ! La pluie arrive aux fleurs de la terrasse. Regarde, elles s'ouvrent toutes !" },
        bravo: { titre: "La terrasse fleurit !", gainIcone: "🌼", gain: "Fleur Écolabel n°1 : la fleur de la terrasse", gainSous: "Grâce à toi, chaque goutte trouve sa fleur.", perso: "Ouah ! Roi ou reine des tuyaux de Montgaillard : c'est toi !" },
        savais: { titre: "Le savais-tu ?", texte: "Depuis 2016, les hôtels Exsel, dont le Créolia, s'engagent à préserver l'eau, à économiser l'énergie, à trier les déchets et à protéger la nature de La Réunion.", src: "exsel.re, engagements Exsel Nature" },
        terrain: "dans l'application complète, la famille trouve ce repère sur la terrasse ou près de la piscine (emplacement à choisir avec vous)." },
      { id: "chambre", lieu: "Ta chambre au Créolia", lieuCourt: "La chambre", titre: "Les 5 défis de Ti Kalou", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 89, y: 290,
        mission: "Ti Kalou s'est cachée dans ta chambre… avec <b>5 défis</b> ! Trouve-les et relève-les en famille, face à Saint-Denis.",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = la fleur de la chambre."],
        boutonJeu: "🔎 Je cherche Ti Kalou !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f5f2ea", sol: "#c9a77c", drap: "#bfe3c8", bois: "#8f6a46", accent: "#e8743b" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans la chambre 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 sur 5 ! Ti Kalou danse sur le balcon, face à Saint-Denis !",
          objets: [
            { obj: "robinet", x: 284, y: 112, icone: "🪥", titre: "Défi brossage en chanson", defi: "Ce soir, robinet fermé pendant le brossage… et tu chantes une chanson de ton choix jusqu'au bout. Qui tiendra 2 minutes ?", vrai: "Ce soir, fais pareil avec le vrai robinet : fermé pendant tout le brossage, et une chanson jusqu'au bout. Qui tiendra 2 minutes ?", bravo: "Robinet fermé, sourire ouvert !" },
            { obj: "clim", x: 98, y: 136, s: .85, r: 38, icone: "🌬️", titre: "Défi air des hauts", defi: "Fenêtre ouverte ? La clim se repose et l'air frais de Montgaillard prend le relais. Fenêtre fermée, la clim reprend son travail !", vrai: "Dans ta vraie chambre, c'est pareil : fenêtre ouverte, la clim se repose et l'air des hauts entre. Fenêtre fermée, la clim reprend son travail !", bravo: "L'air des hauts et la clim font équipe !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi lumière éclair", defi: "En sortant de la chambre, éteins toutes les lumières en moins de 5 secondes. Prêt ? Prête ? 3, 2, 1… éclair !", vrai: "Tout à l'heure, en sortant de la chambre, fais pareil pour de vrai : toutes les lumières éteintes en moins de 5 secondes. 3, 2, 1… éclair !", bravo: "Plus rapide qu'un éclair sur Saint-Denis !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#2f8a5b", icone: "🌿", titre: "Défi serviette voyageuse", defi: "Suspends ta serviette pour qu'elle sèche : demain, elle repart avec toi à la grande piscine !", vrai: "Ce soir, fais pareil avec ta vraie serviette : suspends-la pour qu'elle sèche, elle te suivra demain à la piscine. Ti Kalou compte sur toi !", bravo: "Serviette suspendue, prête pour demain !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Bouteille, papier, épluchure : trouve le bon bac du premier coup. Le Créolia trie ses déchets, et toi aussi !", vrai: "Pendant ton séjour, garde ton œil de trieur : bouteille, papier, épluchure, chacun son bac. Le Créolia trie ses déchets, et toi aussi !", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "bouteille", "nom": "bouteille", "bac": "emb"}, {"obj": "papier", "nom": "papier", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait !" }
          ] },
        bravo: { titre: "La chambre est au top !", gainIcone: "🌼", gain: "Fleur Écolabel n°2 : la fleur de la chambre", gainSous: "5 défis relevés en famille.", perso: "Grâce à toi, ta chambre est la plus fleurie de Montgaillard !" },
        savais: { titre: "Le savais-tu ?", texte: "Le Créolia a deux labels : l'Écolabel européen et Destination d'Excellence, un label de l'État pour la qualité de l'accueil et le respect de l'environnement.", src: "exsel.re/hotel/creolia" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à choisir avec vous)." },
      { id: "kaloupile", lieu: "Le Kaloupilé", lieuCourt: "Le Kaloupilé", titre: "Le goût de l'île", resume: "Le grand jeu des saveurs", x: 276, y: 252,
        teaser: "Au Kaloupilé, les saveurs créoles rencontrent celles du monde : sauras-tu les reconnaître ?",
        complet: ["Un jeu des saveurs (à imaginer avec le chef)", "La 3e fleur Écolabel, à table, en famille", "Les parents découvrent le buffet du dimanche"] },
      { id: "piscine", lieu: "La piscine panoramique", lieuCourt: "La piscine", titre: "Le grand plouf", resume: "L'énigme de l'eau, face à Saint-Denis", x: 261, y: 152,
        teaser: "Au bord de la grande piscine, Ti Kalou te pose l'énigme du voyage de l'eau, face à Saint-Denis.",
        complet: ["Une énigme sur l'eau, au bord de la piscine", "La 4e fleur Écolabel", "Un défi en famille, chrono en main"] },
      { id: "accueil", lieu: "L'accueil", lieuCourt: "L'accueil", titre: "Le bouquet Écolabel", resume: "Rends les 5 fleurs et gagne ta récompense", x: 160, y: 380,
        teaser: "Avec les 5 fleurs Écolabel, Ti Kalou compose un bouquet… et ta famille rejoint les jardiniers du Créolia !",
        complet: ["Le compteur des familles jardinières, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Jardinier·ère de Montgaillard", court: "JARDINIER DE MONTGAILLARD" },
    victoireTexte: "Ti Kalou a retrouvé ses 5 fleurs : le bouquet Écolabel du Créolia est complet ! Voici ta récompense.",
    lot: { titre: "1 dessert offert à l'enfant", lieu: "Au restaurant Le Kaloupilé", detail: "Montre ce bon au Kaloupilé pendant ton séjour : Ti Kalou t'y attend !" },
    codePrefixe: "KALOU",
    compteur: "Ta famille rejoint les familles jardinières du Créolia (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 fleurs Écolabel dans tout le Créolia", "Une version pour vos journées détente", "Une carte souvenir de Montgaillard à garder"],
    projet: {
      pour: "Maquette pour l'Hôtel Exsel Créolia · Saint-Denis",
      sous: "Une aventure sur téléphone pour vos familles. Ti Kalou, une petite feuille de caloupilé, fait découvrir le Créolia, de la chambre à la piscine qui regarde Saint-Denis. Personnage, étapes, défis et lots se construisent avec vos équipes.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. au Kaloupilé"], ["🌿", "Un appui pour vos critères Écolabel 3 et 26"], ["📱", "Un QR code suffit, et ça marche même hors ligne"]],
      idee: [
        "Les enfants aident Ti Kalou à retrouver les 5 fleurs Écolabel cachées dans l'hôtel.",
        "Chaque étape est un mini-jeu : la terrasse, la chambre, Le Kaloupilé, la piscine…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer."
      ],
      appli: "Une création à plusieurs mains : ateliers avec vos équipes (accueil, Kaloupilé, Créolia Bien-Être, étages), idées de votre personnel, puis un test avec de vraies familles avant le lancement. Tout ce que montre cette maquette est à choisir avec vous.",
      apports: [
        ["👨‍👩‍👧", "Un plus pour vos familles", "Le week-end, pendant les vacances ou une journée détente : une heure de jeu en autonomie, au rythme de chacun."],
        ["🍽️", "Vos lieux mis en valeur", "Les lots amènent les familles au Kaloupilé, au bar La Varangue ou à Créolia Bien-Être."],
        ["🌼", "Votre Écolabel, vécu en jeu", "L'eau, l'énergie, le tri, la nature : les engagements Exsel Nature deviennent des défis que les enfants adorent relever."],
        ["📊", "Des chiffres pour votre bilan", "Familles qui jouent, défis relevés, avis : un tableau de bord simple et anonyme."]
      ],
      label: {
        titre: "Un appui pour votre Écolabel européen",
        intro: "L'aventure informe vos clients de façon active et fait de l'éducation à l'environnement une vraie distraction. Elle aide à documenter :",
        criteres: [
          ["Critère 3", "Information de la clientèle donnée « activement » : économies d'eau, linge et serviettes, déchets, lieux d'intérêt. Le petit avis de fin répond au point b)."],
          ["Critère 26", "Biodiversité locale (a, avec les plantes de vos jardins) et éducation à l'environnement dans les distractions (b) : 2 points optionnels."],
          ["Critère 16", "Réutilisation des serviettes : le défi « serviette voyageuse » de la mission chambre."]
        ],
        note: "Référence : décision (UE) 2017/175. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple (à choisir avec vous) :",
      lots: [["🍨", "1 dessert offert à l'enfant", "au Kaloupilé"], ["🍹", "1 mocktail « Ti Kalou » pour l'enfant", "au bar La Varangue"], ["💆", "Une attention pour les parents", "à Créolia Bien-Être"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou un jour de pluie. Les écogestes deviennent des défis, et chaque défi relevé est une fierté :", defis: ["Le brossage en chanson, robinet fermé", "L'air des hauts : fenêtre ouverte, clim au repos", "La lumière éclair, éteinte en 5 secondes", "La serviette voyageuse, suspendue pour demain", "Le tri du premier coup"] },
      complete: ["5 étapes : la terrasse, la chambre, Le Kaloupilé, la piscine, l'accueil (lieux à choisir avec vous)", "Une version pour les classes découvertes et les scolaires, que vos engagements Exsel Nature visent déjà", "Voix de Ti Kalou en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une nouvelle aventure par saison, pour les familles qui reviennent", "Hors connexion, dans le navigateur, en toute discrétion pour les données"],
      stats: [["142", "familles ont terminé l'aventure"], ["44 min", "de jeu en moyenne"], ["85 %", "des défis « chambre » relevés"], ["9,0/10", "note des enfants"]],
      barres: [["Étape terrasse", 94], ["Étape chambre", 87], ["Étape Kaloupilé", 73], ["Bons utilisés", 67]]
    }
  };
})();
