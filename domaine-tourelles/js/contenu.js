/* ============================================================
   CONTENU.JS — textes de « Les Légendes de la Plaine » (Domaine des Tourelles)
   Faits sourcés (consultés le 27/11/2026) :
   - https://tourelles.re/ (entrée libre 7 j/7, audioguide, visites pédagogiques, centres aérés)
   - https://tourelles.re/wp-content/uploads/2025/12/DDT-depliant-de-visite.pdf
     (maison achetée en 1923, reconstruite en 1926-1927, façade à deux tours ;
      jardins utilitaires : ayapana et plantes médicinales des tisaneurs, chouchou ;
      vétiver dans les plantes à parfum ; contes d'Emmeline Payet et Luco Sautron)
   Tout le reste = exemple, à co-écrire avec le Domaine.
   ============================================================ */
window.CONTENU = {
  slug: "domaine-tourelles",
  lieu: "Domaine des Tourelles",
  commune: "La Plaine-des-Palmistes",
  titre: "Les Légendes de la Plaine",
  perso: "Ti Bwa",

  projet: {
    pour: "Maquette préparée pour le Domaine des Tourelles",
    titre: "Les Légendes de la Plaine",
    sous: "Une aventure à jouer sur téléphone, dans la Maison de Villeneuve et ses jardins. Les familles aident Ti Bwa, petit fantôme farceur, à retrouver les pages de son livre de contes.",
    puces: [
      ["📱", "Un QR code à l'accueil, et l'aventure s'ouvre dans le navigateur"],
      ["🌿", "La varangue, les jardins, le salon de lecture et la boutique deviennent des énigmes"],
      ["🗣️", "En français, avec la voix et les mots créoles de Ti Bwa"],
      ["📅", "Elle reste en place toute l'année : vacances, week-ends, classes"]
    ],
    idee: [
      "La famille scanne le QR code à l'accueil : Ti Bwa apparaît et raconte qu'il a semé les pages de son livre de contes dans le Domaine.",
      "À chaque lieu du parcours « Des Hommes, des Hauts, des Plantes », une énigme à résoudre en observant pour de vrai : un panneau, une étiquette de plante, un conte, un objet d'artisan.",
      "Chaque réussite rend une page du livre. Avec les 4 pages, les enfants reçoivent le diplôme de « Gardien des Légendes », à leur prénom."
    ],
    apports: [
      ["👨‍👩‍👧", "Les familles restent plus longtemps", "Les enfants guident leurs parents d'un lieu à l'autre : la visite devient un moment partagé, du jardin à la boutique."],
      ["🏫", "Les classes et les centres aérés ont leur version", "Un parcours prêt à l'emploi qui complète vos visites pédagogiques et vos ateliers."],
      ["🎧", "Un beau prolongement de votre audioguide", "La même visite autonome, version jeu, pour les 6-12 ans et leurs parents."],
      ["🌦️", "Une aventure qui vit toute l'année", "Vacances de décembre-janvier, week-ends, Journées du patrimoine : l'aventure est là chaque jour d'ouverture."],
      ["📶", "Elle fonctionne hors connexion", "Une fois ouverte, elle tourne sur le téléphone, même au fond du jardin."],
      ["💬", "Des avis et un souvenir à partager", "Le diplôme à l'écran se montre et se photographie : un joli souvenir de la Plaine."]
    ],
    jonathan: "Je suis Jonathan Bou, artiste de spectacle à La Réunion (jonglage, danse, beatbox) et développeur. Pour le lancement ou une date forte, je peux venir animer en personnage : Ti Bwa en chair et en os, sur la varangue, pour lancer les familles dans l'aventure.",
    scolaire: {
      titre: "Version scolaire : « Vivre dans les Hauts autrefois »",
      texte: "Une déclinaison cycle 3 (CM1-CM2-6e) du même parcours, pour vos visites pédagogiques et les centres aérés.",
      points: [
        "Thèmes : la villégiature et le « changement d'air », les Petits Blancs des Hauts, les plantes utiles des jardins",
        "Un carnet de bord par équipe sur téléphone ou tablette, et une fiche enseignant (avant, pendant, après la visite)",
        "Des énigmes adaptées par niveau, à co-construire avec vos médiateurs"
      ]
    },
    parcours: [
      ["La date de la varangue", "Façade et varangue de la Maison de Villeneuve", true],
      ["Les plantes de Gramoun", "Jardins utilitaires du parcours", true],
      ["Le conte du salon", "Salon de lecture : un conte à écouter, la fin à choisir", false],
      ["L'objet de l'artisan", "Boutique artisanale : l'objet à retrouver", false]
    ],
    verifies: [
      ["Maison achetée en 1923 par la famille de Villeneuve, reconstruite en 1926-1927, façade à deux tours", "Dépliant de visite du Domaine"],
      ["Jardins utilitaires : ayapana et plantes médicinales des tisaneurs, chouchou ; vétiver parmi les plantes à parfum", "Dépliant de visite du Domaine"],
      ["Contes & légendes de la Plaine racontés par Emmeline Payet, Luco Sautron et des habitants", "Dépliant de visite du Domaine"],
      ["Entrée libre 7 j/7, audioguide en boutique, visites pédagogiques et accueil des centres aérés", "tourelles.re"]
    ],
    acoecrire: [
      "Le panneau exact qui affiche l'année 1927 près de la varangue (l'énigme 1 s'appuie dessus)",
      "Les 3 plantes étiquetées du jardin et leurs usages d'autrefois : ici ayapana → tisane, vétiver → haie qui tient la terre, chouchou → cuisine, à confirmer avec vos étiquettes",
      "Le conte du salon de lecture et les droits de citation (Emmeline Payet, Luco Sautron)",
      "L'objet d'artisan de la boutique, l'emplacement des QR codes et les phrases créoles de Ti Bwa"
    ],
    sources: [
      "https://tourelles.re/",
      "https://tourelles.re/wp-content/uploads/2025/12/DDT-depliant-de-visite.pdf"
    ]
  },

  accueil: {
    phrase: "Ti Bwa a semé les pages de son livre de contes dans tout le Domaine. Aide-le à les retrouver avant que la brume monte !",
    kreol: "Ti Bwa la sem bann paz son liv zistoir partou dann Domaine. Ed ali artrouv azot avan la brime i monte !"
  },

  intro: [
    "Bonjour toi ! Moi, c'est <b>Ti Bwa</b>, le petit fantôme de la Maison de Villeneuve. Je suis un peu farceur… mais très gentil !",
    "Ce matin, un coup de vent a fait voler les pages de mon livre de contes. <em class=\"kr\">Mi la pa trouv mon paz !</em>",
    "Il y a 4 pages cachées dans le Domaine. Suis la carte, observe bien autour de toi, et on les retrouve ensemble. <em class=\"kr\">Alé !</em>"
  ],

  etapes: {
    varangue: {
      n: 1, titre: "La date de la varangue", lieu: "📍 Façade et varangue de la Maison de Villeneuve",
      court: "Ouvre le cadenas du livre",
      mission: "Ma maison a été reconstruite l'année où j'ai fêté mes cent ans de fantôme… Trouve cette année sur le panneau près de la varangue pour ouvrir mon livre !",
      panneau: ["LA MAISON DE VILLENEUVE", "Achetée en 1923 par la famille de Villeneuve, la maison de vacances est entièrement reconstruite en 1927. Sa façade est ornée de deux tours."],
      code: "1927",
      indices: ["Cherche une année qui commence par 19…", "C'est entre les deux guerres mondiales, quand les familles venaient changer d'air à la Plaine."],
      essai: "Presque ! Relis bien le panneau : l'année de la reconstruction.",
      page: "Il était une fois, dans les Hauts, une famille qui montait chaque été respirer l'air frais…",
      bravo: "Kler ! La première page s'envole vers toi !",
      savais: ["Le « changement d'air »", "Au début du XXe siècle, les familles des Bas montaient passer l'été dans les Hauts, au frais. La Maison de Villeneuve, avec ses deux tours, était la plus somptueuse maison de villégiature de la Plaine jusqu'à la fin des années 1940.", "Dépliant de visite du Domaine des Tourelles"]
    },
    jardin: {
      n: 2, titre: "Les plantes de Gramoun", lieu: "📍 Jardins du parcours « Des Hommes, des Hauts, des Plantes »",
      court: "Associe chaque plante à son usage",
      mission: "Ma gramoun soignait tout le monde avec les plantes du jardin. Aide-moi à retrouver à quoi servait chacune !",
      plantes: [
        { id: "ayapana", nom: "Ayapana", etiq: "plante médicinale", usage: "tisane" },
        { id: "vetiver", nom: "Vétiver", etiq: "plante à racines", usage: "haie" },
        { id: "chouchou", nom: "Chouchou", etiq: "plante grimpante", usage: "cuisine" }
      ],
      usages: [
        { id: "tisane", ico: "🫖", nom: "Tisane", txt: "pour se soigner, chez le tisaneur" },
        { id: "haie", ico: "🌾", nom: "Haie ou clôture", txt: "pour tenir la terre et border le jardin" },
        { id: "cuisine", ico: "🍲", nom: "Cuisine", txt: "pour le repas, au feu de bois du boucan" }
      ],
      essai: "Presque ! Regarde bien l'étiquette au pied de la plante.",
      page: "…et dans le jardin, Gramoun cueillait l'ayapana, le chouchou et les herbes qui soignent…",
      bravo: "Bravo, ou lé in vré zardinier ! Deuxième page retrouvée.",
      savais: ["Les tisaneurs, gardiens du savoir", "Dans les jardins utilitaires des Hauts, plantes médicinales, aromatiques et légumes se côtoient. L'ayapana et les autres plantes médicinales servent à la médecine traditionnelle, dont les tisaneurs maîtrisent les mélanges.", "Dépliant de visite du Domaine des Tourelles"]
    },
    salon: { n: 3, titre: "Le conte du salon", lieu: "Salon de lecture", court: "Un conte à écouter, la fin à choisir" },
    boutique: { n: 4, titre: "L'objet de l'artisan", lieu: "Boutique artisanale", court: "L'objet d'artisan à retrouver" }
  },

  victoire: {
    titre: "Deux pages sur quatre !",
    texte: "Ti Bwa rayonne : son livre reprend vie. Dans l'application complète, le conte du salon de lecture et l'objet de l'artisan t'attendent pour les deux dernières pages… et le diplôme de Gardien des Légendes.",
    diplome: "Gardien des Légendes"
  }
};
