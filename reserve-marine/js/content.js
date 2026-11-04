/* ============================================================
   CONTENT.JS — Tous les textes de « Enquête au bord du lagon »
   (prototype pour la Réserve naturelle marine de La Réunion).
   Faits : « Guide des écogestes » de la Réserve [R5] et pages publiques [R1-R6],
   voir SOURCES.md (page du guide indiquée pour chaque fait).
   Zouzou la zourite est un personnage FICTIF : elle « parle » (convention de fiction).
   Rien n'est définitif : tout est à relire et à réécrire avec les équipes de la Réserve.
   ============================================================ */
(function () {
  "use strict";
  // VERSION DÉMO : étapes 1 et 2 jouables (les deux mini-jeux les plus spectaculaires),
  // 3, 4 et 5 présentées et verrouillées « Dans l'application complète ».
  // (Le jeu de l'étape 3, « le sac de plage », existe dans games.js mais reste verrouillé.)
  // Passer versionComplete à true quand toutes les étapes seront ouvertes.
  const CONFIG = { versionComplete: false, etapesJouables: 2, total: 5 };

  // ---------- déclenchement des étapes (comme au Croc Parc : on marche, l'étape s'ouvre à l'arrivée) ----------
  // Mode À CHOISIR AVEC LA RÉSERVE : "gps" (position du téléphone) ou "qr-depart" (un seul QR code au départ,
  // puis bouton « Je suis arrivé » devant le repère). Aucun QR code par étape.
  // points : coordonnées réelles des étapes, inconnues tant que les emplacements ne sont pas choisis (null).
  // La géolocalisation n'est demandée QUE si le joueur touche « Utiliser ma position » ; refus = aucun souci.
  const DECLENCHEMENT = { mode: "à choisir ensemble", rayon: 25, points: { 1: null, 2: null, 3: null, 4: null, 5: null } };

  // ---------- écran « Le projet » ----------
  const projet = {
    lieu: "Réserve marine · La Réunion",
    badge: "Proposition · à imaginer et co-écrire avec vos équipes",
    titre: "Enquête au bord du lagon",
    sous: "Une aventure sur téléphone, en complément de vos animations",
    idee: "Zouzou la zourite ne reconnaît plus son coin de récif. Familles et classes mènent l'enquête <b>depuis la plage, sans entrer dans l'eau</b>, et découvrent en jouant <b>les bons gestes de votre guide des écogestes</b>. Un seul QR code au départ (ou le GPS du téléphone), puis on marche : <b>chaque étape s'ouvre quand on arrive au bon endroit</b>. Rien à télécharger, et ça marche <b>sans réseau</b>.",
    complete: [
      ["🪸", "5 étapes au bord du lagon", "Aujourd'hui, vous en jouez deux.", "large"],
      ["👨‍👩‍👧", "Familles et classes", "Le même jeu, un ton adapté à chacun"],
      ["🗣️", "Français, kréol, anglais", "Avec de vraies voix enregistrées"],
      ["📶", "Hors connexion", "Une fois ouverte, plus besoin de réseau"],
      ["📍", "Un départ, puis on marche", "QR code au départ ou GPS : à choisir ensemble"],
      ["✏️", "Vos contenus, vos mots", "Relus et validés par vos équipes"],
      ["📊", "Statistiques anonymes", "Ce qui est joué, ce qui est retenu"]
    ],
    possible: [
      ["🔭", "Réalité augmentée", "Faire apparaître le récif et ses habitants sur l'écran, depuis la plage"],
      ["🎧", "Parcours sonore", "Des voix et des sons du lagon, au fil de la promenade"],
      ["🎭", "En personnage", "Jonathan anime l'aventure en direct lors de vos événements"],
      ["🗺️", "Autres lieux, autres héros", "Un autre personnage, une autre plage de la Réserve"]
    ],
    fiction: "Zouzou est un personnage inventé pour l'histoire. Les messages viennent du guide des écogestes de la Réserve et restent à relire par vos équipes."
  };

  // ---------- accueil du jeu ----------
  const accueil = {
    kicker: "Réserve naturelle marine · La Réunion",
    titre: "Enquête au bord du lagon",
    accroche: "Zouzou la zourite a besoin de toi. Mène l'enquête sur la plage, sans entrer dans l'eau, et deviens gardien du lagon.",
    promesses: [{ n: "5", t: "étapes" }, { n: "0", t: "réseau requis" }, { n: "15", t: "min environ*" }]
  };
  const publics = {
    famille: { ico: "👨‍👩‍👧", t: "Famille", desc: "À jouer ensemble, en se passant le téléphone (dès 7 ans environ, à valider avec vous)." },
    classe: { ico: "🎓", t: "Classe", desc: "Consignes scolaires, mots-clés et une question à débattre à chaque étape. Fiche enseignant disponible." }
  };

  // ---------- intro (Zouzou se présente) ----------
  const intro = [
    { expr: "triste", t: "Psst… ici, dans l'eau ! Je suis Zouzou, une zourite. Depuis quelque temps, mon coin de récif change : des déchets, des branches de corail cassées… Je ne comprends pas ce qui se passe." },
    { expr: "surpris", t: "Moi, quand j'ai peur, je crache un nuage d'encre et je file ! Mais là, l'encre ne sert à rien : j'ai besoin d'un enquêteur. Quelqu'un qui reste au sec, sur la plage, et qui ouvre l'œil." },
    { expr: "clin", t: "Sur la plage, il y a 5 étapes. À chacune, un défi et un indice. Tu pars du point de départ, puis tu marches : l'étape suivante s'ouvre quand tu arrives au bon endroit. On y va ?" }
  ];

  // ---------- les 5 étapes ----------
  // lieu : GÉNÉRIQUE (le site, le mode de déclenchement — GPS ou un seul QR code au départ — et les emplacements
  // sont à choisir avec la Réserve). marche : trajet indicatif depuis l'étape précédente (écran « Rejoins le prochain point »).
  const etapes = [
    { id: 1, ico: "🏖️", jeu: "plage", titre: "Le sable n'est pas un cendrier",
      lieu: "L'entrée de la plage",
      brief: { expr: "triste", t: "Première piste : la plage. Le vent emporte tout ce qu'on oublie… et tout finit chez moi, dans le lagon. Ramasse ce qui n'a rien à faire là. Mais attention : certaines choses sont à leur place sur le sable !" },
      consigne: "Touche les déchets pour les mettre dans le sac. Laisse ce qui est naturel. Et vite : le vent pousse un sac plastique vers l'eau !",
      quiz: { q: "Un seul mégot jeté dans le sable peut polluer…", opts: ["5 litres d'eau de mer", "50 litres d'eau de mer", "500 litres d'eau de mer"], ok: 2,
        bravo: "Oui : 500 litres d'eau de mer, et il met jusqu'à 15 ans à se dégrader. Le sable n'est pas un cendrier !",
        rate: "Plus que ça ! C'est tout petit, un mégot… mais ça pollue énormément." },
      fait: "Un sac plastique met plus de 400 ans à se dégrader. Il peut tuer une tortue, blesser un dauphin et même étouffer les coraux. Avec le temps, les plastiques deviennent des micro-plastiques qui se retrouvent dans toute la chaîne alimentaire, jusque dans nos assiettes.",
      src: "R5 · guide des écogestes, « Profiter sans polluer »",
      indice: "Indice n° 1 : des déchets oubliés sur la plage, emportés par le vent jusqu'au lagon.",
      carte: "bernard",
      classe: { notion: "Impact des activités humaines sur un milieu : les déchets.", mots: ["déchet", "dégradation", "micro-plastique", "chaîne alimentaire"], q: "Où va un déchet oublié sur la plage ? Que devient-il au bout de longues années ?" },
      fin: { expr: "content", t: "Merci ! Et tu as laissé les coquillages et le corail mort à leur place : ils servent de maison aux bernard-l'ermite et deviennent, avec le temps, le sable blanc de la plage." } },

    { id: 2, ico: "🏄", jeu: "paddle", titre: "Naviguer sans casser",
      lieu: "Le bord du lagon, face aux paddles",
      marche: { distance: "≈ 150 m", duree: "2 min à pied", repere: "Longe la plage vers le nord. Arrête-toi là où les paddles sont posés sur le sable, face au lagon.", vignette: "paddles" },
      brief: { expr: "surpris", t: "Deuxième piste : des branches de mon récif sont cassées ! Les paddles et les kayaks passent juste au-dessus. Guide ce paddle jusqu'au banc de sable… sans toucher un seul massif de corail." },
      consigne: "Fais glisser ton doigt pour guider le paddle. Reste sur les zones CLAIRES (le sable) et évite les zones SOMBRES (les coraux). Attention au courant !",
      quiz: { q: "Le corail, c'est…", opts: ["une plante", "une pierre", "un animal"], ok: 2,
        bravo: "Exact ! Le corail est fait de petits animaux, les polypes. Si on marche dessus ou si on le cogne avec une pagaie, on les écrase.",
        rate: "Pas tout à fait… Indice : si je marche dessus, je l'écrase… et je le tue." },
      fait: "Les coraux sont de petits polypes qui fabriquent un squelette calcaire, en bouquet branchu ou en boule massive. Avec un paddle, un kayak ou un matelas, on reste au-dessus des zones claires de sable : à cause du vent ou du courant, on peut vite se retrouver poussé au-dessus des massifs sans le vouloir.",
      src: "R5 · guide des écogestes, « Explorer sans piétiner » et « Naviguer sans casser »",
      indice: "Indice n° 2 : des pagaies et des pieds qui touchent le corail, souvent sans le faire exprès.",
      carte: "corail",
      classe: { notion: "Le vivant : le corail est un animal (des polypes et leur squelette calcaire).", mots: ["corail", "polype", "récif", "zone sableuse"], q: "Pourquoi dit-on que le récif est « vivant » ? Que se passe-t-il si des milliers de visiteurs le touchent un peu ?" },
      fin: { expr: "content", t: "Bravo, tu es resté au-dessus du sable ! Les zones claires pour passer, les zones sombres pour admirer de loin : c'est simple, et ça protège mes voisins les polypes." } },

    { id: 3, ico: "🎒", jeu: "sac", titre: "Le sac de plage",
      lieu: "À l'ombre des filaos",
      marche: { distance: "≈ 120 m", duree: "2 min à pied", repere: "Cherche le grand filao penché, à l'ombre.", vignette: "filao" },
      brief: { expr: "clin", t: "Troisième piste : ce qu'on emporte à la plage. Certains objets protègent le lagon, d'autres le dérangent sans qu'on s'en rende compte. Prépare le sac idéal pour une journée au bord de l'eau !" },
      consigne: "Glisse dans le sac (ou touche) les objets qui protègent le lagon et toi. Les autres restent à la maison.",
      quiz: { q: "Donner du pain aux poissons du lagon, c'est…", opts: ["un bon goûter pour eux", "les rendre malades et plus faciles à braconner", "sans aucun effet"], ok: 1,
        bravo: "Oui ! Le récif leur offre déjà « le gîte et le couvert ». Le pain les rend malades et plus vulnérables au braconnage.",
        rate: "Non… Le récif les nourrit déjà très bien. Et le pain, ce n'est pas fait pour eux." },
      fait: "Pour se protéger du soleil sans abîmer le récif : des vêtements protecteurs (chapeau, lunettes, T-shirt ou Lycra à manches longues), pas d'exposition entre 10 h et 16 h, et une crème solaire minérale, moins nocive pour les récifs, appliquée au moins 20 minutes avant la baignade.",
      src: "R5 · guide des écogestes, « Admirer sans déranger » et « Se protéger sans intoxiquer »",
      indice: "Indice n° 3 : du pain pour les poissons, des épuisettes, de la crème qui file dans l'eau.",
      carte: "baliste",
      classe: { notion: "Relations entre les êtres vivants et leur milieu : se nourrir, se protéger.", mots: ["récif", "nourrissage", "crème minérale", "braconnage"], q: "Pourquoi un geste « gentil », comme nourrir un poisson, peut-il lui faire du mal ?" },
      fin: { expr: "fete", t: "Un sac parfait ! Pas de pain, pas d'épuisette, pas de seau à coquillages : tu viens admirer sans déranger. Il reste deux étapes à l'enquête…" },
      apercu: "Préparer le sac idéal pour une journée au bord du lagon." },

    { id: 4, ico: "🟡", jeu: null, titre: "Visiter sans dépasser",
      lieu: "Face aux balises jaunes",
      apercu: "Repérer les balises jaunes des zones de quiétude, où toute activité est interdite pour laisser le récif se repeupler." },
    { id: 5, ico: "🐙", jeu: null, titre: "Chez Zouzou",
      lieu: "Le point de vue sur le récif",
      apercu: "Réunir les indices, répondre à la grande question : qui a abîmé le coin de récif de Zouzou ?" }
  ];

  // ---------- étape 1 : la plage ----------
  // x, y en unités du dessin (360 × 430) ; mal = déchet à ramasser
  const plage = [
    { id: "canette", nom: "une canette", mal: true, x: 64, y: 268, msg: "Une canette de moins dans le lagon !" },
    { id: "bouteille", nom: "une bouteille en plastique", mal: true, x: 272, y: 300, msg: "Ramassée ! Le plastique ne disparaît jamais vraiment." },
    { id: "megot", nom: "un mégot", mal: true, x: 186, y: 352, msg: "Bien vu ! Ce petit mégot aurait pollué 500 litres d'eau de mer." },
    { id: "gobelet", nom: "un gobelet", mal: true, x: 118, y: 372, msg: "Hop, dans le sac ! On ramène ses déchets chez soi." },
    { id: "chips", nom: "un paquet de chips", mal: true, x: 300, y: 384, msg: "Le vent l'aurait emporté jusqu'à l'eau." },
    { id: "sac", nom: "un sac plastique", mal: true, x: 150, y: 250, vent: true, msg: "Rattrapé ! Un sac plastique peut tuer une tortue et étouffer les coraux." },
    { id: "coquillage", nom: "un coquillage", mal: false, x: 236, y: 266, msg: "On le laisse : un coquillage peut devenir la maison d'un bernard-l'ermite." },
    { id: "corailmort", nom: "un morceau de corail mort", mal: false, x: 44, y: 340, msg: "On le laisse : avec le temps, les débris de corail deviennent le sable blanc." },
    { id: "bernard", nom: "un bernard-l'ermite", mal: false, x: 330, y: 334, msg: "Chut… c'est un bernard-l'ermite ! Il nettoie la plage : on le laisse tranquille." },
    { id: "chateau", nom: "un château de sable", mal: false, x: 214, y: 404, msg: "Un château de sable ne fait aucun mal… tant qu'on ne ramène rien à la maison !" }
  ];

  // ---------- étape 3 : le sac de plage ----------
  const sac = [
    { id: "chapeau", nom: "Chapeau", ok: true, msg: "Le chapeau protège du soleil, sans une goutte de crème." },
    { id: "pain", nom: "Pain pour les poissons", ok: false, msg: "Non ! Le pain rend les poissons malades et plus faciles à braconner." },
    { id: "lycra", nom: "T-shirt à manches longues", ok: true, msg: "Parfait : un T-shirt ou un Lycra à manches longues, c'est moins de crème dans l'eau." },
    { id: "epuisette", nom: "Épuisette", ok: false, msg: "On la laisse : poursuivre un poisson l'éloigne de son abri et le rend vulnérable." },
    { id: "creme", nom: "Crème solaire minérale", ok: true, msg: "Oui : une crème minérale, moins nocive pour les récifs, au moins 20 minutes avant la baignade." },
    { id: "seau", nom: "Seau à coquillages", ok: false, msg: "On s'en passe : les coquillages sont plus utiles sur la plage que sur une étagère." },
    { id: "dechets", nom: "Sac pour mes déchets", ok: true, msg: "Le bon réflexe : on ramène ses déchets chez soi." },
    { id: "lunettes", nom: "Lunettes de soleil", ok: true, msg: "Bien vu : les lunettes font partie des protections conseillées." }
  ];

  // ---------- cartes du carnet du lagon ----------
  const cartes = {
    bernard: { nom: "Le bernard-l'ermite", sous: "Crustacé · habitant des plages",
      t: "Il s'abrite dans une coquille vide. C'est un charognard : il évite la prolifération des bactéries et des maladies.", src: "R5 · « Jouer sans ramener »" },
    corail: { nom: "Le corail", sous: "Animal · bâtisseur du récif",
      t: "De petits polypes fragiles fabriquent un squelette calcaire. Vivant, il est coloré ; mort, il sert de support aux nouveaux coraux et d'abri à de petits animaux.", src: "R5 · « Explorer sans piétiner »" },
    baliste: { nom: "Le baliste Picasso", sous: "Poisson · « bourse »",
      t: "Il projette de l'eau avec sa bouche pour retourner les oursins dont il se nourrit.", src: "R5 · page à colorier « Le baliste Picasso (bourse) »" }
  };

  // ---------- fin de la démo ----------
  const findemo = {
    suite: [
      ["🎒", "3 autres étapes", "Le sac de plage, les zones de quiétude, puis le récif de Zouzou"],
      ["🕵️", "La grande révélation", "Qui a abîmé le coin de récif de Zouzou ? Un peu tout le monde, sans le vouloir…"],
      ["📒", "Le carnet du lagon complet", "Une carte par habitant du récif rencontré"],
      ["🏅", "Le diplôme de gardien du lagon", "À garder en image ou à imprimer"]
    ]
  };

  // ---------- bons gestes (fin d'aventure et fiche) ----------
  const gestes = [
    ["🗑️", "Je ramène mes déchets chez moi."],
    ["🏝️", "Je marche et je navigue au-dessus du sable, jamais sur les coraux."],
    ["🐚", "Je laisse coquillages et corail mort à leur place."],
    ["🐠", "J'admire les poissons sans les nourrir ni les poursuivre."],
    ["🧴", "Je me protège du soleil avec des vêtements et une crème minérale."],
    ["🟡", "Je respecte les balises jaunes des zones de quiétude."]
  ];

  const credits = [
    "Prototype conçu et développé par Jonathan Bou (Atma digital) pour la Réserve naturelle marine de La Réunion. C'est une proposition : rien n'est officiel, tout peut changer.",
    "Zouzou est un personnage FICTIF. Elle « parle » : c'est une convention de fiction, à signaler aux classes.",
    "Messages sur les bons gestes : guide des écogestes de la Réserve (voir SOURCES.md), à relire et valider par vos équipes.",
    "Illustrations, sons et QR code : faits maison, sans aucune ressource externe. Aucune donnée n'est collectée, aucun compte n'est créé. La position du téléphone n'est utilisée que si vous l'autorisez, sur le téléphone seulement, jamais envoyée.",
    "* Durées et distances indicatives, à mesurer sur place avec vous."
  ];

  // diaporama ?demo=1 : [écran, étape]
  const demo = [["projet"], ["accueil"], ["intro", "0"], ["intro", "2"], ["hub"],
    ["st1", "brief"], ["st1", "jeu"], ["st1", "quiz"], ["st1", "info"], ["marche", "2"],
    ["st2", "brief"], ["st2", "jeu"], ["st2", "quiz"], ["st2", "info"],
    ["findemo"], ["fiche"], ["qr"]];

  window.Content = { CONFIG, DECLENCHEMENT, projet, accueil, publics, intro, etapes, plage, sac, cartes, findemo, gestes, credits, demo };
})();
