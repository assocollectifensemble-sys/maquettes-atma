/* ============================================================
   CONTENT.JS — TOUS les textes de l'aventure (FR / KR / EN).
   - FR : texte de référence, à relire par l'équipe du Muséum.
   - KR : créole réunionnais, PROPOSITION À FAIRE RELIRE (bulles et
     quelques libellés). Les consignes de jeu restent en français.
   - EN : visiteurs anglophones.
   - Les codes [M1]… renvoient à SOURCES.md.
   - L'identifiant d'une bulle = nom du fichier voix :
     assets/audio/<id>.<fr|kr|en>.mp3
   Règle d'écriture : formulation positive (on dit ce qu'on gagne).
   ============================================================ */
(function () {
  "use strict";

  // VERSION DÉMO : étapes 1 et 2 jouables, le reste visible et verrouillé.
  // Passer à true quand les étapes 3, 4, 5, le jardin et le diplôme seront écrits.
  const CONFIG = { versionComplete: false };

  const UI = {
    suite: { fr: "Suite", kr: "Apré", en: "Next" },
    ecouter: { fr: "Écouter", kr: "Ékout", en: "Listen" },
    commencer: { fr: "Commencer l'enquête", kr: "Komans lankèt", en: "Start the investigation" },
    continuer: { fr: "Continuer l'enquête", kr: "Kontinié lankèt", en: "Continue the investigation" },
    parcours: { fr: "Voir le parcours", kr: "Oir lo parkour", en: "See the trail" },
    arrive: { fr: "Je suis arrivé·e", kr: "Lé arivé", en: "I'm here" },
    etape: { fr: "Étape", kr: "Étap", en: "Stage" },
    sur: { fr: "sur", kr: "su", en: "of" },
    source: { fr: "Source", kr: "Sours", en: "Source" },
    tourDe: { fr: "Au tour de", kr: "Lé o tour", en: "Your turn," },
    tenir: { fr: "de tenir la tablette", kr: "pou tienbo la tablèt", en: "to hold the tablet" }
  };

  const titre = { fr: "Sur la piste des animaux disparus", kr: "Su la tras bann zanimo disparu", en: "On the trail of vanished animals" };

  const publics = {
    famille: { ico: "👨‍👩‍👧", fr: "Famille", kr: "Fanmiy", en: "Family", desc: { fr: "Enfants de 8 à 12 ans avec leurs parents : on joue ensemble sur un téléphone.", en: "Kids aged 8-12 with their parents, sharing one phone." } },
    classe: { ico: "🎓", fr: "Classe", kr: "Klas", en: "School class", desc: { fr: "Cycles 2 et 3 : encadrés « Pour la classe » et mode tablette de groupe (une tablette pour 3 à 5 élèves).", en: "Primary school: “For the class” boxes and group-tablet mode (one tablet for 3-5 pupils)." } }
  };

  // ---------- Introduction : Ti-Vent, jeune pétrel de Barau [M65, M66] ----------
  const intro = [
    { expr: "surpris", fr: "Psst… par ici ! Moi, c'est Ti-Vent, un jeune pétrel de Barau. Cette nuit, j'ai quitté mon nid, tout en haut du Piton des Neiges, pour mon tout premier vol vers la mer.",
      kr: "Psst… par isi ! Mwin, sé Ti-Vent, in zène pétrèl Barau. Sète nwit, mwin la kit mon ni, tout an o Pitone dé Nèz, pou mon promié vol ziska la mèr.",
      en: "Psst… over here! I'm Ti-Vent, a young Barau's petrel. Last night I left my nest, high up on the Piton des Neiges, for my very first flight to the sea." },
    { expr: "pense", fr: "Les lumières de la ville m'ont ébloui… et me voilà posé dans le Jardin de l'État, juste devant le Muséum ! Quelqu'un a appelé la SEOR : ce soir, son équipe m'aidera à rejoindre l'océan.",
      kr: "Bann limièr la vil la ébloui amwin… é koman mi sa la, dann Jardin lÉta, zis divan lo Mizéom ! Inn moun la apèl la SEOR : sète swar, zot ékip va èd amwin rézoinn lo oséan.",
      en: "The city lights dazzled me… and here I am in the Jardin de l'État, right outside the Museum! Someone called SEOR, the bird society: tonight their team will help me reach the ocean." },
    { expr: "content", fr: "En attendant, une question me trotte dans la tête : qui vivait sur mon île AVANT moi ? Les réponses dorment là-haut, au premier étage du Muséum.",
      kr: "Anatandan, inn késtion i tourn dann mon tèt : kisa i viv dsi mon zil AVAN mwin ? Bann répons i dor la-o, o promié étaz Mizéom.",
      en: "Meanwhile, I keep wondering: who lived on my island BEFORE me? The answers are sleeping upstairs, on the Museum's first floor." },
    { expr: "clin", fr: "Tu m'aides à mener l'enquête, de vitrine en vitrine ? À chaque découverte, une nouvelle planche rejoint ton carnet de naturaliste !",
      kr: "Ou èd amwin fé lankèt, vitrine apré vitrine ? Shak dékouvèrt, inn nouvèl plansh i rant dann out karné natiralis !",
      en: "Will you help me investigate, display case by display case? Every discovery adds a new plate to your naturalist's notebook!",
      classe: { fr: "Tu m'aides à mener l'enquête ? Petit secret : un vrai pétrel communique avec des cris. Moi, je parle pour l'histoire 😉 Le reste, ce sont de vraies découvertes de scientifiques !",
        kr: "Ou èd amwin fé lankèt ? Ti sekré : in vré pétrèl i koz ék son kri. Mwin, mi koz pou zistoir 😉 Lo rès, sé bann vré dékouvèrt bann siantifik !",
        en: "Will you help me investigate? Little secret: a real petrel talks with calls. I talk for the story 😉 Everything else is real science!" } }
  ];

  // ---------- Les étapes (1 et 2 jouables dans la démo) ----------
  const etapes = [
    { id: "1", ico: "🦴", titre: { fr: "L'énigme du Solitaire", kr: "Lénigm Solitèr", en: "The Solitaire mystery" },
      lieu: { fr: "Salle Lacroix · vitrine des animaux disparus", en: "Lacroix room · extinct animals case" },
      apercu: { fr: "Fouille, squelette à remonter, et le grand secret du « dodo blanc ».", en: "Dig, rebuild a skeleton, uncover the “white dodo” secret." } },
    { id: "2", ico: "🗺️", titre: { fr: "Les îles sœurs", kr: "Bann zil sèr", en: "The sister islands" },
      lieu: { fr: "Salle Lacroix · squelette du dodo", en: "Lacroix room · dodo skeleton" },
      apercu: { fr: "Chaque animal sur son île, puis la grande règle du temps.", en: "Each animal on its island, then the great time ruler." } },
    { id: "3", ico: "⛰️", titre: { fr: "De la montagne au lagon", kr: "La montagn ziska lagon", en: "From mountain to lagoon" },
      lieu: { fr: "Salle Lacroix · faune actuelle des Mascareignes", en: "Lacroix room · today's wildlife" },
      apercu: { fr: "Replace chaque animal vivant dans son milieu : pétrel, tuit-tuit, gecko vert, papangue…", en: "Put each living animal back in its habitat." } },
    { id: "4", ico: "🐦", titre: { fr: "À chaque bec son repas", kr: "Shak bèk son manzé", en: "A beak for every meal" },
      lieu: { fr: "Oiseaux des mers du Sud · emplacement à valider", en: "Southern seabirds · location to confirm" },
      apercu: { fr: "Associe les becs et les nourritures des oiseaux marins.", en: "Match seabird beaks to their food." } },
    { id: "5", ico: "🐟", titre: { fr: "Le poisson venu des fossiles", kr: "Pwason sorti dann fosil", en: "The fish from the fossils" },
      lieu: { fr: "Cœlacanthe des Comores · salle à valider", en: "Comoros coelacanth · room to confirm" },
      apercu: { fr: "Remonte le temps avec le cœlacanthe, surnommé « fossile vivant ».", en: "Travel back in time with the coelacanth." } },
    { id: "jardin", ico: "🌳", titre: { fr: "Éteins la ville !", kr: "Tèy la vil !", en: "Lights out!" },
      lieu: { fr: "Jardin de l'État · final", en: "Jardin de l'État · finale" },
      apercu: { fr: "Éteins les lumières pour guider les jeunes pétrels vers la mer, puis cherche le baobab du jardin.", en: "Switch off the lights to guide young petrels to the sea." } }
  ];
  const diplome = { titre: { fr: "Diplôme de jeune naturaliste du Muséum", en: "Young naturalist diploma" }, apercu: { fr: "Ton carnet complet, ton prénom, à imprimer ou à partager.", en: "Your full notebook and name, to print or share." } };

  // ---------- Étape 1 · L'énigme du Solitaire [M33-M42] ----------
  const st1 = {
    brief: { expr: "pense", fr: "Dans cette salle, une vitrine raconte un oiseau surnommé « Solitaire ». Pendant longtemps, des savants l'ont imaginé en gros « dodo blanc »… Qui avait raison ? Les os vont nous le dire !",
      kr: "Dann sète sal, inn vitrine i rakont in zozo bann moun i apèl « Solitèr ». Lontan, bann savan la imazine ali an gro « dodo blan »… Kisa lavé rézon ? Bann zo va dir anou !",
      en: "In this room, a display case tells the story of a bird nicknamed “Solitaire”. For a long time, scholars imagined it as a big “white dodo”… Who was right? The bones will tell us!",
      classe: { fr: "Dans cette salle, une vitrine raconte le « Solitaire ». Mission de paléontologue : comparer des récits, des tableaux… et des os. Quelle preuve est la plus solide ?",
        kr: "Dann sète sal, inn vitrine i rakont lo « Solitèr ». Misyon paléontolog : konpar bann rési, bann tablo… é bann zo. Kèl prèv lé pli solid ?",
        en: "This case tells the story of the “Solitaire”. Palaeontologist mission: compare accounts, paintings… and bones. Which evidence is strongest?" } },
    observer: { fr: "Devant la vitrine : repère le Solitaire et regarde la couleur du bout de ses ailes.", en: "At the case: find the Solitaire and look at the colour of its wing tips." },
    fouille: { fr: "Ton doigt devient un pinceau de paléontologue : frotte la terre pour dégager les 5 os cachés.", en: "Your finger is a palaeontologist's brush: rub the soil to uncover the 5 hidden bones." },
    noms: { crane: { fr: "Le crâne et son bec", en: "Skull and beak" }, cou: { fr: "Les vertèbres du cou", en: "Neck vertebrae" }, aile: { fr: "Un os de l'aile", en: "A wing bone" }, sternum: { fr: "Le sternum", en: "Breastbone" }, patte: { fr: "La patte", en: "The leg" } },
    court: { crane: { fr: "Crâne", en: "Skull" }, cou: { fr: "Cou", en: "Neck" }, aile: { fr: "Aile", en: "Wing" }, sternum: { fr: "Sternum", en: "Breastbone" }, patte: { fr: "Patte", en: "Leg" } },
    osTrouve: { fr: "Os trouvé :", en: "Bone found:" },
    fouilleFin: { expr: "fete", fr: "Les 5 os sont dégagés ! Des os comme ceux-là ont été retrouvés pour de vrai à La Réunion, dans une grotte et lors de fouilles dans l'ouest de l'île. Maintenant, on remonte le squelette !",
      kr: "Bann 5 zo lé dégazé ! Bann zo konmsa la té trouvé pou dovré La Rényon, dann in gro trou é dann bann fouy lwès lil. Astèr, nou romont lo skelèt !",
      en: "All 5 bones are uncovered! Bones like these were really found on Réunion, in a cave and during digs in the west of the island. Now let's rebuild the skeleton!" },
    squelette: { fr: "Glisse chaque os à sa place sur la silhouette. Astuce : touche un os, puis son emplacement.", en: "Drag each bone onto the silhouette. Tip: tap a bone, then its spot." },
    sqBravo: { crane: { fr: "Le crâne ! Regarde ce bec fin et plutôt court…", en: "The skull! Look at that slim, rather short beak…" }, cou: { fr: "Un long cou souple, bien vu.", en: "A long flexible neck, well done." }, aile: { fr: "L'aile est là : il volait peu, mais il avait des ailes !", en: "The wing: it flew little, but it had wings!" }, sternum: { fr: "Le sternum, au milieu du corps.", en: "The breastbone, in the middle of the body." }, patte: { fr: "Une patte solide, faite pour courir.", en: "A strong leg, built for running." } },
    sqRate: { crane: { fr: "Le crâne va tout en haut, au bout du cou.", en: "The skull goes at the very top, at the end of the neck." }, cou: { fr: "Les vertèbres relient la tête au corps.", en: "The vertebrae link the head to the body." }, aile: { fr: "L'aile se range sur le dos, le long du corps.", en: "The wing folds along the back." }, sternum: { fr: "Le sternum va au milieu, sous le dos.", en: "The breastbone goes in the middle." }, patte: { fr: "La patte va en bas, vers le sol.", en: "The leg goes at the bottom." } },
    sqChoisi: { fr: "Touche maintenant le bon emplacement sur la silhouette.", en: "Now tap the right spot on the silhouette." },
    sqLacher: { fr: "Lâche l'os sur la silhouette.", en: "Drop the bone on the silhouette." },
    sqFin: { expr: "surpris", fr: "Le squelette est complet ! Ce bec, ce long cou, ces pattes… ça ressemble à un échassier. Habillons-le de plumes pour en avoir le cœur net !",
      kr: "Lo skelèt lé konplé ! Bèk-la, gran kou-la, bann pat-la… i rosanm in zozo marshèr. Anon abiy ali ék son plim pou konèt la vérité !",
      en: "The skeleton is complete! That beak, long neck and legs… it looks like a wading bird. Let's dress it in feathers to find out!" },
    habiller: { fr: "✨ Habiller le squelette de plumes", en: "✨ Dress the skeleton in feathers" },
    annot: { bec: { fr: "bec court, presque droit", en: "short, almost straight beak" }, ailes: { fr: "bout des ailes et de la queue noir", en: "black wing and tail tips" }, pattes: { fr: "pattes épaisses", en: "thick legs" } },
    badge: { fr: "Détective des os", en: "Bone detective" },
    legende: { fr: "Fais glisser le volet d'un bord à l'autre : à gauche la légende, à droite la science.", en: "Slide the panel from edge to edge: legend on the left, science on the right." },
    etqMythe: { fr: "La légende", en: "Legend" },
    etqScience: { fr: "La science", en: "Science" },
    lgNote: { fr: "À gauche : un dodo blanc peint au XVIIe siècle, que des savants du XIXe siècle ont pris pour le Solitaire. À droite : l'ibis reconstitué d'après les os.", en: "Left: a white dodo painted in the 1600s, which 19th-century scholars took for the Solitaire. Right: the ibis rebuilt from its bones.", src: "M41 · M42" },
    revelation: { expr: "fete", fr: "Incroyable ! Le Solitaire était un IBIS : un grand oiseau blanc, avec le bout des ailes et de la queue noir. Le « dodo blanc » ? Un mélange de vieux tableaux et de vieux récits !",
      kr: "Inkroyab ! Lo Solitèr té in IBIS : in gran zozo blan, ék lo bout son zèl é son ké noir. Lo « dodo blan » ? In mélanz vié tablo ék vié rési !",
      en: "Incredible! The Solitaire was an IBIS: a big white bird with black wing and tail tips. The “white dodo”? A mix-up of old paintings and old stories!" },
    quiz: { q: { fr: "Qu'est-ce qui a permis de découvrir que le Solitaire était un ibis ?", en: "What revealed that the Solitaire was an ibis?" },
      opts: [{ fr: "Des os retrouvés dans le sol de l'île", en: "Bones found in the island's ground" }, { fr: "Un tableau de dodo blanc", en: "A painting of a white dodo" }, { fr: "Une photo prise par un marin", en: "A photo taken by a sailor" }], ok: 0,
      bravo: { fr: "Exact ! En 1987, des scientifiques décrivent un ibis d'après un os trouvé dans une grotte. En 1995, ils montrent que c'est le Solitaire : Threskiornis solitarius, l'ibis de La Réunion.", en: "Right! In 1987, scientists described an ibis from a bone found in a cave. In 1995, they showed it was the Solitaire: Threskiornis solitarius, the Réunion ibis." },
      rate: { fr: "Bonne piste ! Les tableaux montraient des dodos blancs, et la photographie arrive au XIXe siècle, bien après le Solitaire. Les vrais témoins, ce sont les os !", en: "Good thinking! The paintings showed white dodos, and photography arrived in the 1800s, long after the Solitaire. The real witnesses are the bones!" } },
    fait: { fr: "Le Solitaire préférait courir plutôt que voler. Le dernier récit qui parle de lui date de 1708.", en: "The Solitaire preferred running to flying. The last account of it dates from 1708.", src: "M37 · M38 · M39" },
    planche: { fr: "Le Solitaire de La Réunion", en: "The Réunion Solitaire", latin: "Threskiornis solitarius", famille: { fr: "Un ibis · La Réunion", en: "An ibis · Réunion" } },
    fin: { expr: "clin", fr: "Première planche dans ton carnet ! Prochaine piste : le dodo. Vivait-il vraiment ici, à La Réunion ?",
      kr: "Promié plansh dann out karné ! Lot tras : lo dodo. Li viv pou dovré isi, La Rényon ?",
      en: "First plate in your notebook! Next lead: the dodo. Did it really live here on Réunion?" },
    classe: { notion: "Ce sont les preuves matérielles (os) qui permettent de classer un animal disparu ; les récits et les images se recoupent avec elles.",
      mots: ["squelette", "vertébré", "ossements (subfossiles)", "ibis", "classification"], q: "Un tableau, un récit, un os : quelle preuve est la plus solide ? Pourquoi ?",
      prog: "CM1 : classer en groupes emboîtés à partir d'attributs [M79] · CM2 : biodiversité passée, fossiles [M79]" }
  };

  // ---------- « Rejoins la prochaine vitrine » ----------
  const marche = {
    2: { expr: "content", repere: { fr: "Dans la même salle, cherche le squelette du dodo.", en: "In the same room, look for the dodo skeleton." },
      fr: "Cherche un squelette d'oiseau au bec énorme et crochu : le dodo ! Il pesait environ 10 kilos : autant qu'un gros sac de riz !",
      kr: "Rod in skelèt zozo ék in bèk gro é kroshi : lo dodo ! Li té pèz anviron 10 kilo : otan k'in gro sak di ri !",
      en: "Look for a bird skeleton with a huge hooked beak: the dodo! It weighed about 10 kilos: as much as a big bag of rice!" }
  };

  // ---------- Étape 2 · Les îles sœurs [M44-M59, M81-M83] ----------
  const animaux = [
    { id: "dodo", ile: "maurice", nom: { fr: "Dodo", en: "Dodo" }, bravo: { fr: "Oui ! Le dodo vivait à Maurice. C'était un cousin des pigeons.", en: "Yes! The dodo lived on Mauritius. It was a cousin of pigeons." }, rate: { fr: "Le dodo habitait l'île voisine, à environ 170 km d'ici.", en: "The dodo lived on the neighbouring island, about 170 km away." } },
    { id: "solitaire", ile: "reunion", nom: { fr: "Solitaire (ibis)", en: "Solitaire (ibis)" }, bravo: { fr: "Oui ! L'ibis de La Réunion, celui de nos os.", en: "Yes! The Réunion ibis, from our bones." }, rate: { fr: "Souviens-toi : ses os ont été retrouvés ici même, à La Réunion.", en: "Remember: its bones were found right here on Réunion." } },
    { id: "huppe", ile: "reunion", nom: { fr: "Huppe de Bourbon", en: "Hoopoe starling" }, bravo: { fr: "Oui ! La Huppe de Bourbon, de la famille des étourneaux, vivait à La Réunion. Bourbon, c'est l'ancien nom de l'île.", en: "Yes! The hoopoe starling lived on Réunion, once called Bourbon." }, rate: { fr: "Indice : Bourbon est l'ancien nom de La Réunion 😉", en: "Clue: Bourbon is Réunion's old name 😉" } },
    { id: "tortue", ile: "reunion", nom: { fr: "Tortue de La Réunion", en: "Réunion giant tortoise" }, bravo: { fr: "Oui ! Une tortue géante, longue de 50 cm à plus d'un mètre.", en: "Yes! A giant tortoise, 50 cm to over a metre long." }, rate: { fr: "Son nom donne la réponse : regarde-le bien !", en: "Its name gives the answer!" } },
    { id: "rodrigues", ile: "rodrigues", nom: { fr: "Solitaire de Rodrigues", en: "Rodrigues solitaire" }, bravo: { fr: "Oui ! Un grand pigeon de la taille d'un cygne, cousin du dodo.", en: "Yes! A swan-sized pigeon, the dodo's cousin." }, rate: { fr: "Son nom contient le nom de son île 😉", en: "Its name contains its island's name 😉" } }
  ];
  const st2 = {
    brief: { expr: "surpris", fr: "Voici le dodo ! Beaucoup de gens le croient réunionnais… Les Mascareignes sont trois îles sœurs : La Réunion, Maurice et Rodrigues. Qui vivait où ?",
      kr: "Vwala lo dodo ! Bonpé moun i kroi li lé rényoné… Bann Maskarègn, sé trwa zil sèr : La Rényon, Moris é Rodrig. Kisa i viv oussa ?",
      en: "Here's the dodo! Many people think it came from Réunion… The Mascarenes are three sister islands: Réunion, Mauritius and Rodrigues. Who lived where?" },
    observer: { fr: "Devant la vitrine : compare le bec du dodo avec celui du Solitaire. Lequel est le plus massif ?", en: "At the case: compare the dodo's beak with the Solitaire's. Which is bulkier?" },
    carte: { fr: "Glisse chaque animal sur son île. Les cartels de la salle peuvent t'aider !", en: "Drag each animal onto its island. The labels in the room can help!" },
    caChoisi: { fr: "Touche maintenant son île sur la carte.", en: "Now tap its island on the map." },
    caLacher: { fr: "Lâche l'animal sur une île.", en: "Drop the animal on an island." },
    carteFin: { expr: "fete", fr: "Carte complète ! Trois animaux de La Réunion, le dodo à Maurice, et son grand cousin à Rodrigues. Maintenant, voyageons dans le temps…",
      kr: "Kart lé konplé ! Trwa zanimo La Rényon, lo dodo Moris, é son gran kouzin Rodrig. Astèr, anou voyaz dann tan…",
      en: "Map complete! Three Réunion animals, the dodo on Mauritius and its big cousin on Rodrigues. Now, let's travel in time…" },
    temps: { fr: "Fais glisser la règle du temps, de 1600 à aujourd'hui. À chaque événement, note la date dans ton carnet.", en: "Slide the time ruler from 1600 to today. At each event, note the date in your notebook." },
    evenements: [
      { an: 1598, bateau: "maurice", court: { fr: "bateaux à Maurice", en: "ships at Mauritius" }, texte: { fr: "Des navires hollandais abordent l'île Maurice. Avec les bateaux suivants arrivent des rats, des cochons, des singes…", en: "Dutch ships land on Mauritius. Later ships bring rats, pigs, monkeys…" }, src: "M83 · M47" },
      { an: 1662, animal: "dodo", court: { fr: "dernier dodo observé", en: "last dodo seen" }, texte: { fr: "Dernière observation acceptée d'un dodo, à Maurice. La chasse et les animaux venus avec les bateaux ont eu raison de lui.", en: "Last accepted sighting of a dodo, on Mauritius. Hunting and animals brought by ships wiped it out." }, src: "M46 · M47" },
      { an: 1663, bateau: "reunion", court: { fr: "La Réunion habitée", en: "Réunion settled" }, texte: { fr: "Les premiers habitants s'installent pour de bon à La Réunion. Chats, rats et cochons arrivent aussi…", en: "The first settlers come to stay on Réunion. Cats, rats and pigs arrive too…" }, src: "M82 · M40" },
      { an: 1708, animal: "solitaire", court: { fr: "dernier récit du Solitaire", en: "last Solitaire account" }, texte: { fr: "Le dernier récit qui parle du Solitaire date de 1708. Il était chassé pour sa chair, et les chats et les rats s'attaquaient aux nids.", en: "The last account of the Solitaire dates from 1708. It was hunted, and cats and rats raided its nests." }, src: "M39 · M40" },
      { an: 1750, vers: true, animal: "rodrigues", court: { fr: "Solitaire de Rodrigues", en: "Rodrigues solitaire" }, texte: { fr: "Vers le milieu du XVIIIe siècle, le Solitaire de Rodrigues disparaît à son tour (la date exacte reste à découvrir).", en: "Around the mid-1700s, the Rodrigues solitaire vanishes too (the exact date is still unknown)." }, src: "M81" },
      { an: 1840, vers: true, animal: "tortue", court: { fr: "dernières tortues", en: "last tortoises" }, texte: { fr: "Les dernières tortues géantes de La Réunion vivent dans les hauts, jusque vers les années 1840.", en: "Réunion's last giant tortoises survive in the highlands until around the 1840s." }, src: "M55 · M56" },
      { an: 1850, vers: true, animal: "huppe", court: { fr: "dernière Huppe", en: "last hoopoe starling" }, texte: { fr: "La Huppe de Bourbon disparaît vers le milieu du XIXe siècle. 19 spécimens sont conservés dans les musées du monde, dont un à La Réunion.", en: "The hoopoe starling vanishes around the mid-1800s. 19 specimens are kept in museums worldwide, one of them on Réunion." }, src: "M51 · M53" },
      { an: 1855, musee: true, court: { fr: "ouverture du Muséum", en: "Museum opens" }, texte: { fr: "Le Muséum ouvre ses portes, dans un bâtiment de 1834 : le premier musée créé à La Réunion !", en: "The Museum opens in an 1834 building: the first museum created on Réunion!" }, src: "M1 · M3 · M5" },
      { an: 1995, musee: true, court: { fr: "le Solitaire devient ibis", en: "Solitaire named an ibis" }, texte: { fr: "Grâce aux os retrouvés dans le sol de l'île, des scientifiques montrent que le Solitaire est un ibis : Threskiornis solitarius !", en: "Thanks to bones found in the island's ground, scientists show the Solitaire is an ibis: Threskiornis solitarius!" }, src: "M42" }
    ],
    tempsFin: { expr: "pense", fr: "Tu as vu ? Tout a changé quand les bateaux sont arrivés : chasse, rats, chats et cochons, forêts coupées… Aujourd'hui, on peut aider les animaux qui vivent encore ici. Comme moi !",
      kr: "Ou la oir ? Tout la shanzé kan bann bato la arivé : lashas, bann rat, sha, koshon, bann foré koupé… Zordi, nou pé èd bann zanimo ki viv ankor isi. Konm mwin !",
      en: "See? Everything changed when the ships arrived: hunting, rats, cats and pigs, forests cut down… Today we can help the animals still living here. Like me!" },
    quiz: { q: { fr: "Qui est le vrai cousin du dodo ?", en: "Who is the dodo's true cousin?" },
      opts: [{ fr: "Le Solitaire de Rodrigues", en: "The Rodrigues solitaire" }, { fr: "Le Solitaire de La Réunion", en: "The Réunion Solitaire" }, { fr: "La Huppe de Bourbon", en: "The hoopoe starling" }], ok: 0,
      bravo: { fr: "Bravo ! Le dodo et le Solitaire de Rodrigues sont deux grands pigeons. Le Solitaire de La Réunion, lui, est un ibis : même surnom, famille différente !", en: "Well done! The dodo and the Rodrigues solitaire are both big pigeons. The Réunion Solitaire is an ibis: same nickname, different family!" },
      rate: { fr: "Joli piège ! Le Solitaire de La Réunion porte le même surnom… et c'est un ibis. Cherche l'autre grand pigeon des îles sœurs.", en: "Nice trap! The Réunion Solitaire shares the nickname… and it's an ibis. Look for the other big pigeon of the sister islands." } },
    fait: { fr: "Le Muséum a ouvert ses portes en 1855 : c'est le premier musée créé à La Réunion ! Le bâtiment, lui, date de 1834.", en: "The Museum opened in 1855: the first museum created on Réunion! The building dates from 1834.", src: "M1 · M3 · M5" },
    badge: { fr: "Cartographe des îles sœurs", en: "Sister-island mapmaker" },
    planche: { fr: "Le dodo", en: "The dodo", latin: "Raphus cucullatus", famille: { fr: "Un grand pigeon · île Maurice", en: "A big pigeon · Mauritius" } },
    fin: { expr: "fete", fr: "Deux planches ! La suite de l'enquête t'attend : la faune d'aujourd'hui, les oiseaux des mers du Sud, le cœlacanthe… et mon grand départ vers la mer, depuis le Jardin de l'État !",
      kr: "De plansh ! La swit lankèt i ater aou : bann zanimo zordi, bann zozo la mèr di Sid, lo kéalakant… é mon gran dépar pou la mèr, dopi Jardin lÉta !",
      en: "Two plates! More awaits: today's wildlife, southern seabirds, the coelacanth… and my big departure to the sea from the Jardin de l'État!" },
    classe: { notion: "Une espèce endémique vit sur un seul territoire. L'arrivée des humains et des espèces introduites a entraîné la disparition de nombreuses espèces des îles.",
      mots: ["endémique", "extinction", "espèce introduite", "parenté", "frise chronologique"], q: "Qui est plus proche de qui : le dodo, le Solitaire de Rodrigues, l'ibis de La Réunion ?",
      prog: "CM1 : liens de parenté, « qui est plus proche de qui ? » [M79] · CE2 : effets des activités humaines sur la biodiversité [M78]" }
  };

  // ---------- Hub ----------
  const hub = {
    debut: { expr: "clin", fr: "Voici le parcours de l'étage. Pour cette démo, les étapes 1 et 2 sont ouvertes : touche la première pour commencer !",
      kr: "Vwala lo parkour létaz. Pou sète démo, létap 1 é 2 lé ouvèr : tous la promié pou komansé !",
      en: "Here's the floor trail. In this demo, stages 1 and 2 are open: tap the first one to begin!" },
    milieu: { expr: "content", fr: "Bravo, première planche gagnée ! Direction l'étape 2, juste à côté.", kr: "Bravo, promié plansh gagné ! Diréksion létap 2, zis akoté.", en: "Well done, first plate earned! On to stage 2, right next door." },
    fin: { expr: "fete", fr: "Deux planches dans ton carnet ! Les autres étapes arrivent dans l'application complète.", kr: "De plansh dann out karné ! Lé zot étap i ariv dann laplikasion konplèt.", en: "Two plates in your notebook! The other stages come in the full app." }
  };

  window.Content = { CONFIG, UI, titre, publics, intro, etapes, diplome, st1, st2, marche, animaux, hub };
})();
