/* ============================================================
   CONTENU — Le Battant des Lames (Saint-Pierre) · « Ti Lame et le trésor du lagon »
   Faits utilisés (vérifiés le 13/11/2026) :
   - Écolabel européen FR/051/442 (ADEME, ligne 4 de 07-hotels-eco-labellises.md) ;
     page lebattantdeslames.com/ecolabel/ : tri et revalorisation des déchets, anti-gaspillage,
     panneaux photovoltaïques, éclairages extérieurs à détecteur, suivi mensuel des consommations ;
     en chambre : LED, coupure par carte, clim réglée à 22 °C, robinetterie à réduction d'eau, affiches écogestes ;
     au restaurant : déchets de cuisine au compost, produits locaux et bio, confitures maison au petit-déjeuner.
   - Site (accueil, FAQ) : hôtel « les pieds dans l'eau & tourné vers le lagon », front de mer de Saint-Pierre,
     zone de baignade « idéale pour les familles » ; restaurant Le Grand Large (vue lagon, produits locaux,
     plats adaptés aux enfants : page /restaurant-saint-pierre/) ; bar face à l'océan (/prestations/bar-saint-pierre/) ;
     Spa La Perle d'Ambre (/spa/).
   Tout le reste (personnage, étapes, défis, lots) est une PROPOSITION, à choisir avec l'hôtel.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#1597c9", c2: "#f28c38", fond: "#0a3550", fond2: "#155a7d", accent: "#ffd166", clair: "#eaf7fc" };

  /* ---------- Ti Lame, la petite vague du lagon ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M70 120 q10 -11 20 0 M110 120 q10 -11 20 0" stroke="#0b3a57" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="80" cy="118" rx="10" ry="12" fill="#fff"/><ellipse cx="120" cy="118" rx="10" ry="12" fill="#fff"/><circle cx="82" cy="121" r="6.5" fill="#0b2233"/><circle cx="122" cy="121" r="6.5" fill="#0b2233"/><circle cx="84.5" cy="117.5" r="2.4" fill="#fff"/><circle cx="124.5" cy="117.5" r="2.4" fill="#fff"/></g>';
    const bouche = pose === "parle"
      ? '<ellipse cx="100" cy="144" rx="9" ry="7" fill="#0b3a57"/><ellipse cx="100" cy="147" rx="5" ry="2.6" fill="#ff8fa3"/>'
      : '<path d="M86 138 q14 15 28 0z" fill="#0b3a57" stroke="#0b3a57" stroke-width="3" stroke-linejoin="round"/><path d="M93 144 q7 4 14 0" fill="#ff8fa3"/>';
    const main = leve
      ? '<g class="balance"><path d="M168 118 q18 -22 12 -46" stroke="#1b7fae" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="180" cy="68" r="11" fill="#fff"/><circle cx="170" cy="62" r="7" fill="#fff"/><circle cx="188" cy="58" r="6" fill="#fff"/></g>'
      : '<path d="M168 130 q16 6 18 22" stroke="#1b7fae" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="186" cy="156" r="8" fill="#fff"/>';
    return '<ellipse cx="100" cy="190" rx="74" ry="7" fill="#000" opacity=".12"/>' +
      // le corps de la vague
      '<path d="M22 182 C16 118 46 62 108 46 C146 37 176 54 182 84 C164 70 142 74 138 94 C162 100 178 126 176 182 Z" fill="#2fb2e0" stroke="#1b7fae" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M40 168 q30 -10 60 0 t60 0" stroke="#8fdcf5" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>' +
      // la crête d'écume
      '<path d="M108 46 C146 37 176 54 182 84 C172 76 160 74 150 78 C150 62 132 52 108 46z" fill="#fff" stroke="#d5eef8" stroke-width="2"/>' +
      '<circle cx="104" cy="50" r="9" fill="#fff"/><circle cx="88" cy="58" r="7" fill="#fff"/><circle cx="74" cy="68" r="5" fill="#fff"/>' +
      '<ellipse cx="62" cy="136" rx="8" ry="5" fill="#ff9aa8" opacity=".75"/><ellipse cx="138" cy="136" rx="8" ry="5" fill="#ff9aa8" opacity=".75"/>' +
      yeux + bouche + main +
      // un petit coquillage ambré sur la tête
      '<g transform="translate(132 40) rotate(18)"><path d="M0 0 q-10 -16 0 -20 q10 4 0 20z" fill="#f28c38" stroke="#c76a1f" stroke-width="2"/></g>';
  }

  /* ---------- décor : le front de mer de Saint-Pierre, le lagon et la barrière de corail ---------- */
  const extra = '<g transform="translate(232 300)"><path d="M-22 0 a22 22 0 0 1 44 0z" fill="#f28c38"/><path d="M-22 0 a22 22 0 0 1 14 -21 L0 0z M8 -21 a22 22 0 0 1 14 21 L0 0z" fill="#fff"/><path d="M0 0 v26" stroke="#7a5230" stroke-width="3"/></g>' +
    '<g transform="translate(64 314)"><rect x="-24" y="-6" width="48" height="10" rx="5" fill="#1597c9"/><rect x="-24" y="-6" width="48" height="3" fill="#fff" opacity=".6"/></g>';
  const decor = { ciel: ["#5ec0ee", "#dcf3ff"], merC: ["#0f5f93", "#3cc3d6"], mer: "large", sable: "#f1e0b6", sableC2: "#d9bd88", horizon: 118, plage: 236,
    montagne: "M0 128 q24 -46 70 -50 q26 0 40 34 L120 132 H0z", montagneC: "#3f7150",
    extraFond: '<g class="ressac"><path d="M0 180 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".85"/></g>',
    palmiers: [[326, 300, 104, -1], [26, 300, 88, 1]], extra };

  const vue = '<rect width="140" height="120" fill="#a6dcf6"/><rect y="46" width="140" height="74" fill="#2a95c8"/><path d="M0 58 q20 -5 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="3" fill="none" class="vague-anim"/>' +
    '<rect y="70" width="140" height="26" fill="#5fd0d6"/><path d="M0 98 q70 -12 140 0 V120 H0z" fill="#f1e0b6"/><circle cx="116" cy="20" r="10" fill="#ffd166"/>' +
    '<g transform="translate(52 66) scale(.14)"><path d="M22 182 C16 118 46 62 108 46 C146 37 176 54 182 84 C164 70 142 74 138 94 C162 100 178 126 176 182 Z" fill="#2fb2e0"/><path d="M108 46 C146 37 176 54 182 84 C172 76 160 74 150 78 C150 62 132 52 108 46z" fill="#fff"/></g>';

  /* ---------- la carte (illustrée, non contractuelle) ---------- */
  const carteFond = '<rect width="360" height="440" fill="#bfe3a9"/>' +
    '<path d="M0 0 h360 v70 H0z" fill="#1d6fa6"/>' +
    '<path d="M0 66 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="5" fill="none" opacity=".9" class="ressac"/>' +
    '<path d="M0 70 h360 v84 q-90 -10 -180 6 t-180 -8z" fill="#5fd0d6"/>' +
    [0, 1].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-10 ' + (24 + i * 70) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".45"/>').join("") +
    '<text x="12" y="20" font-size="10" font-weight="800" fill="#d6f1ff" font-family="system-ui,sans-serif">barrière de corail</text>' +
    '<text x="236" y="120" font-size="11" font-weight="800" fill="#0f6a7a" font-family="system-ui,sans-serif">le lagon</text>' +
    '<path d="M0 152 q90 -10 180 6 t180 -8 v46 q-90 16 -180 0 t-180 4z" fill="#f1e0b6"/><text x="22" y="186" font-size="11" font-weight="800" fill="#a8844a" font-family="system-ui,sans-serif">plage de Saint-Pierre</text>' +
    '<path d="M0 214 h360" stroke="#d2d6db" stroke-width="14"/><text x="196" y="218" font-size="9" font-weight="800" fill="#7b8590" font-family="system-ui,sans-serif">front de mer</text>' +
    '<path d="M90 336 q40 -40 70 -100 M160 236 q40 30 90 60 M250 296 q-20 40 -60 90" stroke="#f3e2bd" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    // l'hôtel
    '<g transform="translate(24 300)"><rect width="134" height="70" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h146 l-12 -14 h-122z" fill="#1597c9"/>' + [0, 1, 2, 3].map(i => '<rect x="' + (12 + i * 30) + '" y="14" width="18" height="16" rx="3" fill="#9fdcf0"/><rect x="' + (12 + i * 30) + '" y="42" width="18" height="16" rx="3" fill="#9fdcf0"/>').join("") + '</g>' +
    // Le Grand Large
    '<g transform="translate(206 280)"><rect width="92" height="48" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h104 l-12 -14 h-80z" fill="#f28c38"/>' + [0, 1, 2].map(i => '<g transform="translate(' + (20 + i * 26) + ' 28)"><circle r="8" fill="#fff" stroke="#d6c19a" stroke-width="2"/><circle r="4" fill="#ffd166"/></g>').join("") + '</g>' +
    // le bar face à l'océan
    '<g transform="translate(214 226)"><rect width="70" height="30" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-4 0 h78 l-8 -10 h-62z" fill="#2fb2e0"/><path d="M22 10 h14 l-7 9z M29 19 v6" stroke="#f28c38" stroke-width="3" fill="#f28c38"/><rect x="44" y="8" width="16" height="10" rx="2" fill="#2b4c6b"/><path d="M44 13 h16 M52 8 v10" stroke="#9fdcf0" stroke-width="1.5"/></g>' +
    // le spa
    '<g transform="translate(168 392)"><rect width="66" height="36" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h78 l-10 -12 h-58z" fill="#e0a45e"/><circle cx="33" cy="20" r="7" fill="#f6d39a" stroke="#c88a3e" stroke-width="2"/></g>' +
    Art.palmier(340, 250, 44, -1) + Art.palmier(180, 266, 34, 1) + Art.palmier(22, 432, 40, 1) +
    '<g transform="translate(286 84) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  return {
    id: "battant-des-lames", nom: "Le Battant des Lames", nomCourt: "Battant des Lames", titre: "Ti Lame et le trésor du lagon",
    couleurs: C, perso, perso_nom: "Ti Lame", decor,
    accroche: "Une aventure en famille, de ta chambre au lagon de Saint-Pierre.",
    accueilBulle: "Coucou ! Moi, c'est <b>Ti Lame</b>, la petite vague du lagon. Je viens dire bonjour à l'hôtel tous les matins. Tu joues avec moi ?",
    boutonDepart: "🌊 Je plonge dans l'aventure !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Le Battant des Lames, c'est l'endroit où les vagues viennent battre la barrière de corail. Et moi, je suis la plus petite de toutes !"],
      ["coucou", "L'hôtel a l'<b>Écolabel européen</b> : il prend soin de l'eau, de l'énergie et du lagon. Pour le fêter, j'ai semé <b>5 coquillages d'or</b>."],
      ["joie", "Retrouve-les avec moi, de ta chambre au lagon, et une <b>vraie récompense</b> t'attend. À l'eau !", "🗺️ Voir la carte"]
    ],
    carteTitre: "La carte du Battant des Lames", carteBulle: "On commence par ta chambre ? Touche l'étape <b>1</b> !",
    gain: { icone: "🐚", nomPluriel: "Les coquillages d'or" },
    carte: { fond: carteFond },
    etapes: [
      { id: "chambre", lieu: "Ta chambre au Battant des Lames", lieuCourt: "La chambre", titre: "La chambre de la petite vague", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 91, y: 300,
        mission: "Ta chambre regarde le lagon ! J'y ai caché <b>5 défis</b>. Trouve-les et relève-les en famille.",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = le coquillage d'or de la chambre."],
        boutonJeu: "🔎 J'explore ma chambre !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f2f7f9", sol: "#cfae84", drap: "#9fd6ee", bois: "#8f6a46", accent: "#f28c38" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans la chambre 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 défis sur 5 ! Ti Lame fait des remous de joie !",
          objets: [
            { obj: "robinet", x: 284, y: 112, icone: "🪥", titre: "Défi de la vague qui chuchote", defi: "Ici, le robinet est réglé pour garder l'eau précieuse. Défi : robinet fermé pendant le brossage, et on compte jusqu'à 100 en chuchotant comme une vague. Chhh…", vrai: "Ce soir, pour de vrai : robinet fermé pendant le brossage, et on compte jusqu'à 100 en chuchotant comme Ti Lame. Chhh…", bravo: "Dents qui brillent, robinet au repos !" },
            { obj: "clim", x: 98, y: 136, s: .85, r: 38, icone: "🌬️", titre: "Défi brise du large", defi: "Au Battant des Lames, la clim est réglée à 22 °C, la température douce. Fenêtre ouverte, elle se repose et la brise du lagon prend le relais !", vrai: "Dans ta vraie chambre, c'est pareil : fenêtre ouverte, la clim se repose et la brise du lagon prend le relais. Fenêtre fermée, la clim revient !", bravo: "La brise et la clim font équipe !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi de la carte magique", defi: "Ici, la carte de la chambre allume les lumières… et les éteint quand on sort. Défi : fais comme elle, tout éteint en 5 secondes. Top chrono !", vrai: "En quittant ta vraie chambre, fais comme la carte magique : toutes les lumières éteintes en 5 secondes. Top chrono !", bravo: "Plus rapide que la carte magique !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#1597c9", icone: "🏖️", titre: "Défi serviette voyageuse", defi: "Suspends ta serviette : elle sèche cette nuit, et demain elle repart avec toi à la plage de Saint-Pierre !", vrai: "Ce soir, fais pareil avec ta vraie serviette : suspends-la pour qu'elle sèche, et demain elle repart à la plage avec toi.", bravo: "Serviette prête pour demain !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Bouteille, papier, épluchure : trouve le bon bac du premier coup. À l'hôtel, les épluchures de la cuisine partent même au compost !", vrai: "Pendant ton séjour, trie pour de vrai : bouteille, papier, épluchure, chacun son bac, comme l'équipe du Battant des Lames.", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "bouteille", "nom": "bouteille", "bac": "emb"}, {"obj": "papier", "nom": "papier", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait, champion !" }
          ] },
        bravo: { titre: "Chambre au top !", gainIcone: "🐚", gain: "Coquillage d'or n°1 : celui de la chambre", gainSous: "5 défis relevés en famille.", perso: "Quelle équipe ! Ta chambre brille comme le lagon au soleil !" },
        savais: { titre: "Le savais-tu ?", texte: "Au Battant des Lames, des panneaux solaires fabriquent de l'électricité, les épluchures de la cuisine partent au compost et les confitures du petit-déjeuner sont faites maison.", src: "lebattantdeslames.com/ecolabel" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à choisir avec vous)." },
      { id: "lagon", lieu: "Le lagon de Saint-Pierre", lieuCourt: "Le lagon", titre: "Les foulées de velours", resume: "Traverse le lagon sur le sable", duree: "3 min", x: 166, y: 120,
        mission: "Ti Lame t'attend au bord de la barrière de corail ! Avance de tache de sable en tache de sable, pour laisser le corail dormir tranquille.",
        regle: ["Touche une tache de sable juste à côté de toi pour avancer.", "Le corail est vivant : on le regarde avec les yeux.", "Rejoins Ti Lame = le coquillage d'or du lagon."],
        boutonJeu: "🦶 Je traverse le lagon !",
        jeu: { type: "chemin", titreBarre: "🦶 Foulées de velours", plageNom: "plage de Saint-Pierre", depart: [4],
          grille: ["CCNCCC", "CCSSSC", "CCCCSC", "CSSSSC", "CSCCCC", "CSSSSC"],
          solution: [[4, 5], [3, 5], [2, 5], [1, 5], [1, 4], [1, 3], [2, 3], [3, 3], [4, 3], [4, 2], [4, 1], [3, 1], [2, 1], [2, 0]],
          msgDebut: "Touche une tache de sable à côté de toi pour avancer. Ti Lame t'attend en haut !",
          msgLoin: "Une foulée à la fois : touche une case juste à côté de toi 🦶",
          msgCorail: ["Oups ! Ici, c'est la maison d'un poisson-clown 🐠 Cherche le sable à côté !", "Ce corail est un immeuble à poissons ! Le sable t'attend juste à côté.", "Le corail fait la sieste… Essaie une autre case de sable !"],
          msgPas: ["Foulée de velours… 🦶", "Tout en douceur !", "Le sable est ton ami.", "Ti Lame fait des bulles de joie !"],
          msgGagne: "Tu as rejoint Ti Lame en laissant chaque corail dormir. Les poissons-clowns applaudissent avec leurs nageoires !" },
        bravo: { titre: "Lagon traversé !", gainIcone: "🐚", gain: "Coquillage d'or n°2 : celui du lagon", gainSous: "Une traversée tout en douceur, le corail est ravi.", perso: "Tu as des pieds de velours ! Le lagon de Saint-Pierre te dit merci." },
        savais: { titre: "Le savais-tu ?", texte: "Le corail est un animal ! Il grandit très lentement et sert de maison à des centaines de poissons. Dans le lagon, on l'admire avec les yeux, et il reste en pleine forme.", src: "" },
        terrain: "dans l'application complète, cette étape se joue sur la plage, face au lagon, avec un repère à trouver (à organiser avec vous)." },
      { id: "grandlarge", lieu: "Le restaurant Le Grand Large", lieuCourt: "Le Grand Large", titre: "Les confitures du matin", resume: "Le jeu des fruits et des saveurs", x: 252, y: 304,
        teaser: "Au Grand Large, les confitures du petit-déjeuner sont faites maison. Sauras-tu deviner les fruits ?",
        complet: ["Un jeu des saveurs, imaginé avec le chef", "Le 3e coquillage d'or, à table, en famille", "Les parents découvrent les produits locaux de la carte"] },
      { id: "bar", lieu: "Le bar face à l'océan", lieuCourt: "Le bar", titre: "Le soleil du Battant", resume: "L'énigme de l'énergie du soleil", x: 249, y: 226,
        teaser: "Sur le toit, des panneaux solaires attrapent les rayons du soleil. À quoi sert leur électricité ?",
        complet: ["Une énigme sur l'énergie du soleil, face à l'océan", "Le 4e coquillage d'or", "Un mocktail à partager pour fêter ça (au choix de l'hôtel)"] },
      { id: "accueil", lieu: "L'accueil", lieuCourt: "L'accueil", titre: "Le trésor du lagon", resume: "Rends les 5 coquillages et gagne ta récompense", x: 120, y: 404,
        teaser: "Avec les 5 coquillages d'or, on ouvre le trésor de Ti Lame… et ta famille rejoint les Gardiens du lagon !",
        complet: ["Le compteur des familles Gardiens du lagon, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Gardien du lagon", court: "GARDIEN DU LAGON" },
    victoireTexte: "Ti Lame a retrouvé ses coquillages d'or : mission accomplie, Gardien du lagon ! Voici ta récompense.",
    lot: { titre: "1 mocktail « Ti Lame » offert à l'enfant", lieu: "Au bar face à l'océan", detail: "Montre ce bon au bar pendant ton séjour, et trinque face au lagon !" },
    codePrefixe: "LAME",
    compteur: "Ta famille rejoint les Gardiens du lagon du Battant des Lames (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 coquillages d'or dans tout l'hôtel", "Des niveaux 2 et 3 pour les longs séjours", "Une carte souvenir de Gardien du lagon à garder"],
    projet: {
      pour: "Maquette pour Le Battant des Lames · Saint-Pierre",
      sous: "Une aventure sur téléphone pour vos familles. Ti Lame, une petite vague du lagon, fait découvrir l'hôtel, de la chambre au lagon de Saint-Pierre. Personnage, étapes, défis et lots se construisent avec vos équipes.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. au bar face à l'océan"], ["🌿", "Un appui pour vos critères Écolabel 3, 16 et 26"], ["📱", "Un QR code suffit, et ça marche même hors ligne"]],
      idee: [
        "Les enfants aident Ti Lame à retrouver les 5 coquillages d'or semés dans l'hôtel.",
        "Chaque étape est un mini-jeu : la chambre, le lagon, Le Grand Large, le bar…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer."
      ],
      appli: "Une création à plusieurs mains : ateliers avec vos équipes (accueil, restaurant, bar, spa, entretien), idées de votre personnel, puis un test avec de vraies familles avant le lancement. Tout ce que montre cette maquette est à choisir avec vous.",
      apports: [
        ["👨‍👩‍👧", "Un plus pour vos familles", "Une heure de jeu en autonomie, au rythme de chacun, en écho à votre plage familiale."],
        ["🍹", "Vos lieux mis en valeur", "Les lots amènent les familles au bar face à l'océan, au Grand Large ou au Spa La Perle d'Ambre."],
        ["☀️", "Votre Écolabel, vécu en jeu", "Les panneaux solaires, le compost, les confitures maison, la clim à 22 °C : vos engagements deviennent des défis que les enfants adorent relever."],
        ["📊", "Des chiffres pour votre bilan", "Familles qui jouent, défis relevés, avis : un tableau de bord simple et anonyme."]
      ],
      label: {
        titre: "Un appui pour votre Écolabel européen",
        intro: "L'aventure informe vos clients de façon active et fait de l'éducation à l'environnement une vraie distraction. Elle aide à documenter :",
        criteres: [
          ["Critère 3", "Information de la clientèle donnée « activement » : économies d'eau, linge et serviettes, déchets, lieux d'intérêt. Le petit avis de fin répond au point b)."],
          ["Critère 26", "Biodiversité locale (a, avec le lagon et son corail) et éducation à l'environnement dans les distractions (b) : 2 points optionnels."],
          ["Critère 16", "Réutilisation des serviettes : le défi « serviette voyageuse » de la mission chambre."]
        ],
        note: "Référence : décision (UE) 2017/175. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple (à choisir avec vous) :",
      lots: [["🍹", "1 mocktail « Ti Lame » pour l'enfant", "au bar face à l'océan"], ["🍨", "1 dessert offert à l'enfant", "au Grand Large"], ["💆", "Une attention pour les parents", "au Spa La Perle d'Ambre"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou un jour de pluie. Les écogestes deviennent des défis, et chaque défi relevé est une fierté :", defis: ["La vague qui chuchote : robinet fermé, on compte jusqu'à 100", "La brise du large : fenêtre ouverte, clim au repos", "La carte magique : tout éteint en 5 secondes", "La serviette voyageuse, suspendue pour demain", "Le tri du premier coup"] },
      complete: ["5 étapes : la chambre, le lagon, Le Grand Large, le bar, l'accueil (lieux à choisir avec vous)", "Des défis imaginés avec vos équipes et vos affiches d'écogestes", "Voix de Ti Lame en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une nouvelle aventure par saison, pour les familles qui reviennent", "Hors connexion, dans le navigateur, en toute discrétion pour les données"],
      stats: [["162", "familles ont terminé l'aventure"], ["46 min", "de jeu en moyenne"], ["85 %", "des défis « chambre » relevés"], ["9,1/10", "note des enfants"]],
      barres: [["Étape chambre", 92], ["Étape lagon", 90], ["Étape Grand Large", 74], ["Bons utilisés", 69]]
    }
  };
})();
