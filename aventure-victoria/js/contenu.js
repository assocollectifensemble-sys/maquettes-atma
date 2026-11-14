/* ============================================================
   CONTENU — Hôtel Le Victoria (Grand Bois, Saint-Pierre, groupe Exsel) · « Ti Paille et les plumes d'or »
   Faits utilisés (vérifiés le 13/11/2026) :
   - Écolabel européen FR/051/622 (ADEME, ligne 9 de 07-hotels-eco-labellises.md) ;
     page exsel.re/hotel/le-victoria/ : « engagé dans une démarche RSE qui lui a permis d'obtenir l'Écolabel Européen »,
     et label d'État « Destination d'Excellence ».
   - Même page : hôtel « à flanc de falaise » à Grand Bois, à 10 min de Saint-Pierre, aux portes du Sud Sauvage,
     qui « veille sur l'océan depuis le haut des falaises » ; 31 chambres, dont une Suite Famille ; piscine extérieure et jardin ;
     petit-déjeuner face à la piscine et à l'océan, avec confitures péi.
   - exsel.re/restaurant/le-rivage/ : restaurant & bar Le Rivage, entre mer et falaise, produits locaux et saveurs de la mer,
     dîner en famille.
   - Personnage : le paille-en-queue, oiseau des falaises de La Réunion (savoir général, aucune affirmation sur l'hôtel).
   Tout le reste (personnage, étapes, défis, lots) est une PROPOSITION, à choisir avec l'hôtel.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#2a7fb8", c2: "#e0663d", fond: "#12324a", fond2: "#1f4f6e", accent: "#ffd166", clair: "#eef6fb" };

  /* ---------- Ti Paille, le petit paille-en-queue ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M74 104 q9 -10 18 0 M108 104 q9 -10 18 0" stroke="#1d2730" stroke-width="5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="83" cy="102" rx="9" ry="11" fill="#fff" stroke="#1d2730" stroke-width="1.5"/><ellipse cx="117" cy="102" rx="9" ry="11" fill="#fff" stroke="#1d2730" stroke-width="1.5"/><circle cx="85" cy="105" r="6" fill="#1d2730"/><circle cx="119" cy="105" r="6" fill="#1d2730"/><circle cx="87" cy="101.5" r="2.2" fill="#fff"/><circle cx="121" cy="101.5" r="2.2" fill="#fff"/></g>';
    // le masque noir caractéristique, en virgule autour des yeux
    const masque = '<path d="M66 96 q14 -8 30 2 M134 96 q-14 -8 -30 2" stroke="#1d2730" stroke-width="4" fill="none" stroke-linecap="round"/>';
    const bec = pose === "parle"
      ? '<path d="M90 118 l10 -4 l10 4 l-10 6z" fill="#f2a33a" stroke="#c97a1e" stroke-width="2"/><path d="M92 126 l8 6 l8 -6z" fill="#f2a33a" stroke="#c97a1e" stroke-width="2"/>'
      : '<path d="M88 118 l12 -5 l12 5 l-12 12z" fill="#f2a33a" stroke="#c97a1e" stroke-width="2" stroke-linejoin="round"/>';
    const ailes = leve
      ? '<g class="balance"><path d="M150 140 q34 -30 40 -64 q-26 12 -46 44z" fill="#fff" stroke="#c8d3dc" stroke-width="3" stroke-linejoin="round"/><path d="M176 92 q6 -8 10 -14" stroke="#1d2730" stroke-width="4" stroke-linecap="round"/></g>' +
        '<path d="M50 140 q-34 -30 -40 -64 q26 12 46 44z" fill="#fff" stroke="#c8d3dc" stroke-width="3" stroke-linejoin="round"/><path d="M24 92 q-6 -8 -10 -14" stroke="#1d2730" stroke-width="4" stroke-linecap="round"/>'
      : '<path d="M150 136 q24 10 26 36 q-22 -4 -32 -22z" fill="#fff" stroke="#c8d3dc" stroke-width="3" stroke-linejoin="round"/><path d="M50 136 q-24 10 -26 36 q22 -4 32 -22z" fill="#fff" stroke="#c8d3dc" stroke-width="3" stroke-linejoin="round"/>';
    return '<ellipse cx="100" cy="192" rx="66" ry="7" fill="#000" opacity=".12"/>' +
      // les deux longues plumes de la queue
      '<path d="M108 176 q34 10 70 4" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M108 176 q34 10 70 4" stroke="#c8d3dc" stroke-width="1.5" fill="none"/>' +
      '<path d="M106 180 q30 16 64 16" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M106 180 q30 16 64 16" stroke="#c8d3dc" stroke-width="1.5" fill="none"/>' +
      ailes +
      // le corps rond
      '<ellipse cx="100" cy="132" rx="56" ry="58" fill="#fff" stroke="#c8d3dc" stroke-width="4"/>' +
      '<path d="M78 172 l-6 16 M122 172 l6 16" stroke="#3a4a58" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="68" cy="122" rx="8" ry="5" fill="#ff9aa8" opacity=".7"/><ellipse cx="132" cy="122" rx="8" ry="5" fill="#ff9aa8" opacity=".7"/>' +
      masque + yeux + bec;
  }

  /* ---------- décor : la falaise de Grand Bois, la piscine, l'océan du Sud Sauvage ---------- */
  const extra = '<g transform="translate(150 296)"><rect x="-40" y="-10" width="80" height="20" rx="9" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><path d="M-28 0 q7 -4 14 0 t14 0 t14 0 t14 0" stroke="#fff" stroke-width="2" fill="none" class="reflet"/></g>' +
    '<g transform="translate(250 312)"><rect x="-22" y="-6" width="44" height="10" rx="5" fill="#e0663d"/><rect x="-22" y="-6" width="44" height="3" fill="#fff" opacity=".6"/></g>';
  const decor = { ciel: ["#6cc3ec", "#e6f5ff"], merC: ["#0d4f86", "#2a8fc8"], mer: "large", sable: "#8fc27a", sableC2: "#6fa35e", horizon: 128, plage: 230,
    montagne: "M0 132 q40 -30 90 -26 q50 4 70 26 H0z", montagneC: "#466e4f",
    extraFond: '<path d="M0 230 L0 196 q60 -8 120 0 t120 -4 t120 2 V230z" fill="#6b5a4a"/><path d="M0 206 q60 -6 120 0 t120 -4 t120 2" stroke="#8a7562" stroke-width="3" fill="none"/>',
    palmiers: [[326, 300, 100, -1], [28, 300, 86, 1]], extra };

  const vue = '<rect width="140" height="120" fill="#a9dcf4"/><rect y="46" width="140" height="74" fill="#1f6fa8"/><path d="M0 58 q20 -5 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="3" fill="none" class="vague-anim"/>' +
    '<path d="M0 88 q30 -10 70 -6 t70 2 V120 H0z" fill="#6b5a4a"/><path d="M0 100 q40 -6 70 -2 t70 0 V120 H0z" fill="#8fc27a"/><circle cx="116" cy="20" r="10" fill="#ffd166"/>' +
    '<g transform="translate(30 18) scale(.16)" class="flotte"><path d="M50 140 q-34 -30 -40 -64 q26 12 46 44z M150 140 q34 -30 40 -64 q-26 12 -46 44z" fill="#fff"/><ellipse cx="100" cy="132" rx="56" ry="58" fill="#fff"/><path d="M108 176 q34 10 70 4" stroke="#fff" stroke-width="7" fill="none"/></g>';

  /* ---------- la carte (illustrée, non contractuelle) ---------- */
  const carteFond = '<rect width="360" height="440" fill="#9fcf86"/>' +
    '<path d="M0 0 h360 v96 H0z" fill="#1f6fa8"/>' +
    [0, 1].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-10 ' + (26 + i * 34) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".45"/>').join("") +
    '<text x="12" y="20" font-size="10" font-weight="800" fill="#d6f1ff" font-family="system-ui,sans-serif">l\'océan du Sud Sauvage</text>' +
    '<path d="M0 96 q60 -10 120 0 t120 -4 t120 2 v34 q-60 8 -120 0 t-120 2 t-120 -4z" fill="#6b5a4a"/><path d="M0 110 q60 -8 120 0 t120 -4 t120 2" stroke="#8a7562" stroke-width="3" fill="none"/>' +
    '<text x="232" y="146" font-size="10" font-weight="800" fill="#4a3c30" font-family="system-ui,sans-serif">la falaise</text>' +
    '<path d="M40 380 q40 -60 100 -90 M140 290 q60 -40 120 -40 M260 250 q20 -40 0 -80" stroke="#efe3c4" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    // l'hôtel
    '<g transform="translate(20 330)"><rect width="140" height="72" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h152 l-12 -14 h-128z" fill="#2a7fb8"/>' + [0, 1, 2, 3].map(i => '<rect x="' + (12 + i * 32) + '" y="14" width="18" height="16" rx="3" fill="#9fdcf0"/><rect x="' + (12 + i * 32) + '" y="42" width="18" height="16" rx="3" fill="#9fdcf0"/>').join("") + '</g>' +
    // la piscine face à l'océan
    '<g transform="translate(170 226)"><rect width="96" height="40" rx="16" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><path d="M14 20 q8 -5 16 0 t16 0 t16 0 t16 0" stroke="#fff" stroke-width="2" fill="none" class="reflet"/></g>' +
    // Le Rivage
    '<g transform="translate(206 300)"><rect width="96" height="48" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h108 l-12 -14 h-84z" fill="#e0663d"/>' + [0, 1, 2].map(i => '<g transform="translate(' + (22 + i * 26) + ' 28)"><circle r="8" fill="#fff" stroke="#d6c19a" stroke-width="2"/><circle r="4" fill="#ffd166"/></g>').join("") + '</g>' +
    // le jardin
    [[96, 196], [120, 216], [76, 226], [300, 196]].map(p => '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><circle r="13" fill="#5cbf5f"/><circle cx="-9" cy="5" r="9" fill="#6fd06a"/><circle cx="9" cy="5" r="9" fill="#4aa84f"/><circle cx="-3" cy="-3" r="3" fill="#ff8fab"/></g>').join("") +
    '<text x="62" y="256" font-size="10" font-weight="800" fill="#2f6a35" font-family="system-ui,sans-serif">le jardin</text>' +
    Art.palmier(340, 296, 40, -1) + Art.palmier(180, 412, 34, 1) +
    '<g transform="translate(110 52) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  /* ---------- le jeu des intrus : le jardin au bord de la falaise ---------- */
  const decorJardin = '<rect width="360" height="440" fill="#9fcf86"/><rect width="360" height="70" fill="#1f6fa8"/>' +
    '<path class="vague-anim" d="M-10 30 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".55"/>' +
    '<path d="M0 70 q60 -8 120 0 t120 -4 t120 2 v26 q-60 8 -120 0 t-120 2 t-120 -4z" fill="#6b5a4a"/>' +
    '<path d="M0 82 q60 -6 120 0 t120 -4 t120 2" stroke="#8a7562" stroke-width="3" fill="none"/>' +
    [[30, 150], [120, 210], [250, 170], [80, 320], [210, 360], [320, 260], [160, 420]].map(p => '<path d="M' + p[0] + ' ' + p[1] + ' q3 -10 6 0 M' + (p[0] + 8) + ' ' + (p[1] + 2) + ' q3 -12 6 0" stroke="#5f9f4c" stroke-width="2" fill="none"/>').join("") +
    '<g transform="translate(318 380)"><circle r="16" fill="#5cbf5f"/><circle cx="-11" cy="6" r="11" fill="#6fd06a"/><circle cx="11" cy="6" r="11" fill="#4aa84f"/><circle cx="-4" cy="-4" r="3" fill="#ff8fab"/><circle cx="6" cy="2" r="3" fill="#ffd166"/></g>' +
    '<path d="M14 440 q4 -50 18 -80" stroke="#6b4a2a" stroke-width="5" fill="none"/><path d="M32 360 q-18 10 -26 22 M32 360 q18 10 26 22 M30 374 q-16 8 -22 20 M30 374 q16 8 22 20" stroke="#4b7d4f" stroke-width="5" fill="none" stroke-linecap="round"/>';

  return {
    id: "victoria", nom: "Hôtel Le Victoria", nomCourt: "Le Victoria", titre: "Ti Paille et les plumes d'or",
    couleurs: C, perso, perso_nom: "Ti Paille", decor,
    accroche: "Une aventure en famille, de ta chambre au jardin face à l'océan.",
    accueilBulle: "Bonjour ! Moi, c'est <b>Ti Paille</b>, un petit paille-en-queue. Je vis dans la falaise, juste sous l'hôtel. Tu viens voler avec moi ?",
    boutonDepart: "🪶 Je m'envole avec Ti Paille !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Du haut de sa falaise, le Victoria regarde l'océan du Sud Sauvage. Et moi, je fais mon nid juste en dessous !"],
      ["coucou", "L'hôtel a l'<b>Écolabel européen</b> : il prend soin de la nature qui l'entoure. Pour le fêter, j'ai semé <b>5 plumes d'or</b>."],
      ["joie", "Retrouve-les avec moi, de ta chambre au jardin, et une <b>vraie récompense</b> t'attend. On décolle !", "🗺️ Voir la carte"]
    ],
    carteTitre: "La carte du Victoria", carteBulle: "On commence par ta chambre ? Touche l'étape <b>1</b> !",
    gain: { icone: "🪶", nomPluriel: "Les plumes d'or" },
    carte: { fond: carteFond },
    etapes: [
      { id: "chambre", lieu: "Ta chambre au Victoria", lieuCourt: "La chambre", titre: "La chambre du paille-en-queue", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 90, y: 330,
        mission: "Ta chambre regarde l'océan ! J'y ai caché <b>5 défis</b>. Trouve-les et relève-les en famille.",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = la plume d'or de la chambre."],
        boutonJeu: "🔎 J'explore ma chambre !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f3f6f8", sol: "#c2a07a", drap: "#a9cfea", bois: "#7d5e42", accent: "#e0663d" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans la chambre 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 défis sur 5 ! Ti Paille fait un looping de joie !",
          objets: [
            { obj: "robinet", x: 284, y: 112, icone: "🪥", titre: "Défi de la goutte d'océan", defi: "L'eau douce est précieuse, même face à l'océan ! Défi : robinet fermé pendant le brossage, et on compte jusqu'à 100 en battant des ailes.", vrai: "Ce soir, pour de vrai : robinet fermé pendant le brossage, et on compte jusqu'à 100 avec Ti Paille.", bravo: "Dents qui brillent, goutte gardée !" },
            { obj: "clim", x: 98, y: 136, s: .85, r: 38, icone: "🌬️", titre: "Défi vent de la falaise", defi: "Fenêtre ouverte, la clim se repose et le vent frais de la falaise prend le relais !", vrai: "Dans ta vraie chambre, c'est pareil : fenêtre ouverte, la clim se repose et le vent du large entre. Fenêtre fermée, la clim revient !", bravo: "Le vent du large a pris le relais !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi lumière express", defi: "En quittant la chambre, on éteint tout. Défi : toutes les lumières éteintes en 5 secondes, plus vite qu'un paille-en-queue !", vrai: "En quittant ta vraie chambre, fais la course : toutes les lumières éteintes en 5 secondes. Top chrono !", bravo: "Plus rapide qu'un paille-en-queue !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#2a7fb8", icone: "🏊", titre: "Défi serviette voyageuse", defi: "Suspends ta serviette : elle sèche cette nuit, et demain elle t'accompagne à la piscine face à l'océan !", vrai: "Ce soir, fais pareil avec ta vraie serviette : suspends-la pour qu'elle sèche, et demain elle repart avec toi.", bravo: "Serviette prête pour demain !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Bouteille, papier, épluchure : trouve le bon bac du premier coup, et la falaise reste toute belle.", vrai: "Pendant ton séjour, trie pour de vrai : bouteille, papier, épluchure, chacun son bac.", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "bouteille", "nom": "bouteille", "bac": "emb"}, {"obj": "papier", "nom": "papier", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait, champion !" }
          ] },
        bravo: { titre: "Chambre au top !", gainIcone: "🪶", gain: "Plume d'or n°1 : celle de la chambre", gainSous: "5 défis relevés en famille.", perso: "Quelle équipe ! Ta chambre brille comme l'océan au soleil !" },
        savais: { titre: "Le savais-tu ?", texte: "Le Victoria a reçu l'Écolabel européen grâce à sa démarche responsable. Au petit-déjeuner, face à la piscine et à l'océan, on goûte les confitures péi.", src: "exsel.re/hotel/le-victoria" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à choisir avec vous)." },
      { id: "jardin", lieu: "Le jardin face à l'océan", lieuCourt: "Le jardin", titre: "Le jardin de la falaise", resume: "Trouve les intrus du jardin", duree: "3 min", x: 98, y: 214,
        mission: "Le vent a soufflé quelques déchets dans le jardin, au bord de la falaise ! Aide Ti Paille à les mettre au panier, et laisse la nature à sa place.",
        regle: ["Touche un déchet ou glisse-le dans le panier.", "Les branches restent dans le jardin : ce sont des maisons pour les petites bêtes.", "Tous les intrus au panier = la plume d'or du jardin."],
        boutonJeu: "🧺 Je range le jardin !",
        jeu: { type: "plage", titreBarre: "🧺 Les intrus", decor: decorJardin, panier: [290, 384],
          objets: [
            { obj: "bouteille", x: 60, y: 150, dechet: true }, { obj: "canette", x: 214, y: 132, dechet: true }, { obj: "sac", x: 130, y: 250, dechet: true },
            { obj: "emballage", x: 296, y: 196, dechet: true }, { obj: "bouchon", x: 74, y: 380, dechet: true, s: 1.4 }, { obj: "bouchon", x: 236, y: 300, dechet: true, s: 1.4 },
            { obj: "bois", x: 170, y: 196, msg: "Cette branche abrite des petites bêtes du jardin. Elle reste chez elle 🌿" },
            { obj: "bois", x: 150, y: 352, msg: "Ce bois fait partie du jardin : les insectes y ont leur maison. On le laisse !" }
          ],
          msgDebut: "Touche les intrus ou glisse-les dans le panier 🧺",
          msgPris: ["Hop, au panier !", "Bien vu, explorateur !", "Encore un intrus de moins !", "Le jardin te dit merci !", "Plus qu'un ou deux…"],
          msgGagne: "Jardin tout propre ! Le vent de l'océan chante et Ti Paille fait la ronde au-dessus de la falaise !" },
        bravo: { titre: "Jardin rangé !", gainIcone: "🪶", gain: "Plume d'or n°2 : celle du jardin", gainSous: "Le jardin et la falaise brillent de propreté.", perso: "Merci ! Mes copains paille-en-queue vont adorer leur falaise toute propre." },
        savais: { titre: "Le savais-tu ?", texte: "Le paille-en-queue est l'oiseau des falaises de La Réunion. Il fait son nid dans les creux des rochers, au-dessus de l'océan, et se reconnaît à ses deux longues plumes blanches.", src: "" },
        terrain: "dans l'application complète, cette étape se joue dans le jardin, avec un repère à trouver face à l'océan (à organiser avec vous)." },
      { id: "rivage", lieu: "Le restaurant Le Rivage", lieuCourt: "Le Rivage", titre: "Les saveurs péi", resume: "Le jeu des produits d'ici", x: 254, y: 324,
        teaser: "Au Rivage, entre mer et falaise, la cuisine met à l'honneur les produits locaux. Sauras-tu reconnaître les fruits péi ?",
        complet: ["Un jeu des saveurs péi, imaginé avec le chef", "La 3e plume d'or, à table, en famille", "Les parents découvrent les saveurs de la mer de la carte"] },
      { id: "piscine", lieu: "La piscine face à l'océan", lieuCourt: "La piscine", titre: "Le grand plongeon", resume: "L'énigme de l'océan", x: 218, y: 246,
        teaser: "Au bord de la piscine, face à l'océan, une énigme t'attend sur les animaux du Sud Sauvage.",
        complet: ["Une énigme sur les animaux de l'océan et de la falaise", "La 4e plume d'or", "Un défi en famille, chrono en main"] },
      { id: "accueil", lieu: "L'accueil", lieuCourt: "L'accueil", titre: "Le nid des plumes d'or", resume: "Rends les 5 plumes et gagne ta récompense", x: 120, y: 420,
        teaser: "Avec les 5 plumes d'or, Ti Paille termine son nid… et ta famille rejoint les Gardiens de la falaise !",
        complet: ["Le compteur des familles Gardiens de la falaise, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Gardien de la falaise", court: "GARDIEN DE LA FALAISE" },
    victoireTexte: "Ti Paille a retrouvé ses 5 plumes d'or et son nid est tout doux : mission accomplie, Gardien de la falaise ! Voici ta récompense.",
    lot: { titre: "1 dessert offert à l'enfant", lieu: "Au restaurant Le Rivage", detail: "Montre ce bon au Rivage pendant ton séjour, et régale-toi entre mer et falaise !" },
    codePrefixe: "PAILLE",
    compteur: "Ta famille rejoint les Gardiens de la falaise du Victoria (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 plumes d'or dans tout l'hôtel", "Des niveaux 2 et 3 pour les longs séjours", "Une carte souvenir de Gardien de la falaise à garder"],
    projet: {
      pour: "Maquette pour l'Hôtel Le Victoria · Grand Bois, Saint-Pierre",
      sous: "Une aventure sur téléphone pour vos familles. Ti Paille, un petit paille-en-queue de la falaise, fait découvrir l'hôtel, de la chambre au jardin face à l'océan. Personnage, étapes, défis et lots se construisent avec vos équipes.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. au Rivage"], ["🌿", "Un appui pour vos critères Écolabel 3, 16 et 26"], ["📱", "Un QR code suffit, et ça marche même hors ligne"]],
      idee: [
        "Les enfants aident Ti Paille à retrouver les 5 plumes d'or semées dans l'hôtel.",
        "Chaque étape est un mini-jeu : la chambre, le jardin, Le Rivage, la piscine…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer."
      ],
      appli: "Une création à plusieurs mains : ateliers avec vos équipes (accueil, Le Rivage, entretien du jardin), idées de votre personnel, puis un test avec de vraies familles avant le lancement. Tout ce que montre cette maquette est à choisir avec vous.",
      apports: [
        ["👨‍👩‍👧", "Un plus pour vos familles", "Une heure de jeu en autonomie, au rythme de chacun, en écho à votre Suite Famille."],
        ["🍽️", "Vos lieux mis en valeur", "Les lots amènent les familles au Rivage, au bord de la piscine et dans le jardin."],
        ["🌊", "Votre Écolabel, vécu en jeu", "Votre démarche responsable et la nature du Sud Sauvage deviennent des défis que les enfants adorent relever."],
        ["📊", "Des chiffres pour votre bilan", "Familles qui jouent, défis relevés, avis : un tableau de bord simple et anonyme."]
      ],
      label: {
        titre: "Un appui pour votre Écolabel européen",
        intro: "L'aventure informe vos clients de façon active et fait de l'éducation à l'environnement une vraie distraction. Elle aide à documenter :",
        criteres: [
          ["Critère 3", "Information de la clientèle donnée « activement » : économies d'eau, linge et serviettes, déchets, lieux d'intérêt. Le petit avis de fin répond au point b)."],
          ["Critère 26", "Biodiversité locale (a, avec le paille-en-queue et la falaise) et éducation à l'environnement dans les distractions (b) : 2 points optionnels."],
          ["Critère 16", "Réutilisation des serviettes : le défi « serviette voyageuse » de la mission chambre."]
        ],
        note: "Référence : décision (UE) 2017/175. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple (à choisir avec vous) :",
      lots: [["🍨", "1 dessert offert à l'enfant", "au Rivage"], ["🍹", "1 mocktail « Ti Paille » pour l'enfant", "au bar du Rivage"], ["🥐", "Une douceur péi pour toute la famille", "au petit-déjeuner"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou un jour de pluie. Les écogestes deviennent des défis, et chaque défi relevé est une fierté :", defis: ["La goutte d'océan : robinet fermé, on compte jusqu'à 100", "Le vent de la falaise : fenêtre ouverte, clim au repos", "Lumière express : tout éteint en 5 secondes", "La serviette voyageuse, suspendue pour demain", "Le tri du premier coup"] },
      complete: ["5 étapes : la chambre, le jardin, Le Rivage, la piscine, l'accueil (lieux à choisir avec vous)", "Des défis imaginés avec vos équipes, au fil de votre démarche RSE", "Voix de Ti Paille en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une aventure prolongée vers le Sud Sauvage, pour les longs séjours", "Hors connexion, dans le navigateur, en toute discrétion pour les données"],
      stats: [["126", "familles ont terminé l'aventure"], ["43 min", "de jeu en moyenne"], ["86 %", "des défis « chambre » relevés"], ["9,2/10", "note des enfants"]],
      barres: [["Étape chambre", 91], ["Étape jardin", 92], ["Étape Rivage", 72], ["Bons utilisés", 68]]
    }
  };
})();
