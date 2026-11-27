/* ============================================================
   CONTENT.JS — Tous les textes de l'aventure (formulation positive).
   Contenu d'exemple : à co-écrire avec le pôle Valorisation du patrimoine.
   ============================================================ */
(function () {
  "use strict";
  window.C = {
    titre: "Le Secret de la Ville du Sud",
    lieu: "Saint-Pierre, centre-ville",

    projet: {
      sur: "Maquette pour la Ville de Saint-Pierre · Ville d'art et d'histoire",
      accroche: "Un parcours patrimoine à jouer sur téléphone : les familles et les classes lisent les façades créoles, remontent l'histoire du port et repartent avec le carnet du gardien.",
      gains: [
        ["👨‍👩‍👧", "Les familles", "Un jeu de piste en plein centre-ville, à faire en autonomie, à son rythme, toute l'année."],
        ["🎒", "Les classes", "Une version cycle 3 de 1 h 30 avec fiche enseignant, articulée au catalogue du service éducatif."],
        ["🌴", "Les vacances", "Une sortie prête pour chaque semaine de vacances scolaires, à vivre en famille ou entre amis."],
        ["📅", "Toute l'année", "L'aventure reste en place : elle brille aux Journées européennes du patrimoine 2027 et vit chaque jour ensuite."],
        ["🎭", "Les lancements", "Jonathan, artiste de spectacle, anime en personnage les dates fortes : inauguration, JEP, Nuit des musées."],
        ["📱", "Simple à jouer", "Un QR code, le navigateur du téléphone, et l'aventure démarre. Elle fonctionne aussi hors connexion, en français et en créole."]
      ],
      comment: [
        "Le visiteur scanne le QR code au point de départ.",
        "Ti Bassoul, petit lézard gardien des cases créoles, l'accueille et lui confie une mission.",
        "À chaque lieu, une énigme se joue avec ce qu'il voit devant lui : façade, front de mer, marché, hôtel de ville.",
        "Chaque énigme réussie livre un secret du carnet du gardien. Les quatre secrets forment le mot final."
      ],
      scolaire: "Parcours cycle 3 en 1 h 30 : la classe joue par petits groupes, l'enseignant reçoit une fiche de préparation et une fiche de suivi. Le contenu s'appuie sur les visites et ateliers déjà proposés par le service éducatif du patrimoine, et prépare la venue au futur centre d'interprétation.",
      coecrire: [
        "La maison du point de départ : la maquette s'inspire de la Maison Bassoul, le choix final revient au service patrimoine.",
        "Les dates et les images du port : les quatre cartes sont des illustrations d'attente, à remplacer par des images d'archives fournies par la Ville.",
        "Les textes sur l'architecture créole : exemples rédigés pour la démo, à relire avec les guides conférenciers.",
        "Le personnage : gecko vert de Bourbon ou petit lézard imaginaire, à choisir ensemble.",
        "Les phrases en créole : à relire avec une personne créolophone de l'équipe."
      ],
      jouable: "Dans cette maquette, les étapes 1 et 2 se jouent en entier. Les étapes 3 et 4 sont présentées et arrivent dans l'application complète."
    },

    accueil: {
      bulle: "Salut ! Mi lé Ti Bassoul. Depuis cent ans je garde les maisons créoles de Saint-Pierre. Le carnet du gardien est fermé par quatre secrets cachés dans la ville. Tu m'aides à les retrouver ?",
      bouton: "En route, gardien·ne !"
    },

    carte: {
      titre: "Le plan du gardien",
      intro: "Quatre lieux, quatre secrets. Touche un lieu ouvert pour jouer.",
      complet: "Disponible dans l'application complète"
    },

    etapes: [
      {
        id: "e1", num: 1, nom: "La façade qui parle", lieu: "Maison Bassoul (exemple)", x: 96, y: 86, jouable: true,
        intro: "Gard sa ! Regarde bien la maison devant toi. Trois détails font d'elle une vraie case créole. Retrouve-les en touchant la façade !",
        zones: {
          lambrequins: { bon: true, titre: "Les lambrequins", texte: "Cette dentelle de bois au bord du toit guide l'eau de pluie et décore la maison." },
          varangue: { bon: true, titre: "La varangue", texte: "La varangue, c'est la terrasse couverte : on y prend le frais et on y reçoit les visites." },
          barreaudage: { bon: true, titre: "Le barreaudage", texte: "Cette barrière ajourée laisse passer l'air et la lumière tout en entourant la varangue." },
          toit: { bon: false, texte: "Belle tôle rouge ! Elle protège la case de la pluie. Cherche un détail plus fin, tout près du toit." },
          persiennes: { bon: false, texte: "Joli coup d'œil : les persiennes font entrer l'air frais. Il te reste des détails à trouver." },
          jardin: { bon: false, texte: "Le jardin créole fleurit devant la case. Les trois détails se trouvent sur la maison elle-même." }
        },
        indices: ["Lève les yeux vers le bord du toit, puis regarde la terrasse et sa petite barrière.", "Les trois détails : la dentelle du toit, la terrasse couverte, la barrière ajourée."],
        consigneMots: "Maintenant, glisse chaque mot sous le bon dessin.",
        vignettes: [
          { mot: "varangue", vb: "30 112 130 130" },
          { mot: "barreaudage", vb: "40 180 80 80" },
          { mot: "lambrequins", vb: "36 92 64 64" }
        ],
        mots: ["lambrequins", "varangue", "barreaudage"],
        reussite: "Lé bon ! Tu lis une façade comme un architecte.",
        secret: "La maison respire.",
        badge: { nom: "Œil d'architecte", icone: "👁️" }
      },
      {
        id: "e2", num: 2, nom: "Le port d'autrefois", lieu: "Front de mer", x: 200, y: 244, jouable: true,
        intro: "Ici, les bateaux chargeaient le sucre. Remets ces quatre images dans l'ordre de l'histoire, de la plus ancienne à la plus récente.",
        cartes: [
          { id: "marine", legende: "Les chaloupes à voile et la marine en bois" },
          { id: "chantier", legende: "Le chantier de la jetée en pierre" },
          { id: "trois_mats", legende: "Un grand voilier dans le port achevé" },
          { id: "moteurs", legende: "Les bateaux à moteur d'aujourd'hui" }
        ],
        melange: ["chantier", "moteurs", "marine", "trois_mats"],
        indices: ["Regarde les voiles, puis les moteurs.", "Commence par la marine en bois : la jetée en pierre arrive ensuite."],
        attente: "Illustrations d'attente : les vraies images d'archives viendront du service patrimoine.",
        reussite: "Bravo ! Tu remontes le temps comme un vrai historien.",
        secret: "La ville est née de la mer.",
        badge: { nom: "Mémoire du port", icone: "⚓" }
      },
      {
        id: "e3", num: 3, nom: "Le marché des saveurs", lieu: "Marché couvert", x: 296, y: 150, jouable: false,
        resume: "Jeu des épices et des métiers d'antan, en français et en créole : retrouver qui vendait quoi sous la halle."
      },
      {
        id: "e4", num: 4, nom: "Le carnet s'ouvre", lieu: "Hôtel de ville", x: 170, y: 60, jouable: false,
        resume: "Les quatre secrets forment le mot final : le carnet du gardien s'ouvre et invite à découvrir le programme Ville d'art et d'histoire."
      }
    ],

    victoire: {
      titre: "Deux secrets retrouvés !",
      texte: "Le carnet du gardien commence à s'ouvrir. Dans l'application complète, le marché couvert et l'hôtel de ville livrent les deux derniers secrets et le mot final.",
      merci: "Mèrsi, gardien·ne ! Ou la fé in bon travay."
    }
  };
})();
