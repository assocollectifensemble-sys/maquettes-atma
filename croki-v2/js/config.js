/* ============================================================
   CONFIG.JS — Croki v2 « pilote » : tout le contenu de l'aventure
   ============================================================
   ADN gardé de la v28 (décisions du parc) :
   - 7 étapes dans l'ordre du plan numéroté 1 → 7 ;
   - PAS DE GPS : le plan reste accessible, l'enfant appuie lui-même
     sur « Je suis arrivé(e) devant le panneau » ;
   - AUCUNE synthèse vocale : la voix = fichiers enregistrés
     assets/audio/voix/<clé>.mp3, listés dans CONFIG.voix ci-dessous
     (bouton 🔊 masqué tant que la clé n'y figure pas → aucune requête 404) ;
   - Croki tutoie « Super Marmaille », français + créole réunionnais
     (créole = proposition, à faire relire par le parc) ;
   - mot PARADIS, 1 lettre + 1 accessoire par étape ;
   - MESSAGE CACHÉ en gras (**…**) dans les intros, lu dans l'ordre :
     « Combien il y a de trous dans le mini golf ? »
   Questions et faits animaliers : REPRIS de la v28 (config.js prod).
   Tout fait nouveau est sourcé dans SOURCES.md (une URL par fait).
   ============================================================ */

const CONFIG = {
  // 🔑 DRAPEAU UNIQUE de la maquette pilote.
  // false = pilote : étapes 1, 2, 3, 5 jouables, les autres avec cadenas
  //         « Version complète » (leurs lettres sont offertes à la fin).
  // true  = les 7 étapes s'ouvrent ; celles dont le défi n'est pas encore
  //         construit se jouent en mode « question » comme en v28.
  versionComplete: false,

  version: "crokiv2-pilote-1",
  parc: { nom: "Croc Parc", lieu: "Étang-Salé, La Réunion" },
  motCible: "PARADIS",

  // 🎙️ Voix enregistrées présentes dans assets/audio/voix/ (ex. "accueil").
  // Ajouter ici la clé APRÈS avoir déposé le fichier <clé>.mp3 (+ dans sw.js).
  voix: [],

  // ---------------- Textes de Croki hors étapes ----------------
  textes: {
    accueil: "Coucou Super Marmaille ! Moin lé Croki, et mi revien avec une toute nouvelle aventure ! Ce coup-ci, ton téléphone devient un appareil photo, un tambour et même un micro magique. On prépare ensemble ma fête surprise ?",
    choixJoueurs: "Avant de partir, dis-moi : vous jouez à combien ?",
    famille: "Super ! On joue en équipe : à chaque défi, je dis qui tient le téléphone et qui fait le geste. Chacun son tour !",
    solo: "Ok, Super Marmaille ! Garde un grand à côté de toi, et en avant pour l'aventure !",
    carte: "Voici le plan du parc ! Suis les panneaux de 1 à 7. Devant le bon panneau, appuie sur « Je suis arrivé(e) » et ton défi commence !",
    secretTrouve: "Ooh, un mot doré ! Garde-le précieusement : il fait partie d'un message secret…",
    offertes: "Les étapes 4, 6 et 7 arrivent dans la version complète. Pour ta fête, je t'offre leurs lettres et leurs décorations !",
    enigme: "Dernière énigme, Super Marmaille : c'est l'endroit où on est heureux, entouré de ceux qu'on aime, où la fête dure toujours… Range tes lettres pour former ce mot magique !",
    motTrouve: "PARADIS ! Nou lé arrivé, sa lé le paradis ! Grâce à toi, tous mes amis sont réunis pour la fête !",
    photoFete: "Tout le monde se serre bien fort dans le cadre… et on fait le plus grand sourire de la journée !",
    diplome: "Bravo, Super Marmaille ! Voici ton diplôme : tu es officiellement une Super Marmaille de Croc Parc !",
    secretBonus: "Tu as rassemblé tous les mots dorés ! Lis le message secret avec ta famille, puis filez compter au mini golf !",
    finale: "Merci du fond du cœur, Super Marmaille ! Viens me rejoindre dans les jeux gonflables. Et si un grand laisse un petit avis au parc, ça nous aide beaucoup !"
  },

  // Mot du message caché, dans l'ordre des étapes (doit correspondre aux **…** des intros)
  secret: ["Combien", "il y a", "de", "trous", "dans le", "mini", "golf"],

  // Rôles du mode Famille (annoncés par Croki à chaque défi, ils alternent)
  roles: {
    grand: { nom: "Le Grand", ico: "🧑" },
    petit: { nom: "Le Petit", ico: "🧒" }
  },

  stages: [
    {
      id: "crocos", num: 1, lettre: "P",
      nom: "Bassin des Crocodiles", court: "Crocodiles", emoji: "🐊",
      couleur: "#12806f",
      accessoire: "Paillettes", accessoireEmoji: "🎊",
      crokiImage: "croki-reflechit-pilier",
      transition: "Rendez-vous au panneau n°1, celui des crocodiles du Nil. À toi de le trouver !",
      intro: "J'ai besoin de tes yeux de Super Marmaille ! Est-ce que tu as trouvé le panneau des crocodiles du Nil ? **Combien** de secrets peut bien cacher mon cousin, à ton avis ? Regarde bien son panneau, il y a un super-pouvoir extraordinaire à découvrir…",
      question: {
        texte: "Quel est le super-pouvoir du crocodile du Nil ?",
        options: ["Il peut voler sur de courtes distances 🦅", "Il peut rester près d'une heure sous l'eau en retenant son souffle 🫧", "Il change de couleur comme un caméléon 🦎", "Il peut courir aussi vite qu'une gazelle 🐆"],
        bonne: 1,
        explication: "Eh oui, brav Super Marmaille ! Le crocodile du Nil peut retenir sa respiration et rester immobile sous l'eau pendant presque une heure avant de remonter reprendre son souffle. Un vrai champion d'apnée !"
      },
      defi: {
        type: "oeil", pilote: true, capteur: "camera",
        titre: "L'œil du croco",
        accroche: "Photographie mon cousin le croco et colle-le dans ton carnet !",
        role: { tient: "grand", geste: "petit", texteGeste: "montre du doigt où se cache le croco" },
        consigne: "Mon cousin garde ses yeux et ses narines tout en haut de sa tête : il voit tout en restant presque caché dans l'eau ! Trouve-le, cadre-le dans l'œil de Croki et clic-clac !",
        consigneTouch: "Mes cousins se cachent dans le bassin : seuls leurs yeux dépassent de l'eau ! Touche les 3 paires d'yeux pour les retrouver.",
        bravo: "Clic-clac ! Ta photo est collée dans le carnet de Croki !"
      }
    },
    {
      id: "paon", num: 2, lettre: "A",
      nom: "Clairière des Paons", court: "Paons", emoji: "🦚",
      couleur: "#5b3fa0",
      accessoire: "Assiettes", accessoireEmoji: "🍽️",
      crokiImage: "croki-appuye-malin",
      transition: "En route vers le panneau n°2, la clairière des paons. À toi de la trouver !",
      intro: "As-tu trouvé le panneau avec un magnifique paon dessus, marmaille ? Dans sa grande traîne **il y a** des centaines de plumes, toutes bien rangées pour impressionner ! Toi seul peux m'aider à percer son secret…",
      question: {
        texte: "Quel est le super-pouvoir du paon ?",
        options: ["Il peut sauter à plus de 1m70 de haut 🦵", "Il peut nager sous l'eau comme un poisson 🐟", "Il change la couleur de ses plumes selon la météo 🌦️", "Il peut voler à plus de 200 km/h 🚀"],
        bonne: 0,
        explication: "Sa lé bon, hein ! Malgré sa lourde traîne de plumes, le paon peut sauter à plus d'1m70 de haut d'un seul bond pour rejoindre les branches et échapper à ses prédateurs !"
      },
      defi: {
        type: "roue", pilote: true, capteur: "mouvement",
        titre: "Fais la roue !",
        accroche: "Penche ton téléphone pour déployer la roue du paon !",
        role: { tient: "petit", geste: "grand", texteGeste: "compte les yeux de la roue avec le petit" },
        consigne: "Pour impressionner, le paon déploie sa traîne en grand éventail : il fait la roue ! Penche le téléphone à gauche, à droite, à gauche… et la roue s'ouvre !",
        consigneTouch: "Le paon déploie sa traîne en grand éventail : il fait la roue ! Glisse ton doigt de gauche à droite sur ses plumes pour ouvrir la roue.",
        compte: "Sa roue est pleine de taches rondes qui ressemblent à des yeux : les ocelles ! Combien en vois-tu sur MA roue ?",
        bravo: "Quelle roue magnifique ! Le paon est fier de toi !"
      }
    },
    {
      id: "makis", num: 3, lettre: "R",
      nom: "Île des Makis Catta", court: "Makis catta", emoji: "🐒",
      couleur: "#b7791f",
      accessoire: "Rubans", accessoireEmoji: "🎀",
      crokiImage: "croki-duo-pense",
      transition: "En route vers le panneau n°3, l'île des makis catta. À toi de la trouver !",
      intro: "Tu es arrivé sur l'île des makis catta, marmaille ? Cherche bien le panneau avec leur photo ! Leur longue queue est pleine **de** rayures noires et blanches — essaie donc de les compter ! Et j'ai besoin de ta mémoire de champion pour la prochaine question !",
      question: {
        texte: "Comment s'appelle le dernier maki catta né au CrocParc en 2020 ?",
        options: ["Scarlette", "Bijou", "Nala", "Praline"],
        bonne: 0,
        explication: "Brav toi ! Scarlette est née au CrocParc en 2020. Les makis catta vivent en troupe dirigée par… une femelle ! C'est elle la cheffe du groupe."
      },
      defi: {
        type: "beatbox", pilote: true, capteur: "toucher",
        titre: "Le beatbox du maki",
        accroche: "Croki tape un rythme… à toi de le rejouer sur les tam-tams !",
        role: { tient: "petit", geste: "grand", texteGeste: "fais le rythme avec ta bouche : boum, tchak, tss !" },
        consigne: "Place à la musique ! Écoute bien le rythme de Croki, puis rejoue-le dans le même ordre sur les trois tam-tams. Quatre rythmes pour devenir le roi du beatbox !",
        pose: "Le maki catta prend son bain de soleil : assis bien droit, il tourne son ventre blanc vers le soleil. À toi ! Assieds-toi bien droit, ouvre grand les bras, ventre au soleil… et souris pour la photo souvenir !",
        bravo: "Wouah, quel groove ! Les makis dansent avec toi !"
      }
    },
    {
      id: "inseparables", num: 4, lettre: "A",
      nom: "Volière des Inséparables", court: "Inséparables", emoji: "🦜",
      couleur: "#d1456b",
      accessoire: "Ananas", accessoireEmoji: "🍍",
      crokiImage: "croki-salut-4pattes",
      transition: "En route vers le panneau n°4, la volière des inséparables. À toi de la trouver !",
      intro: "Écoute-les gazouiller, marmaille ! Cette volière est pleine de petits oiseaux très câlins qu'on appelle les inséparables — ils vivent toujours en couple, comme de bons zamis, et se faufilent dans les petits **trous** de leur nid ! Attention : il y en a de DEUX couleurs, des VERTS 💚 et des BLEUS 💙. Compte les verts, puis les bleus, et additionne le tout !",
      question: {
        texte: "Combien d'inséparables en tout dans la volière : les VERTS 💚 + les BLEUS 💙 ?",
        options: ["Moins de 10", "Entre 10 et 19", "Entre 20 et 29", "30 ou plus"],
        bonne: 1,
        indices: [
          "Presque ! As-tu bien compté les bleus 💙 en plus des verts 💚 ? Certains se cachent dans les nids…",
          "Allez, on y va ensemble : compte d'abord les verts, puis les bleus, et additionne les deux 😉"
        ],
        indiceTrop: "Oh là, c'est beaucoup ! Chaque oiseau compte une seule fois : recompte tranquillement 🔎",
        explication: "Brav, il y en a 19, verts et bleus réunis ! Les inséparables portent bien leur nom : ils forment des couples pour la vie et restent toujours collés l'un à l'autre."
      },
      defi: {
        type: "jumelles", pilote: false, capteur: "toucher",
        titre: "Les jumelles",
        accroche: "Sors tes jumelles magiques et compte les verts et les bleus !"
      }
    },
    {
      id: "oies", num: 5, lettre: "D",
      nom: "Mare aux Oies", court: "Oies", emoji: "🪿",
      couleur: "#1f7fb0",
      accessoire: "Diadèmes", accessoireEmoji: "👑",
      crokiImage: "croki-court",
      transition: "En route vers le panneau n°5, la mare aux oies. À toi de la trouver !",
      intro: "Regarde bien autour de toi, Super Marmaille : as-tu repéré le panneau **dans le** coin où cacardent les oies ? Elles cachent, elles aussi, un super-pouvoir étonnant…",
      question: {
        texte: "Jusqu'à quel âge peut vivre une oie ?",
        options: ["10 ans", "20 ans", "40 ans", "80 ans"],
        bonne: 2,
        explication: "Et oui, jusqu'à 40 ans, lontan sa ! C'est bien plus longtemps que la plupart des oiseaux de basse-cour."
      },
      defi: {
        type: "cacardage", pilote: true, capteur: "micro",
        titre: "Le grand cacardage",
        accroche: "Faites le plus de bruit possible pour faire décoller l'oie !",
        role: { tient: "grand", geste: "petit", texteGeste: "cacarde le plus fort possible : « Couac ! Couac ! »" },
        consigne: "Le cri de l'oie s'appelle le cacardement ! Toute la famille cacarde très fort près du téléphone : plus vous êtes bruyants, plus l'oie monte haut dans le ciel !",
        consigneTouch: "Le cri de l'oie s'appelle le cacardement ! Tapote très vite le gros bouton « Couac ! » pour faire décoller l'oie !",
        bravo: "Décollage réussi ! Quelle famille de champions du cacardage !"
      }
    },
    {
      id: "chevres", num: 6, lettre: "I",
      nom: "Oasis des Chèvres", court: "Chèvres", emoji: "🐐",
      couleur: "#9a6a2f",
      accessoire: "Illuminations", accessoireEmoji: "✨",
      crokiImage: "croki-court",
      transition: "En route vers le panneau n°6, l'oasis des chèvres. À toi de la trouver !",
      intro: "Ouuu, i senté bon zot ! Psst, entre nous marmaille : les chèvres sont toutes **mini** à côté de moi, mais elles sont sacrément costaudes ! Avant-dernière étape avant la fête : trouve leur panneau, elles cachent elles aussi un super-pouvoir !",
      question: {
        texte: "Combien d'estomacs possède une chèvre ?",
        options: ["1 seul estomac", "2 estomacs", "3 estomacs", "4 estomacs"],
        bonne: 3,
        explication: "Et oui, 4 estomacs ! La chèvre est un ruminant : ses 4 estomacs (dont la fameuse panse) lui permettent de digérer même l'herbe la plus coriace !"
      },
      defi: {
        type: "seau", pilote: false, capteur: "mouvement",
        titre: "Secoue le seau",
        accroche: "Secoue ton téléphone pour remplir la mangeoire des chèvres !"
      }
    },
    {
      id: "iguane", num: 7, lettre: "S",
      nom: "Rocher de l'Iguane Vert", court: "Iguane vert", emoji: "🦎",
      couleur: "#2c8a4f",
      accessoire: "Serpentins", accessoireEmoji: "🎉",
      crokiImage: "croki-salut-4pattes",
      transition: "En route vers le panneau n°7, le rocher de l'iguane vert. À toi de le trouver !",
      intro: "Regarde comme il est beau, tout vert et immobile au soleil ! Approche-toi du panneau de l'iguane vert, marmaille : il paraît qu'il adore se dorer du côté du **golf** du parc… Dernière étape avant la fête, lui aussi cache un super-pouvoir surprenant sur sa famille !",
      question: {
        texte: "Combien d'œufs maximum une iguane peut-elle pondre par portée ?",
        options: ["10 œufs", "25 œufs", "60 œufs", "5 œufs"],
        bonne: 2,
        explication: "Assiz aou, jusqu'à 60 œufs d'un coup ! L'iguane verte est une championne de la ponte."
      },
      defi: {
        type: "chasseVert", pilote: false, capteur: "camera",
        titre: "Chasse au vert",
        accroche: "Trouve autour de toi un objet du même vert que l'iguane !"
      }
    }
  ]
};

// Étape jouable dans cette version ?
CONFIG.estJouable = s => CONFIG.versionComplete || !!(s.defi && s.defi.pilote);
