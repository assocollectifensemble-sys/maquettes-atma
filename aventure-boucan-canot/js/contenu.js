/* ============================================================
   CONTENU — Hôtel Boucan Canot (Saint-Paul) · « Ti Canot et la mission Clef Verte »
   Faits utilisés (source : 07-hotels-eco-labellises.md, 08-bonnes-pratiques-eco-demarchage.md) :
   - Clef Verte, palmarès 2026 (renouvellement annoncé le 27/01/2026 ; obtention le 28/02/2025).
   - Engagements cités : eau, énergie, déchets, sensibilisation des clients.
   - Sur la plage de Boucan Canot ; La Table du Boucan, espace massage, piscine ; Pôle hôtelier Groupe Macé.
   - Référentiel Clef Verte 2026-2031 : critères 2.3 (impératif), 2.10 (conseillé), 2.6 (avis clients).
   Offre enfants non vérifiée : rien n'est affirmé sur un club enfants. Tout le reste est une PROPOSITION.
   ============================================================ */
window.H = (function () {
  "use strict";
  const C = { c1: "#1f7fc4", c2: "#f2694b", fond: "#0b2f52", fond2: "#164b78", accent: "#ffd166", clair: "#edf6fc" };

  /* ---------- Ti Canot, la petite pirogue rigolote ---------- */
  function perso(pose) {
    const leve = pose === "coucou" || pose === "joie";
    const yeux = pose === "joie"
      ? '<path d="M70 120 q10 -11 20 0 M110 120 q10 -11 20 0" stroke="#3b2412" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
      : '<g class="cligne"><ellipse cx="80" cy="118" rx="10" ry="12" fill="#fff"/><ellipse cx="120" cy="118" rx="10" ry="12" fill="#fff"/><circle cx="82" cy="121" r="6.5" fill="#2a1a0d"/><circle cx="122" cy="121" r="6.5" fill="#2a1a0d"/><circle cx="84.5" cy="117.5" r="2.4" fill="#fff"/><circle cx="124.5" cy="117.5" r="2.4" fill="#fff"/></g>';
    const bouche = pose === "parle"
      ? '<ellipse cx="100" cy="142" rx="9" ry="7" fill="#6b2a1f"/><ellipse cx="100" cy="145" rx="5" ry="2.6" fill="#ff8fa3"/>'
      : '<path d="M86 136 q14 15 28 0z" fill="#6b2a1f" stroke="#6b2a1f" stroke-width="3" stroke-linejoin="round"/><path d="M93 142 q7 4 14 0" fill="#ff8fa3"/>';
    const pagaie = leve
      ? '<g transform="rotate(-28 150 70)"><rect x="146" y="20" width="8" height="96" rx="4" fill="#a0703f"/><ellipse cx="150" cy="22" rx="12" ry="22" fill="#f2694b" stroke="#c94e34" stroke-width="2.5"/></g>'
      : '<g transform="rotate(14 160 100)"><rect x="156" y="52" width="8" height="96" rx="4" fill="#a0703f"/><ellipse cx="160" cy="148" rx="12" ry="22" fill="#f2694b" stroke="#c94e34" stroke-width="2.5"/></g>';
    return '<ellipse cx="100" cy="190" rx="70" ry="7" fill="#000" opacity=".12"/>' +
      // voile triangulaire
      '<path d="M100 18 v70" stroke="#7a5230" stroke-width="5"/><path d="M104 22 q34 26 38 62 h-38z" fill="#fff" stroke="#d7e3ea" stroke-width="2"/><path d="M104 46 h22 M104 64 h32" stroke="#1f7fc4" stroke-width="5"/>' +
      '<path d="M100 18 l16 6 l-16 6z" fill="#f2694b"/>' +
      // coque (le visage)
      '<path d="M20 98 q80 -14 160 0 q-6 64 -80 72 q-74 -8 -80 -72z" fill="#d89a5b" stroke="#9a6334" stroke-width="4"/>' +
      '<path d="M26 112 q74 -10 148 0" stroke="#b97a3e" stroke-width="3" fill="none"/><path d="M40 156 q60 14 120 0" stroke="#b97a3e" stroke-width="3" fill="none"/>' +
      '<path d="M20 98 q80 -14 160 0" stroke="#1f7fc4" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="62" cy="136" rx="8" ry="5" fill="#ff9aa8" opacity=".8"/><ellipse cx="138" cy="136" rx="8" ry="5" fill="#ff9aa8" opacity=".8"/>' +
      yeux + bouche + pagaie +
      '<path d="M10 176 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0" stroke="#5cc0ff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>';
  }

  /* ---------- décor : la plage de Boucan Canot, les rochers, les filaos ---------- */
  const filao = (x, y, h) => '<g transform="translate(' + x + ' ' + y + ')" class="balance"><path d="M0 0 v-' + h + '" stroke="#6b4a2a" stroke-width="5"/>' + [0, 1, 2, 3].map(i => '<path d="M0 -' + (h - i * 14) + ' q-' + (18 - i * 2) + ' 10 -' + (24 - i * 2) + ' 22 M0 -' + (h - i * 14) + ' q' + (18 - i * 2) + ' 10 ' + (24 - i * 2) + ' 22" stroke="#4b7d4f" stroke-width="5" fill="none" stroke-linecap="round"/>').join("") + '</g>';
  const extra = '<path d="M296 252 q20 -30 50 -26 q20 4 24 30 z" fill="#3a3f47"/><path d="M310 246 q14 -10 30 -8" stroke="#555c66" stroke-width="3" fill="none"/>' +
    '<g transform="translate(230 296)"><path d="M-20 0 a20 20 0 0 1 40 0z" fill="#f2694b"/><path d="M-20 0 a20 20 0 0 1 13 -19 L0 0z M7 -19 a20 20 0 0 1 13 19 L0 0z" fill="#fff"/><path d="M0 0 v26" stroke="#7a5230" stroke-width="3"/></g>' +
    '<g transform="translate(60 312)"><rect x="-22" y="-6" width="44" height="10" rx="5" fill="#1f7fc4"/><rect x="-22" y="-6" width="44" height="3" fill="#fff" opacity=".6"/></g>';
  const decor = { ciel: ["#59b8ee", "#d8f0ff"], merC: ["#0f5a95", "#2a9fd0"], mer: "large", sable: "#f3e1b5", sableC2: "#dcc08a", horizon: 118, plage: 236,
    montagne: "M0 126 q20 -40 60 -44 q20 0 34 30 L100 130 H0z", montagneC: "#3b6e4a",
    extraFond: '<path d="M0 216 q12 -24 34 -20 q16 4 18 22z" fill="#3a3f47"/><g class="ressac"><path d="M4 214 q10 -8 20 -2 q10 -8 22 0" stroke="#fff" stroke-width="3" fill="none"/></g>',
    palmiers: [[330, 300, 104, -1]], extra: filao(26, 300, 96) + filao(150, 296, 70) + extra };

  const vue = '<rect width="140" height="120" fill="#9fd8f6"/><rect y="50" width="140" height="70" fill="#2a8fc8"/><path d="M0 62 q20 -5 35 0 t35 0 t35 0 t35 0" stroke="#fff" stroke-width="3" fill="none" class="vague-anim"/><path d="M0 96 q70 -12 140 0 V120 H0z" fill="#f3e1b5"/><path d="M100 96 q12 -16 30 -14 q10 2 10 14z" fill="#3a3f47"/><circle cx="24" cy="20" r="10" fill="#ffd166"/><g transform="translate(60 74) scale(.12)">' + '<path d="M20 98 q80 -14 160 0 q-6 64 -80 72 q-74 -8 -80 -72z" fill="#d89a5b"/><path d="M100 18 v70" stroke="#7a5230" stroke-width="8"/><path d="M104 22 q34 26 38 62 h-38z" fill="#fff"/>' + '</g>';

  /* ---------- la carte (illustrée, non contractuelle) ---------- */
  const carteFond = '<rect width="360" height="440" fill="#b9dfa5"/>' +
    '<path d="M0 0 h360 v150 q-90 -10 -180 6 t-180 -8z" fill="#2a8fc8"/>' +
    [0, 1, 2, 3].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-10 ' + (20 + i * 30) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2" fill="none" opacity=".45"/>').join("") +
    '<path d="M0 148 q90 -10 180 6 t180 -8 v50 q-90 16 -180 0 t-180 4z" fill="#f3e1b5"/><text x="140" y="186" font-size="11" font-weight="800" fill="#a8844a" font-family="system-ui,sans-serif">plage de Boucan Canot</text>' +
    '<path d="M0 150 q14 -26 40 -22 q16 4 18 26z M310 150 q20 -30 50 -26 v32z" fill="#3a3f47"/>' +
    '<path d="M90 330 q50 -40 40 -110 t110 -60 M130 230 q70 30 120 70 M250 300 q-30 40 -70 80" stroke="#f3e2bd" stroke-width="12" fill="none" stroke-linecap="round"/>' +
    // l'hôtel
    '<g transform="translate(26 300)"><rect width="130" height="66" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h142 l-12 -14 h-118z" fill="#1f7fc4"/>' + [0, 1, 2, 3].map(i => '<rect x="' + (12 + i * 30) + '" y="14" width="18" height="16" rx="3" fill="#9fdcf0"/><rect x="' + (12 + i * 30) + '" y="40" width="18" height="16" rx="3" fill="#9fdcf0"/>').join("") + '</g>' +
    // La Table du Boucan
    '<g transform="translate(206 282)"><rect width="88" height="48" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h100 l-12 -14 h-76z" fill="#f2694b"/>' + [0, 1, 2].map(i => '<g transform="translate(' + (18 + i * 26) + ' 28)"><circle r="8" fill="#fff" stroke="#d6c19a" stroke-width="2"/><circle r="4" fill="#ffd166"/></g>').join("") + '</g>' +
    // piscine
    '<g transform="translate(200 214)"><rect width="74" height="34" rx="14" fill="#5cc8f0" stroke="#fff" stroke-width="4"/><path d="M12 16 q8 -5 16 0 t16 0 t16 0" stroke="#fff" stroke-width="2" fill="none" class="reflet"/></g>' +
    // espace massage
    '<g transform="translate(170 392)"><rect width="66" height="36" rx="8" fill="#fff8ea" stroke="#d6c19a" stroke-width="3"/><path d="M-6 0 h78 l-10 -12 h-58z" fill="#8bc49a"/><path d="M33 12 q-8 8 0 16 q8 -8 0 -16z" fill="#8bc49a"/></g>' +
    Art.palmier(340, 240, 46, -1) + Art.palmier(176, 260, 36, 1) + Art.palmier(20, 430, 40, 1) +
    '<g transform="translate(250 90) scale(.3)" class="flotte">' + perso("coucou") + '</g>';

  /* ---------- la plage (jeu « ce qui n'est pas de la plage ») ---------- */
  const decorPlage = '<rect width="360" height="440" fill="#f3e1b5"/><rect width="360" height="92" fill="#2a8fc8"/>' +
    [0, 1].map(i => '<path class="vague-anim" style="animation-delay:-' + i + 's" d="M-10 ' + (26 + i * 30) + ' q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".55"/>').join("") +
    '<path class="ressac" d="M0 92 q45 -10 90 0 t90 0 t90 0 t90 0 V104 H0z" fill="#fff" opacity=".8"/>' +
    '<path d="M300 92 q18 -36 60 -32 V108 q-30 6 -60 -16z" fill="#3a3f47"/>' +
    [[30, 140], [120, 200], [250, 160], [70, 300], [200, 350], [310, 260], [150, 410]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" fill="#d8bf8a"/><circle cx="' + (p[0] + 8) + '" cy="' + (p[1] + 5) + '" r="1.6" fill="#d8bf8a"/>').join("") +
    '<path d="M14 440 q4 -50 18 -80" stroke="#6b4a2a" stroke-width="5" fill="none"/><path d="M32 360 q-18 10 -26 22 M32 360 q18 10 26 22 M30 374 q-16 8 -22 20 M30 374 q16 8 22 20" stroke="#4b7d4f" stroke-width="5" fill="none" stroke-linecap="round"/>';

  return {
    id: "boucan-canot", nom: "Hôtel Boucan Canot", nomCourt: "Boucan Canot", titre: "Ti Canot et la mission Clef Verte",
    couleurs: C, perso, perso_nom: "Ti Canot", decor,
    accroche: "Une aventure en famille, de ta chambre à la plage de Boucan Canot.",
    accueilBulle: "Ohé, moussaillon ! Moi, c'est <b>Ti Canot</b>, la petite pirogue de Boucan Canot. Tu montes à bord pour une mission ?",
    boutonDepart: "🛶 Je monte à bord !",
    infoFamille: "Pour les 5-12 ans et leurs parents · démo : 2 étapes jouables",
    intro: [
      ["parle", "L'hôtel Boucan Canot a une <b>Clef Verte</b> : c'est le prix des hôtels qui chouchoutent l'eau, l'énergie et la plage."],
      ["coucou", "Pour la fêter, j'ai caché <b>5 petites clés vertes</b> : dans ta chambre, sur la plage, à La Table du Boucan…"],
      ["joie", "Retrouve-les avec moi, et une <b>vraie récompense</b> t'attend. Hissez la voile !", "🗺️ Voir la carte"]
    ],
    carteTitre: "La carte de Boucan Canot", carteBulle: "On commence par ta chambre ? Touche l'étape <b>1</b> !",
    gain: { icone: "🔑", nomPluriel: "Les clés vertes" },
    carte: { fond: carteFond },
    etapes: [
      { id: "chambre", lieu: "Ta chambre à Boucan Canot", lieuCourt: "La chambre", titre: "La cabine du capitaine", resume: "Trouve les défis cachés dans ta chambre", duree: "5 min", x: 91, y: 296,
        mission: "Ta chambre est ta cabine de capitaine ! J'y ai caché <b>5 défis</b>. Trouve-les et relève-les avec ton équipage.",
        regle: ["Touche un objet entouré de pointillés.", "Fais le geste avec ton doigt : glisse, appuie, tourne !", "5 défis relevés = la clé verte de la cabine."],
        boutonJeu: "🔎 J'inspecte la cabine !",
        jeu: { type: "chambre", titreBarre: "🔎 Défis trouvés",
          palette: { mur: "#f3f6f8", sol: "#c7a57a", drap: "#8cc3ea", bois: "#8f6a46", accent: "#f2694b" }, vue,
          msgDebut: "Capitaine, cherche les 5 objets qui brillent dans la cabine 👀",
          msgReste: "Encore {n} défi(s) caché(s) !",
          msgGagne: "5 défis sur 5 ! Cabine parée, capitaine. Ti Canot fait des bonds de joie !",
          objets: [
            { obj: "robinet", x: 284, y: 112, icone: "🪥", titre: "Défi du pirate brosseur", defi: "Ce soir, robinet fermé pendant le brossage. En échange, tu as le droit de faire ta plus belle grimace de pirate dans le miroir. Arrr !", vrai: "Ce soir, pour de vrai : robinet fermé pendant le brossage, et ta plus belle grimace de pirate dans le miroir en récompense. Arrr !", bravo: "Dents de pirate, robinet au repos !" },
            { obj: "clim", x: 98, y: 136, s: .85, r: 38, icone: "🌬️", titre: "Défi brise marine", defi: "Fenêtre ouverte ? La clim se repose et la brise de Boucan Canot prend le relais. On ferme la fenêtre, et la clim reprend la barre !", vrai: "Dans ta vraie cabine, c'est pareil : fenêtre ouverte, la clim se repose et la brise prend le relais. Fenêtre fermée, la clim reprend la barre !", bravo: "La brise et la clim font équipe !" },
            { obj: "lampe", x: 177, y: 234, s: .85, r: 34, icone: "💡", titre: "Défi phare éteint", defi: "En quittant la cabine, le capitaine éteint tous les phares (les lumières !) en moins de 5 secondes. Top chrono !", vrai: "En quittant ta vraie cabine, capitaine, fais pareil : tous les phares (les lumières !) éteints en moins de 5 secondes. Top chrono !", bravo: "Mission éclair réussie !" },
            { obj: "serviette", x: 214, y: 370, couleur: "#1f7fc4", icone: "🏴‍☠️", titre: "Défi drapeau du navire", defi: "Suspends ta serviette comme un drapeau de navire : elle sèche, et demain elle repart avec toi à la plage !", vrai: "Ce soir, fais pareil avec ta vraie serviette : hisse-la comme un drapeau de navire pour qu'elle sèche. Ti Canot compte sur toi, moussaillon !", bravo: "Drapeau hissé, serviette prête !" },
            { obj: "tri", x: 112, y: 384, icone: "♻️", titre: "Défi du tri", defi: "Bouteille, papier, épluchure : trouve le bon bac du premier coup, comme un vrai matelot de la Clef Verte.", vrai: "Pendant ton séjour, trie pour de vrai : bouteille, papier, épluchure, chacun son bac, comme un vrai matelot de la Clef Verte.", tri: {"bacs": [{"id": "emb", "nom": "Emballages et papiers", "c": "jaune"}, {"id": "eplu", "nom": "Épluchures", "c": "marron"}], "dechets": [{"obj": "bouteille", "nom": "bouteille", "bac": "emb"}, {"obj": "papier", "nom": "papier", "bac": "emb"}, {"obj": "epluchure", "nom": "épluchure", "bac": "eplu"}]}, bravo: "Tri parfait, moussaillon !" }
          ] },
        bravo: { titre: "Cabine parée !", gainIcone: "🔑", gain: "Clé verte n°1 : la clé de la cabine", gainSous: "5 défis relevés par tout l'équipage.", perso: "Quel équipage ! Ta cabine est la plus Clef Verte du port !" },
        savais: { titre: "Le savais-tu ?", texte: "La Clef Verte récompense les hôtels qui prennent soin de l'eau, de l'énergie et des déchets, et qui en parlent à leurs clients. L'hôtel Boucan Canot fait partie du palmarès 2026.", src: "Palmarès Clef Verte 2026 (laclefverte.org)" },
        terrain: "dans la vraie chambre, une petite carte ou un QR code lance la mission, par exemple le soir ou un jour de pluie (version chambre, à définir avec vous)." },
      { id: "plage", lieu: "La plage de Boucan Canot", lieuCourt: "La plage", titre: "Les trésors de la plage", resume: "Ramasse ce qui n'est pas de la plage", duree: "3 min", x: 160, y: 168,
        mission: "Sur la plage, des <b>intrus</b> se sont glissés parmi les trésors. Mets-les dans le panier… mais laisse les vrais habitants de la plage à leur place !",
        regle: ["Touche un intrus, ou fais-le glisser dans le panier.", "Les crabes et les coquillages sont chez eux : on les laisse.", "Tous les intrus ramassés = la clé verte de la plage."],
        boutonJeu: "🧺 À la chasse aux intrus !",
        jeu: { type: "plage", titreBarre: "🧺 Les intrus", decor: decorPlage, panier: [290, 384],
          objets: [
            { obj: "bouteille", x: 60, y: 150, dechet: true }, { obj: "canette", x: 214, y: 132, dechet: true }, { obj: "sac", x: 130, y: 250, dechet: true },
            { obj: "emballage", x: 296, y: 196, dechet: true }, { obj: "bouchon", x: 74, y: 380, dechet: true, s: 1.4 }, { obj: "bouchon", x: 236, y: 300, dechet: true, s: 1.4 },
            { obj: "crabe", x: 180, y: 200, msg: "Coucou ! C'est Monsieur Crabe, il est chez lui. On le laisse se promener 🦀" },
            { obj: "coquillage", x: 46, y: 262, msg: "Ce coquillage est la future maison d'un bernard-l'ermite. Il reste sur la plage 🐚" },
            { obj: "bois", x: 150, y: 352, msg: "Le bois flotté fait partie du décor : il abrite des petites bêtes. On le laisse !" },
            { obj: "chateau", x: 310, y: 130, s: 1, msg: "Un château de sable ! Joli travail, il peut rester 🏰" }
          ],
          msgDebut: "Touche les intrus ou glisse-les dans le panier 🧺",
          msgPris: ["Hop, au panier !", "Bien vu, capitaine !", "Encore un intrus de moins !", "La plage te dit merci !", "Plus qu'un ou deux…"],
          msgGagne: "Plage parée ! Les crabes font la fête et Ti Canot hisse la voile !" },
        bravo: { titre: "Plage au top !", gainIcone: "🔑", gain: "Clé verte n°2 : la clé de la plage", gainSous: "Tous les intrus sont au panier, les habitants sont chez eux.", perso: "Les crabes de Boucan Canot t'applaudissent avec leurs pinces !" },
        savais: { titre: "Le savais-tu ?", texte: "Un bouchon en plastique peut voyager très loin sur l'océan. Un coquillage, lui, sert de maison aux bernard-l'ermite : la plage en a besoin !", src: "" },
        terrain: "dans l'application complète, cette étape se joue sur la plage, avec un vrai panier à rapporter à l'accueil, par exemple (à organiser avec vous)." },
      { id: "table", lieu: "La Table du Boucan", lieuCourt: "La Table", titre: "Le menu du capitaine", resume: "Le grand jeu des saveurs", x: 250, y: 306,
        teaser: "À La Table du Boucan, le capitaine compose son menu… avec des produits d'ici ?",
        complet: ["Un jeu des saveurs (à imaginer avec le chef)", "La 3e clé verte, à table, en famille", "Les parents découvrent la carte de La Table du Boucan"] },
      { id: "piscine", lieu: "La piscine", lieuCourt: "La piscine", titre: "Le grand plouf", resume: "Le jeu des gouttes d'eau", x: 237, y: 231,
        teaser: "Plouf ! Au bord de la piscine, une énigme t'attend sur le voyage de l'eau.",
        complet: ["Une énigme sur l'eau, à résoudre au bord de la piscine", "La 4e clé verte", "Un défi en famille, chrono en main"] },
      { id: "accueil", lieu: "L'accueil", lieuCourt: "L'accueil", titre: "Le trésor de la Clef Verte", resume: "Rends les 5 clés et gagne ta récompense", x: 204, y: 410,
        teaser: "Avec les 5 clés vertes, on ouvre le coffre du capitaine… et ta famille rejoint l'équipage Clef Verte !",
        complet: ["Le compteur des familles de l'équipage, affiché à l'accueil", "Le badge remis par l'équipe (autocollant ou bracelet, au choix)", "Le bon gagné, à utiliser pendant le séjour"] }
    ],
    badge: { titre: "Capitaine Clef Verte", court: "CAPITAINE CLEF VERTE" },
    victoireTexte: "Ti Canot a retrouvé ses clés vertes : la mission est accomplie, capitaine ! Voici ta récompense.",
    lot: { titre: "1 dessert offert à l'enfant", lieu: "À La Table du Boucan", detail: "Montre ce bon à La Table du Boucan pendant ton séjour. À l'abordage du dessert !" },
    codePrefixe: "CANOT",
    compteur: "Ta famille rejoint l'équipage Clef Verte de Boucan Canot (compteur affiché à l'accueil, par exemple).",
    victoireSuite: ["5 clés vertes dans tout l'hôtel", "Des niveaux 2 et 3 pour les longs séjours", "Une carte souvenir de capitaine à garder"],
    projet: {
      pour: "Maquette pour l'hôtel Boucan Canot · Saint-Paul",
      sous: "Une aventure sur téléphone pour les familles. Ti Canot, une petite pirogue, fait découvrir l'hôtel, de la chambre à la plage de Boucan Canot.",
      puces: [["🎁", "Un lot gagné à coup sûr, par ex. à La Table du Boucan"], ["🌿", "Un appui pour vos critères Clef Verte 2.3 et 2.10"], ["📱", "Rien à installer, ça marche même hors ligne"]],
      idee: [
        "Les enfants aident Ti Canot à retrouver les 5 clés vertes cachées dans l'hôtel.",
        "Chaque étape est un mini-jeu : la chambre, la plage, La Table du Boucan…",
        "À la fin, chaque famille gagne à coup sûr : un badge, et un vrai lot à montrer."
      ],
      apports: [
        ["👨‍👩‍👧", "Une animation pour vos familles", "Une heure de jeu en autonomie, au rythme de chacun, sans personnel en plus."],
        ["🍽️", "Vos lieux mis en valeur", "Les lots amènent les familles à La Table du Boucan ou à l'espace massage."],
        ["🔑", "Votre Clef Verte, vécue en jeu", "Eau, énergie, déchets : vos engagements deviennent des défis que les enfants adorent relever."],
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
      lotsIntro: "Chaque famille qui termine gagne un lot. Il fait découvrir un de vos lieux, par exemple :",
      lots: [["🍨", "1 dessert offert à l'enfant", "à La Table du Boucan"], ["🍹", "1 mocktail « Ti Canot » offert", "au moment de votre choix"], ["💆", "-10 % sur un massage pour les parents", "à l'espace massage"]],
      chambre: { texte: "Une mini-aventure se joue aussi dans la chambre, le soir ou un jour de pluie. Les écogestes deviennent des défis, jamais des consignes :", defis: ["Le pirate brosseur : robinet fermé, grimace autorisée", "La brise marine : fenêtre ouverte, clim au repos", "Le phare éteint en 5 secondes", "La serviette « drapeau du navire », suspendue pour demain", "Le tri du premier coup"] },
      complete: ["5 étapes : la chambre, la plage, La Table du Boucan, la piscine, l'accueil (lieux à choisir avec vous)", "Voix de Ti Canot en français, créole et anglais (option)", "Un repère à trouver sur place à chaque étape (panneau ou QR code)", "Une nouvelle aventure par saison : vos activités du critère 2.10", "Adaptable ensuite aux Créoles, du même groupe", "Hors connexion, sans téléchargement, sans compte, sans donnée personnelle"],
      stats: [["167", "familles ont terminé l'aventure"], ["45 min", "de jeu en moyenne"], ["84 %", "des défis « chambre » relevés"], ["9,0/10", "note des enfants"]],
      barres: [["Étape chambre", 93], ["Étape plage", 90], ["Étape Table", 76], ["Bons utilisés", 70]]
    }
  };
})();
