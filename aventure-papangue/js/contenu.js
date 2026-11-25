/* ============================================================
   CONTENU — Papangue Hôtel & Spa (L'Étang-Salé les Hauts) · « Ti Papang et les plumes du vent »
   Faits utilisés (sources vérifiées le 13/11/2026) :
   - Écolabel européen FR/051/679, « PAPANGUE HOTEL », 26 chemin de Ligne, L'Étang-Salé (base ADEME, data.ademe.fr, ecolabel-hebergement-touristique).
   - « Niché dans un écrin de verdure à mi-hauteur de l'Étang-Salé », « vue imprenable sur la côte sud-ouest » (papanguehotel.re, /l-hotel).
   - Le Curcuma : cuisine à base de produits locaux et de saison, nouvelle carte tous les 3 à 4 mois ; projet « sur le long terme » d'un espace
     d'environ 12 000 m² avec potager et parcours au cœur d'une forêt exotique (papanguehotel.re/le-curcuma-restaurant).
   - Aloe SPA, espace bien-être de 150 m², balnéothérapie (papanguehotel.re/aloe-spa) ; bar ; menu enfant 3-12 ans (carte du Curcuma, oct. 2026).
   - Groupe Morgabine Hospitality (Dina Morgabine Saint-Gilles et Saint-Denis, Tuit-Tuit, Doudou) : pied de page de papanguehotel.re.
   - Le papangue (busard de Maillard) : dernier rapace diurne endémique nicheur de La Réunion, protégé depuis 1989
     (PNA Busard de Maillard 2022-2031, DEAL Réunion ; reunion-parcnational.fr).
   Tout le reste est une PROPOSITION (lieux, lots, défis) à choisir avec l'hôtel et ses équipes.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#7a4a2a", c2: "#e0a23a", fond: "#2c2416", fond2: "#4a3a22", accent: "#ffd166", clair: "#f6efe2" };

  /* ---------- Ti Papang, le jeune papangue (busard de Maillard) ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M74 74 q10 -11 20 0 M106 74 q10 -11 20 0" stroke="#3a2412" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="84" cy="72" rx="11" ry="12" fill="#fff"/><ellipse cx="116" cy="72" rx="11" ry="12" fill="#fff"/><circle cx="86" cy="75" r="7" fill="#e8a317"/><circle cx="118" cy="75" r="7" fill="#e8a317"/><circle cx="86" cy="75" r="4" fill="#24160b"/><circle cx="118" cy="75" r="4" fill="#24160b"/><circle cx="88" cy="72" r="2.2" fill="#fff"/><circle cx="120" cy="72" r="2.2" fill="#fff"/></g>';
    const bec = pose === "parle"
      ? '<path d="M90 88 q10 -8 20 0 l-10 10z" fill="#ffd166" stroke="#c99316" stroke-width="2"/><path d="M92 96 q8 12 16 0z" fill="#7a2e3b"/><path d="M95 93 q5 9 10 0 q-2 12 -5 16 q-3 -4 -5 -16z" fill="#3b3b3b"/>'
      : '<path d="M90 88 q10 -8 20 0 l-10 10z" fill="#ffd166" stroke="#c99316" stroke-width="2"/><path d="M94 94 q6 -3 12 0 q-1 10 -6 14 q-5 -4 -6 -14z" fill="#3b3b3b"/>';
    const aileD = leve
      ? '<path d="M140 118 q34 -30 52 -74 q4 -8 -4 -8 q-30 22 -58 56z" fill="#8a5a36" stroke="#5c3a1f" stroke-width="3"/><path d="M168 66 l18 -22 M160 80 l24 -18 M150 94 l26 -10" stroke="#e9d2ad" stroke-width="3" stroke-linecap="round"/>'
      : '<path d="M144 112 q24 20 22 58 q-12 6 -26 -6 q-6 -28 4 -52z" fill="#8a5a36" stroke="#5c3a1f" stroke-width="3"/><path d="M152 132 q6 14 4 30" stroke="#e9d2ad" stroke-width="3" fill="none" stroke-linecap="round"/>';
    const aileG = pose === "joie"
      ? '<path d="M60 118 q-34 -30 -52 -74 q-4 -8 4 -8 q30 22 58 56z" fill="#8a5a36" stroke="#5c3a1f" stroke-width="3"/><path d="M32 66 l-18 -22 M40 80 l-24 -18 M50 94 l-26 -10" stroke="#e9d2ad" stroke-width="3" stroke-linecap="round"/>'
      : '<path d="M56 112 q-24 20 -22 58 q12 6 26 -6 q6 -28 -4 -52z" fill="#8a5a36" stroke="#5c3a1f" stroke-width="3"/><path d="M48 132 q-6 14 -4 30" stroke="#e9d2ad" stroke-width="3" fill="none" stroke-linecap="round"/>';
    return '<ellipse cx="100" cy="192" rx="50" ry="7" fill="#000" opacity=".12"/>' +
      // pattes jaunes (« pieds-jaune »)
      '<path d="M86 172 v14 m0 0 l-8 4 m8 -4 l0 6 m0 -6 l8 4 M114 172 v14 m0 0 l-8 4 m8 -4 l0 6 m0 -6 l8 4" stroke="#f2b51b" stroke-width="5" stroke-linecap="round" fill="none"/>' +
      aileG + aileD +
      '<ellipse cx="100" cy="132" rx="46" ry="48" fill="#a46c43" stroke="#5c3a1f" stroke-width="4"/>' +
      '<ellipse cx="100" cy="144" rx="28" ry="32" fill="#ecd6b0"/>' +
      '<path d="M88 128 q4 6 0 12 M100 132 q4 6 0 12 M112 128 q4 6 0 12 M94 150 q4 6 0 12 M106 150 q4 6 0 12" stroke="#b98a5e" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M86 30 q4 -14 14 -18 q-2 10 2 16 q6 -12 16 -12 q-6 8 -4 18z" fill="#8a5a36" stroke="#5c3a1f" stroke-width="2.5"/>' +
      '<circle cx="100" cy="72" r="40" fill="#b57a4e" stroke="#5c3a1f" stroke-width="3.5"/>' +
      '<ellipse cx="100" cy="80" rx="31" ry="26" fill="#e9d2ad"/>' +
      '<ellipse cx="72" cy="88" rx="7" ry="4.5" fill="#ff9aa8" opacity=".7"/><ellipse cx="128" cy="88" rx="7" ry="4.5" fill="#ff9aa8" opacity=".7"/>' +
      yeux + bec;
  }

  /* ---------- décor : les hauts de l'Étang-Salé, la forêt, la côte sud-ouest au loin ---------- */
  const arbre = (x, y, h, c) => '<g transform="translate(' + x + ' ' + y + ')" class="balance"><path d="M0 0 v-' + h + '" stroke="#6b4a2a" stroke-width="5"/><ellipse cy="-' + h + '" rx="' + (h * .42) + '" ry="' + (h * .36) + '" fill="' + (c || "#3f8a55") + '"/><ellipse cx="-' + (h * .2) + '" cy="-' + (h * .82) + '" rx="' + (h * .26) + '" ry="' + (h * .22) + '" fill="#5aa56a"/></g>';
  const fougere = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" class="balance"><path d="M0 0 q-4 -40 -24 -62 M0 0 q4 -40 24 -62 M0 0 v-70" stroke="#2f7a45" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-10 -30 l-10 -4 M-16 -46 l-10 -2 M10 -30 l10 -4 M16 -46 l10 -2 M0 -40 l-8 -4 M0 -40 l8 -4 M0 -56 l-7 -4 M0 -56 l7 -4" stroke="#4fa35f" stroke-width="4" stroke-linecap="round"/></g>';
  const vol = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" class="flotte"><path d="M-30 0 q15 -12 30 0 q15 -12 30 0" stroke="#5c3a1f" stroke-width="5" fill="none" stroke-linecap="round"/></g>';
  const hotel = '<g transform="translate(206 210)"><rect width="110" height="42" rx="4" fill="#efe6d6" stroke="#b59b78" stroke-width="3"/><rect x="-6" y="-8" width="122" height="10" rx="3" fill="#6b5a44"/>' +
    [0, 1, 2, 3].map(i => '<rect x="' + (10 + i * 26) + '" y="12" width="16" height="22" rx="2" fill="#9fd0e6"/>').join("") + '</g>';
  const extra = '<path d="M0 194 q90 -18 180 -6 t180 -4" stroke="#78b862" stroke-width="9" fill="none"/>' + hotel +
    arbre(30, 300, 92, "#2f7a45") + arbre(330, 306, 84) + arbre(170, 250, 44, "#4f9a5c") + fougere(300, 318, .8) + fougere(64, 322, .7) + vol(250, 130, .7);
  const decor = { ciel: ["#7cc4ea", "#e4f4ff"], merC: ["#2a7fb8", "#5ab4d6"], mer: "large", sable: "#86c46e", sableC2: "#5aa55a", horizon: 150, plage: 188,
    montagne: "M0 152 q40 -70 100 -86 q50 -10 90 30 q40 -30 90 -20 q50 12 80 76 z", montagneC: "#4e8a5e", soleilX: 70, extra };

  /* ---------- la vue depuis la fenêtre : les hauts, la côte au loin ---------- */
  const vue = '<rect width="140" height="120" fill="#a9daf3"/><rect y="64" width="140" height="18" fill="#3a8fc0"/><path d="M0 70 q20 -4 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="2" fill="none" class="vague-anim"/>' +
    '<path d="M0 82 q40 -10 80 -2 t60 -4 V120 H0z" fill="#6fb35e"/><path d="M0 100 q50 -12 140 -4 V120 H0z" fill="#3f8a55"/><circle cx="24" cy="20" r="9" fill="#ffd166"/>' +
    '<path d="M86 34 q8 -6 16 0 q8 -6 16 0" stroke="#5c3a1f" stroke-width="3" fill="none" stroke-linecap="round" class="flotte"/>';

  /* ---------- la carte du Papangue (illustrée, non contractuelle) ---------- */
  const carteFond = '<defs><linearGradient id="cpente" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ed08a"/><stop offset="1" stop-color="#5fa35c"/></linearGradient></defs>' +
    '<rect width="360" height="440" fill="url(#cpente)"/>' +
    '<rect width="360" height="44" fill="#3a8fc0"/>' + [0, 1].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-10 ' + (14 + i * 16) + ' q20 -5 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>').join("") +
    '<path d="M0 44 q90 -8 180 2 t180 -2 v14 q-90 8 -180 -2 t-180 2z" fill="#e9d6a8"/>' +
    '<text x="350" y="78" text-anchor="end" font-size="11" font-weight="800" fill="#2e5e33" font-family="system-ui,sans-serif">la côte sud-ouest, tout en bas</text>' +
    // la forêt et les fougères
    [[24, 160], [52, 196], [20, 236], [330, 120], [346, 160], [180, 120], [150, 168]].map(p => arbre(p[0], p[1], 34, "#2f7a45")).join("") +
    '<path d="M95 330 q40 -60 30 -120 q-10 -50 60 -80 M125 214 q60 0 110 -20 M150 300 q60 0 110 0 M190 380 q-20 -40 -40 -70" stroke="#efe2c0" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    // l'hôtel (architecture contemporaine)
    '<g transform="translate(30 286)"><rect width="128" height="70" rx="6" fill="#efe6d6" stroke="#b59b78" stroke-width="3"/><rect x="-6" y="-10" width="140" height="12" rx="3" fill="#6b5a44"/>' + [0, 1, 2, 3].map(i => '<rect x="' + (12 + i * 30) + '" y="14" width="18" height="16" rx="2" fill="#9fd0e6"/><rect x="' + (12 + i * 30) + '" y="40" width="18" height="16" rx="2" fill="#9fd0e6"/>').join("") + '</g>' +
    // Le Curcuma
    '<g transform="translate(220 262)"><rect width="86" height="46" rx="6" fill="#efe6d6" stroke="#b59b78" stroke-width="3"/><rect x="-6" y="-10" width="98" height="12" rx="3" fill="#e0a23a"/>' + [0, 1, 2].map(i => '<circle cx="' + (20 + i * 24) + '" cy="26" r="7" fill="#e0a23a"/>').join("") + '</g>' +
    // la piscine
    '<g transform="translate(212 170)"><rect width="76" height="34" rx="12" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><path d="M12 16 q8 -5 16 0 t16 0 t16 0" stroke="#fff" stroke-width="2" fill="none" class="reflet"/></g>' +
    // Aloe Spa
    '<g transform="translate(286 344)"><rect width="60" height="36" rx="6" fill="#efe6d6" stroke="#b59b78" stroke-width="3"/><path d="M30 8 q-10 10 0 22 q10 -12 0 -22z" fill="#5aa56a"/></g>' +
    '<text x="316" y="398" text-anchor="middle" font-size="10" font-weight="800" fill="#2e5e33" font-family="system-ui,sans-serif">Aloe Spa</text>' +
    vol(250, 100, .6) +
    '<g transform="translate(40 70) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  /* ---------- le jeu des tuyaux : la pluie des hauts arrose le jardin ---------- */
  const decorHaut = '<path d="M0 60 q50 -40 110 -36 q50 4 90 -14 q60 -20 160 20 V100 H0z" fill="#9fcf8f" opacity=".7"/>' +
    '<g transform="translate(72 18)"><ellipse rx="40" ry="14" fill="#fff"/><ellipse cx="-18" cy="-8" rx="20" ry="12" fill="#fff"/><ellipse cx="14" cy="-10" rx="18" ry="12" fill="#fff"/></g>' +
    '<g class="pluie" stroke="#5cc0ff" stroke-width="2.4" stroke-linecap="round"><line x1="52" y1="34" x2="49" y2="46"/><line x1="72" y1="36" x2="69" y2="48"/><line x1="92" y1="34" x2="89" y2="46"/></g>' +
    '<path d="M64 58 h16 v46 h-16z" fill="#8a6440"/><path d="M68 58 h8 v46 h-8z" fill="#5cc0ff" opacity=".6"/>' +
    '<text x="132" y="54" font-size="13" font-weight="900" fill="#2e5e33" font-family="system-ui,sans-serif">La pluie tombe sur les hauts…</text>' +
    fougere(330, 100, .55);
  const decorBas = '<rect x="0" y="400" width="360" height="40" fill="#5c3d22"/><text x="12" y="425" font-size="13" font-weight="900" fill="#ffe9c4" font-family="system-ui,sans-serif">…le jardin du Papangue a soif !</text>' +
    '<path id="sortie" d="M288 392 v10" stroke="#3aa7ff" stroke-width="16" opacity="0" style="transition:opacity .4s"/>' +
    [244, 274, 304, 334].map((x, i) => '<g transform="translate(' + x + ' 412)"><g class="plante"><path d="M0 0 v-20" stroke="#3e8e41" stroke-width="3"/><path d="M0 -8 q-12 -4 -14 -16 M0 -12 q12 -4 14 -16" stroke="#5cbf5f" stroke-width="4" fill="none" stroke-linecap="round"/>' + (i % 2 ? '<circle cx="0" cy="-24" r="4" fill="#ff8fab"/>' : '<circle cx="0" cy="-24" r="4" fill="#ffd166"/>') + '</g></g>').join("");

  return {
    id: "papangue", nom: "Papangue Hôtel & Spa", nomCourt: "Papangue", titre: "Ti Papang et les plumes du vent",
    couleurs: C, perso, perso_nom: "Ti Papang", decor,
    accroche: "Une aventure en famille dans les hauts de l'Étang-Salé, du jardin à ta chambre.",
    accueilBulle: "Coucou ! Moi, c'est <b>Ti Papang</b>, un jeune papangue. Le vent des hauts a emporté mes plus belles plumes… tu m'aides à les retrouver ?",
    boutonDepart: "🪶 J'aide Ti Papang !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Je suis un papangue, le grand rapace de La Réunion. J'aime planer au-dessus de la forêt, tout en haut, là où le vent porte."],
      ["coucou", "Ce matin, une rafale a éparpillé mes <b>plumes du vent</b> dans tout le Papangue : au jardin, dans ta chambre, au Curcuma…"],
      ["joie", "Retrouve-les avec moi. À la fin, une <b>vraie récompense</b> t'attend. Parole de papangue !", "🗺️ Voir la carte du Papangue"]
    ],
    carteTitre: "La carte du Papangue", carteBulle: "On commence par le jardin ? Touche l'étape <b>1</b> !",
    gain: { icone: "🪶", nomPluriel: "Les plumes du vent" },
    carte: { fond: carteFond },
    etapes: [
      { id: "jardin", lieu: "Le jardin du Papangue", lieuCourt: "Le jardin", titre: "Le chemin de la pluie", resume: "Guide la pluie des hauts jusqu'au jardin", duree: "3 min", x: 80, y: 150,
        mission: "Il pleut sur les hauts ! Fais tourner les tuyaux pour que l'eau coule jusqu'au <b>jardin</b>. Les fougères comptent sur toi, et ma 1re plume t'attend au bout.",
        regle: ["Pose ton doigt sur un tuyau et fais-le tourner en rond, comme une manivelle.", "L'eau devient bleue quand elle passe.", "Relie le nuage (en haut) au jardin (en bas à droite)."],
        boutonJeu: "🔧 Je fais couler la pluie !",
        jeu: { type: "tuyaux", titreBarre: "💧 Le chemin de la pluie", coupsMini: 7, decorHaut, decorBas,
          tuiles: [["L", 0, 3, 1], ["L", 2, 1, 1], ["T", 0, 1], ["I", 0, 1],
                   ["L", 0, 2], ["L", 0, 3, 1], ["I", 1, 0, 1], ["L", 2, 1, 1],
                   ["T", 0, 2], ["I", 0, 0], ["L", 0, 1], ["I", 0, 1, 1],
                   ["I", 0, 1], ["T", 0, 3], ["L", 0, 0], ["I", 0, 1, 1]],
          msgDebut: "Fais tourner avec ton doigt : dessine un rond sur un tuyau gris. La pluie part du nuage (en haut à gauche) et file vers la flèche jaune 💧",
          msgAide: "Astuce de Ti Papang : vu du ciel, l'eau descend du nuage vers le coin en bas à droite.",
          msgGagne: "Plouf ! La pluie des hauts arrive au jardin. Les fougères se redressent !" },
        bravo: { titre: "Le jardin a bu !", gainIcone: "🪶", gain: "Plume n°1 : la plume de pluie", gainSous: "Grâce à toi, chaque goutte arrive au jardin.", perso: "Tu as l'œil du papangue : tu as tout vu d'en haut !" },
        savais: { titre: "Le savais-tu ?", texte: "Le papangue, ou busard de Maillard, vit seulement à La Réunion. C'est le dernier rapace de l'île qui y fait son nid, et il est protégé depuis 1989. Il plane au-dessus des forêts et des ravines.", src: "Plan national d'actions Busard de Maillard 2022-2031 (DEAL Réunion) · reunion-parcnational.fr" },
        terrain: "dans l'application complète, la famille trouve ce repère au jardin (emplacement à choisir avec vous) et y découvre les plantes du Papangue, avec vos jardiniers." },
      { id: "chambre", lieu: "Ta chambre au Papangue", lieuCourt: "La chambre", titre: "Le nid de Ti Papang", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 96, y: 330,
        mission: "Ma 2e plume est cachée dans ta chambre, derrière <b>5 défis</b>. Ta chambre devient mon nid douillet : relève les défis en famille !",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = la plume du nid."],
        boutonJeu: "🔎 J'inspecte le nid !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f6efe2", sol: "#b88d5e", drap: "#e9d2ad", bois: "#7a5636", accent: "#e0a23a" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans le nid de Ti Papang 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 défis sur 5 ! Ton nid est le plus douillet des hauts. Ti Papang bat des ailes de joie !",
          objets: [
            { obj: "douche", x: 254, y: 106, s: .85, r: 34, icone: "🚿", titre: "Défi douche chanson", defi: "Une douche le temps d'une chanson, et hop, on ferme l'eau ! Ti Papang chante avec toi. Quelle chanson choisis-tu ?", vrai: "Ce soir, fais pareil sous la vraie douche : le temps d'une chanson, puis on ferme l'eau. Quelle chanson choisis-tu ?", bravo: "Douche en chanson : bravo, la star des hauts !" },
            { obj: "clim", x: 98, y: 136, s: .85, r: 38, icone: "🌬️", titre: "Défi air des hauts", defi: "Fenêtre ouverte ? La clim se repose et l'air frais des hauts entre dans le nid. On ferme la fenêtre, et la clim reprend !", vrai: "Dans ta vraie chambre, c'est pareil : fenêtre ouverte, la clim se repose et l'air des hauts entre. Fenêtre fermée, elle reprend !", bravo: "L'air des hauts et la clim font équipe !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi nuit de papangue", defi: "Le papangue dort quand le soleil se couche. En sortant, éteins toutes les lumières en moins de 5 secondes. 3, 2, 1… dodo !", vrai: "Tout à l'heure, en sortant de la chambre, fais pareil pour de vrai : toutes les lumières éteintes en moins de 5 secondes. 3, 2, 1… dodo !", bravo: "Lumières éteintes, nid tout calme !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#e0a23a", icone: "🪶", titre: "Défi ailes au sec", defi: "Suspends ta serviette pour qu'elle sèche, comme Ti Papang étale ses ailes au soleil. Demain, elle est prête à servir !", vrai: "Ce soir, fais pareil avec ta vraie serviette : suspends-la pour qu'elle sèche, comme Ti Papang étale ses ailes. Il compte sur toi !", bravo: "Ailes au sec, serviette prête !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Emballage, papier, épluchure : trouve le bon bac du premier coup. Le papangue a l'œil, et toi aussi !", vrai: "Pendant ton séjour, garde ton œil de papangue : emballage, papier, épluchure, chacun son bac.", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "emballage", "nom": "emballage", "bac": "emb"}, {"obj": "papier", "nom": "papier", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait, œil de papangue !" }
          ] },
        bravo: { titre: "Le nid est douillet !", gainIcone: "🪶", gain: "Plume n°2 : la plume du nid", gainSous: "5 défis relevés en famille.", perso: "Quel nid ! Tu prends soin de l'eau, de la lumière et des déchets." },
        savais: { titre: "Le savais-tu ?", texte: "Le Papangue Hôtel & Spa a reçu l'Écolabel européen, le label écologique officiel de l'Europe. Il récompense les hôtels qui prennent soin de l'eau, de l'énergie et des déchets.", src: "Base Écolabel européen de l'ADEME (licence FR/051/679)" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à définir avec vous)." },
      { id: "curcuma", lieu: "Le Curcuma", lieuCourt: "Le Curcuma", titre: "Le panier du chef", resume: "Les produits d'ici et de saison", x: 262, y: 286,
        teaser: "Au Curcuma, le chef cuisine des produits d'ici et de saison. Sauras-tu retrouver ce qui pousse en ce moment ?",
        complet: ["Un jeu des saisons avec les produits de la carte (à choisir avec le chef)", "La 3e plume, gagnée à table", "Les parents découvrent la carte du Curcuma"] },
      { id: "piscine", lieu: "La piscine", lieuCourt: "La piscine", titre: "Le grand plongeon", resume: "Le jeu des gouttes d'eau", x: 250, y: 196,
        teaser: "Au bord de la piscine, avec la côte au loin, une énigme t'attend sur le voyage de l'eau.",
        complet: ["Une énigme sur l'eau, du nuage à la mer", "La 4e plume", "Un défi en famille, chrono en main"] },
      { id: "accueil", lieu: "L'accueil du Papangue", lieuCourt: "L'accueil", titre: "L'envol de Ti Papang", resume: "Rends les plumes et prends ton envol", x: 196, y: 396,
        teaser: "Avec les 5 plumes, Ti Papang reprend son envol. Et ta famille rejoint les gardiens des hauts !",
        complet: ["Le compteur des familles gardiennes des hauts, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Sentinelle des hauts", court: "SENTINELLE DES HAUTS" },
    victoireTexte: "Ti Papang a retrouvé ses plumes : il plane de nouveau au-dessus de la forêt ! Voici ta récompense.",
    lot: { titre: "1 dessert offert à l'enfant", lieu: "Au restaurant Le Curcuma", detail: "Montre ce bon au Curcuma pendant ton séjour. Bon appétit, Ti Papang !" },
    codePrefixe: "PAPANG",
    compteur: "Ta famille rejoint les familles gardiennes des hauts (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 plumes à retrouver dans tout le Papangue", "Des niveaux 2 et 3 pour les longs séjours", "Une carte souvenir de Ti Papang à garder"],
    projet: {
      pour: "Maquette pour le Papangue Hôtel & Spa · L'Étang-Salé les Hauts",
      sous: "Une aventure sur téléphone pour les familles. Ti Papang, un jeune papangue, fait découvrir l'hôtel, du jardin à la chambre. Personnage, étapes, défis et lots se construisent avec vos équipes.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. au Curcuma"], ["🌿", "Un appui pour vos critères Écolabel 3, 16 et 26"], ["🤝", "Co-construite avec vos équipes, en ateliers"]],
      idee: [
        "Les enfants aident Ti Papang, le jeune papangue, à retrouver ses plumes du vent.",
        "Chaque étape est un mini-jeu dans un lieu de l'hôtel : le jardin, la chambre, le Curcuma…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer au restaurant."
      ],
      apports: [
        ["👨‍👩‍👧", "Une animation pour vos familles", "Une heure de jeu en autonomie, au rythme de chacun, pendant le séjour."],
        ["🍽️", "Vos lieux mis en valeur", "Les lots amènent les familles au Curcuma, au bar ou à l'Aloe Spa."],
        ["🪶", "Votre Écolabel, vécu en jeu", "L'eau, l'énergie, les déchets et le papangue, oiseau de l'île : les enfants les découvrent en jouant, avec le sourire."],
        ["🤝", "Une aventure construite avec vos équipes", "Ateliers avec le personnel, idées de vos équipes du restaurant, du spa et de l'accueil, puis test avec des familles : le Papangue choisit tout."]
      ],
      label: {
        titre: "Un appui pour votre Écolabel européen",
        intro: "L'aventure informe vos clients de façon active et fait de l'éducation à l'environnement une vraie distraction. Elle aide à documenter :",
        criteres: [
          ["Critère 3", "Information de la clientèle donnée « activement » : économies d'eau, linge et serviettes, déchets, lieux d'intérêt. Le petit avis de fin répond au point b)."],
          ["Critère 26", "Biodiversité locale (a, avec le papangue et vos plantes) et éducation à l'environnement dans les distractions (b) : 2 points optionnels."],
          ["Critère 16", "Réutilisation des serviettes : le défi « ailes au sec » de la mission chambre."]
        ],
        note: "Référence : décision (UE) 2017/175. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple (à choisir avec vous) :",
      lots: [["🍨", "1 dessert offert à l'enfant", "au Curcuma"], ["🍹", "1 mocktail « Ti Papang » pour l'enfant", "au bar"], ["💆", "Une attention pour les parents", "à l'Aloe Spa"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou un jour de pluie. Les écogestes deviennent des défis de famille :", defis: ["La douche le temps d'une chanson", "L'air des hauts : fenêtre ouverte, clim au repos", "Nuit de papangue : tout éteint en 5 secondes", "Les ailes au sec : la serviette suspendue pour demain", "Le tri du premier coup"] },
      complete: ["5 étapes : le jardin, la chambre, le Curcuma, la piscine, l'accueil (lieux à choisir avec vous)", "Des ateliers avec vos équipes pour choisir personnage, défis et lots", "Un test avec quelques familles, puis les ajustements ensemble", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une étape « forêt » le jour où votre futur parcours ouvrira", "Hors connexion, dans le navigateur, avec des compteurs anonymes"],
      appli: "Un QR code suffit : l'aventure s'ouvre dans le navigateur. Elle peut ensuite se décliner dans les autres hôtels du groupe Morgabine, chacun avec son personnage.",
      stats: [["126", "familles ont terminé l'aventure"], ["50 min", "de jeu en moyenne"], ["87 %", "des défis « chambre » relevés"], ["9,2/10", "note des enfants"]],
      barres: [["Étape jardin", 93], ["Étape chambre", 87], ["Étape Curcuma", 76], ["Bons utilisés", 70]]
    }
  };
})();
