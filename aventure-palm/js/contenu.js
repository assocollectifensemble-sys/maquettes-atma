/* ============================================================
   CONTENU — PALM Hotel & Spa (Petite-Île, Grande Anse) · « Le voyage de Goutte »
   Faits utilisés (source : 07-hotels-eco-labellises.md) :
   - Écolabel européen FR/051/010 (base ADEME 11/2026), le premier de l'île depuis 2014 ; « renouvelé pour la 3e fois en 2021 » (blog).
   - Eaux de pluie récupérées pour le potager, réducteurs de débit (palm.re/blog/environnement/hotel-reunion-certifie-ecolabel-europeen/).
   - Adhésion à l'association Badula (flore indigène), annoncée le 05/08/2026.
   - Le Makassar, Le Kah Beach, Akea Spa ; offre famille : mini club pendant les vacances scolaires, salle de jeux, menu enfant.
   - Plage de Grande Anse (pas de lagon).
   Tout le reste est une PROPOSITION (lieux, lots, défis) à choisir avec l'hôtel.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#2e9d6a", c2: "#f08a3c", fond: "#103a33", fond2: "#1d5a4a", accent: "#ffd166", clair: "#eef8ee" };

  /* ---------- Goutte, la petite goutte de pluie voyageuse ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M74 104 q10 -11 20 0 M106 104 q10 -11 20 0" stroke="#123c5c" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="84" cy="102" rx="10" ry="13" fill="#fff"/><ellipse cx="116" cy="102" rx="10" ry="13" fill="#fff"/><circle cx="86" cy="105" r="6.5" fill="#123c5c"/><circle cx="118" cy="105" r="6.5" fill="#123c5c"/><circle cx="88.5" cy="101.5" r="2.4" fill="#fff"/><circle cx="120.5" cy="101.5" r="2.4" fill="#fff"/></g>';
    const bouche = pose === "parle"
      ? '<ellipse cx="100" cy="128" rx="9" ry="7" fill="#0f3b66"/><ellipse cx="100" cy="131" rx="5" ry="2.6" fill="#ff8fa3"/>'
      : '<path d="M86 122 q14 15 28 0z" fill="#0f3b66" stroke="#0f3b66" stroke-width="3" stroke-linejoin="round"/><path d="M93 128 q7 4 14 0" fill="#ff8fa3"/>';
    const brasD = leve ? '<path d="M148 120 q20 -14 22 -38" stroke="#2f8fd8" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="170" cy="80" r="9" fill="#5cc0ff" stroke="#2f8fd8" stroke-width="3"/>'
      : '<path d="M150 130 q16 8 24 22" stroke="#2f8fd8" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="175" cy="154" r="9" fill="#5cc0ff" stroke="#2f8fd8" stroke-width="3"/>';
    const brasG = pose === "joie" ? '<path d="M52 120 q-20 -14 -22 -38" stroke="#2f8fd8" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="30" cy="80" r="9" fill="#5cc0ff" stroke="#2f8fd8" stroke-width="3"/>'
      : '<path d="M50 130 q-16 8 -24 22" stroke="#2f8fd8" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="25" cy="154" r="9" fill="#5cc0ff" stroke="#2f8fd8" stroke-width="3"/>';
    return '<ellipse cx="100" cy="192" rx="44" ry="6" fill="#000" opacity=".12"/>' +
      '<ellipse cx="80" cy="184" rx="13" ry="7" fill="#2f8fd8"/><ellipse cx="120" cy="184" rx="13" ry="7" fill="#2f8fd8"/>' +
      brasG + brasD +
      '<path d="M100 14 C 118 52 156 86 156 124 a56 56 0 0 1 -112 0 C 44 86 82 52 100 14z" fill="#5cc0ff" stroke="#2f8fd8" stroke-width="4"/>' +
      '<path d="M78 60 q-14 22 -16 46" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/><circle cx="66" cy="120" r="4" fill="#fff" opacity=".6"/>' +
      '<ellipse cx="70" cy="122" rx="8" ry="5" fill="#ff9aa8" opacity=".75"/><ellipse cx="130" cy="122" rx="8" ry="5" fill="#ff9aa8" opacity=".75"/>' +
      yeux + bouche +
      // petite feuille sur la tête (le potager)
      '<g transform="translate(104 18) rotate(20)"><path d="M0 0 q14 -18 32 -10 q-12 18 -32 10z" fill="#5cbf5f" stroke="#2e8b3f" stroke-width="2"/><path d="M2 -1 q12 -6 24 -8" stroke="#2e8b3f" stroke-width="1.5" fill="none"/></g>';
  }

  /* ---------- décor : Grande Anse, falaises vertes, la houle du sud ---------- */
  const extra = '<g transform="translate(250 286)">' +
    '<rect x="-4" y="-34" width="76" height="40" rx="6" fill="#fff8ea" stroke="#d6c19a" stroke-width="2"/><path d="M-10 -32 l44 -22 l44 22z" fill="#c8553d"/><path d="M-12 -30 h92" stroke="#7f97a5" stroke-width="4"/>' +
    '<path d="M76 -30 v34" stroke="#7f97a5" stroke-width="4"/><rect x="66" y="0" width="22" height="26" rx="4" fill="#5c8fa8"/><path d="M68 6 h18" stroke="#3aa7ff" stroke-width="4"/>' +
    '<rect x="8" y="-24" width="14" height="12" rx="2" fill="#9fdcf0"/><rect x="40" y="-24" width="14" height="12" rx="2" fill="#9fdcf0"/></g>' +
    '<g transform="translate(40 318)">' + [0, 1, 2, 3, 4].map(i => '<g transform="translate(' + i * 16 + ' 0)"><path d="M0 0 v-10" stroke="#3e8e41" stroke-width="3"/><ellipse cx="-4" cy="-12" rx="6" ry="3.5" fill="#5cbf5f"/><ellipse cx="4" cy="-14" rx="6" ry="3.5" fill="#5cbf5f"/>' + (i % 2 ? '<circle cx="0" cy="-6" r="3.5" fill="#ff5a4e"/>' : "") + '</g>').join("") + '<rect x="-10" y="0" width="84" height="8" rx="3" fill="#8a5a2b"/></g>';
  const decor = { ciel: ["#86d0ef", "#e6f7ff"], merC: ["#14608f", "#2c93b8"], mer: "large", sable: "#e9d3a6", sableC2: "#cfb27c", horizon: 132, plage: 244,
    montagne: "M0 150 q30 -60 80 -50 q20 4 40 30 q16 20 30 22 L150 160 H0z M250 150 q30 -40 70 -46 q30 0 40 20 V160 H240z", montagneC: "#3f8a55",
    extraFond: '<g class="pluie" stroke="#9fd4ff" stroke-width="2" stroke-linecap="round" opacity=".55"><line x1="20" y1="20" x2="16" y2="32"/><line x1="60" y1="8" x2="56" y2="20"/><line x1="100" y1="26" x2="96" y2="38"/></g>',
    palmiers: [[18, 304, 110, 1], [218, 300, 90, -1]], extra, soleilX: 300 };

  const vue = '<rect width="140" height="120" fill="#a7dcf6"/><path d="M0 58 q30 -30 70 -20 q30 8 70 -8 V70 H0z" fill="#3f8a55"/><rect y="62" width="140" height="58" fill="#2a86b0"/><path d="M0 74 q20 -5 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="3" fill="none" class="vague-anim"/><path d="M0 98 q70 -10 140 0 V120 H0z" fill="#e9d3a6"/><circle cx="20" cy="18" r="9" fill="#ffd166"/>';

  /* ---------- la carte du PALM (illustrée, non contractuelle) ---------- */
  const carteFond = '<rect width="360" height="440" fill="#bfe3a8"/>' +
    '<path d="M0 0 h360 v120 q-90 -16 -180 4 t-180 -6z" fill="#2c8fb8"/>' +
    [0, 1, 2].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-10 ' + (24 + i * 28) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>').join("") +
    '<path d="M0 118 q90 -16 180 4 t180 -6 v40 q-90 18 -180 0 t-180 4z" fill="#ead6a8"/><text x="20" y="152" font-size="11" font-weight="800" fill="#a8844a" font-family="system-ui,sans-serif">plage de Grande Anse</text>' +
    '<path d="M70 360 q40 -60 30 -120 t110 -100 M100 240 q90 10 160 70 M260 310 q-40 50 -60 90" stroke="#f3e2bd" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    // bâtiment principal (toits) à gauche-bas
    '<g transform="translate(20 330)"><rect width="110" height="62" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-8 2 l63 -30 l63 30z" fill="#c8553d"/><path d="M-10 4 h130" stroke="#7f97a5" stroke-width="4"/>' + [0, 1, 2].map(i => '<rect x="' + (14 + i * 32) + '" y="18" width="18" height="16" rx="3" fill="#9fdcf0"/>').join("") + '<rect x="118" y="20" width="14" height="40" rx="3" fill="#5c8fa8"/></g>' +
    // potager
    '<g transform="translate(206 270)"><rect width="100" height="64" rx="8" fill="#8a5a2b"/>' + [0, 1, 2].map(r => [0, 1, 2, 3, 4].map(c => '<g transform="translate(' + (12 + c * 19) + ' ' + (16 + r * 18) + ')"><ellipse cx="-3" cy="0" rx="5" ry="3" fill="#6fd06a"/><ellipse cx="3" cy="-2" rx="5" ry="3" fill="#5cbf5f"/>' + ((r + c) % 3 === 0 ? '<circle cx="0" cy="3" r="3" fill="#ff5a4e"/>' : "") + '</g>').join("")).join("") + '</g>' +
    // jardin indigène
    '<g transform="translate(60 205)">' + [0, 1, 2, 3].map(i => '<g transform="translate(' + i * 26 + ' ' + (i % 2) * 8 + ')"><circle r="14" fill="#2e8b57"/><circle cx="6" cy="-6" r="9" fill="#3fa36a"/><circle cx="-4" cy="2" r="3" fill="#f7c948"/></g>').join("") + '</g>' +
    // Kah Beach (paillote)
    '<g transform="translate(250 160)"><path d="M-34 6 l34 -22 l34 22z" fill="#c9a36a"/><rect x="-28" y="6" width="56" height="18" fill="#8a6440"/><rect x="-22" y="10" width="44" height="8" fill="#ffd9a0"/></g>' +
    Art.palmier(340, 210, 46, -1) + Art.palmier(186, 216, 40, 1) + Art.palmier(340, 420, 44, -1) +
    '<g transform="translate(300 360) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  /* ---------- le jeu des tuyaux : du toit au potager ---------- */
  const decorHaut = '<path d="M20 50 l60 -34 l60 34z" fill="#c8553d"/><path d="M14 52 h132" stroke="#7f97a5" stroke-width="6" stroke-linecap="round"/>' +
    '<g class="pluie" stroke="#5cc0ff" stroke-width="2.4" stroke-linecap="round"><line x1="40" y1="0" x2="37" y2="12"/><line x1="76" y1="4" x2="73" y2="16"/><line x1="110" y1="0" x2="107" y2="12"/><line x1="160" y1="6" x2="157" y2="18"/><line x1="200" y1="0" x2="197" y2="12"/><line x1="240" y1="8" x2="237" y2="20"/><line x1="290" y1="2" x2="287" y2="14"/><line x1="330" y1="6" x2="327" y2="18"/></g>' +
    '<rect x="64" y="52" width="16" height="44" fill="#9fb4c0"/><path d="M64 92 h16 v12 h-16z" fill="#7f97a5"/>' +
    '<text x="160" y="44" font-size="13" font-weight="900" fill="#2e6b4f" font-family="system-ui,sans-serif">Le toit récolte la pluie…</text>' +
    '<g transform="translate(300 60) scale(.24)">' + perso("parle") + '</g>';
  const decorBas = '<rect x="0" y="400" width="360" height="40" fill="#8a5a2b"/><text x="12" y="425" font-size="13" font-weight="900" fill="#ffe9c4" font-family="system-ui,sans-serif">…le potager a soif !</text>' +
    '<path id="sortie" d="M288 392 v10" stroke="#3aa7ff" stroke-width="16" opacity="0" style="transition:opacity .4s"/>' +
    [214, 244, 274, 304, 334].map((x, i) => '<g transform="translate(' + x + ' 410)"><g class="plante"><path d="M0 0 v-18" stroke="#3e8e41" stroke-width="3"/><ellipse cx="-6" cy="-18" rx="8" ry="4.5" fill="#5cbf5f"/><ellipse cx="6" cy="-22" rx="8" ry="4.5" fill="#6fd06a"/>' + (i % 2 ? '<circle cx="0" cy="-10" r="5" fill="#ff5a4e"/>' : '<circle cx="0" cy="-28" r="4" fill="#ffd166"/>') + '</g></g>').join("");

  return {
    id: "palm", nom: "PALM Hotel & Spa", nomCourt: "PALM Hotel & Spa", titre: "Le voyage de Goutte",
    couleurs: C, perso, perso_nom: "Goutte", decor,
    accroche: "Une aventure en famille, du toit du PALM jusqu'à la plage de Grande Anse.",
    accueilBulle: "Salut ! Je suis <b>Goutte</b>, une goutte de pluie voyageuse. Au PALM, chaque goutte a une mission. Tu m'aides à trouver la mienne ?",
    boutonDepart: "💧 Je pars avec Goutte !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "Hier soir, il a plu sur Petite-Île. Je suis tombée sur le toit du PALM… plic !"],
      ["coucou", "Ici, la pluie ne se perd pas : elle est récoltée pour arroser le <b>potager</b>. Mais moi, je me suis égarée dans les tuyaux !"],
      ["joie", "Guide-moi d'un lieu à l'autre et gagne les <b>gouttes d'or</b>. À la fin, une vraie récompense t'attend !", "🗺️ Voir la carte du PALM"]
    ],
    carteTitre: "La carte du PALM", carteBulle: "Première mission : le chemin de l'eau. Touche l'étape <b>1</b> !",
    gain: { icone: "💧", nomPluriel: "Les gouttes d'or" },
    carte: { fond: carteFond },
    etapes: [
      { id: "potager", lieu: "Des toits au potager", lieuCourt: "Le potager", titre: "Le chemin de l'eau", resume: "Guide l'eau de pluie jusqu'au potager", duree: "3 min", x: 256, y: 302,
        mission: "La pluie tombe sur le toit. Fais tourner les tuyaux pour qu'elle coule jusqu'au <b>potager</b>. Les tomates comptent sur toi !",
        regle: ["Touche un tuyau pour le faire tourner.", "L'eau devient bleue quand elle passe.", "Relie le toit (en haut) au potager (en bas à droite)."],
        boutonJeu: "🔧 Je fais couler l'eau !",
        jeu: { type: "tuyaux", titreBarre: "💧 Le chemin de l'eau", coupsMini: 7, decorHaut, decorBas,
          // [forme, rotation solution, rotation de départ, sur le chemin]
          tuiles: [["L", 0, 3, 1], ["L", 2, 1, 1], ["T", 0, 1], ["I", 0, 1],
                   ["L", 0, 2], ["L", 0, 3, 1], ["I", 1, 0, 1], ["L", 2, 1, 1],
                   ["T", 0, 2], ["I", 0, 0], ["L", 0, 1], ["I", 0, 1, 1],
                   ["I", 0, 1], ["T", 0, 3], ["L", 0, 0], ["I", 0, 1, 1]],
          msgDebut: "Touche un tuyau gris pour le tourner. L'eau part du toit (en haut à gauche) et file vers la flèche jaune 💧",
          msgAide: "Astuce de Goutte : l'eau sort en haut à gauche et descend vers le coin en bas à droite.",
          msgGagne: "Plouf ! L'eau de pluie arrive au potager. Regarde, tout pousse !" },
        bravo: { titre: "Le potager est arrosé !", gainIcone: "💧", gain: "Goutte d'or n°1 : la goutte du potager", gainSous: "Grâce à toi, la pluie fait pousser les légumes.", perso: "Ouah ! Roi ou reine des tuyaux : c'est toi, sans hésiter !" },
        savais: { titre: "Le savais-tu ?", texte: "Au PALM, l'eau de pluie est récupérée pour arroser le potager. Et les robinets ont des réducteurs de débit : on se lave aussi bien, avec moins d'eau.", src: "palm.re, article « Écolabel européen »" },
        terrain: "dans l'application complète, la famille trouve ce repère près du potager (emplacement à choisir avec vous) et peut y découvrir ce qui pousse en ce moment." },
      { id: "chambre", lieu: "Ta suite au PALM", lieuCourt: "La chambre", titre: "Les 5 défis de Goutte", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 76, y: 378,
        mission: "Goutte s'est cachée dans ta chambre… avec <b>5 défis</b> ! Trouve-les et relève-les en famille.",
        regle: ["Touche un objet entouré de pointillés.", "Lis le défi… et accepte-le !", "5 défis acceptés = la goutte de la chambre."],
        boutonJeu: "🔎 Je cherche Goutte !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f6f1e6", sol: "#c9a77c", drap: "#9ed3a6", bois: "#9a7450", accent: "#f2b26b" }, vue,
          msgDebut: "Cherche les 5 objets qui brillent dans la chambre 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 sur 5 ! Goutte saute de joie : plic, ploc, plic !",
          objets: [
            { obj: "douche", x: 254, y: 106, s: .85, r: 34, icone: "🚿", titre: "Défi douche chanson", defi: "La douche du PALM a un réducteur de débit : elle mousse aussi bien ! Défi : une douche le temps d'une chanson. Laquelle choisis-tu ?", bravo: "Douche en chanson : bravo, la star !" },
            { obj: "robinet", x: 318, y: 132, s: .8, r: 32, icone: "🪥", titre: "Défi brosse à dents", defi: "Robinet fermé pendant le brossage, et on compte jusqu'à 100 avec Goutte. Qui arrive au bout sans rire ?", bravo: "Dents qui brillent, robinet qui dort !" },
            { obj: "clim", x: 98, y: 136, s: .85, r: 38, icone: "🌬️", titre: "Défi vent du large", defi: "Fenêtre ouverte ? La clim fait une pause et laisse entrer le vent de Grande Anse. Ferme la fenêtre et elle repart !", bravo: "Vent du large : 1, clim : au repos !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#2e9d6a", icone: "🧺", titre: "Défi serviette voyageuse", defi: "Suspends ta serviette pour qu'elle sèche au soleil. Demain, elle repart avec toi à la plage !", bravo: "Serviette prête pour l'aventure !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Emballage, papier, épluchure : trouve le bon bac du premier coup. Les épluchures, elles, rêvent du potager !", bravo: "Tri parfait ! Les épluchures font la fête au potager !" }
          ] },
        bravo: { titre: "La chambre est au top !", gainIcone: "💧", gain: "Goutte d'or n°2 : la goutte de la chambre", gainSous: "5 défis acceptés en famille.", perso: "Grâce à toi, chaque goutte de la chambre a trouvé sa mission !" },
        savais: { titre: "Le savais-tu ?", texte: "Le PALM est le premier hôtel de l'île à avoir reçu l'Écolabel européen, en 2014. Et il le garde depuis !", src: "palm.re ; base Écolabel ADEME (licence FR/051/010)" },
        terrain: "dans la vraie suite, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à définir avec vous)." },
      { id: "badula", lieu: "Le jardin des plantes de l'île", lieuCourt: "Le jardin", titre: "Les plantes péï", resume: "Retrouve les plantes indigènes", x: 100, y: 212,
        teaser: "Dans le jardin poussent des plantes qui n'existent qu'ici… Sauras-tu les reconnaître ?",
        complet: ["Un jeu d'observation des plantes indigènes (en lien avec Badula, à valider ensemble)", "La 3e goutte d'or", "Une carte à collectionner par plante"] },
      { id: "makassar", lieu: "Le Makassar", lieuCourt: "Le Makassar", titre: "Le goût du potager", resume: "Devine ce qui vient du potager", x: 176, y: 258,
        teaser: "Au Makassar, certaines saveurs ont fait un détour par le potager… lesquelles ?",
        complet: ["Un jeu des saveurs avec l'équipe du restaurant (à imaginer avec le chef)", "La 4e goutte d'or", "Les parents découvrent la carte du Makassar"] },
      { id: "kahbeach", lieu: "Le Kah Beach", lieuCourt: "Le Kah Beach", titre: "Retour à l'océan", resume: "Goutte rejoint la mer à Grande Anse", x: 250, y: 160,
        teaser: "Mon voyage finit face à Grande Anse. Viens me dire au revoir… et récupérer ta récompense !",
        complet: ["Le grand final face à l'océan", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Gardien·ne de la pluie", court: "GARDIEN DE LA PLUIE" },
    victoireTexte: "Goutte a trouvé sa mission : faire pousser le potager du PALM ! Voici ta récompense.",
    lot: { titre: "1 mocktail « Goutte » offert à l'enfant", lieu: "Au Kah Beach, face à Grande Anse", detail: "Montre ce bon au Kah Beach pendant ton séjour : Goutte t'y attend !" },
    codePrefixe: "GOUTTE",
    compteur: "Ta famille rejoint les familles gardiennes de la pluie (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 gouttes d'or dans tout le PALM", "Une version pour le mini club des vacances scolaires", "Une carte souvenir du potager à garder"],
    projet: {
      pour: "Maquette pour PALM Hotel & Spa · Petite-Île",
      sous: "Une aventure sur téléphone pour vos familles. Goutte, une goutte de pluie, fait découvrir le PALM, du toit au potager, de la suite à la plage.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. au Kah Beach"], ["🌿", "Un appui pour vos critères Écolabel 3 et 26"], ["📱", "Rien à installer, ça marche même hors ligne"]],
      idee: [
        "Les enfants suivent Goutte, une goutte de pluie, dans son voyage à travers le PALM.",
        "Chaque étape est un mini-jeu : les tuyaux du potager, la suite, le jardin, le Kah Beach…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer."
      ],
      apports: [
        ["👨‍👩‍👧", "Un plus pour votre offre famille", "Elle complète le mini club et la salle de jeux, toute l'année, au rythme de chaque famille."],
        ["🍹", "Vos lieux mis en valeur", "Les lots amènent les familles au Kah Beach, au Makassar ou à Akea Spa."],
        ["🌱", "Vos engagements, vécus en jeu", "L'eau de pluie du potager, les réducteurs de débit, les plantes indigènes avec Badula : les enfants les découvrent en jouant."],
        ["📊", "Des chiffres pour votre bilan", "Familles qui jouent, défis relevés, avis : un tableau de bord simple et anonyme."]
      ],
      label: {
        titre: "Un appui pour votre Écolabel européen",
        intro: "L'aventure informe vos clients de façon active et fait de l'éducation à l'environnement une vraie distraction. Elle aide à documenter :",
        criteres: [
          ["Critère 3", "Information de la clientèle donnée « activement » : économies d'eau, linge et serviettes, déchets, lieux d'intérêt. Le petit avis de fin répond au point b)."],
          ["Critère 26", "Biodiversité locale (a, avec vos plantes indigènes) et éducation à l'environnement dans les distractions (b) : 2 points optionnels."],
          ["Critère 16", "Réutilisation des serviettes : le défi « serviette voyageuse » de la mission chambre."]
        ],
        note: "Référence : décision (UE) 2017/175. L'appli aide à documenter ces critères ; la validation reste celle de l'auditeur."
      },
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple :",
      lots: [["🍹", "1 mocktail « Goutte » pour l'enfant", "au Kah Beach"], ["🍽️", "1 dessert offert avec le menu enfant", "au Makassar"], ["💆", "-10 % sur un soin pour les parents", "à Akea Spa"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la suite, le soir ou un jour de pluie. Les écogestes deviennent des défis, jamais des consignes :", defis: ["La douche le temps d'une chanson", "Brosse à dents : on compte jusqu'à 100, robinet fermé", "Le « vent du large » : fenêtre ouverte, clim au repos", "La serviette voyageuse, suspendue pour demain", "Le tri du premier coup"] },
      complete: ["5 étapes : le potager, la suite, le jardin, le Makassar, le Kah Beach (lieux à choisir avec vous)", "Une version spéciale pour le mini club des vacances scolaires", "Voix de Goutte en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une nouvelle aventure par saison, pour les familles qui reviennent", "Hors connexion, sans téléchargement, sans compte, sans donnée personnelle"],
      stats: [["184", "familles ont terminé l'aventure"], ["52 min", "de jeu en moyenne"], ["88 %", "des défis « chambre » acceptés"], ["9,2/10", "note des enfants"]],
      barres: [["Étape potager", 95], ["Étape chambre", 88], ["Étape jardin", 74], ["Bons utilisés", 69]]
    }
  };
})();
