/* ============================================================
   CONTENT.JS — Tous les textes du prototype « Enquête au bord du lagon ».
   Faits sur les bons gestes : « Guide des écogestes » de la Réserve naturelle marine
   de La Réunion (R1, voir SOURCES.md). Zouzou est un personnage FICTIF.
   ============================================================ */
(function () {
  "use strict";
  const CONFIG = { versionComplete: false };

  const projet = {
    kicker: "Prototype · à co-écrire avec la Réserve naturelle marine",
    titre: "Enquête au bord du lagon",
    idee: "Zouzou, une petite zourite, ne retrouve plus sa maison dans le récif. Les familles et les classes mènent l'enquête sur la plage, sans entrer dans l'eau, et découvrent les bons gestes qui protègent les coraux.",
    cartes: [
      { ico: "📱", t: "Un QR code, c'est parti", d: "Un QR code sur place ouvre l'aventure : pas de compte, pas de téléchargement." },
      { ico: "🏖️", t: "Jouable depuis la plage", d: "Des énigmes et des mini-jeux tactiles, étape après étape, sans entrer dans l'eau." },
      { ico: "📶", t: "Sans connexion", d: "Une fois ouverte, l'aventure se rejoue hors réseau, même sur la plage." },
      { ico: "📖", t: "Vos contenus, vos mots", d: "Les messages viennent de vos documents (guide des écogestes…) et sont relus par vos équipes." },
      { ico: "🎭", t: "Version animée en personnage", d: "Pour un événement, Jonathan peut jouer l'aventure en direct, en costume." },
      { ico: "🌐", t: "Français, kréol, anglais", d: "Prévus dans la version complète, avec voix enregistrées." }
    ],
    mention: "Zouzou est un personnage inventé pour l'histoire. Les contenus sont issus du guide des écogestes de la Réserve et restent à relire par ses équipes."
  };

  const intro = [
    { qui: "zouzou", expr: "triste", t: "Psst… par ici ! Je suis Zouzou la zourite. Mon trou dans le récif est tout abîmé, et je ne sais pas qui a fait ça. Tu veux bien m'aider à trouver ?" },
    { qui: "zouzou", expr: "clin", t: "Il y a des indices partout sur la plage. Pour chaque indice, scanne le QR code… ou touche « Je suis à l'étape ». À la fin, on saura qui a abîmé ma maison !" }
  ];

  // lieu : nom GÉNÉRIQUE (à choisir avec la Réserve selon le site retenu)
  const etapes = [
    { id: 1, ico: "🏖️", jeu: "tri", titre: "Sur la plage",
      lieu: "L'entrée de la plage (lieu à choisir avec vous)",
      apercu: "",
      brief: "Première énigme : regarde cette plage. Certaines choses n'ont rien à faire là, parce qu'elles finissent dans le lagon. Touche-les pour les retirer, et garde les bons gestes !",
      consigne: "Touche ce qui n'a rien à faire sur la plage. Laisse les bons gestes !",
      quiz: { q: "Après le pique-nique, que fait-on de ses déchets ?",
        opts: ["On les laisse : le vent s'en occupe", "On les ramène chez soi", "On les enterre dans le sable"], ok: 1,
        bravo: "Oui ! Tout ce qui est abandonné sur l'île finit dans le lagon, dans l'océan. Les déchets, on les ramène chez soi.",
        rate: "Cherche encore : où finit ce que le vent emporte ?" },
      fait: "Un mégot pollue 500 litres d'eau de mer et met jusqu'à 15 ans à se dégrader. Un sac plastique, plus de 400 ans.",
      src: "R1 · Guide des écogestes, « Profiter sans polluer »",
      indice: "Les déchets laissés sur la plage finissent dans le lagon.",
      classe: { notion: "Impact des activités humaines sur un milieu · déchets.", mots: ["lagon", "déchet", "micro-plastique", "geste responsable"], q: "Que devient un déchet laissé sur la plage ? Où peut-il voyager ?" },
      fin: "Bien joué ! La plage est plus propre. Mais ma maison reste abîmée… suis-moi vers le lagon !" },
    { id: 2, ico: "🏄", jeu: "lagon", titre: "Traverser sans casser",
      lieu: "Le bord du lagon, face au récif (lieu à choisir avec vous)",
      apercu: "",
      brief: "Deuxième énigme : et si c'étaient les promeneurs et les paddles qui abîmaient mon récif ? Aide ce paddle à traverser le lagon sans toucher les coraux !",
      consigne: "Touche les cases CLAIRES (le sable) pour avancer jusqu'au drapeau. Les cases sombres, ce sont les coraux !",
      quiz: { q: "Le corail est…", opts: ["Une plante", "Une pierre", "Un animal"], ok: 2,
        bravo: "Exact ! Le corail est un animal : si on lui marche dessus, on le tue. On reste donc au-dessus du sable, dans les zones claires.",
        rate: "Indice : si je lui marche dessus, je risque de le tuer…" },
      fait: "Les coraux sont des animaux : de petits polypes, qu'on risque de tuer en cassant une branche ou en marchant dessus.",
      src: "R1 · Guide des écogestes, « Naviguer sans casser »",
      indice: "Piétiner ou toucher le corail abîme de petits animaux fragiles.",
      classe: { notion: "Êtres vivants · classification (le corail est un animal).", mots: ["corail", "polype", "récif", "lagon"], q: "Pourquoi dit-on qu'un récif est « vivant » ?" },
      fin: "Bravo ! Avec toi, mon récif est à l'abri. Il me reste un indice, mais il faudra revenir pour la suite." },
    { id: 3, ico: "🟠", jeu: null, titre: "Les zones de quiétude", lieu: "À définir", apercu: "Repérer sur la carte les zones où les animaux ont besoin de tranquillité." },
    { id: 4, ico: "🐠", jeu: null, titre: "Admirer sans déranger", lieu: "À définir", apercu: "Observer les poissons sans les nourrir ni les déranger." }
  ];

  const tri = [
    { ico: "🚬", nom: "un mégot", mal: true, msg: "Un mégot pollue 500 litres d'eau de mer et met jusqu'à 15 ans à se dégrader." },
    { ico: "👒", nom: "un chapeau et un T-shirt", mal: false, msg: "Des vêtements qui protègent du soleil : un bon geste, sans crème en trop." },
    { ico: "🛍️", nom: "un sac plastique", mal: true, msg: "Un sac plastique peut tuer une tortue, blesser un dauphin et même étouffer les coraux." },
    { ico: "🏰", nom: "un château de sable", mal: false, msg: "Jouer dans le sable ne nuit pas à l'écosystème, tant qu'on ne ramène rien à la maison." },
    { ico: "🍞", nom: "du pain pour les poissons", mal: true, msg: "Nourrir les poissons avec du pain, c'est surtout les rendre malades et plus vulnérables au braconnage." },
    { ico: "🧴", nom: "une crème solaire minérale", mal: false, msg: "Une crème minérale est moins nocive pour les récifs, à appliquer au moins 20 minutes avant la baignade." },
    { ico: "🐚", nom: "un coquillage dans le seau", mal: true, msg: "Prendre un coquillage, c'est priver un bernard-l'ermite de sa protection. Sa place est sur la plage !" },
    { ico: "🗑️", nom: "un sac pour ramener ses déchets", mal: false, msg: "Voilà un bon réflexe : on ramène ses déchets chez soi." },
    { ico: "🥤", nom: "un gobelet oublié", mal: true, msg: "Tout ce qui est abandonné sur l'île finit dans le lagon et dans l'océan." }
  ];

  // grille du paddle : S = sable (clair), C = corail (sombre) ; départ en haut à gauche, arrivée en haut à droite
  const lagon = { grille: ["SCCCS", "SSCSS", "CSCSC", "CSSSC", "CCCCC"], depart: [0, 0], arrivee: [0, 4],
    ko: ["Aïe ! Ça, c'est du corail : on le contourne.", "Pas par là : ce sont de petits animaux fragiles.", "Les cases sombres, ce sont les coraux. On reste sur le sable !"] };

  const dossier = {
    titre: "Le dossier de Zouzou",
    q: "Qui a abîmé la maison de Zouzou ?",
    reponse: "Un peu tout le monde, sans le vouloir. Un déchet oublié, un pas sur le corail, un coquillage emporté : chaque petit geste compte, et chacun peut aussi bien faire pour le protéger."
  };

  const fin = {
    gestes: [
      { ico: "🗑️", t: "Je ramène mes déchets chez moi." },
      { ico: "🏖️", t: "Je marche et je navigue au-dessus du sable, jamais sur le corail." },
      { ico: "🐚", t: "Je laisse les coquillages à leur place." },
      { ico: "🐠", t: "Je ne nourris pas les poissons." },
      { ico: "🧴", t: "Je choisis une crème solaire minérale et des vêtements protecteurs." }
    ],
    src: "R1 · Guide des écogestes de la Réserve naturelle marine de La Réunion"
  };

  const credits = [
    "Prototype conçu par Jonathan Bou (Atma digital) pour la Réserve naturelle marine de La Réunion. Proposition à co-construire, rien n'est officiel.",
    "Zouzou est un personnage FICTIF. Elle « parle » : convention de fiction, à signaler aux classes.",
    "Messages sur les bons gestes : guide des écogestes de la Réserve (voir SOURCES.md), à relire par vos équipes.",
    "Illustrations, sons et générateur de QR codes : faits maison, sans ressource externe. Aucune donnée n'est collectée."
  ];

  const demo = [["projet"], ["accueil"], ["intro", "0"], ["hub"], ["st1", "brief"], ["st1", "jeu"], ["st1", "quiz"], ["st1", "info"], ["st2", "brief"], ["st2", "jeu"], ["st2", "quiz"], ["st2", "info"], ["findemo"], ["fiche"]];

  window.Content = { CONFIG, projet, intro, etapes, tri, lagon, dossier, fin, credits, demo };
})();
