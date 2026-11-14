/* ============================================================
   CONTENU — Hôtel Le Saint-Pierre (Saint-Pierre, Côté Sun Hotels) · « Ti Pierre et le jardin secret »
   Faits utilisés (vérifiés le 13/11/2026) :
   - Écolabel européen FR/051/128 (ADEME, ligne 7 de 07-hotels-eco-labellises.md) ;
     article hotellesaintpierre.fr/ecolabel-europeen/ : filières locales et bio, eau filtrée en bouteille de verre,
     ventilation naturelle, coupure automatique des appareils à la sortie des chambres, réducteurs de débit,
     suivi des arrosages, produits écolabellisés, compostage, tri des déchets en chambre, réduction du gaspillage alimentaire,
     marche, vélo et transports en commun encouragés, collaborateurs formés.
   - Site (accueil, /hotel/) : boutique hôtel du centre-ville, 51 avenue des Indes, plage du lagon à 2 min à pied ;
     cour intérieure végétalisée avec le restaurant-bar Le Jardin de Pierre (produits de la région), bar attenant,
     piscine chauffée et transats ; offre famille « Petits Voyageurs » (vacances d'octobre).
   Tout le reste (personnage, étapes, défis, lots) est une PROPOSITION, à choisir avec l'hôtel.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#3f9b6e", c2: "#e9784a", fond: "#1d3a33", fond2: "#2f5a4c", accent: "#ffd166", clair: "#eef7f1" };

  /* ---------- Ti Pierre, le petit galet du jardin ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M70 118 q10 -11 20 0 M110 118 q10 -11 20 0" stroke="#33302c" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="80" cy="116" rx="10" ry="12" fill="#fff"/><ellipse cx="120" cy="116" rx="10" ry="12" fill="#fff"/><circle cx="82" cy="119" r="6.5" fill="#2a2622"/><circle cx="122" cy="119" r="6.5" fill="#2a2622"/><circle cx="84.5" cy="115.5" r="2.4" fill="#fff"/><circle cx="124.5" cy="115.5" r="2.4" fill="#fff"/></g>';
    const bouche = pose === "parle"
      ? '<ellipse cx="100" cy="142" rx="9" ry="7" fill="#6b2a1f"/><ellipse cx="100" cy="145" rx="5" ry="2.6" fill="#ff8fa3"/>'
      : '<path d="M86 136 q14 15 28 0z" fill="#6b2a1f" stroke="#6b2a1f" stroke-width="3" stroke-linejoin="round"/><path d="M93 142 q7 4 14 0" fill="#ff8fa3"/>';
    const bras = leve
      ? '<path d="M170 128 q20 -14 22 -38" stroke="#7d7a74" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="192" cy="86" r="8" fill="#9a968e"/>' +
        '<path d="M30 132 q-18 -10 -20 -30" stroke="#7d7a74" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="10" cy="98" r="8" fill="#9a968e"/>'
      : '<path d="M170 138 q14 10 14 26" stroke="#7d7a74" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M30 138 q-14 10 -14 26" stroke="#7d7a74" stroke-width="10" fill="none" stroke-linecap="round"/>';
    return '<ellipse cx="100" cy="190" rx="72" ry="7" fill="#000" opacity=".12"/>' +
      // la pousse sur la tête
      '<path d="M100 66 q-2 -20 4 -34" stroke="#3f9b6e" stroke-width="5" fill="none" stroke-linecap="round"/>' +
      '<path d="M104 36 q20 -20 36 -10 q-14 20 -36 10z" fill="#5cbf5f" stroke="#3f9b6e" stroke-width="2"/><path d="M102 46 q-22 -14 -32 0 q16 14 32 0z" fill="#6fd06a" stroke="#3f9b6e" stroke-width="2"/>' +
      bras +
      // le galet (le visage)
      '<path d="M28 128 C26 84 62 62 102 62 C146 62 176 88 174 130 C172 170 140 184 100 184 C58 184 30 168 28 128z" fill="#a9a59c" stroke="#7d7a74" stroke-width="4"/>' +
      '<path d="M52 86 q30 -16 64 -12" stroke="#c9c5bc" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/>' +
      '<circle cx="146" cy="160" r="4" fill="#918d85"/><circle cx="58" cy="164" r="3" fill="#918d85"/>' +
      '<ellipse cx="62" cy="136" rx="8" ry="5" fill="#ff9aa8" opacity=".8"/><ellipse cx="138" cy="136" rx="8" ry="5" fill="#ff9aa8" opacity=".8"/>' +
      yeux + bouche;
  }

  /* ---------- décor : le centre-ville de Saint-Pierre, la cour végétalisée, l'océan au bout de l'avenue ---------- */
  const maison = (x, y, w, h, toit) => '<g transform="translate(' + x + ' ' + y + ')"><rect width="' + w + '" height="' + h + '" fill="#fff4e2" stroke="#d9c4a0" stroke-width="2"/><path d="M-4 0 h' + (w + 8) + ' l-' + (w / 2 + 4) + ' -' + (h / 2.4) + 'z" fill="' + toit + '"/>' +
    '<rect x="' + (w / 2 - 6) + '" y="' + (h - 18) + '" width="12" height="18" fill="#8f6a46"/><rect x="6" y="8" width="10" height="10" fill="#9fdcf0"/><rect x="' + (w - 16) + '" y="8" width="10" height="10" fill="#9fdcf0"/></g>';
  const extra = maison(150, 238, 58, 48, "#e9784a") + maison(222, 246, 46, 40, "#3f9b6e") +
    '<g transform="translate(96 312)"><rect x="-30" y="-8" width="60" height="14" rx="7" fill="#5cc8f0" stroke="#fff" stroke-width="3"/></g>' +
    '<g transform="translate(250 312)"><circle r="16" fill="#5cbf5f"/><circle cx="-12" cy="6" r="11" fill="#6fd06a"/><circle cx="12" cy="6" r="11" fill="#4aa84f"/><circle cx="-4" cy="-4" r="3" fill="#ff8fab"/><circle cx="7" cy="2" r="3" fill="#ffd166"/></g>';
  const decor = { ciel: ["#62bfe9", "#e2f4ff"], merC: ["#14639a", "#3aa7d6"], mer: "large", sable: "#e7e1d2", sableC2: "#cfc6b0", horizon: 118, plage: 236,
    montagne: "M190 132 q40 -54 96 -58 q46 2 74 46 V136 H190z", montagneC: "#4c7a58",
    extraFond: '<path d="M0 226 h360 v10 H0z" fill="#d2d6db"/>',
    palmiers: [[326, 300, 100, -1], [30, 300, 84, 1]], extra };

  const vue = '<rect width="140" height="120" fill="#a9dcf4"/><rect y="64" width="140" height="56" fill="#7cc48a"/>' +
    '<path d="M0 64 h140" stroke="#5fa06c" stroke-width="3"/><circle cx="22" cy="22" r="10" fill="#ffd166"/>' +
    '<rect x="44" y="78" width="54" height="24" rx="10" fill="#5cc8f0" stroke="#fff" stroke-width="3"/>' +
    '<g transform="translate(116 70)"><path d="M0 0 v-30" stroke="#6b4a2a" stroke-width="4"/><path d="M0 -30 q-14 2 -20 12 M0 -30 q14 2 20 12 M0 -30 q-6 -12 -16 -14 M0 -30 q6 -12 16 -14" stroke="#4b8d4f" stroke-width="4" fill="none" stroke-linecap="round"/></g>' +
    '<g transform="translate(14 86) scale(.12)"><path d="M28 128 C26 84 62 62 102 62 C146 62 176 88 174 130 C172 170 140 184 100 184 C58 184 30 168 28 128z" fill="#a9a59c"/><path d="M104 36 q20 -20 36 -10 q-14 20 -36 10z" fill="#5cbf5f"/></g>';

  /* ---------- la carte (illustrée, non contractuelle) ---------- */
  const carteFond = '<rect width="360" height="440" fill="#e8e2d4"/>' +
    '<path d="M0 0 h360 v58 H0z" fill="#2a8fc8"/>' +
    '<path class="vague-anim" d="M-10 26 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>' +
    '<path d="M0 56 h360 v14 H0z" fill="#f3e1b5"/><text x="12" y="88" font-size="10" font-weight="800" fill="#8a7a5a" font-family="system-ui,sans-serif">la plage du lagon, à 2 min à pied</text>' +
    // les rues du centre-ville
    '<path d="M0 104 h360 M0 206 h360 M60 104 V440 M300 104 V440" stroke="#cfc7b4" stroke-width="14"/>' +
    '<text x="170" y="210" font-size="9" font-weight="800" fill="#8a8170" font-family="system-ui,sans-serif">avenue des Indes</text>' +
    [[8, 116], [8, 220], [8, 330], [312, 116], [312, 220], [312, 330], [80, 116], [200, 116]].map(p => '<rect x="' + p[0] + '" y="' + p[1] + '" width="40" height="78" rx="4" fill="#f6eedd" stroke="#d9c4a0" stroke-width="2"/>').join("") +
    // l'hôtel autour de sa cour
    '<g transform="translate(80 222)"><rect width="208" height="206" rx="10" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><rect x="22" y="22" width="164" height="150" rx="10" fill="#a8d8a0"/>' +
    '<text x="104" y="190" text-anchor="middle" font-size="9" font-weight="800" fill="#7a6a48" font-family="system-ui,sans-serif">la cour végétalisée</text></g>' +
    // la piscine
    '<g transform="translate(196 262)"><rect width="70" height="34" rx="14" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><path d="M12 16 q8 -5 16 0 t16 0 t16 0" stroke="#fff" stroke-width="2" fill="none" class="reflet"/></g>' +
    // Le Jardin de Pierre
    '<g transform="translate(112 320)"><rect width="82" height="44" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h94 l-12 -14 h-70z" fill="#e9784a"/>' + [0, 1, 2].map(i => '<g transform="translate(' + (16 + i * 25) + ' 26)"><circle r="8" fill="#fff" stroke="#d6c19a" stroke-width="2"/><circle r="4" fill="#ffd166"/></g>').join("") + '</g>' +
    // le bar
    '<g transform="translate(214 330)"><rect width="56" height="30" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-4 0 h64 l-8 -10 h-48z" fill="#3f9b6e"/><path d="M20 10 h14 l-7 9z M27 19 v6" stroke="#e9784a" stroke-width="3" fill="#e9784a"/></g>' +
    // l'accueil
    '<g transform="translate(150 400)"><rect width="64" height="22" rx="6" fill="#3f9b6e"/><text x="32" y="15" text-anchor="middle" font-size="10" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">accueil</text></g>' +
    Art.palmier(118, 268, 30, 1) + Art.palmier(278, 318, 26, -1) +
    '<g transform="translate(236 128) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  /* ---------- le jeu des tuyaux : du robinet du jardin aux plantes de la cour ---------- */
  const decorHaut = '<rect x="20" y="40" width="120" height="14" rx="6" fill="#7f97a5"/><path d="M40 40 v-14 h26 v14" stroke="#9fb4c0" stroke-width="6" fill="none"/><circle cx="53" cy="22" r="9" fill="#e9784a" stroke="#b85a32" stroke-width="2"/>' +
    '<rect x="64" y="52" width="16" height="44" fill="#9fb4c0"/><path d="M64 92 h16 v12 h-16z" fill="#7f97a5"/>' +
    '<text x="156" y="44" font-size="13" font-weight="900" fill="#2e6b4f" font-family="system-ui,sans-serif">Le robinet du jardin…</text>' +
    '<g transform="translate(300 60) scale(.24)">' + perso("parle") + '</g>';
  const decorBas = '<rect x="0" y="400" width="360" height="40" fill="#6f8f4a"/><text x="12" y="425" font-size="13" font-weight="900" fill="#f4ffe6" font-family="system-ui,sans-serif">…la cour a soif !</text>' +
    '<path id="sortie" d="M288 392 v10" stroke="#3aa7ff" stroke-width="16" opacity="0" style="transition:opacity .4s"/>' +
    [214, 244, 274, 304, 334].map((x, i) => '<g transform="translate(' + x + ' 410)"><g class="plante"><path d="M0 0 v-18" stroke="#3e8e41" stroke-width="3"/><ellipse cx="-6" cy="-18" rx="8" ry="4.5" fill="#5cbf5f"/><ellipse cx="6" cy="-22" rx="8" ry="4.5" fill="#6fd06a"/>' + (i % 2 ? '<circle cx="0" cy="-10" r="5" fill="#ff8fab"/>' : '<circle cx="0" cy="-28" r="4" fill="#ffd166"/>') + '</g></g>').join("");

  return {
    id: "le-saint-pierre", nom: "Hôtel Le Saint-Pierre", nomCourt: "Le Saint-Pierre", titre: "Ti Pierre et le jardin secret",
    couleurs: C, perso, perso_nom: "Ti Pierre", decor,
    accroche: "Une aventure en famille, de ta chambre à la cour fleurie du Saint-Pierre.",
    accueilBulle: "Bonjour ! Moi, c'est <b>Ti Pierre</b>, le petit galet qui vit dans la cour de l'hôtel. Une plante pousse sur ma tête ! Tu viens jouer ?",
    boutonDepart: "🌱 Je pars avec Ti Pierre !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Je suis un galet de la plage de Saint-Pierre. Un jour, je suis venu habiter dans la cour du Saint-Pierre, au milieu des plantes."],
      ["coucou", "L'hôtel a l'<b>Écolabel européen</b> : ici, on prend soin de l'eau, du jardin et des déchets. J'ai caché <b>5 feuilles d'or</b> pour fêter ça."],
      ["joie", "Retrouve-les avec moi, de ta chambre à la cour, et une <b>vraie récompense</b> t'attend. En route !", "🗺️ Voir la carte"]
    ],
    carteTitre: "La carte du Saint-Pierre", carteBulle: "On commence par ta chambre ? Touche l'étape <b>1</b> !",
    gain: { icone: "🍃", nomPluriel: "Les feuilles d'or" },
    carte: { fond: carteFond },
    etapes: [
      { id: "chambre", lieu: "Ta chambre au Saint-Pierre", lieuCourt: "La chambre", titre: "La chambre du petit galet", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 96, y: 166,
        mission: "Ta chambre cache <b>5 défis</b> ! Trouve-les et relève-les en famille, comme de vrais jardiniers de l'Écolabel.",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = la feuille d'or de la chambre."],
        boutonJeu: "🔎 J'explore ma chambre !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f6f3ec", sol: "#c9a67c", drap: "#bfe3c8", bois: "#8f6a46", accent: "#e9784a" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans la chambre 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 défis sur 5 ! La plante de Ti Pierre pousse d'un coup !",
          objets: [
            { obj: "robinet", x: 284, y: 112, icone: "🪥", titre: "Défi de la goutte précieuse", defi: "Au Saint-Pierre, les robinets ont un réducteur de débit : chaque goutte compte. Défi : robinet fermé pendant le brossage, et on compte jusqu'à 100 !", vrai: "Ce soir, pour de vrai : robinet fermé pendant le brossage, et on compte jusqu'à 100. Ti Pierre compte avec toi !", bravo: "Dents qui brillent, goutte gardée !" },
            { obj: "clim", x: 98, y: 136, s: .85, r: 38, icone: "🌬️", titre: "Défi du vent du jardin", defi: "L'hôtel aime la ventilation naturelle. Fenêtre ouverte, la clim se repose et l'air frais de la cour prend le relais !", vrai: "Dans ta vraie chambre, c'est pareil : fenêtre ouverte, la clim se repose et l'air de la cour entre. Fenêtre fermée, la clim revient !", bravo: "Le vent du jardin a pris le relais !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi lumière express", defi: "Ici, les appareils s'éteignent tout seuls quand on quitte la chambre. Défi : fais encore plus vite qu'eux, tout éteint en 5 secondes !", vrai: "En quittant ta vraie chambre, fais la course avec l'hôtel : toutes les lumières éteintes en 5 secondes. Top chrono !", bravo: "Plus rapide que l'interrupteur magique !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#3f9b6e", icone: "🌿", titre: "Défi serviette voyageuse", defi: "Suspends ta serviette : elle sèche cette nuit, et demain elle t'accompagne à la piscine ou à la plage !", vrai: "Ce soir, fais pareil avec ta vraie serviette : suspends-la pour qu'elle sèche, et demain elle repart avec toi.", bravo: "Serviette prête pour demain !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Au Saint-Pierre, on trie jusque dans la chambre ! Bouteille, papier, épluchure : trouve le bon bac du premier coup.", vrai: "Pendant ton séjour, trie pour de vrai dans ta chambre : bouteille, papier, épluchure, chacun son bac.", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "bouteille", "nom": "bouteille", "bac": "emb"}, {"obj": "papier", "nom": "papier", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait, jardinier !" }
          ] },
        bravo: { titre: "Chambre au top !", gainIcone: "🍃", gain: "Feuille d'or n°1 : celle de la chambre", gainSous: "5 défis relevés en famille.", perso: "Bravo ! Grâce à toi, ma petite plante a gagné une feuille !" },
        savais: { titre: "Le savais-tu ?", texte: "Au Saint-Pierre, l'eau filtrée est servie en bouteille de verre, les déchets se trient jusque dans la chambre et les épluchures partent au compost pour nourrir la terre.", src: "hotellesaintpierre.fr/ecolabel-europeen" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à choisir avec vous)." },
      { id: "cour", lieu: "La cour végétalisée", lieuCourt: "La cour", titre: "L'eau de la cour", resume: "Guide l'eau jusqu'aux plantes de la cour", duree: "3 min", x: 150, y: 270,
        mission: "Les plantes de la cour ont soif ! Fais tourner les tuyaux pour que l'eau du robinet du jardin arrive jusqu'à elles, goutte après goutte.",
        regle: ["Pose ton doigt sur un tuyau et fais-le tourner en rond, comme une manivelle.", "L'eau devient bleue quand elle passe.", "Relie le robinet (en haut) aux plantes (en bas à droite)."],
        boutonJeu: "🔧 J'arrose la cour !",
        jeu: { type: "tuyaux", titreBarre: "💧 L'eau de la cour", coupsMini: 7, decorHaut, decorBas,
          // [forme, rotation solution, rotation de départ, sur le chemin]
          tuiles: [["L", 0, 3, 1], ["L", 2, 1, 1], ["T", 0, 1], ["I", 0, 1],
                   ["L", 0, 2], ["L", 0, 3, 1], ["I", 1, 0, 1], ["L", 2, 1, 1],
                   ["T", 0, 2], ["I", 0, 0], ["L", 0, 1], ["I", 0, 1, 1],
                   ["I", 0, 1], ["T", 0, 3], ["L", 0, 0], ["I", 0, 1, 1]],
          msgDebut: "Fais tourner avec ton doigt : dessine un rond sur un tuyau gris. L'eau part du robinet (en haut à gauche) et file vers la flèche jaune 💧",
          msgAide: "Astuce de Ti Pierre : l'eau sort en haut à gauche et descend vers le coin en bas à droite.",
          msgGagne: "Glouglou ! L'eau arrive dans la cour. Regarde, les fleurs se réveillent !" },
        bravo: { titre: "Cour arrosée !", gainIcone: "🍃", gain: "Feuille d'or n°2 : celle de la cour", gainSous: "Juste l'eau qu'il faut, là où il faut.", perso: "Les plantes de la cour te disent merci, et moi aussi !" },
        savais: { titre: "Le savais-tu ?", texte: "Au Saint-Pierre, l'équipe suit l'arrosage de près et signale vite la moindre fuite : chaque goutte va droit aux plantes.", src: "hotellesaintpierre.fr/ecolabel-europeen" },
        terrain: "dans l'application complète, cette étape se joue dans la cour végétalisée, avec un repère caché près des plantes (à organiser avec vous)." },
      { id: "jardindepierre", lieu: "Le restaurant Le Jardin de Pierre", lieuCourt: "Le Jardin de Pierre", titre: "Le panier de la région", resume: "Le jeu des produits d'ici", x: 153, y: 342,
        teaser: "Au Jardin de Pierre, la cuisine choisit les produits de la région. Sauras-tu reconnaître les fruits et les légumes d'ici ?",
        complet: ["Un jeu des produits locaux, imaginé avec le chef", "La 3e feuille d'or, à table, en famille", "Les parents découvrent la carte du Jardin de Pierre"] },
      { id: "piscine", lieu: "La piscine de la cour", lieuCourt: "La piscine", titre: "Le grand plouf", resume: "L'énigme des gouttes d'eau", x: 231, y: 279,
        teaser: "Au bord de la piscine, une énigme t'attend : d'où vient l'eau, et où part-elle ensuite ?",
        complet: ["Une énigme sur le voyage de l'eau, au bord de la piscine", "La 4e feuille d'or", "Un défi en famille, chrono en main"] },
      { id: "accueil", lieu: "L'accueil", lieuCourt: "L'accueil", titre: "Le jardin secret", resume: "Rends les 5 feuilles et gagne ta récompense", x: 182, y: 421,
        teaser: "Avec les 5 feuilles d'or, la plante de Ti Pierre fleurit… et ta famille rejoint les Jardiniers du Saint-Pierre !",
        complet: ["Le compteur des familles Jardiniers, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Jardinier du Saint-Pierre", court: "JARDINIER DU SAINT-PIERRE" },
    victoireTexte: "Ti Pierre a retrouvé ses 5 feuilles d'or et sa plante est en fleurs : mission accomplie, jardinier ! Voici ta récompense.",
    lot: { titre: "1 dessert offert à l'enfant", lieu: "Au Jardin de Pierre", detail: "Montre ce bon au Jardin de Pierre pendant ton séjour, et régale-toi dans la cour !" },
    codePrefixe: "PIERRE",
    compteur: "Ta famille rejoint les Jardiniers du Saint-Pierre (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 feuilles d'or dans tout l'hôtel", "Des niveaux 2 et 3 pour les longs séjours", "Une carte souvenir de jardinier à garder"],
    projet: {
      pour: "Maquette pour l'Hôtel Le Saint-Pierre · Saint-Pierre",
      sous: "Une aventure sur téléphone pour vos familles. Ti Pierre, un petit galet devenu jardinier, fait découvrir l'hôtel, de la chambre à la cour végétalisée. Personnage, étapes, défis et lots se construisent avec vos équipes.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. au Jardin de Pierre"], ["🌿", "Un appui pour vos critères Écolabel 3, 16 et 26"], ["📱", "Un QR code suffit, et ça marche même hors ligne"]],
      idee: [
        "Les enfants aident Ti Pierre à retrouver les 5 feuilles d'or cachées dans l'hôtel.",
        "Chaque étape est un mini-jeu : la chambre, la cour, Le Jardin de Pierre, la piscine…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer."
      ],
      appli: "Une création à plusieurs mains : ateliers avec vos équipes (accueil, restaurant, bar, entretien de la cour), idées de votre personnel, puis un test avec de vraies familles avant le lancement. Tout ce que montre cette maquette est à choisir avec vous.",
      apports: [
        ["👨‍👩‍👧", "Un plus pour vos familles", "Une heure de jeu en autonomie, au rythme de chacun, en écho à votre offre « Petits Voyageurs »."],
        ["🍽️", "Vos lieux mis en valeur", "Les lots amènent les familles au Jardin de Pierre, au bar et au bord de la piscine."],
        ["🌱", "Votre Écolabel, vécu en jeu", "Le tri en chambre, la ventilation naturelle, l'arrosage suivi de près, le compost : vos engagements deviennent des défis que les enfants adorent relever."],
        ["📊", "Des chiffres pour votre bilan", "Familles qui jouent, défis relevés, avis : un tableau de bord simple et anonyme."]
      ],
      label: {
        titre: "Un appui pour votre Écolabel européen",
        intro: "L'aventure informe vos clients de façon active et fait de l'éducation à l'environnement une vraie distraction. Elle aide à documenter :",
        criteres: [
          ["Critère 3", "Information de la clientèle donnée « activement » : économies d'eau, linge et serviettes, déchets, lieux d'intérêt. Le petit avis de fin répond au point b)."],
          ["Critère 26", "Biodiversité locale (a, avec les plantes de votre cour) et éducation à l'environnement dans les distractions (b) : 2 points optionnels."],
          ["Critère 16", "Réutilisation des serviettes : le défi « serviette voyageuse » de la mission chambre."]
        ],
        note: "Référence : décision (UE) 2017/175. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple (à choisir avec vous) :",
      lots: [["🍨", "1 dessert offert à l'enfant", "au Jardin de Pierre"], ["🍹", "1 mocktail « Ti Pierre » pour l'enfant", "au bar"], ["☀️", "Une attention pour les parents", "au bord de la piscine"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou un jour de pluie. Les écogestes deviennent des défis, et chaque défi relevé est une fierté :", defis: ["La goutte précieuse : robinet fermé, on compte jusqu'à 100", "Le vent du jardin : fenêtre ouverte, clim au repos", "Lumière express : tout éteint en 5 secondes", "La serviette voyageuse, suspendue pour demain", "Le tri en chambre, du premier coup"] },
      complete: ["5 étapes : la chambre, la cour, Le Jardin de Pierre, la piscine, l'accueil (lieux à choisir avec vous)", "Des défis imaginés avec vos collaborateurs, formés à l'Écolabel", "Voix de Ti Pierre en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une balade à pied jusqu'au lagon, pour les familles qui aiment marcher", "Hors connexion, dans le navigateur, en toute discrétion pour les données"],
      stats: [["148", "familles ont terminé l'aventure"], ["44 min", "de jeu en moyenne"], ["87 %", "des défis « chambre » relevés"], ["9,0/10", "note des enfants"]],
      barres: [["Étape chambre", 93], ["Étape cour", 91], ["Étape Jardin de Pierre", 73], ["Bons utilisés", 70]]
    }
  };
})();
