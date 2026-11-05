/* ============================================================
   CONTENT.JS — TOUS les textes de « Ti-Komèt et le ciel du Sud »
   (FR · KR · EN). Le kréol est une PROPOSITION à faire relire par un
   locuteur (signalée dans les Crédits) ; quand une phrase n'est pas sûre,
   on laisse le français (pas de champ kr).
   Faits : voir SOURCES.md (codes [M1]…). Textes à valider par l'équipe
   pédagogique de l'Observatoire. TEXTES.md est généré depuis ce fichier :
   node tests/generer-textes.js
   ============================================================ */
(function () {
  "use strict";

  // ======== VERSION DÉMO ========
  // Un seul drapeau : false = étapes 1 et 2 jouables, tout le reste VISIBLE mais VERROUILLÉ.
  // true = application complète (les étapes 3 à 6 et le brevet devront alors être codées : leur place est prévue).
  const CONFIG = { versionComplete: false, jouables: [1, 2], rdv: "vendredi 6 novembre 2026 · 10 h 30" };

  const guide = { nom: "Ti-Komèt", sous: { fr: "la petite comète", en: "the little comet", kr: "la ti komèt" } };

  const publics = {
    famille: { ico: "famille", fr: "Famille", en: "Family", kr: "Fanmi", desc: { fr: "Visite de jour, à faire ensemble (dès 7 ans environ, à valider). Affichage lisible en plein soleil.", en: "Day visit, to play together (from about age 7, to be confirmed). Sun-readable display." } },
    classe: { ico: "ecole", fr: "Classe", en: "School", kr: "Klas", desc: { fr: "Cycle 3 et cycle 4 : encadrés « Pour la classe », mots-clés du programme, une question à débattre par étape.", en: "Ages 8-15: “For the class” boxes, curriculum keywords, one debate question per stage." } },
    soiree: { ico: "lune", fr: "Soirée", en: "Evening", kr: "Swaré", desc: { fr: "Écran tout rouge, peu lumineux : il préserve la vision de nuit des observateurs. Ciel du soir simulé si besoin.", en: "All-red, dim screen that protects observers' night vision. Evening sky simulated if needed." } }
  };

  const accueil = {
    kicker: { fr: "Observatoire des Makes · La Réunion", en: "Les Makes Observatory · Réunion Island", kr: "Obsèrvatwar Makes · La Rényon" },
    titre: { fr: "Ti-Komèt et le ciel du Sud", en: "Ti-Komèt and the Southern Sky", kr: "Ti-Komèt ék lo syèl di Sid" },
    sous: { fr: "Une petite comète s'est perdue au-dessus des Makes. Espace après espace, apprends-lui à se repérer dans le ciel austral.", en: "A little comet got lost above Les Makes. Space by space, teach her to find her way in the southern sky.", kr: "In ti komèt la pèrdi o-dsi Makes. Espas apré espas, aprann aèl rotrouv son somin dan lo syèl." },
    promesses: [{ n: "5", fr: "espaces + 1 soirée", en: "spaces + 1 evening" }, { n: "3", fr: "langues", en: "languages" }, { n: "0", fr: "réseau requis", en: "network needed" }]
  };

  // ---------- intro (bulles de Ti-Komèt) ----------
  const intro = [
    { expr: "wow", fr: "Psst ! Lève les yeux… plus haut ! Bonjour, je suis Ti-Komèt, une petite comète : une boule de glace et de poussière qui tourne autour du Soleil.", kr: "Psst ! Lèv out zié… pli o ! Bonzour, mi apèl Ti-Komèt. Mi lé in ti komèt : in boul glas ék lapousièr i tourn otour lo Soley.", en: "Psst! Look up… higher! Hi, I'm Ti-Komèt, a little comet: a ball of ice and dust travelling around the Sun." },
    { expr: "inquiete", fr: "J'arrive du fond du système solaire, et c'est la première fois que je passe au-dessus du ciel du Sud. Ici, je ne reconnais rien : je suis perdue !", kr: "Mi sort o fon sistèm solèr, é lé premié fwa mi pas o-dsi lo syèl di Sid. Isi, mi koné pa rien : mi lé pèrdi !", en: "I come from the far edge of the solar system, and it's my first time over the southern sky. I don't recognise anything: I'm lost!" },
    { expr: "content", fr: "Mais j'ai de la chance : l'Observatoire des Makes est né grâce à une comète ! En 1986, au passage de la comète de Halley, des passionnés ont eu l'idée de le construire ici.", kr: "Mé mi gingn la shans : l'Obsèrvatwar Makes la nès gras in komèt ! An 1986, kan la komèt Halley la pasé, bann pasioné la gingn lidé konstrui ali isi.", en: "But I'm lucky: Les Makes Observatory was born thanks to a comet! In 1986, when Halley's Comet passed by, enthusiasts had the idea of building it here.", src: "M3",
      classe: { expr: "content", fr: "Mais j'ai de la chance : l'Observatoire des Makes est né grâce à une comète, celle de Halley, en 1986. Bien sûr, une comète ne parle pas : je suis un personnage inventé. Mais tout ce que tu vas apprendre est vrai !", en: "But I'm lucky: Les Makes Observatory was born thanks to a comet, Halley's, in 1986. Of course, comets don't talk: I'm a made-up character. But everything you'll learn is true!" } },
    { expr: "clin", fr: "Espace après espace, apprends-moi à me repérer dans le ciel. À chaque étape, tu gagnes un repère pour ma carte du ciel. À la fin : ton brevet d'astronome junior !", kr: "Espas apré espas, aprann amwin rotrouv mon somin dan lo syèl. Shak étap, ou gingn in rèpèr pou mon kart di syèl. Alon !", en: "Space by space, teach me to find my way in the sky. Each stage earns you a landmark for my sky map. At the end: your junior astronomer certificate!" }
  ];

  // ---------- les étapes (ordre de la visite de jour, À VALIDER avec l'Observatoire) ----------
  const stations = [
    {
      id: 1, ico: "boussole", titre: { fr: "L'axe du Monde", en: "The World's Axis", kr: "L'aks di Mond" },
      lieu: { fr: "Espace Jaï Sing", en: "Jaï Sing area" },
      court: { fr: "Incline l'instrument, puis vise le pôle sud céleste avec ton téléphone.", en: "Tilt the instrument, then aim at the south celestial pole with your phone." },
      repere: { fr: "Le pôle sud céleste", en: "The south celestial pole", kr: "Lo pôl sid di syèl" },
      brief: { expr: "pense", fr: "Ici, tout le ciel tourne autour de moi… mais autour de QUOI ? Les instruments de l'espace Jaï Sing dessinent les grandes lignes du ciel. La plus importante : l'axe du Monde.", kr: "Isi, tout lo syèl i tourn otour d'moin… mé otour KOSA ? Bann instriman Jaï Sing i dési bann gran lign di syèl. La pli inportan : l'aks di Mond.", en: "Here the whole sky spins around me… but around WHAT? The instruments of the Jaï Sing area draw the sky's great lines. The most important one: the World's Axis." },
      surPlace: { fr: "Sur place : repère l'instrument dont l'arête monte vers le sud. Il matérialise l'axe du Monde (ton guide te le montrera).", en: "On site: find the instrument whose edge rises towards the south. It shows the World's Axis (your guide will point it out)." },
      consigneAxe: { fr: "Fais glisser la poignée dorée pour incliner l'arête. Vise le centre autour duquel tournent les étoiles.", en: "Drag the golden handle to tilt the edge. Aim at the centre the stars spin around." },
      axeOk: { expr: "wow", fr: "Regarde ! Les étoiles tournent pile autour du bout de ton axe. Il monte de 21° au-dessus de l'horizon sud.", kr: "Gard ! Bann zétoil i tourn zis otour lo bou out aks. Li mont 21° o-dsi l'orizon sid.", en: "Look! The stars spin right around the tip of your axis. It rises 21° above the southern horizon." },
      visee: { expr: "pense", fr: "À toi ! Vise ce point avec ton téléphone : le pôle sud céleste. Tourne-toi vers le sud, puis lève un peu le téléphone.", kr: "Out tour ! Vis lo pwin ék out téléfone : lo pôl sid di syèl. Tourn vèr lo sid, apré lèv in tikou.", en: "Your turn! Aim at that point with your phone: the south celestial pole. Face south, then raise your phone a little." },
      quiz: {
        q: { fr: "Aux Makes, l'axe du Monde monte de 21° au-dessus de l'horizon sud. Pourquoi 21° ?", en: "At Les Makes, the World's Axis rises 21° above the southern horizon. Why 21°?" },
        opts: [
          { fr: "Parce que les Makes sont à 21° de latitude sud", en: "Because Les Makes lie at latitude 21° south" },
          { fr: "Parce que l'axe de la Terre est penché de 23°", en: "Because Earth's axis is tilted by 23°" },
          { fr: "Parce que c'est la hauteur du Soleil à midi", en: "Because that's the Sun's height at noon" }],
        ok: 0,
        bravo: { fr: "Exact ! La hauteur du pôle céleste au-dessus de l'horizon est égale à la latitude du lieu. À Paris (environ 49° nord), l'axe du Monde monte de 49°… vers le nord.", en: "Right! The height of the celestial pole above the horizon equals the latitude. In Paris (about 49° north), the World's Axis rises 49°… towards the north." },
        rates: [null,
          { fr: "Piège classique ! Les 23° sont l'inclinaison de l'axe de la Terre sur son orbite : c'est elle qui fait les saisons. Ici, la réponse dépend de l'endroit où tu es sur la Terre.", en: "Classic trap! 23° is the tilt of Earth's axis on its orbit: it causes the seasons. Here, the answer depends on where you are on Earth." },
          { fr: "La hauteur du Soleil à midi change tous les jours ; celle du pôle, jamais. Cherche ce qui dépend de l'endroit où tu es sur la Terre.", en: "The Sun's noon height changes every day; the pole's never does. Look for what depends on where you are on Earth." }]
      },
      fin: { expr: "fete", fr: "Merci ! Je sais où est le pôle sud céleste : le point fixe autour duquel tourne tout le ciel du Sud. Premier repère pour ma carte !", kr: "Mersi ! Mi koné lé ousa lo pôl sid di syèl : lo pwin i boug pa, otour d'li tout lo syèl i tourn. Premié rèpèr !", en: "Thank you! I know where the south celestial pole is: the fixed point the whole southern sky turns around. First landmark for my map!" },
      fait: { fr: "Dans le ciel du Sud, aucune étoile brillante ne marque le pôle. La plus proche, sigma de l'Octant, est à peine visible à l'œil nu, même sous un ciel très noir. Au nord, l'étoile Polaire joue ce rôle, et elle se voit bien mieux.", en: "In the southern sky, no bright star marks the pole. The closest one, Sigma Octantis, is barely visible to the naked eye, even under a very dark sky. In the north, the Pole Star plays that role, and it is far easier to see.", src: "M8" },
      jaiSing: { fr: "Le nom de l'espace évoque Jai Singh II, qui fit bâtir au XVIIIe siècle de grands instruments de pierre en Inde. À Jaipur, l'arête de son cadran géant est inclinée de 27° : la latitude de Jaipur. Même idée qu'ici, avec 21°.", en: "The area's name recalls Jai Singh II, who built huge stone instruments in India in the 18th century. In Jaipur, the edge of his giant sundial is tilted 27°: Jaipur's latitude. Same idea as here, with 21°.", src: "M6" },
      classe: { notion: "Le ciel semble tourner autour de l'axe du Monde, parallèle à l'axe de rotation de la Terre. Sa hauteur au-dessus de l'horizon est égale à la latitude.", mots: ["axe de rotation", "pôle céleste", "latitude", "horizon", "angle"], q: "Si l'on partait pour le pôle Sud, comment changerait l'inclinaison de l'axe du Monde ? Et à l'équateur ?" }
    },
    {
      id: 2, ico: "coupole", titre: { fr: "Ouvre la coupole", en: "Open the dome", kr: "Ouv la koupol" },
      lieu: { fr: "Les deux petites coupoles", en: "The two small domes" },
      court: { fr: "Tourne la coupole, ouvre la fente, lève le télescope : une vraie planète t'attend.", en: "Turn the dome, open the slit, raise the telescope: a real planet awaits." },
      repere: { fr: "L'adresse d'un astre : azimut et hauteur", en: "A star's address: azimuth and altitude", kr: "Ladrès in zastr : azimit ék otèr" },
      brief: { expr: "content", fr: "Sous ces coupoles, les astronomes amateurs observent la nuit. Pour viser un astre, il faut tourner la coupole, ouvrir sa fente et lever le télescope. Ce soir, je voudrais revoir une planète croisée en chemin…", kr: "Anba bann koupol-la, bann astronom amatèr i obsèrv la nwit. Pou vis in zastr, i fo tourn la koupol, ouv la fant, lèv lo téléskop. Swar-la, mi vé oir in planèt mi la kroizé…", en: "Under these domes, amateur astronomers observe at night. To aim at an object, you turn the dome, open its slit and raise the telescope. Tonight, I'd love to see a planet I met on my way…" },
      surPlace: { fr: "Sur place : regarde la fente de la coupole. De quel côté du ciel s'ouvre-t-elle ? (Modèle de télescope à l'intérieur : à préciser avec l'Observatoire.)", en: "On site: look at the dome's slit. Which side of the sky does it face? (Telescope model inside: to be confirmed with the Observatory.)" },
      explique: { fr: "L'azimut dit vers où tourner : 0° = nord, 90° = est, 180° = sud, 270° = ouest. La hauteur dit de combien lever : 0° = l'horizon, 90° = au-dessus de ta tête.", en: "Azimuth tells you which way to turn: 0° = north, 90° = east, 180° = south, 270° = west. Altitude tells you how high: 0° = horizon, 90° = straight overhead." },
      etapes: [
        { fr: "Tourne la coupole du doigt : amène la fente face à l'azimut", en: "Turn the dome with your finger: bring the slit to azimuth" },
        { fr: "Ouvre la fente : touche la trappe", en: "Open the slit: tap the shutter" },
        { fr: "Lève le télescope à la hauteur", en: "Raise the telescope to altitude" },
        { fr: "Regarde dans l'oculaire !", en: "Look through the eyepiece!" }],
      derive: { expr: "wow", fr: "Oh ! Elle glisse hors de l'oculaire… Ce n'est pas elle qui file : c'est la Terre qui tourne sous nos pieds ! Allume le moteur de suivi.", kr: "Oh ! Li glis déor… Sé pa li i fil : sé la Tèr i tourn anba nout pié ! Alim lo motèr.", en: "Oh! It's sliding out of the eyepiece… It isn't racing away: it's the Earth turning beneath our feet! Switch on the tracking motor." },
      quiz: {
        q: { fr: "Pourquoi l'astre sortait-il tout seul de l'oculaire ?", en: "Why did the object drift out of the eyepiece by itself?" },
        opts: [
          { fr: "Parce que la Terre tourne sur elle-même", en: "Because the Earth spins on its axis" },
          { fr: "Parce que la planète file à toute vitesse", en: "Because the planet is racing along" },
          { fr: "Parce que la coupole tournait encore", en: "Because the dome was still turning" }],
        ok: 0,
        bravo: { fr: "Oui ! La Terre fait un tour sur elle-même en un jour : le ciel semble tourner de 15° par heure. Le moteur fait tourner le télescope autour d'un axe parallèle… à l'axe du Monde de l'étape 1 !", en: "Yes! The Earth spins once a day, so the sky seems to turn 15° per hour. The motor turns the telescope around an axis parallel… to the World's Axis from stage 1!" },
        rates: [null,
          { fr: "Les planètes se déplacent bien parmi les étoiles, mais si lentement qu'il faut des jours pour le voir. Ce qui va vite, c'est autre chose…", en: "Planets do move among the stars, but so slowly that it takes days to notice. What moves fast is something else…" },
          { fr: "La coupole était arrêtée. C'est autre chose qui tourne… sous tes pieds !", en: "The dome had stopped. Something else is turning… under your feet!" }]
      },
      fin: { expr: "fete", fr: "Je l'ai vue ! Grâce à toi, je sais qu'un astre a une « adresse » dans le ciel : un azimut et une hauteur. Deuxième repère !", kr: "Mi la oir ali ! Gras a ou, mi koné in zastr i na in ladrès dan lo syèl : in azimit ék in otèr. Dézièm rèpèr !", en: "I saw it! Thanks to you, I know that a sky object has an “address”: an azimuth and an altitude. Second landmark!" },
      faitCoupole: { fr: "La coupole abrite le télescope du vent et de l'humidité. On n'ouvre qu'une fente, que l'on fait tourner vers la partie du ciel observée.", en: "The dome shelters the telescope from wind and damp. Only a slit is opened, and it is turned towards the part of the sky being observed.", src: "M10" },
      classe: { notion: "Repérer un astre dans le ciel avec deux angles : l'azimut (direction) et la hauteur. Le mouvement apparent des astres est dû à la rotation de la Terre.", mots: ["azimut", "hauteur", "rotation de la Terre", "mouvement apparent", "15° par heure"], q: "Une heure plus tard, faudra-t-il encore tourner la coupole ? Dans quel sens ?" }
    },
    { id: 3, ico: "telescope", verrou: true, titre: { fr: "Le bon télescope", en: "The right telescope" }, lieu: { fr: "Espace Newton", en: "Newton area" },
      court: { fr: "Assemble objectif et oculaire pour chaque mission : taches du Soleil, planètes, astéroïdes.", en: "Combine lens and eyepiece for each mission: sunspots, planets, asteroids." } },
    { id: 4, ico: "cadran", verrou: true, titre: { fr: "L'ombre à l'envers", en: "The backwards shadow" }, lieu: { fr: "Espace Ptolémée", en: "Ptolemy area" },
      court: { fr: "Règle un cadran solaire à 21° sud : ici, l'ombre tourne dans l'autre sens qu'en métropole !", en: "Set a sundial for 21° south: here, the shadow turns the other way round!" } },
    { id: 5, ico: "planetes", verrou: true, titre: { fr: "Le système solaire en poche", en: "The solar system in your pocket" }, lieu: { fr: "Salle Einstein", en: "Einstein room" },
      court: { fr: "Range les planètes à l'échelle, puis dévie un astéroïde comme la mission DART.", en: "Place the planets to scale, then deflect an asteroid like the DART mission." } },
    { id: 6, ico: "lune", verrou: true, soir: true, titre: { fr: "Le ciel de Ti-Komèt", en: "Ti-Komèt's sky" }, lieu: { fr: "Soirée · terrasse d'observation", en: "Evening · observing terrace" },
      court: { fr: "En nuit rouge : relie la Croix du Sud, retrouve le pôle grâce à elle, compte les étoiles comme dans l'atelier LASCAR.", en: "In red night mode: join the Southern Cross, find the pole with it, count stars as in the LASCAR workshop." } }
  ];
  const brevet = { titre: { fr: "Brevet d'astronome junior des Makes", en: "Les Makes junior astronomer certificate" }, court: { fr: "À imprimer ou à partager, avec les 6 repères de ta carte du ciel.", en: "To print or share, with the 6 landmarks of your sky map." } };

  // ---------- « Rejoins le prochain espace » ----------
  const marche = {
    2: { expr: "clin", fr: "Bravo pour ce premier repère ! On marche jusqu'aux coupoles, sans courir. L'étape suivante s'ouvre quand tu y es.", kr: "Bravo pou lo premié rèpèr ! Asot, nou mars ziska bann koupol, san kour.", en: "Well done on your first landmark! Let's walk to the domes, no running. The next stage opens when you get there.",
      repere: { fr: "Deux petites coupoles blanches, près du bâtiment principal (emplacement à valider avec l'Observatoire).", en: "Two small white domes near the main building (location to be confirmed with the Observatory)." } }
  };

  // ---------- textes d'interface ----------
  const UI = {
    ecouter: { fr: "Écouter", en: "Listen", kr: "Ékout" },
    suite: { fr: "Suite", en: "Next", kr: "Apré" },
    commencer: { fr: "Commencer l'aventure", en: "Start the adventure", kr: "Komans" },
    continuer: { fr: "Continuer", en: "Continue", kr: "Kontinié" },
    parcours: { fr: "Voir le parcours", en: "See the route", kr: "Oir lo parkour" },
    pret: { fr: "C'est parti", en: "Let's go", kr: "Alé" },
    etape: { fr: "Étape", en: "Stage", kr: "Étap" },
    sur: { fr: "sur", en: "of", kr: "si" },
    savais: { fr: "Le savais-tu ?", en: "Did you know?", kr: "Ou té i koné ?" },
    repereGagne: { fr: "Repère gagné", en: "Landmark earned", kr: "Rèpèr gingné" },
    retourParcours: { fr: "Le parcours", en: "The route", kr: "Lo parkour" },
    arrive: { fr: "Je suis arrivé·e", en: "I'm here", kr: "Mi lé arivé" },
    source: { fr: "Source", en: "Source" },
    mission: { fr: "Ta mission", en: "Your mission", kr: "Out misyon" },
    surPlace: { fr: "Sur place", en: "On site", kr: "Si plas" }
  };

  // ---------- diaporama ?demo=1 (s'arrête à la fin de la démo) ----------
  const demo = [
    ["projet"], ["accueil"], ["intro", "0"], ["intro", "2"], ["hub"],
    ["st1", "brief"], ["st1", "axe"], ["st1", "visee"], ["st1", "quiz"], ["st1", "info"],
    ["marche", "2"], ["st2", "brief"], ["st2", "coupole"], ["st2", "quiz"], ["st2", "info"],
    ["hub"], ["findemo"], ["fiche"], ["observatoire"], ["stats"]
  ];

  const credits = [
    "Concept, textes et développement : Atma digital (Jonathan Bou et Aurélie). Prototype du " + "6/11/2026, non publié.",
    "Ti-Komèt est un personnage inventé : une comète ne parle pas et ne se perd pas. Les faits scientifiques, eux, sont sourcés (SOURCES.md) et restent À RELIRE par l'équipe pédagogique de l'Observatoire.",
    "Kréol : proposition à faire relire par un locuteur avant tout usage public. Voix : synthèse du navigateur en attendant les voix enregistrées (français, kréol, anglais).",
    "Positions des astres calculées sur le téléphone avec astronomy-engine (Don Cross, licence MIT), copie locale. Déclinaison magnétique : modèle WMM2025 (NOAA).",
    "Illustrations SVG maison, d'après les descriptions publiées par l'Observatoire : à valider ou redessiner d'après photos du lieu. Plan du parcours schématique.",
    "Aucune donnée personnelle collectée. Statistiques : compteurs anonymes, sur ce téléphone seulement."
  ];

  window.Content = { CONFIG, guide, publics, accueil, intro, stations, brevet, marche, UI, demo, credits };
})();
