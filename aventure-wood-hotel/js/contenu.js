/* ============================================================
   CONTENU — WOOD Hotel & Spa (Trois-Bassins, Pointe des Diamants) · « Ti Natte et le trésor de la savane »
   Faits utilisés (sources lues le 13/11/2026) :
   - Écolabel européen FR/051/726, AFNOR, raison sociale WOOD HOTEL, 63 rue Henri Cornu 97460 Saint-Paul (base ADEME
     data.ademe.fr, jeu « ecolabel-hebergement-touristique »). Obtenu en juin 2026, remis à l'inauguration du 16/09/2026
     (memento.fr, 17/09/2026). Le 63 rue Henri Cornu (Saint-Paul) est l'adresse du SIÈGE ; l'hôtel est 11 chemin de la
     Poudrière, 97426 Trois-Bassins (woodhotel.re/contact/, mentions légales).
   - Hôtel tout en bois, 3 hectares de savane, falaises de la Pointe des Diamants, côte sauvage préservée par le
     Conservatoire du littoral (woodhotel.re/) ; 84 chambres, suites et villas orientées vers l'océan, Suite famille
     Horizon à deux chambres, eau filtrée en chambre (woodhotel.re/sejourner/).
   - Piscine avec couloir de nage de 50 m, baby-sitting, voiturettes électriques, produits d'accueil Wood&Sens
     rechargeables (woodhotel.re/hotel/).
   - Restaurant Le Grand Natte, bar Le Basalte, bar Le Savane au bord de la piscine, L'Atelier du vin, circuits courts
     (woodhotel.re/gastronomie/) ; spa (woodhotel.re/spa-bien-etre/).
   - Charte : chauffe-eau solaires, LED, conception bioclimatique ; robinets basse consommation, arrosage au
     goutte-à-goutte, linge lavé sur demande tous les trois jours ; équipe formée au développement durable
     (woodhotel.re/charte-engagements-hotellerie-ethique-responsable/).
   - Bois précieux « grand natte » et « petit natte » récupérés de la charpente de l'église de Saint-Paul (linfo.re, 04/02/2025).
   Offre enfants : seuls la Suite famille et le baby-sitting sont affirmés. Tout le reste est une PROPOSITION.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#a0662f", c2: "#2f8f9d", fond: "#2b1d12", fond2: "#4a3220", accent: "#ffd166", clair: "#f7efe4" };

  /* ---------- Ti Natte, le petit arbre de bois de natte ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M78 124 q9 -10 18 0 M106 124 q9 -10 18 0" stroke="#3b2412" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="87" cy="122" rx="9" ry="11" fill="#fff"/><ellipse cx="115" cy="122" rx="9" ry="11" fill="#fff"/><circle cx="89" cy="125" r="6" fill="#2a1a0d"/><circle cx="117" cy="125" r="6" fill="#2a1a0d"/><circle cx="91" cy="121.5" r="2.2" fill="#fff"/><circle cx="119" cy="121.5" r="2.2" fill="#fff"/></g>';
    const bouche = pose === "parle"
      ? '<ellipse cx="101" cy="146" rx="8" ry="6.5" fill="#6b2a1f"/><ellipse cx="101" cy="149" rx="4.5" ry="2.4" fill="#ff8fa3"/>'
      : '<path d="M89 141 q12 13 24 0z" fill="#6b2a1f" stroke="#6b2a1f" stroke-width="3" stroke-linejoin="round"/><path d="M95 146 q6 3.5 12 0" fill="#ff8fa3"/>';
    const brasG = '<path d="M64 140 q-22 6 -30 22" stroke="#8a5a2b" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="164" rx="9" ry="6" fill="#5aa34a"/>';
    const brasD = leve
      ? '<path d="M138 132 q22 -12 28 -40" stroke="#8a5a2b" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="166" cy="88" rx="10" ry="6.5" fill="#5aa34a" transform="rotate(-30 166 88)"/>'
      : '<path d="M138 140 q22 6 30 22" stroke="#8a5a2b" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="170" cy="164" rx="9" ry="6" fill="#5aa34a"/>';
    return '<ellipse cx="100" cy="192" rx="56" ry="7" fill="#000" opacity=".12"/>' +
      // feuillage
      '<g class="balance"><circle cx="100" cy="52" r="40" fill="#3f8f3f"/><circle cx="66" cy="70" r="26" fill="#4fa34a"/><circle cx="134" cy="70" r="26" fill="#4fa34a"/><circle cx="100" cy="34" r="22" fill="#5cb85a"/>' +
      '<ellipse cx="84" cy="40" rx="8" ry="4" fill="#8fd47f" opacity=".8" transform="rotate(-25 84 40)"/><circle cx="122" cy="48" r="5" fill="#ffd166"/><circle cx="74" cy="78" r="4" fill="#ffd166"/></g>' +
      // tronc (le visage), veines du bois
      '<path d="M64 88 q36 -10 74 0 v82 q-37 14 -74 0z" fill="#c8915a" stroke="#8a5a2b" stroke-width="4"/>' +
      '<path d="M74 100 q-4 30 2 62 M128 100 q4 30 -2 62" stroke="#a8743f" stroke-width="3" fill="none"/>' +
      '<ellipse cx="74" cy="138" rx="7" ry="4.5" fill="#ff9aa8" opacity=".8"/><ellipse cx="128" cy="138" rx="7" ry="4.5" fill="#ff9aa8" opacity=".8"/>' +
      yeux + bouche + brasG + brasD +
      '<path d="M66 176 q-10 10 -20 12 M136 176 q10 10 20 12 M100 182 v10" stroke="#8a5a2b" stroke-width="7" fill="none" stroke-linecap="round"/>';
  }

  /* ---------- décor : la savane de Trois-Bassins, les falaises, l'océan ---------- */
  const herbe = (x, y) => '<path d="M' + x + ' ' + y + ' q-3 -14 -8 -20 M' + x + ' ' + y + ' q1 -16 2 -24 M' + x + ' ' + y + ' q5 -12 10 -18" stroke="#b49a4a" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
  const lodge = (x, y, s) => '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-60" y="-34" width="120" height="40" rx="4" fill="#b07a45" stroke="#7a5230" stroke-width="3"/>' +
    [-44, -18, 8, 34].map(i => '<rect x="' + i + '" y="-26" width="14" height="22" rx="2" fill="#bfe6f2"/>').join("") +
    '<path d="M-70 -34 q70 -26 140 0z" fill="#5aa34a" stroke="#3f7f3a" stroke-width="3"/></g>';
  const decor = { ciel: ["#62bdf0", "#e4f5ff"], merC: ["#0f5a95", "#2a8fc8"], mer: "large", sable: "#d9c27a", sableC2: "#c2a65c", horizon: 112, plage: 214,
    montagne: "M240 120 q40 -44 80 -40 q24 2 40 22 V122 H240z", montagneC: "#5f7f4a",
    extraFond: '<path d="M0 214 q60 -12 120 -4 t120 -2 t120 -6 V230 H0z" fill="#4a4743"/><path d="M0 214 q60 -12 120 -4 t120 -2 t120 -6" stroke="#6b6660" stroke-width="3" fill="none"/>',
    palmiers: [], extra: lodge(250, 270, .9) + [20, 60, 110, 150, 190, 300, 340].map((x, i) => herbe(x, 300 + (i % 3) * 18)).join("") + herbe(80, 360) + herbe(200, 370) + herbe(320, 350) };

  const vue = '<rect width="140" height="120" fill="#a7dcf6"/><rect y="46" width="140" height="74" fill="#2a8fc8"/><path d="M0 58 q20 -5 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="3" fill="none" class="vague-anim"/>' +
    '<path d="M0 92 q40 -8 80 -2 t60 -4 V120 H0z" fill="#d9c27a"/><path d="M0 92 q40 -8 80 -2 t60 -4" stroke="#4a4743" stroke-width="5" fill="none"/>' + herbe(20, 116) + herbe(110, 114) + '<circle cx="118" cy="20" r="10" fill="#ffd166"/>';

  /* ---------- la carte (illustrée, non contractuelle) ---------- */
  const carteFond = '<rect width="360" height="440" fill="#dcc77f"/>' +
    '<path d="M0 0 h360 v118 q-90 14 -180 2 t-180 8z" fill="#2a8fc8"/>' +
    [0, 1, 2].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-10 ' + (22 + i * 30) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".45"/>').join("") +
    '<path d="M0 126 q90 -14 180 -2 t180 -8 v16 q-90 10 -180 2 t-180 6z" fill="#4a4743"/>' +
    '<text x="14" y="158" font-size="11" font-weight="800" fill="#6b5a2a" font-family="system-ui,sans-serif">falaises de la Pointe des Diamants</text>' +
    [[30, 200], [90, 230], [300, 190], [330, 260], [40, 300], [130, 420], [320, 410], [250, 380]].map(p => herbe(p[0], p[1])).join("") +
    '<path d="M100 300 q60 -50 120 -40 t90 -60 M100 300 q10 60 80 90 M220 262 q10 50 60 90" stroke="#f3e2bd" stroke-width="11" fill="none" stroke-linecap="round"/>' +
    // l'hôtel en bois au toit végétalisé (l'accueil)
    '<g transform="translate(140 372)">' + lodge(0, 0, .75) + '</g>' +
    // la piscine de 50 m
    '<g transform="translate(150 206)"><rect width="150" height="24" rx="10" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><path d="M14 12 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#fff" stroke-width="2" fill="none" class="reflet"/></g>' +
    // Le Grand Natte
    '<g transform="translate(222 288)"><rect width="88" height="46" rx="8" fill="#f7efe4" stroke="#b07a45" stroke-width="3"/><path d="M-8 2 q52 -26 104 0z" fill="#5aa34a"/>' + [0, 1, 2].map(i => '<g transform="translate(' + (18 + i * 26) + ' 28)"><circle r="8" fill="#fff" stroke="#b07a45" stroke-width="2"/><circle r="4" fill="#ffd166"/></g>').join("") + '</g>' +
    // la chambre
    '<g transform="translate(36 262)"><rect width="74" height="42" rx="6" fill="#c8915a" stroke="#7a5230" stroke-width="3"/><rect x="10" y="10" width="20" height="18" rx="3" fill="#bfe6f2"/><rect x="44" y="10" width="20" height="18" rx="3" fill="#bfe6f2"/><path d="M-6 2 q43 -22 86 0z" fill="#5aa34a"/></g>' +
    '<g transform="translate(26 340) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  /* ---------- la savane (jeu « ce qui n'est pas de la savane ») ---------- */
  const decorSavane = '<rect width="360" height="440" fill="#dcc77f"/><rect width="360" height="70" fill="#2a8fc8"/>' +
    '<path class="vague-anim" d="M-10 30 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".55"/>' +
    '<path d="M0 70 q60 -10 120 -2 t120 -4 t120 -2 V96 q-60 8 -120 2 t-120 2 t-120 -4z" fill="#4a4743"/>' +
    [[30, 140], [120, 210], [260, 170], [60, 320], [190, 360], [320, 250], [150, 430], [330, 420], [240, 280]].map(p => herbe(p[0], p[1])).join("") +
    '<text x="352" y="432" text-anchor="end" font-size="12" font-weight="800" fill="#8a7232" font-family="system-ui,sans-serif">la savane du WOOD</text>';

  return {
    id: "wood-hotel", nom: "WOOD Hotel & Spa", nomCourt: "WOOD", titre: "Ti Natte et le trésor de la savane",
    couleurs: C, perso, perso_nom: "Ti Natte", decor,
    accroche: "Une aventure en famille, de ta chambre en bois à la savane face à l'océan.",
    accueilBulle: "Salut ! Moi, c'est <b>Ti Natte</b>, un petit arbre de bois de natte. Tu viens explorer le WOOD avec moi ?",
    boutonDepart: "🌳 Je pars avec Ti Natte !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Le WOOD a reçu l'<b>Écolabel européen</b> : c'est la fleur des hôtels qui prennent soin de l'eau, de l'énergie et de la nature."],
      ["coucou", "Pour la fêter, j'ai semé <b>5 feuilles d'or</b> : dans ta chambre, dans la savane, au Grand Natte…"],
      ["joie", "Retrouve-les avec moi, et une <b>vraie récompense</b> t'attend. En route !", "🗺️ Voir la carte"]
    ],
    carteTitre: "La carte du WOOD", carteBulle: "On commence par ta chambre ? Touche l'étape <b>1</b> !",
    gain: { icone: "🍃", nomPluriel: "Les feuilles d'or" },
    carte: { fond: carteFond },
    etapes: [
      { id: "chambre", lieu: "Ta chambre au WOOD", lieuCourt: "La chambre", titre: "La cabane de Ti Natte", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 73, y: 282,
        mission: "Ta chambre en bois est la cabane de Ti Natte ! J'y ai caché <b>5 défis</b>. Trouve-les et relève-les en famille.",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = la feuille d'or de la cabane."],
        boutonJeu: "🔎 J'explore la cabane !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f4e6d2", sol: "#b8875a", drap: "#e9dcc4", bois: "#8a5a2b", accent: "#2f8f9d" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans la cabane 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 défis sur 5 ! Ta cabane est la plus belle de la savane. Ti Natte agite toutes ses feuilles !",
          objets: [
            { obj: "robinet", x: 284, y: 112, icone: "🪥", titre: "Défi brossage express", defi: "Au WOOD, les robinets donnent juste ce qu'il faut. Ce soir : robinet fermé pendant le brossage, et tu comptes les feuilles de Ti Natte jusqu'à 100 !", vrai: "Ce soir, pour de vrai : robinet fermé pendant le brossage, et on compte jusqu'à 100 en famille. Qui arrive le premier ?", bravo: "Dents brillantes, robinet au repos !" },
            { obj: "carafe", x: 62, y: 206, s: .9, r: 36, icone: "💧", titre: "Défi de la carafe", defi: "Dans ta chambre, l'eau est filtrée : remplis ta gourde ou ton verre à la carafe, et trinque avec Ti Natte !", vrai: "Pendant ton séjour, remplis pour de vrai ta gourde à l'eau filtrée de la chambre, et trinque avec Ti Natte. Santé !", bravo: "Glouglou, santé la savane !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi lumière du jour", defi: "Le WOOD est pensé pour la lumière du jour. En sortant de la cabane, éteins toutes les lampes en moins de 5 secondes. Top chrono !", vrai: "Tout à l'heure, en sortant de ta vraie chambre : toutes les lampes éteintes en moins de 5 secondes, et le soleil prend le relais. Top chrono !", bravo: "Le soleil te dit bravo !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#2f8f9d", icone: "🌿", titre: "Défi serviette voyageuse", defi: "Suspends ta serviette pour qu'elle sèche au vent de la savane : demain, elle repart avec toi à la piscine !", vrai: "Ce soir, fais pareil avec ta vraie serviette : suspends-la pour qu'elle sèche, elle te suivra demain à la piscine. Ti Natte compte sur toi !", bravo: "Serviette au vent, prête pour demain !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Bouteille, papier, épluchure : trouve le bon bac du premier coup. Le WOOD trie ses déchets, et toi aussi !", vrai: "Pendant ton séjour, garde ton œil de trieur : bouteille, papier, épluchure, chacun son bac. Le WOOD trie ses déchets, et toi aussi !", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "bouteille", "nom": "bouteille", "bac": "emb"}, {"obj": "papier", "nom": "papier", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait, explorateur !" }
          ] },
        bravo: { titre: "Cabane parée !", gainIcone: "🍃", gain: "Feuille d'or n°1 : la feuille de la cabane", gainSous: "5 défis relevés en famille.", perso: "Quelle équipe ! Ta cabane brille comme un soleil couchant sur l'océan." },
        savais: { titre: "Le savais-tu ?", texte: "Au WOOD, l'eau chaude est chauffée par le soleil, et les jardins sont arrosés au goutte-à-goutte : chaque goutte va droit aux racines.", src: "woodhotel.re, charte d'engagement" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou à l'heure de la sieste (version chambre, à choisir avec vous)." },
      { id: "savane", lieu: "La savane de la Pointe des Diamants", lieuCourt: "La savane", titre: "Les trésors de la savane", resume: "Rends la savane à ses habitants : attrape les intrus", duree: "3 min", x: 60, y: 190,
        mission: "Dans la savane, face à l'océan, des <b>intrus</b> se sont glissés parmi les herbes. Mets-les dans le panier, et laisse les trésors de la nature à leur place !",
        regle: ["Touche un intrus, ou fais-le glisser dans le panier.", "Les branches et le bois de la savane sont chez eux : on les laisse.", "Tous les intrus ramassés = la feuille d'or de la savane."],
        boutonJeu: "🧺 À la chasse aux intrus !",
        jeu: { type: "plage", titreBarre: "🧺 Les intrus", decor: decorSavane, panier: [290, 384],
          objets: [
            { obj: "bouteille", x: 60, y: 150, dechet: true }, { obj: "canette", x: 214, y: 132, dechet: true }, { obj: "sac", x: 130, y: 250, dechet: true },
            { obj: "emballage", x: 296, y: 196, dechet: true }, { obj: "bouchon", x: 74, y: 380, dechet: true, s: 1.4 }, { obj: "bouchon", x: 236, y: 300, dechet: true, s: 1.4 },
            { obj: "bois", x: 170, y: 196, msg: "Cette branche sèche sert d'abri aux petites bêtes de la savane. Elle reste chez elle 🌾" },
            { obj: "bois", x: 150, y: 352, msg: "Ce morceau de bois fait partie de la savane : les insectes y trouvent leur maison. On le laisse !" }
          ],
          msgDebut: "Touche les intrus ou glisse-les dans le panier 🧺",
          msgPris: ["Hop, au panier !", "Bien vu, explorateur !", "Encore un intrus de moins !", "La savane te dit merci !", "Plus qu'un ou deux…"],
          msgGagne: "Savane parée ! Les herbes dansent au vent et Ti Natte fait la ola avec ses branches !" },
        bravo: { titre: "Savane au top !", gainIcone: "🍃", gain: "Feuille d'or n°2 : la feuille de la savane", gainSous: "Tous les intrus sont au panier, la nature est chez elle.", perso: "Bravo ! La savane de la Pointe des Diamants brille de mille feux." },
        savais: { titre: "Le savais-tu ?", texte: "Le WOOD est installé dans 3 hectares de savane, au bord d'une côte sauvage préservée par le Conservatoire du littoral.", src: "woodhotel.re" },
        terrain: "dans l'application complète, cette étape se joue dans la savane de l'hôtel, avec un vrai panier à rapporter à l'accueil, par exemple (à organiser avec vous)." },
      { id: "grandnatte", lieu: "Le Grand Natte", lieuCourt: "Le Grand Natte", titre: "Les saveurs de l'île", resume: "Le grand jeu des produits d'ici", x: 266, y: 278,
        teaser: "Au Grand Natte, le chef cuisine les produits de l'île : sauras-tu deviner d'où ils viennent ?",
        complet: ["Un jeu des saveurs (à imaginer avec le chef)", "La 3e feuille d'or, à table, en famille", "Les parents découvrent la carte du Grand Natte"] },
      { id: "piscine", lieu: "La piscine de 50 m", lieuCourt: "La piscine", titre: "Le grand plouf du soleil", resume: "L'énigme de l'eau chauffée au soleil", x: 225, y: 196,
        teaser: "Au bord de la grande piscine, Ti Natte te pose l'énigme du soleil qui chauffe l'eau.",
        complet: ["Une énigme sur le soleil et l'eau, au bord de la piscine", "La 4e feuille d'or", "Un défi en famille, chrono en main"] },
      { id: "accueil", lieu: "L'accueil", lieuCourt: "L'accueil", titre: "Le trésor de la savane", resume: "Rends les 5 feuilles et gagne ta récompense", x: 150, y: 352,
        teaser: "Avec les 5 feuilles d'or, Ti Natte ouvre le trésor de la savane… et ta famille rejoint les gardiens du WOOD !",
        complet: ["Le compteur des familles gardiennes, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Gardien·ne de la savane", court: "GARDIEN DE LA SAVANE" },
    victoireTexte: "Ti Natte a retrouvé ses feuilles d'or : la savane du WOOD est en fête ! Voici ta récompense.",
    lot: { titre: "1 mocktail « Ti Natte » offert à l'enfant", lieu: "Au bar Le Savane, au bord de la piscine", detail: "Montre ce bon au bar Le Savane pendant ton séjour : Ti Natte t'y attend !" },
    codePrefixe: "NATTE",
    compteur: "Ta famille rejoint les familles gardiennes de la savane (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 feuilles d'or dans tout le WOOD", "Des niveaux 2 et 3 pour les longs séjours", "Une carte souvenir de la savane à garder"],
    projet: {
      pour: "Maquette pour le WOOD Hotel & Spa · Trois-Bassins",
      sous: "Une aventure sur téléphone pour vos familles. Ti Natte, un petit arbre de bois de natte, fait découvrir le WOOD, de la chambre en bois à la savane face à l'océan. Personnage, étapes, défis et lots se construisent avec vos équipes.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. au bar Le Savane"], ["🌿", "Un appui pour vos critères Écolabel 3 et 26"], ["📱", "Un QR code suffit, et ça marche même hors ligne"]],
      idee: [
        "Les enfants aident Ti Natte à retrouver les 5 feuilles d'or semées dans l'hôtel.",
        "Chaque étape est un mini-jeu : la chambre, la savane, Le Grand Natte, la piscine…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer."
      ],
      appli: "Une création à plusieurs mains : ateliers avec vos équipes (accueil, restaurant, spa, entretien de la savane), idées de votre personnel, puis un test avec de vraies familles avant le lancement. Tout ce que montre cette maquette est à choisir avec vous.",
      apports: [
        ["👨‍👩‍👧", "Un plus pour vos familles", "Une heure de jeu en autonomie, au rythme de chacun, en complément de vos Suites famille."],
        ["🍹", "Vos lieux mis en valeur", "Les lots amènent les familles au bar Le Savane, au Grand Natte ou au spa."],
        ["🌳", "Votre Écolabel, vécu en jeu", "Le soleil qui chauffe l'eau, le goutte-à-goutte, le tri, la savane : vos engagements deviennent des défis que les enfants adorent relever."],
        ["📊", "Des chiffres pour votre bilan", "Familles qui jouent, défis relevés, avis : un tableau de bord simple et anonyme."]
      ],
      label: {
        titre: "Un appui pour votre Écolabel européen",
        intro: "L'aventure informe vos clients de façon active et fait de l'éducation à l'environnement une vraie distraction. Elle aide à documenter :",
        criteres: [
          ["Critère 3", "Information de la clientèle donnée « activement » : économies d'eau, linge et serviettes, déchets, lieux d'intérêt. Le petit avis de fin répond au point b)."],
          ["Critère 26", "Biodiversité locale (a, avec votre savane) et éducation à l'environnement dans les distractions (b) : 2 points optionnels."],
          ["Critère 16", "Réutilisation des serviettes : le défi « serviette voyageuse » de la mission chambre."]
        ],
        note: "Référence : décision (UE) 2017/175. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple (à choisir avec vous) :",
      lots: [["🍹", "1 mocktail « Ti Natte » pour l'enfant", "au bar Le Savane"], ["🍨", "1 dessert offert à l'enfant", "au Grand Natte"], ["💆", "Une attention pour les parents", "au spa"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou à l'heure de la sieste. Les écogestes deviennent des défis, et chaque défi relevé est une fierté :", defis: ["Brossage express : robinet fermé, on compte jusqu'à 100", "La carafe d'eau filtrée, pour remplir sa gourde", "La lumière du jour : lampes éteintes en 5 secondes", "La serviette voyageuse, suspendue pour demain", "Le tri du premier coup"] },
      complete: ["5 étapes : la chambre, la savane, Le Grand Natte, la piscine, l'accueil (lieux à choisir avec vous)", "Des défis imaginés avec vos équipes, formées au développement durable", "Voix de Ti Natte en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une nouvelle aventure par saison, pour les familles qui reviennent", "Hors connexion, dans le navigateur, en toute discrétion pour les données"],
      stats: [["158", "familles ont terminé l'aventure"], ["47 min", "de jeu en moyenne"], ["86 %", "des défis « chambre » relevés"], ["9,1/10", "note des enfants"]],
      barres: [["Étape chambre", 92], ["Étape savane", 89], ["Étape Grand Natte", 75], ["Bons utilisés", 68]]
    }
  };
})();
