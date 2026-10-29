/* ============================================================
   CONTENT.JS — Tous les textes du jeu (français + créole « à faire relire »)
   Les mêmes textes sont dans TEXTES.md pour relecture.
   Ligne créole : volontairement simple, marquée « à valider » à l'écran.
   ============================================================ */
window.Content = {
  guide: { nom: "Ti-Fil", sous: "l'étoile filante" },

  intro: [
    { fr: "Bonjour ! Je suis Ti-Fil, une petite étoile filante. J'ai un gros problème…", kr: "Bonzour ! Mi apèl Ti-Fil. Mi la in gro problèm…", expr: "pense" },
    { fr: "Cette nuit, en passant au-dessus des Makes, j'ai fait tomber quatre étoiles de la Croix du Sud ! Elles se sont cachées dans l'Observatoire.", kr: "Mi la lès tonm kat zétoil la Kroi di Sid !", expr: "wow" },
    { fr: "Tu veux bien m'aider à les retrouver ? Chaque étape du parcours te donne une étoile. Prêt(e) ?", kr: "Ou i ède amoin ? Alon !", expr: "content" }
  ],

  s1: {
    titre: "Espace Jaï Sing", court: "L'axe du Monde", ico: "🧭",
    brief: { fr: "Station 1 : l'espace Jaï Sing. Ici, de grands instruments traditionnels montrent les directions de référence du ciel, dont l'axe du Monde. Cherche-le sur place !", kr: "Premié stasyon : Jaï Sing. Rod l'axe di Mon !", expr: "content" },
    surPlace: "Sur place : demande à ton guide de te montrer l'instrument qui matérialise l'axe du Monde. Où pointe-t-il ?",
    q: {
      texte: "L'axe du Monde est une ligne imaginaire autour de laquelle le ciel semble tourner. Vers quoi pointe-t-il ?",
      opts: ["Vers le Soleil", "Vers le pôle céleste", "Vers la Lune", "Vers l'étoile la plus brillante"], ok: 1,
      bravo: "Exact ! L'axe du Monde est parallèle à l'axe de rotation de la Terre : il pointe vers le pôle céleste, le point fixe autour duquel tourne tout le ciel.",
      rate: "Presque ! Pense au mouvement du ciel pendant la nuit : tout tourne autour d'un point fixe. L'axe du Monde pointe vers ce point : le pôle céleste."
    },
    fait: "À La Réunion, on est dans l'hémisphère sud : c'est le pôle SUD céleste qu'on vise. Il est au-dessus de l'horizon sud, à une hauteur égale à la latitude du lieu (environ 21° ici). Et il n'y a pas d'étoile brillante pour le marquer, contrairement à l'étoile Polaire dans le nord !",
    visee: { fr: "Maintenant, vise le pôle sud céleste avec ton téléphone : tourne-toi vers le sud, puis lève un peu le téléphone (environ 21°).", kr: "Get vèr le sid ! Lèv in tikoup.", expr: "pense" },
    apres: "C'est le point autour duquel tourne tout le ciel du sud !",
    fin: { fr: "Bravo ! Voilà Acrux, l'étoile du pied de la Croix du Sud. Une de retrouvée !", kr: "Bravo ! In zétoil retrouvé !", expr: "fete" },
    classe: ["Matérialiser l'axe du Monde : l'élève montre avec le bras la direction du pôle sud céleste (hauteur ≈ latitude).", "Prolongement : pourquoi l'axe du Monde est-il incliné d'un angle égal à la latitude ? (schéma avec la Terre)", "Programme : cycle 3, « Le Soleil, la Terre, la Lune » ; cycle 4, repérage dans l'espace et le temps."]
  },

  s2: {
    titre: "Espace Ptolémée", court: "Les cadrans solaires", ico: "☀️",
    brief: { fr: "Station 2 : l'espace Ptolémée et ses cadrans solaires. L'ombre du style se déplace avec le Soleil et indique l'heure. Mais est-ce la même heure que ton téléphone ?", kr: "Dézièm stasyon : lo kadran solèr. Lo zonm i mont lèr.", expr: "pense" },
    surPlace: "Sur place : lis l'heure sur un vrai cadran solaire, puis compare avec ton téléphone. Note l'écart !",
    q: {
      texte: "Le cadran donne l'heure solaire. Ton téléphone donne l'heure légale (celle de la montre). À La Réunion, par rapport au téléphone, le cadran est…",
      opts: ["en avance", "en retard", "exactement pareil"], ok: 1,
      bravo: "Oui ! À La Réunion, le cadran solaire est en retard sur le téléphone. Et l'écart change au fil de l'année : de 2 minutes début novembre à plus de 30 minutes mi-février.",
      rate: "Pas tout à fait. Regarde l'explication ci-dessous : elle donne la raison."
    },
    pourquoi: "Pourquoi ? L'heure légale de La Réunion (UTC+4) est réglée sur un méridien situé à 60° Est, mais les Makes sont à environ 55,4° Est, donc le Soleil y passe plus tard : environ 18 minutes de décalage dû à la longitude. En plus, l'« équation du temps » (la Terre ne tourne pas à vitesse régulière autour du Soleil) ajoute ou retire jusqu'à une quinzaine de minutes selon la saison. Résultat calculé pour 2026 : le cadran est toujours en retard, de 2 minutes (début novembre) à 32 minutes (mi-février).",
    viseSoleil: { fr: "Maintenant, vise le Soleil avec ton téléphone… sans JAMAIS le regarder ! Suis la flèche et ton ombre : elle pointe à l'opposé.", kr: "Pa gard lo soley ! Gard zis lékran.", expr: "wow" },
    viseLune: { fr: "Le Soleil est couché, mais la Lune est levée. Vise la Lune !", kr: "Lo soley la ay, mé la lin i la.", expr: "content" },
    viseNuit: { fr: "Il fait nuit : le Soleil est couché. Vise plutôt la Croix du Sud !", kr: "Lo soley la ay. Rod la Kroi di Sid.", expr: "content" },
    viseSecours: { fr: "Le Soleil est couché. Vise le pôle sud céleste, comme à la station 1 !", kr: "Rod lo pol sid.", expr: "content" },
    fin: { fr: "Bravo ! Voilà Mimosa, l'étoile du bras gauche de la Croix. Deux de retrouvées !", kr: "Bravo ! Dé zétoil !", expr: "fete" },
    classe: ["Mesurer l'écart cadran/montre à 3 moments de la visite et le consigner dans un tableau.", "Prolongement : calculer 4 minutes par degré de longitude (la Terre tourne de 360° en 24 h) pour retrouver le décalage d'environ 18 minutes.", "Programme : cycle 3, repérage du temps ; cycle 4, rotation de la Terre et fuseaux horaires."]
  },

  s3: {
    titre: "Espace Newton", court: "Le télescope de recherche", ico: "🔭",
    brief: { fr: "Station 3 : l'espace Newton et ses télescopes. Certains servent à regarder le ciel en soirée, d'autres à faire de la vraie recherche. Un seul est le T60 : trouve-le !", kr: "Trwazièm stasyon : le télèskop !", expr: "wow" },
    surPlace: "Sur place : demande à ton guide de te présenter les télescopes. Lequel observe pour la recherche ?",
    q: {
      texte: "Quel instrument sert à la recherche (astéroïdes, surveillance des géocroiseurs) ? Indice : il a le plus grand miroir, donc il capte le plus de lumière.",
      ok: 3,
      bravo: "Oui, c'est le T60 ! Son miroir mesure 600 mm de diamètre : le plus grand de ces quatre instruments.",
      rate: "Ce n'est pas lui. Regarde le diamètre indiqué sur chaque carte : plus il est grand, plus l'instrument capte de lumière."
    },
    cartes: [
      { id: "lunette", nom: "Telementor", sous: "lunette 63 mm · Soleil", art: "tele" },
      { id: "c8", nom: "C8", sous: "diamètre 203 mm · scolaires", art: "c8" },
      { id: "c11", nom: "C11", sous: "diamètre 280 mm · soirées", art: "ds16" },
      { id: "t60", nom: "T60", sous: "diamètre 600 mm · recherche", art: "t60" }
    ],
    fait: "Le T60 étudie les astéroïdes et surveille les géocroiseurs, ces astéroïdes qui s'approchent de la Terre. Dans la nuit du 26 au 27 septembre 2022, il a travaillé pour l'ESA : il a suivi en direct les conséquences lumineuses de l'impact de la sonde DART de la NASA sur Dimorphos, petit satellite de l'astéroïde Didymos.",
    fin: { fr: "Bravo ! Voilà Gacrux, l'étoile du sommet de la Croix. Trois de retrouvées !", kr: "Bravo ! Trwa zétoil !", expr: "fete" },
    classe: ["Comparer les diamètres (203, 280, 600 mm) et discuter : pourquoi un grand miroir voit-il des objets plus faibles ?", "Prolongement : DART, un test de défense planétaire — que cherchait-on à mesurer ?", "Programme : cycle 4, technologie (instruments) et sciences (système solaire)."]
  },

  bonus: {
    titre: "Soirée : mode nuit rouge", court: "La Croix du Sud", ico: "🌌",
    brief: { fr: "Bonus de soirée ! Regarde : l'écran est devenu rouge. Cela protège ta vision de nuit : tes yeux s'habituent à l'obscurité et tu vois mieux les étoiles.", kr: "Lékran i rouj : zié i vwa mié dan nwar.", expr: "wow" },
    note: "Démo : si tu joues en plein jour, l'application simule une fin de nuit à 4 h 30 (en novembre, la Croix du Sud se voit surtout avant l'aube ; selon la saison, elle est visible plus tôt ou plus tard dans la nuit). Sur place, c'est le vrai ciel qui compte.",
    visee: { fr: "Vise la Croix du Sud ! Elle est dans le ciel du sud. Baisse la luminosité de ton téléphone au minimum.", kr: "Rod la Kroi di Sid !", expr: "pense" },
    apres: "Les quatre étoiles de la Croix du Sud sont dessinées à l'écran.",
    axe: "Astuce pour trouver le sud : prolonge le grand axe de la Croix (de Gacrux vers Acrux) sur environ 4,5 fois sa longueur : tu arrives près du pôle sud céleste. Les deux Pointeurs, α et β du Centaure, aident à confirmer.",
    fin: { fr: "Magnifique ! Voilà Imai, la dernière étoile. La Croix du Sud est complète !", kr: "Mervèyé ! La Kroi di Sid lé konplè !", expr: "fete" },
    classe: ["Soirée : à l'œil nu, repérer la Croix du Sud puis les Pointeurs ; comparer avec l'écran.", "Prolongement : pourquoi la Croix du Sud tourne-t-elle autour du pôle sud céleste ?"]
  },

  fin: {
    ok: { fr: "MISSION ACCOMPLIE ! Grâce à toi, la Croix du Sud brille de nouveau au-dessus des Makes. Merci, petit(e) astronome !", kr: "Mission fini ! Mèrsi, astronòm !", expr: "fete" },
    presque: { fr: "Presque ! Il manque une étoile : Imai, cachée dans le ciel du soir. Reviens la chercher lors d'une soirée d'observation !", kr: "Rèste in zétoil !", expr: "content" }
  },

  credits: [
    "Démo de principe réalisée pour l'Observatoire astronomique des Makes (La Réunion).",
    "Tous les contenus (faits, instruments, textes) sont à faire relire et valider par l'équipe de l'Observatoire avant toute mise en service.",
    "Les textes en créole sont des propositions simples, à faire relire par un locuteur.",
    "Positions du Soleil, de la Lune, des planètes et des étoiles : calculées en direct avec astronomy-engine (licence MIT, copie locale).",
    "Illustrations et personnage de Ti-Fil : créations originales."
  ],

  // Déroulé de la démo enchaînée (RDV)
  demo: [
    ["accueil"], ["intro"], ["hub"],
    ["s1", "brief"], ["s1", "quiz"], ["s1", "viser"],
    ["s2", "brief"], ["s2", "cadran"], ["s2", "quiz"], ["s2", "viser"],
    ["s3", "brief"], ["s3", "quiz"],
    ["bonus", "brief"], ["bonus", "viser"], ["bonus", "axe"],
    ["fin"]
  ]
};
