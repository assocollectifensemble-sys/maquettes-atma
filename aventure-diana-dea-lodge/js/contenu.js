/* ============================================================
   CONTENU — Diana Dea Lodge & Spa (Sainte-Anne, Saint-Benoît, 600 m d'altitude) · « Ti Dea et les clés de la forêt »
   Faits utilisés (sources lues le 13/11/2026) :
   - Clef Verte : palmarès 2026 (ligne 15 de 07-hotels-eco-labellises.md) ; page label du site : gestion de l'eau et de
     l'énergie, tri et réduction des déchets, produits d'entretien éco-labellisés, biodiversité du domaine « où les
     visiteurs croisent cerfs et plantes endémiques », sentiers, bains de forêt (diana-dea-lodge.re/hotel-labels/).
   - Hôtel 5 étoiles à 600 m d'altitude, vue sur l'océan Indien et la côte Est ; bois, pierre, cuir et verre ; deux
     sentiers du domaine et ses cerfs ; 31 chambres et suites et 5 tentes Glamping ; Spa Cinq Mondes ; deux piscines à
     débordement (une chauffée entre 26 et 28 °C) ; propriété au cœur du Patrimoine mondial de l'Unesco ;
     94 chemin Helvetia, 97437 Sainte-Anne ; reception@diana-dea-lodge.re (diana-dea-lodge.re/).
   - La Table du Diana, chef exécutif Guillaume Caroupaye-Caroupin, produits locaux et circuits courts
     (diana-dea-lodge.re/restaurant/).
   - Activités sur place : salle de jeux (billard, babyfoot), boucle facile de 20 minutes sur le domaine, pique-nique,
     nourrissage des cerfs (diana-dea-lodge.re/activites/).
   - The Leading Hotels of the World depuis juillet 2025 (hotel-labels) ; domaine de 150 hectares (lhw.com, Facebook).
   Offre enfants : suites familiales, glamping 4 personnes, salle de jeux. Tout le reste est une PROPOSITION.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#2f6b4a", c2: "#c9823a", fond: "#13291e", fond2: "#244a36", accent: "#ffd166", clair: "#eef5ee" };

  /* ---------- Ti Dea, le petit faon du domaine ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M76 108 q9 -10 18 0 M106 108 q9 -10 18 0" stroke="#3b2412" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="85" cy="106" rx="9.5" ry="12" fill="#fff"/><ellipse cx="115" cy="106" rx="9.5" ry="12" fill="#fff"/><circle cx="87" cy="109" r="6.5" fill="#2a1a0d"/><circle cx="117" cy="109" r="6.5" fill="#2a1a0d"/><circle cx="89.5" cy="105" r="2.4" fill="#fff"/><circle cx="119.5" cy="105" r="2.4" fill="#fff"/></g>';
    const bouche = pose === "parle"
      ? '<ellipse cx="100" cy="140" rx="7" ry="5.5" fill="#6b2a1f"/>'
      : '<path d="M90 136 q10 10 20 0" stroke="#6b2a1f" stroke-width="4" fill="none" stroke-linecap="round"/>';
    const oreilleD = leve
      ? '<ellipse cx="150" cy="62" rx="12" ry="26" fill="#c98a4f" stroke="#8a5a2b" stroke-width="3" transform="rotate(48 150 62)"/><ellipse cx="150" cy="62" rx="6" ry="16" fill="#f3c9a0" transform="rotate(48 150 62)"/>'
      : '<ellipse cx="152" cy="80" rx="12" ry="26" fill="#c98a4f" stroke="#8a5a2b" stroke-width="3" transform="rotate(70 152 80)"/><ellipse cx="152" cy="80" rx="6" ry="16" fill="#f3c9a0" transform="rotate(70 152 80)"/>';
    return '<ellipse cx="100" cy="192" rx="56" ry="7" fill="#000" opacity=".12"/>' +
      // corps, taches blanches, pattes
      '<ellipse cx="100" cy="170" rx="40" ry="20" fill="#c98a4f" stroke="#8a5a2b" stroke-width="3"/><circle cx="84" cy="166" r="4" fill="#fff4e0"/><circle cx="100" cy="162" r="4" fill="#fff4e0"/><circle cx="116" cy="166" r="4" fill="#fff4e0"/>' +
      '<path d="M78 184 v8 M122 184 v8" stroke="#6b4a2a" stroke-width="7" stroke-linecap="round"/>' +
      // tête, oreilles, petits bois naissants
      '<ellipse cx="48" cy="80" rx="12" ry="26" fill="#c98a4f" stroke="#8a5a2b" stroke-width="3" transform="rotate(-70 48 80)"/><ellipse cx="48" cy="80" rx="6" ry="16" fill="#f3c9a0" transform="rotate(-70 48 80)"/>' + oreilleD +
      '<path d="M84 64 q-6 -18 -2 -30 M84 46 q-10 -4 -14 -12 M116 64 q6 -18 2 -30 M116 46 q10 -4 14 -12" stroke="#7a5230" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="100" cy="110" rx="46" ry="44" fill="#d89a5b" stroke="#8a5a2b" stroke-width="4"/>' +
      '<ellipse cx="100" cy="134" rx="22" ry="16" fill="#f6dcc0"/><ellipse cx="100" cy="124" rx="7" ry="5" fill="#3b2412"/>' +
      '<ellipse cx="68" cy="124" rx="7" ry="4.5" fill="#ff9aa8" opacity=".8"/><ellipse cx="132" cy="124" rx="7" ry="4.5" fill="#ff9aa8" opacity=".8"/>' +
      yeux + bouche +
      '<g transform="translate(100 150)"><path d="M-14 0 q14 8 28 0" stroke="#2f6b4a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M0 4 l-4 10 h8z" fill="#ffd166"/></g>';
  }

  /* ---------- décor : la forêt des hauts de l'Est, l'océan au loin ---------- */
  const arbre = (x, y, h, c) => '<g transform="translate(' + x + ' ' + y + ')" class="balance"><path d="M0 0 v-' + h + '" stroke="#5a3d22" stroke-width="6"/><circle cx="0" cy="-' + h + '" r="' + (h * .42) + '" fill="' + (c || "#2f7a3f") + '"/><circle cx="-' + (h * .3) + '" cy="-' + (h * .78) + '" r="' + (h * .3) + '" fill="#3f8f4a"/><circle cx="' + (h * .3) + '" cy="-' + (h * .8) + '" r="' + (h * .28) + '" fill="#4fa356"/></g>';
  const fougere = (x, y) => '<g transform="translate(' + x + ' ' + y + ')"><path d="M0 0 q-4 -26 10 -46" stroke="#3e8e41" stroke-width="3" fill="none"/>' + [0, 1, 2, 3, 4].map(i => '<ellipse cx="' + (2 + i * 2) + '" cy="-' + (8 + i * 8) + '" rx="9" ry="3" fill="#5cb85a" transform="rotate(-30 ' + (2 + i * 2) + ' -' + (8 + i * 8) + ')"/>').join("") + '</g>';
  const decor = { ciel: ["#7cc6ea", "#eaf7ff"], merC: ["#16608f", "#2c93b8"], mer: "large", sable: "#4f8f4a", sableC2: "#3f7a3c", horizon: 96, plage: 150,
    montagne: "M0 152 q60 -40 120 -30 q60 10 120 -16 q60 -20 120 4 V160 H0z", montagneC: "#3f7a4a",
    extraFond: '<path d="M0 170 q90 -24 180 -14 t180 -10 V200 H0z" fill="#2f6b3c"/>',
    palmiers: [], extra: arbre(30, 300, 110) + arbre(330, 296, 96, "#2a6b38") + arbre(150, 250, 60, "#3a8a48") + fougere(80, 320) + fougere(270, 330) + fougere(220, 300) };

  const vue = '<rect width="140" height="120" fill="#b8e2f6"/><rect y="34" width="140" height="22" fill="#2c93b8"/><path d="M0 40 q20 -4 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="2.4" fill="none" class="vague-anim"/>' +
    '<path d="M0 62 q40 -14 80 -6 t60 -8 V120 H0z" fill="#3f7a4a"/><path d="M0 84 q50 -14 100 -4 t40 -4 V120 H0z" fill="#2f6b3c"/>' +
    '<g transform="translate(26 116) scale(.5)">' + '<path d="M0 0 v-60" stroke="#5a3d22" stroke-width="8"/><circle cx="0" cy="-64" r="26" fill="#2f7a3f"/>' + '</g><circle cx="118" cy="16" r="9" fill="#ffd166"/>';

  /* ---------- la carte (illustrée, non contractuelle) ---------- */
  const carteFond = '<rect width="360" height="440" fill="#6aa35a"/>' +
    '<path d="M0 0 h360 v52 H0z" fill="#2c93b8"/><path class="vague-anim" d="M-10 24 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".45"/>' +
    '<text x="352" y="70" text-anchor="end" font-size="11" font-weight="800" fill="#1f4a2c" font-family="system-ui,sans-serif">l\'océan Indien, 600 m plus bas</text>' +
    '<path d="M0 52 q90 30 180 14 t180 10 v20 q-90 -6 -180 8 t-180 -14z" fill="#3f7a4a"/>' +
    // sentiers du domaine
    '<path d="M70 400 q-40 -80 20 -150 t120 -90 q60 -10 110 40 M210 160 q-20 80 40 160 q20 40 -40 70" stroke="#e8d7ae" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="2 14"/>' +
    [[24, 150, 44], [330, 140, 40], [40, 250, 36], [300, 260, 38], [20, 400, 40], [344, 420, 42], [150, 120, 30]].map(a => arbre(a[0], a[1], a[2])).join("") +
    // les piscines à débordement
    '<g transform="translate(196 196)"><rect width="64" height="30" rx="12" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><rect x="72" y="6" width="50" height="24" rx="10" fill="#7fd6f5" stroke="#fff" stroke-width="4"/></g>' +
    // La Table du Diana
    '<g transform="translate(206 286)"><rect width="88" height="46" rx="8" fill="#f4ead8" stroke="#8a6a46" stroke-width="3"/><path d="M-6 0 h100 l-12 -14 h-76z" fill="#7a5230"/>' + [0, 1, 2].map(i => '<g transform="translate(' + (18 + i * 26) + ' 28)"><circle r="8" fill="#fff" stroke="#8a6a46" stroke-width="2"/><circle r="4" fill="#ffd166"/></g>').join("") + '</g>' +
    // le lodge (chambres et accueil)
    '<g transform="translate(70 330)"><rect width="120" height="60" rx="8" fill="#e9dcc4" stroke="#7a5230" stroke-width="3"/><path d="M-8 2 l68 -26 l68 26z" fill="#6b4a2a"/>' + [0, 1, 2].map(i => '<rect x="' + (14 + i * 34) + '" y="14" width="22" height="18" rx="3" fill="#bfe6f2"/>').join("") + '<rect x="50" y="38" width="20" height="22" fill="#7a5230"/></g>' +
    // la clairière des cerfs
    '<g transform="translate(104 196)"><ellipse rx="44" ry="22" fill="#8cc26a"/><text x="0" y="40" text-anchor="middle" font-size="18">🦌</text></g>' +
    '<g transform="translate(286 360) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  /* ---------- le sentier (jeu « ce qui n'est pas de la forêt ») ---------- */
  const decorSentier = '<rect width="360" height="440" fill="#5f9a4f"/>' +
    '<path d="M150 440 q-40 -120 40 -220 t20 -220 h40 q-30 100 -10 220 t-30 220z" fill="#d8c79a"/>' +
    arbre(30, 120, 80) + arbre(330, 110, 70, "#2a6b38") + arbre(40, 430, 90) + arbre(320, 430, 80, "#2a6b38") + fougere(90, 200) + fougere(280, 260) + fougere(70, 330) + fougere(300, 380) +
    '<text x="352" y="22" text-anchor="end" font-size="12" font-weight="800" fill="#fff4d6" font-family="system-ui,sans-serif">le sentier du domaine</text>';

  return {
    id: "diana-dea-lodge", nom: "Diana Dea Lodge & Spa", nomCourt: "Diana Dea Lodge", titre: "Ti Dea et les clés de la forêt",
    couleurs: C, perso, perso_nom: "Ti Dea", decor,
    accroche: "Une aventure en famille, de ta chambre aux sentiers du domaine, au milieu des cerfs.",
    accueilBulle: "Coucou ! Moi, c'est <b>Ti Dea</b>, le petit faon du domaine. Tu viens explorer la forêt avec moi ?",
    boutonDepart: "🦌 Je suis Ti Dea !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Le Diana Dea Lodge a une <b>Clef Verte</b> : c'est le prix des hôtels qui chouchoutent l'eau, l'énergie et la nature du domaine."],
      ["coucou", "Pour la fêter, j'ai caché <b>5 clés vertes</b> : dans ta chambre, sur le sentier, à La Table du Diana…"],
      ["joie", "Retrouve-les avec moi, et une <b>vraie récompense</b> t'attend. En avant, petits sabots !", "🗺️ Voir la carte"]
    ],
    carteTitre: "La carte du domaine", carteBulle: "On commence par ta chambre ? Touche l'étape <b>1</b> !",
    gain: { icone: "🔑", nomPluriel: "Les clés vertes" },
    carte: { fond: carteFond },
    etapes: [
      { id: "chambre", lieu: "Ta chambre au Diana Dea Lodge", lieuCourt: "La chambre", titre: "Le refuge secret", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 170, y: 330,
        mission: "Ta chambre est le refuge secret de Ti Dea ! J'y ai caché <b>5 défis</b>. Trouve-les et relève-les en famille.",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = la clé verte du refuge."],
        boutonJeu: "🔎 J'explore le refuge !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f2ebdf", sol: "#9c7650", drap: "#d7e6cf", bois: "#6b4a2a", accent: "#c9823a" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans le refuge 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 défis sur 5 ! Ton refuge est le plus doux de la forêt. Ti Dea fait des petits bonds de joie !",
          objets: [
            { obj: "robinet", x: 284, y: 112, icone: "🪥", titre: "Défi brossage du faon", defi: "Ce soir, robinet fermé pendant le brossage… et tu imites le cri du faon jusqu'au bout ! Qui tiendra 2 minutes ?", vrai: "Ce soir, fais pareil avec le vrai robinet : fermé pendant tout le brossage, et 2 minutes de cris de faon en famille. Fou rire garanti !", bravo: "Dents brillantes, robinet au repos !" },
            { obj: "clim", x: 98, y: 136, s: .85, r: 38, icone: "🌬️", titre: "Défi air de la forêt", defi: "Fenêtre ouverte ? La clim se repose et l'air frais de la forêt prend le relais. Fenêtre fermée, la clim reprend son travail !", vrai: "Dans ta vraie chambre, c'est pareil : fenêtre ouverte, la clim se repose et l'air de la forêt entre. Fenêtre fermée, la clim reprend son travail !", bravo: "L'air de la forêt et la clim font équipe !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi nuit des étoiles", defi: "En sortant du refuge, éteins toutes les lumières en moins de 5 secondes : la nuit de la forêt est toute à toi. Top chrono !", vrai: "Tout à l'heure, en sortant de ta vraie chambre, fais pareil : toutes les lumières éteintes en moins de 5 secondes. Ce soir, regarde les étoiles au-dessus de la forêt !", bravo: "Les étoiles brillent pour toi !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#2f6b4a", icone: "🍃", titre: "Défi serviette voyageuse", defi: "Suspends ta serviette pour qu'elle sèche : demain, elle repart avec toi à la piscine qui regarde l'océan !", vrai: "Ce soir, fais pareil avec ta vraie serviette : suspends-la pour qu'elle sèche, elle te suivra demain à la piscine. Ti Dea compte sur toi !", bravo: "Serviette suspendue, prête pour demain !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Bouteille, papier, épluchure : trouve le bon bac du premier coup. Le Diana Dea Lodge trie ses déchets, et toi aussi !", vrai: "Pendant ton séjour, garde ton œil de trieur : bouteille, papier, épluchure, chacun son bac. Le lodge trie ses déchets, et toi aussi !", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "bouteille", "nom": "bouteille", "bac": "emb"}, {"obj": "papier", "nom": "papier", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait, petit faon !" }
          ] },
        bravo: { titre: "Refuge paré !", gainIcone: "🔑", gain: "Clé verte n°1 : la clé du refuge", gainSous: "5 défis relevés en famille.", perso: "Quelle équipe ! Même les cerfs du domaine sont fiers de toi." },
        savais: { titre: "Le savais-tu ?", texte: "La Clef Verte récompense les hôtels qui prennent soin de l'eau, de l'énergie et des déchets, et qui protègent la nature. Au Diana Dea Lodge, on croise des cerfs et des plantes endémiques.", src: "diana-dea-lodge.re, page « Label »" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à choisir avec vous)." },
      { id: "sentier", lieu: "Le sentier du domaine", lieuCourt: "Le sentier", titre: "Les trésors du sentier", resume: "Rends la forêt à ses habitants : attrape les intrus", duree: "3 min", x: 120, y: 140,
        mission: "Sur le sentier des cerfs, des <b>intrus</b> se sont glissés parmi les fougères. Mets-les dans le panier, et laisse les trésors de la forêt à leur place !",
        regle: ["Touche un intrus, ou fais-le glisser dans le panier.", "Les branches et le bois de la forêt sont chez eux : on les laisse.", "Tous les intrus ramassés = la clé verte du sentier."],
        boutonJeu: "🧺 À la chasse aux intrus !",
        jeu: { type: "plage", titreBarre: "🧺 Les intrus", decor: decorSentier, panier: [290, 384],
          objets: [
            { obj: "bouteille", x: 60, y: 150, dechet: true }, { obj: "canette", x: 214, y: 132, dechet: true }, { obj: "sac", x: 130, y: 250, dechet: true },
            { obj: "emballage", x: 296, y: 196, dechet: true }, { obj: "bouchon", x: 74, y: 380, dechet: true, s: 1.4 }, { obj: "bouchon", x: 236, y: 300, dechet: true, s: 1.4 },
            { obj: "bois", x: 170, y: 196, msg: "Cette branche tombée devient la maison des insectes de la forêt. Elle reste chez elle 🪵" },
            { obj: "bois", x: 150, y: 352, msg: "Ce bois mort nourrit la terre de la forêt, et les cerfs passent tout près. On le laisse !" }
          ],
          msgDebut: "Touche les intrus ou glisse-les dans le panier 🧺",
          msgPris: ["Hop, au panier !", "Bien vu, petit faon !", "Encore un intrus de moins !", "La forêt te dit merci !", "Plus qu'un ou deux…"],
          msgGagne: "Sentier paré ! Les cerfs peuvent se promener tranquilles, et Ti Dea fait la ronde !" },
        bravo: { titre: "Sentier au top !", gainIcone: "🔑", gain: "Clé verte n°2 : la clé du sentier", gainSous: "Tous les intrus sont au panier, la forêt est chez elle.", perso: "Les cerfs du domaine te saluent de leurs grands bois !" },
        savais: { titre: "Le savais-tu ?", texte: "Le domaine a deux sentiers, dont une boucle facile d'environ 20 minutes, et ses cerfs vivent en liberté. Il est au cœur d'un site classé au Patrimoine mondial de l'Unesco.", src: "diana-dea-lodge.re, pages Accueil et Activités" },
        terrain: "dans l'application complète, cette étape se joue sur la boucle de 20 minutes, avec un vrai panier à rapporter à l'accueil, par exemple (à organiser avec vous)." },
      { id: "table", lieu: "La Table du Diana", lieuCourt: "La Table", titre: "Les saveurs péï", resume: "Le grand jeu des produits d'ici", x: 250, y: 278,
        teaser: "À La Table du Diana, le chef cuisine les produits de l'île : sauras-tu deviner d'où ils viennent ?",
        complet: ["Un jeu des saveurs (à imaginer avec le chef)", "La 3e clé verte, à table, en famille", "Les parents découvrent la carte de La Table du Diana"] },
      { id: "piscine", lieu: "Les piscines à débordement", lieuCourt: "La piscine", titre: "Le plongeon face à l'océan", resume: "L'énigme de l'eau des hauts", x: 258, y: 186,
        teaser: "Au bord des piscines qui regardent l'océan, Ti Dea te pose l'énigme du voyage de l'eau.",
        complet: ["Une énigme sur l'eau, au bord de la piscine", "La 4e clé verte", "Un défi en famille, chrono en main"] },
      { id: "accueil", lieu: "L'accueil du lodge", lieuCourt: "L'accueil", titre: "Le trésor de la forêt", resume: "Rends les 5 clés et gagne ta récompense", x: 96, y: 360,
        teaser: "Avec les 5 clés vertes, Ti Dea ouvre le trésor de la forêt… et ta famille rejoint les gardiens du domaine !",
        complet: ["Le compteur des familles gardiennes, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Gardien·ne du domaine", court: "GARDIEN DU DOMAINE" },
    victoireTexte: "Ti Dea a retrouvé ses clés vertes : la forêt du domaine est en fête ! Voici ta récompense.",
    lot: { titre: "1 dessert offert à l'enfant", lieu: "À La Table du Diana", detail: "Montre ce bon à La Table du Diana pendant ton séjour : Ti Dea t'y attend !" },
    codePrefixe: "DEA",
    compteur: "Ta famille rejoint les familles gardiennes du domaine (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 clés vertes dans tout le domaine", "Une étape au nourrissage des cerfs, avec l'équipe", "Une carte souvenir du domaine à garder"],
    projet: {
      pour: "Maquette pour le Diana Dea Lodge & Spa · Saint-Benoît",
      sous: "Une aventure sur téléphone pour vos familles. Ti Dea, le petit faon du domaine, fait découvrir le lodge, de la chambre aux sentiers des cerfs. Personnage, étapes, défis et lots se construisent avec vos équipes.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. à La Table du Diana"], ["🌿", "Un appui pour vos critères Clef Verte 2.3 et 2.10"], ["📱", "Un QR code suffit, et ça marche même hors ligne"]],
      idee: [
        "Les enfants aident Ti Dea à retrouver les 5 clés vertes cachées dans le domaine.",
        "Chaque étape est un mini-jeu : la chambre, le sentier, La Table du Diana, la piscine…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer."
      ],
      appli: "Une création à plusieurs mains : ateliers avec vos équipes (réception, Table du Diana, spa, soigneurs des cerfs), idées de votre personnel, puis un test avec de vraies familles avant le lancement. Tout ce que montre cette maquette est à choisir avec vous.",
      apports: [
        ["👨‍👩‍👧", "Un plus pour vos familles", "Il complète la salle de jeux, les suites familiales et le glamping : une heure de jeu en autonomie, au rythme de chacun."],
        ["🍽️", "Vos lieux mis en valeur", "Les lots amènent les familles à La Table du Diana, aux piscines ou au Spa Cinq Mondes."],
        ["🔑", "Votre Clef Verte, vécue en jeu", "Eau, énergie, déchets, cerfs et plantes endémiques : vos engagements deviennent des défis que les enfants adorent relever."],
        ["📊", "Des chiffres pour votre bilan", "Familles qui jouent, défis relevés, avis : un tableau de bord simple et anonyme."]
      ],
      label: {
        titre: "Un appui pour votre Clef Verte",
        intro: "Le référentiel 2026-2031 cite « les applications destinées aux clients » parmi les supports possibles. L'aventure aide à documenter :",
        criteres: [
          ["2.3 · impératif", "Informer les clients et « encourager activement leur participation » : économiser l'eau, l'énergie, soutenir la biodiversité."],
          ["2.10 · conseillé", "Au moins 4 activités de sensibilisation avec participation des clients : une aventure par saison, 2 saisons par an."],
          ["2.6", "L'avis des clients : les 3 petites questions de fin d'aventure."]
        ],
        note: "Référentiel Clef Verte 2026-2031. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple (à choisir avec vous) :",
      lots: [["🍨", "1 dessert offert à l'enfant", "à La Table du Diana"], ["🦌", "Une place au nourrissage des cerfs", "avec l'équipe du domaine"], ["💆", "Une attention pour les parents", "au Spa Cinq Mondes"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou un jour de pluie. Les écogestes deviennent des défis, et chaque défi relevé est une fierté :", defis: ["Le brossage du faon, robinet fermé", "L'air de la forêt : fenêtre ouverte, clim au repos", "La nuit des étoiles : lumières éteintes en 5 secondes", "La serviette voyageuse, suspendue pour demain", "Le tri du premier coup"] },
      complete: ["5 étapes : la chambre, le sentier, La Table du Diana, la piscine, l'accueil (lieux à choisir avec vous)", "Une étape spéciale au nourrissage des cerfs, avec vos équipes", "Voix de Ti Dea en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une nouvelle aventure par saison : vos activités du critère 2.10", "Hors connexion, dans le navigateur, en toute discrétion pour les données"],
      stats: [["96", "familles ont terminé l'aventure"], ["50 min", "de jeu en moyenne"], ["87 %", "des défis « chambre » relevés"], ["9,3/10", "note des enfants"]],
      barres: [["Étape chambre", 93], ["Étape sentier", 91], ["Étape Table", 72], ["Bons utilisés", 71]]
    }
  };
})();
