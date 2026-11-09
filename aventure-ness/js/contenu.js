/* ============================================================
   CONTENU — Ness by D-Ocean (La Saline, Trou d'Eau) · « Le secret de Nessa »
   Faits utilisés (sources : 07-hotels-eco-labellises.md) :
   - Écolabel européen FR/051/671 (base ADEME 11/2026) ; spa labellisé Spa-A.
   - Bord de lagon, plage de Trou d'Eau ; partenariat avec la Réserve marine de La Réunion ;
     respect du récif ; eau filtrée en carafe (fin des bouteilles plastique) ; tri ; produits locaux.
   - Restaurant Le Coconut Grove, Sand Bar (pieds dans le sable), Spa by D-Ocean. Appli « Ness App » existante.
   - Réserve marine créée en 2007, du Cap La Houssaye à la Roche aux Oiseaux (reservemarinereunion.fr).
   Tout le reste est une PROPOSITION (lieux, lots, défis) à choisir avec l'hôtel.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#13a3a0", c2: "#ff7f6b", fond: "#06394a", fond2: "#0b5566", accent: "#ffd166", clair: "#eafaf7" };

  /* ---------- Nessa, la petite tortue du récif ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M72 66 q10 -11 20 0 M108 66 q10 -11 20 0" stroke="#173a2a" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="82" cy="64" rx="11" ry="13" fill="#fff"/><ellipse cx="118" cy="64" rx="11" ry="13" fill="#fff"/><circle cx="84" cy="67" r="7" fill="#1b2a38"/><circle cx="120" cy="67" r="7" fill="#1b2a38"/><circle cx="86.5" cy="63.5" r="2.6" fill="#fff"/><circle cx="122.5" cy="63.5" r="2.6" fill="#fff"/></g>';
    const bouche = pose === "parle"
      ? '<ellipse cx="100" cy="88" rx="9" ry="7.5" fill="#7a2e3b"/><ellipse cx="100" cy="91.5" rx="5" ry="3" fill="#ff8fa3"/>'
      : '<path d="M85 83 q15 16 30 0z" fill="#7a2e3b" stroke="#173a2a" stroke-width="3.5" stroke-linejoin="round"/><path d="M92 89 q8 5 16 0" fill="#ff8fa3"/>';
    const brasD = leve ? '<path d="M146 116 q26 -18 34 -52 q-2 -10 -12 -6 q-12 26 -32 40z" fill="#7cc98a" stroke="#3f8f55" stroke-width="3"/>'
      : '<path d="M148 126 q30 4 44 22 q-2 10 -14 6 q-14 -12 -32 -12z" fill="#7cc98a" stroke="#3f8f55" stroke-width="3"/>';
    const brasG = pose === "joie" ? '<path d="M54 116 q-26 -18 -34 -52 q2 -10 12 -6 q12 26 32 40z" fill="#7cc98a" stroke="#3f8f55" stroke-width="3"/>'
      : '<path d="M52 126 q-30 4 -44 22 q2 10 14 6 q14 -12 32 -12z" fill="#7cc98a" stroke="#3f8f55" stroke-width="3"/>';
    return '<ellipse cx="100" cy="190" rx="54" ry="7" fill="#000" opacity=".12"/>' +
      '<ellipse cx="68" cy="176" rx="17" ry="10" fill="#7cc98a" stroke="#3f8f55" stroke-width="3"/><ellipse cx="132" cy="176" rx="17" ry="10" fill="#7cc98a" stroke="#3f8f55" stroke-width="3"/>' +
      brasG + brasD +
      '<ellipse cx="100" cy="136" rx="57" ry="46" fill="#2f8a52" stroke="#21673c" stroke-width="4"/>' +
      '<path d="M100 108 l20 12 v22 l-20 12 l-20 -12 v-22z" fill="#5cb46f"/><path d="M58 122 l18 -6 l4 26 l-16 12 l-12 -14z M142 122 l-18 -6 l-4 26 l16 12 l12 -14z M80 158 l20 2 l20 -2 l-6 16 h-28z" fill="#5cb46f"/>' +
      '<path d="M66 106 q34 -14 68 0" stroke="#7fd197" stroke-width="3" fill="none" opacity=".7"/>' +
      '<circle cx="100" cy="70" r="40" fill="#8fd89b" stroke="#3f8f55" stroke-width="3.5"/>' +
      '<ellipse cx="68" cy="82" rx="8" ry="5" fill="#ff9aa8" opacity=".75"/><ellipse cx="132" cy="82" rx="8" ry="5" fill="#ff9aa8" opacity=".75"/>' +
      yeux + bouche +
      '<g transform="translate(126 36) rotate(18)"><path d="M0 -13 L4 -4 L13 -3 L6 3 L8 12 L0 7 L-8 12 L-6 3 L-13 -3 L-4 -4Z" fill="#ff8a5c" stroke="#e0603a" stroke-width="1.5"/><circle r="2" fill="#ffd9c2"/></g>';
  }

  /* ---------- décor : le lagon de La Saline, le récif, la plage de sable blanc ---------- */
  const extra = '<g transform="translate(300 300)"><path d="M0 -13 L4 -4 L13 -3 L6 3 L8 12 L0 7 L-8 12 L-6 3 L-13 -3 L-4 -4Z" fill="#ff8a5c"/></g>' +
    '<g transform="translate(52 310) scale(.9)"><path d="M0 -10 q12 4 10 14 q-10 4 -20 0 q-2 -10 10 -14z" fill="#ffd9c2" stroke="#e8a582" stroke-width="1.5"/></g>';
  const decor = { ciel: ["#6fcdf0", "#dff6ff"], merC: ["#0f6f9e", "#2bb3c6"], mer: "lagon", lagon: "#5fd6d0", recif: true, sable: "#fbf2dc", sableC2: "#f1ddb0", horizon: 110, plage: 238, palmiers: [[22, 300, 112, 1], [340, 296, 98, -1]], extra };

  /* ---------- la vue depuis la fenêtre de la chambre ---------- */
  const vue = '<rect width="140" height="120" fill="#a7e3f6"/><rect y="46" width="140" height="74" fill="#2aa7c0"/><path d="M0 54 q20 -4 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="3" fill="none" class="ressac"/><rect y="58" width="140" height="34" fill="#63d6cf"/><path d="M0 92 q70 -10 140 0 V120 H0z" fill="#fbefd2"/><circle cx="112" cy="20" r="10" fill="#ffd166"/><path d="M10 120 q4 -40 16 -60" stroke="#8a6440" stroke-width="4" fill="none"/><path d="M26 60 q-20 -6 -30 6 M26 60 q-4 -20 -22 -22 M26 60 q14 -16 32 -10 M26 60 q20 0 26 16" stroke="#2f9e5a" stroke-width="6" fill="none" stroke-linecap="round"/>';

  /* ---------- la carte du Ness (illustrée, non contractuelle) ---------- */
  const carteFond = '<defs><linearGradient id="cmer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b78a8"/><stop offset=".35" stop-color="#2fb1c4"/><stop offset="1" stop-color="#6fdcd3"/></linearGradient></defs>' +
    '<rect width="360" height="440" fill="#a9d99a"/><rect width="360" height="180" fill="url(#cmer)"/>' +
    '<path d="M0 44 q30 -6 60 0 t60 0 t60 0 t60 0 t60 0 t60 0" stroke="#fff" stroke-width="5" fill="none" class="ressac"/><text x="350" y="30" text-anchor="end" font-size="11" font-weight="800" fill="#e6fbff" font-family="system-ui,sans-serif">le récif</text>' +
    [[150, 90], [210, 120], [300, 80], [40, 150], [250, 140]].map(p => '<g transform="translate(' + p[0] + ' ' + p[1] + ')" opacity=".75"><ellipse rx="16" ry="6" fill="#d77a97"/><ellipse cx="9" cy="-2" rx="8" ry="4" fill="#efb05a"/></g>').join("") +
    '<text x="170" y="66" font-size="12" font-weight="800" fill="#fff" font-family="system-ui,sans-serif" opacity=".9">Lagon de La Saline</text>' +
    '<path d="M0 166 q90 -22 180 -6 t180 -8 V230 q-90 14 -180 4 t-180 8z" fill="#fbf0d4"/><path d="M0 166 q90 -22 180 -6 t180 -8" stroke="#fff" stroke-width="4" fill="none" class="ressac"/>' +
    '<text x="12" y="208" font-size="11" font-weight="800" fill="#b8955a" font-family="system-ui,sans-serif">plage de Trou d\'Eau</text>' +
    '<path d="M95 330 q60 -40 120 -60 t70 -80 M95 330 q60 30 105 70 M215 270 q30 20 35 30" stroke="#f3e2bd" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    '<g transform="translate(285 180)"><path d="M-30 2 l30 -22 l30 22z" fill="#c9a36a"/><rect x="-24" y="2" width="48" height="18" fill="#8a6440"/><rect x="-18" y="6" width="36" height="8" fill="#ffd9a0"/></g>' +
    '<g transform="translate(30 290)"><rect width="128" height="70" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M0 0 h128 l-10 -14 h-108z" fill="#c8553d"/>' + [0, 1, 2, 3].map(i => '<rect x="' + (12 + i * 30) + '" y="14" width="18" height="16" rx="3" fill="#9fdcf0"/><rect x="' + (12 + i * 30) + '" y="40" width="18" height="16" rx="3" fill="#9fdcf0"/>').join("") + '</g>' +
    '<g transform="translate(212 268)"><rect width="84" height="48" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h96 l-12 -14 h-72z" fill="#d97a4a"/><circle cx="20" cy="26" r="7" fill="#ffd166"/><circle cx="42" cy="26" r="7" fill="#ffd166"/><circle cx="64" cy="26" r="7" fill="#ffd166"/></g>' +
    '<g transform="translate(166 376)"><rect width="70" height="40" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h82 l-10 -12 h-62z" fill="#13a3a0"/><rect x="28" y="16" width="14" height="24" rx="3" fill="#8a6440"/></g>' +
    Art.palmier(20, 250, 46, 1) + Art.palmier(186, 250, 40, -1) + Art.palmier(330, 260, 44, -1) + Art.palmier(330, 420, 44, -1) +
    '<g transform="translate(26 196) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  return {
    id: "ness", nom: "Ness by D-Ocean", nomCourt: "Ness by D-Ocean", titre: "Le secret de Nessa",
    couleurs: C, perso, perso_nom: "Nessa", decor,
    accroche: "Une aventure pour toute la famille, du lagon à ta chambre.",
    accueilBulle: "Coucou ! Moi, c'est <b>Nessa</b>, la petite tortue du récif. J'ai perdu mes clés et j'ai besoin d'un héros ou d'une héroïne… c'est toi ?",
    boutonDepart: "🐢 J'aide Nessa !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Ce matin, une grosse vague a éparpillé mes <b>clés du lagon</b>. Elles ouvrent ma maison, tout au fond du récif !"],
      ["coucou", "Il y en a une dans chaque coin du Ness : dans le lagon, dans ta chambre, au Sand Bar…"],
      ["joie", "Retrouve-les avec moi. À la fin, une <b>vraie récompense</b> t'attend. Promis, nageoire levée !", "🗺️ Voir la carte du Ness"]
    ],
    carteTitre: "La carte du Ness", carteBulle: "On commence par le lagon ? Touche l'étape <b>1</b> !",
    gain: { icone: "🗝️", nomPluriel: "Les clés du lagon" },
    carte: { fond: carteFond },
    etapes: [
      { id: "lagon", lieu: "Le lagon de Trou d'Eau", lieuCourt: "Le lagon", titre: "Le chemin du héron", resume: "Rejoins Nessa en marchant sur le sable", duree: "3 min", x: 80, y: 108,
        mission: "Ma 1re clé est près de moi, au milieu du lagon. Pour me rejoindre, avance sur le <b>sable</b>, à pas de héron. Les coraux, ce sont les maisons des poissons : on les admire en passant à côté !",
        regle: ["Touche une tache de sable juste à côté de toi pour avancer.", "Un corail sur ta route ? Fais le tour !", "Moins de détours = plus d'étoiles ⭐"],
        boutonJeu: "🐾 À pas de héron !",
        jeu: { type: "chemin", titreBarre: "🐾 Pas de héron", plageNom: "plage de Trou d'Eau", depart: [1],
          grille: ["CCCNCC", "CSSSCC", "CSCCCC", "CSSSSC", "CCCCSC", "CSSSSC"],
          solution: [[1, 5], [2, 5], [3, 5], [4, 5], [4, 4], [4, 3], [3, 3], [2, 3], [1, 3], [1, 2], [1, 1], [2, 1], [3, 1], [3, 0]],
          msgDebut: "Touche une tache de sable à côté de toi pour avancer. Nessa t'attend en haut !",
          msgLoin: "Un pas à la fois, comme un héron : touche une case juste à côté de toi 🐾",
          msgCorail: ["Oups ! Ici, c'est la maison d'un poisson-clown 🐠 Cherche le sable à côté !", "Ce corail est un immeuble à poissons ! Le sable t'attend juste à côté.", "Le corail fait la sieste… Essaie une autre case de sable !"],
          msgPas: ["Pas de héron… 🐾", "Tout en douceur !", "Le sable est ton ami.", "Nessa te fait coucou avec sa nageoire !"],
          msgGagne: "Tu as rejoint Nessa sans réveiller un seul corail. Même les poissons-clowns applaudissent (avec leurs nageoires) !" },
        bravo: { titre: "La clé du sable !", gainIcone: "🗝️", gain: "Clé n°1 : la clé du sable", gainSous: "Tu as traversé le lagon comme un vrai héron.", perso: "Tu as vu ? Tous les poissons-clowns t'ont fait coucou !" },
        savais: { titre: "Le savais-tu ?", texte: "Le lagon devant le Ness fait partie de la Réserve naturelle marine de La Réunion, créée en 2007 : elle va du Cap La Houssaye à la Roche aux Oiseaux. Et le Ness est partenaire de la Réserve !", src: "reservemarinereunion.fr · nessbydocean.com/eco-responsable" },
        terrain: "dans l'application complète, cette étape se joue au bord du lagon, avec un repère à trouver sur la plage (emplacement à choisir avec vous, messages relus par la Réserve marine)." },
      { id: "chambre", lieu: "Ta chambre au Ness", lieuCourt: "La chambre", titre: "Les 5 défis cachés", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 95, y: 326,
        mission: "La 2e clé est cachée dans ta chambre, derrière <b>5 défis</b>. Trouve-les et relève-les avec ta famille. Je compte sur toi !",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = la clé de l'eau douce."],
        boutonJeu: "🔎 Je cherche !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#fdf5e8", sol: "#d9b98c", drap: "#7fd1c9", bois: "#b98a5e", accent: "#ff9f80" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans la chambre 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 défis sur 5 ! Ta chambre est devenue le QG secret des gardiens du lagon 🐢",
          objets: [
            { obj: "robinet", x: 284, y: 112, icone: "🪥", titre: "Défi brosse à dents", defi: "Ce soir, robinet fermé pendant tout le brossage… et tu fredonnes la chanson de Nessa jusqu'au bout ! Qui tiendra 2 minutes ?", vrai: "Ce soir, fais pareil avec le vrai robinet : on le ferme pendant tout le brossage, et on fredonne la chanson de Nessa jusqu'au bout. Qui tiendra 2 minutes ?", bravo: "Robinet fermé, sourire ouvert !" },
            { obj: "carafe", x: 62, y: 206, s: .9, r: 36, icone: "💧", titre: "Défi de la carafe", defi: "Au Ness, l'eau est filtrée et servie en carafe : zéro bouteille plastique ! Remplis ta gourde ou ton verre, et trinque avec Nessa.", vrai: "Au Ness, l'eau est filtrée et servie en carafe : zéro bouteille plastique ! Remplis pour de vrai ta gourde ou ton verre à la carafe, et trinque avec Nessa.", bravo: "Santé ! Glouglou !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi lumière ninja", defi: "En sortant de la chambre, éteins toutes les lumières en moins de 5 secondes. Prêt ? Prête ? 3, 2, 1… ninja !", vrai: "Tout à l'heure, en sortant de la chambre, fais pareil pour de vrai : toutes les lumières éteintes en moins de 5 secondes. 3, 2, 1… ninja !", bravo: "Plus rapide qu'un poisson-volant !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#13a3a0", icone: "🐢", titre: "Défi mode tortue", defi: "Suspends ta serviette pour qu'elle sèche, comme Nessa sèche ses nageoires au soleil. Demain, elle est prête pour une nouvelle baignade !", vrai: "Ce soir, fais pareil avec ta vraie serviette : suspends-la pour qu'elle sèche, comme Nessa sèche ses nageoires au soleil. Nessa compte sur toi !", bravo: "Serviette en mode tortue : activé !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Papier de bonbon, bouteille, épluchure : trouve le bon bac du premier coup. Le Ness trie ses déchets, et toi aussi !", vrai: "Pendant ton séjour, garde ton œil de trieur : papier, bouteille, épluchure, chacun son bac. Le Ness trie ses déchets, et toi aussi !", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "emballage", "nom": "papier de bonbon", "bac": "emb"}, {"obj": "bouteille", "nom": "bouteille", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait, 10 sur 10 !" }
          ] },
        bravo: { titre: "La clé de l'eau douce !", gainIcone: "🗝️", gain: "Clé n°2 : la clé de l'eau douce", gainSous: "5 défis relevés : quelle équipe !", perso: "Ta chambre est devenue un QG de gardiens du lagon !" },
        savais: { titre: "Le savais-tu ?", texte: "Au Ness, l'eau est filtrée et servie en carafe : l'hôtel a dit au revoir aux bouteilles en plastique. Il trie aussi ses déchets et choisit des produits locaux.", src: "nessbydocean.com/eco-responsable" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à définir avec vous)." },
      { id: "sandbar", lieu: "Le Sand Bar", lieuCourt: "Le Sand Bar", titre: "Le mocktail secret", resume: "Retrouve la recette du mocktail de Nessa", x: 285, y: 180,
        teaser: "Au Sand Bar, pieds dans le sable, j'ai caché ma recette de mocktail… mais les ingrédients se sont mélangés !",
        complet: ["Un jeu de mémoire avec des fruits péï (ingrédients à choisir avec le bar)", "La 3e clé, gagnée au bar", "Les parents découvrent la carte du Sand Bar"] },
      { id: "coconut", lieu: "Le Coconut Grove", lieuCourt: "Coconut Grove", titre: "Le grand menu du lagon", resume: "Qui mange quoi dans le lagon ?", x: 252, y: 296,
        teaser: "Au Coconut Grove, on parle de bons repas… Dans le lagon aussi, chacun a son plat préféré !",
        complet: ["Un jeu d'association : qui mange quoi dans le lagon ?", "Un clin d'œil aux produits locaux de la carte (à choisir avec le chef)", "La 4e clé, à table, en famille"] },
      { id: "accueil", lieu: "L'accueil du Ness", lieuCourt: "L'accueil", titre: "La porte du récif", resume: "Rends les clés et rejoins les gardiens", x: 200, y: 396,
        teaser: "Avec les 5 clés, on ouvre la porte du récif. Et ta famille rejoint les gardiens du lagon !",
        complet: ["Le compteur des familles gardiennes, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Gardien·ne du lagon", court: "GARDIEN DU LAGON" },
    victoireTexte: "Nessa a retrouvé ses clés : sa maison du récif est ouverte ! Voici ta récompense.",
    lot: { titre: "1 mocktail « Nessa » offert à l'enfant", lieu: "Au Sand Bar, pieds dans le sable", detail: "Montre ce bon au Sand Bar pendant ton séjour. Santé, Nessa !" },
    codePrefixe: "NESSA",
    compteur: "Ta famille rejoint les familles gardiennes du lagon (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 clés à retrouver dans tout le Ness", "Des niveaux 2 et 3 pour les longs séjours", "Une carte souvenir à garder (et à envoyer à mamie)"],
    projet: {
      pour: "Maquette pour Ness by D-Ocean · La Saline",
      sous: "Une aventure sur téléphone pour les familles. Nessa, une petite tortue du récif, fait découvrir le Ness, du lagon à la chambre.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. au Sand Bar"], ["🌿", "Un appui pour vos critères Écolabel 3 et 26"], ["📱", "Rien à installer, ça marche même hors ligne"]],
      idee: [
        "Les enfants aident Nessa, la tortue du récif, à retrouver les clés du lagon.",
        "Chaque étape est un mini-jeu dans un lieu du Ness : le lagon, la chambre, le Sand Bar…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer au bar."
      ],
      apports: [
        ["👨‍👩‍👧", "Une animation pour vos familles", "Une heure de jeu en autonomie, au rythme de chacun, sans personnel en plus."],
        ["🍹", "Vos lieux mis en valeur", "Les lots amènent les familles au Sand Bar, au Coconut Grove ou au Spa by D-Ocean."],
        ["🐢", "Votre engagement, vécu en jeu", "Le partenariat avec la Réserve marine, le récif, l'eau en carafe : les enfants le découvrent en jouant, avec le sourire."],
        ["📊", "Des chiffres pour votre bilan", "Familles qui jouent, défis relevés, avis : un tableau de bord simple et anonyme."]
      ],
      label: {
        titre: "Un appui pour votre Écolabel européen",
        intro: "L'aventure informe vos clients de façon active et fait de l'éducation à l'environnement une vraie distraction. Elle aide à documenter :",
        criteres: [
          ["Critère 3", "Information de la clientèle donnée « activement » : économies d'eau, linge et serviettes, déchets, lieux d'intérêt. Le petit avis de fin répond au point b)."],
          ["Critère 26", "Biodiversité locale (a) et éducation à l'environnement dans les distractions (b) : 2 points optionnels."],
          ["Critère 16", "Réutilisation des serviettes : le défi « mode tortue » de la mission chambre."]
        ],
        note: "Référence : décision (UE) 2017/175. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple :",
      lots: [["🍹", "1 mocktail « Nessa » pour l'enfant", "au Sand Bar, pieds dans le sable"], ["🍨", "1 dessert offert", "au restaurant Le Coconut Grove"], ["💆", "-10 % sur un soin pour les parents", "au Spa by D-Ocean"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou un jour de pluie. Les écogestes deviennent des défis, jamais des consignes :", defis: ["Brosse à dents chrono, robinet fermé", "La carafe d'eau filtrée : on trinque !", "La serviette « mode tortue », suspendue pour demain", "Lumière ninja : tout éteint en 5 secondes", "Le tri du premier coup"] },
      complete: ["5 étapes : le lagon, la chambre, le Sand Bar, le Coconut Grove, l'accueil (lieux à choisir avec vous)", "Messages du lagon relus par la Réserve marine (proposé)", "Voix de Nessa en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une nouvelle aventure par saison, pour les familles qui reviennent", "Hors connexion, sans téléchargement, sans compte, sans donnée personnelle"],
      appli: "Vous avez déjà la Ness App : l'aventure peut s'y intégrer (un lien, une rubrique) ou la compléter comme une appli web à part, à votre choix.",
      stats: [["212", "familles ont terminé l'aventure"], ["48 min", "de jeu en moyenne"], ["86 %", "des défis « chambre » relevés"], ["9,1/10", "note des enfants"]],
      barres: [["Étape lagon", 94], ["Étape chambre", 86], ["Étape Sand Bar", 78], ["Bons utilisés", 71]]
    }
  };
})();
