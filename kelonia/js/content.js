/* ============================================================
   CONTENT.JS — Tous les textes de l'aventure « Le dossier Kawann ».
   Langues : fr (référence), kr (créole réunionnais : PROPOSITION À FAIRE
   RELIRE), en (anglais, pour les visiteurs étrangers).
   Variantes par public : clé « soiree » ou « classe » à l'intérieur d'un
   texte (elle remplace la version « famille »).
   Les faits scientifiques renvoient aux sources de SOURCES.md : [K1]…
   ⚠️ Kawann et Jo sont des personnages FICTIFS (aucune tortue réelle n'est nommée).
   ⚠️ Les noms des lieux de visite sont GÉNÉRIQUES : à renommer avec Kélonia.
   ============================================================ */
(function () {
  "use strict";

  // ---------- VERSION DÉMO (RDV Kélonia du 30/10/2026) ----------
  // versionComplete: false → seul le BASSIN 1 est jouable (intro, brief, mini-jeu radio, écran info),
  //   puis écran « Fin de la démo ». Bassins 2 à 5, dossier de soin, relâcher, diplôme et « Et après ? »
  //   restent dans le code mais sont inaccessibles (QR, réglages, raccourcis, carnet, ancienne partie).
  // versionComplete: true  → l'aventure complète (5 bassins) et l'ancien diaporama ?demo=1 reviennent tels quels.
  const CONFIG = { versionComplete: false };
  // une ligne « ce qu'on y fera » pour les bassins verrouillés de la démo
  const apercu = {
    2: { fr: "Trier la mer au doigt : sac plastique ou méduse ?", en: "Sort the sea: plastic bag or jellyfish?" },
    3: { fr: "Reconnaître une tortue à ses écailles, comme les scientifiques.", en: "Identify a turtle by its scales, like scientists do." },
    4: { fr: "Mesurer sa carapace et comprendre pourquoi elle remonte respirer.", en: "Measure her shell and learn why she comes up to breathe." },
    5: { fr: "Éteindre les lumières de la plage pour guider les bébés tortues.", en: "Switch off beach lights to guide the hatchlings." }
  };

  // ---------- libellés d'interface (boutons, titres courts) ----------
  const UI = {
    commencer: { fr: "Commencer l'enquête", en: "Start the investigation", kr: "Komans lankèt" },
    continuer: { fr: "Continuer l'enquête", en: "Continue the investigation", kr: "Kontinié lankèt" },
    suite: { fr: "Suite", en: "Next", kr: "Apré" },
    parcours: { fr: "Voir les bassins", en: "See the pools", kr: "Oir bann basin" },
    devant: { fr: "Je suis devant le bassin", en: "I'm at the pool", kr: "Mi lé dovan lo basin" },
    scanner: { fr: "Scanner le QR code", en: "Scan the QR code", kr: "Skann lo KR kod" },
    pret: { fr: "On y va !", en: "Let's go!", kr: "Anou alé !" },
    retourParcours: { fr: "Retour aux bassins", en: "Back to the pools", kr: "Artourn bann basin" },
    dossier: { fr: "Ouvrir le dossier de soin", en: "Open the care file", kr: "Ouv lo dosié swin" },
    relacher: { fr: "Relâcher Kawann", en: "Release Kawann", kr: "Larg Kawann" },
    diplome: { fr: "Mon diplôme", en: "My certificate", kr: "Mon diplom" },
    fin: { fr: "Et après ?", en: "What next?", kr: "É apré ?" },
    ecouter: { fr: "Écouter", en: "Listen", kr: "Ékout" },
    station: { fr: "Bassin", en: "Pool", kr: "Basin" },
    sur: { fr: "sur", en: "of", kr: "su" },
    valider: { fr: "Valider", en: "Check", kr: "Validé" },
    indice: { fr: "Indice trouvé", en: "Clue found", kr: "Lindis trouvé" },
    carte: { fr: "Nouvelle carte au carnet", en: "New card in your notebook", kr: "In nouvo kart dann karné" },
    savais: { fr: "Le savais-tu ?", en: "Did you know?", kr: "Ou té i koné ?" },
    source: { fr: "Source", en: "Source", kr: "Sours" },
    tourDe: { fr: "Au tour de", en: "Your turn,", kr: "Lé o tour" },
    tenir: { fr: "de tenir le téléphone !", en: "— hold the phone!", kr: "pou tienbo lo téléfone !" }
  };

  // ---------- accueil ----------
  const accueil = {
    kicker: { fr: "Kélonia · Saint-Leu · La Réunion", en: "Kélonia · Saint-Leu · Réunion Island", kr: "Kélonia · Sin-Lé · La Rényon" },
    titre: { fr: "Le dossier Kawann", en: "The Kawann file", kr: "Lo dosié Kawann" },
    sous: {
      fr: "Une tortue en convalescence appelle à l'aide. Mène l'enquête, bassin par bassin, et aide-la à retrouver la mer.",
      en: "A recovering turtle is calling for help. Investigate pool by pool and help her get back to the sea.",
      kr: "In tortu k'i soign ali i apèl o sekour. Fé lankèt, basin par basin, é ède ali artrouv la mèr.",
      soiree: { fr: "Ce soir, le soigneur de nuit fait sa ronde. Une tortue l'appelle à l'aide : mène l'enquête avec lui, bassin par bassin.", en: "Tonight the night keeper is on his rounds. A turtle is calling for help: investigate with him, pool by pool.", kr: "Asoir, lo soignèr la nuit i fé son ronn. In tortu i apèl ali : fé lankèt ansanm li, basin par basin." }
    },
    promesses: [{ n: "5", fr: "bassins", en: "pools", kr: "basin" }, { n: "3", fr: "langues", en: "languages", kr: "lang" }, { n: "0", fr: "réseau requis", en: "network needed", kr: "rézo" }]
  };

  // ---------- publics ----------
  const publics = {
    famille: { ico: "👨‍👩‍👧", fr: "Famille", en: "Family", kr: "Fanmi", desc: { fr: "Visite de jour, à faire ensemble (dès 7 ans environ, à valider).", en: "Daytime visit, to play together.", kr: "Vizit la zourné, pou fé ansanm." } },
    soiree: { ico: "🌙", fr: "Soirée", en: "Evening", kr: "Soiré", desc: { fr: "« Jours de la Nuit » ou Nuit des musées : écran ambré, lumière limitée, le soigneur fait sa ronde de nuit.", en: "Night events: amber screen, low light, the keeper's night rounds.", kr: "Bann soiré : ékran ambré, pa tro la limièr." } },
    classe: { ico: "🎓", fr: "Classe cycle 3", en: "School (age 8-11)", kr: "Lékol", desc: { fr: "CM1-CM2-6e : consignes scolaires, mots-clés, liens avec le programme de sciences, fiche enseignant.", en: "Curriculum links, key words, teacher sheet (in French).", kr: "Pou lékol : konsign, mo-klé, fiche pou lo mèt." } }
  };

  // ---------- intro (3 bulles) ----------
  const intro = [
    {
      qui: "kawann", expr: "triste",
      fr: "Psst… Ici ! C'est moi, Kawann, une tortue caouanne. On me soigne au centre de soins de Kélonia. J'aimerais tant revoir la mer… Tu veux bien m'aider ?",
      kr: "Psst… Isi ! Sé mwin, Kawann, in tortu kawann. Zot i soign amwin dann sant swin Kélonia. Mi anvi tro oir la mèr ankor… Ou vé ède amwin ?",
      en: "Psst… Over here! It's me, Kawann, a loggerhead turtle. I'm being cared for at the Kélonia care centre. I so want to see the sea again… Will you help me?"
    },
    {
      qui: "jo", expr: "parle",
      fr: "Bonjour ! Je suis Jo, soigneur. Pour que Kawann reparte, il faut résoudre trois questions : pourquoi est-elle arrivée ? Qu'est-ce qui la rend malade ? Que lui faut-il pour repartir ?",
      kr: "Bonzour ! Mi lé Jo, soignèr. Pou Kawann i répar, fo trouv trwa répons : pou kosa li la arivé ? Kosa i rand ali malad ? Kosa i fo pou li répar ?",
      en: "Hello! I'm Jo, a keeper. For Kawann to go home, we must answer three questions: why did she come here? What made her ill? What does she need to leave?",
      soiree: {
        fr: "Bonsoir ! Je suis Jo, le soigneur de nuit. Pendant ma ronde, Kawann m'a appelé. Trois questions pour elle : pourquoi est-elle arrivée ? Qu'est-ce qui la rend malade ? Que lui faut-il pour repartir ?",
        kr: "Bonsoir ! Mi lé Jo, lo soignèr la nuit. Pandan mon ronn, Kawann la apèl amwin. Trwa kestion pou li : pou kosa li la arivé ? Kosa i rand ali malad ? Kosa i fo pou li répar ?",
        en: "Good evening! I'm Jo, the night keeper. On my rounds, Kawann called me. Three questions: why did she come here? What made her ill? What does she need to leave?"
      },
      classe: {
        fr: "Bonjour la classe ! Je suis Jo, soigneur. Votre mission : compléter le dossier de soin de Kawann en répondant à trois questions. Pourquoi est-elle arrivée ? Qu'est-ce qui la rend malade ? Que lui faut-il pour repartir ?",
        kr: "Bonzour la klas ! Mi lé Jo, soignèr. Zot misyon : ranpli lo dosié swin Kawann. Pou kosa li la arivé ? Kosa i rand ali malad ? Kosa i fo pou li répar ?",
        en: "Hello class! I'm Jo, a keeper. Your mission: complete Kawann's care file by answering three questions."
      }
    },
    {
      qui: "jo", expr: "clin",
      fr: "Chaque bassin cache un indice. Devant chaque panneau, scanne le QR code… ou touche « Je suis devant le bassin ». À la fin, on relâche Kawann ensemble !",
      kr: "Sak basin i kach in lindis. Dovan sak panno, skann lo KR kod… oubien tous « Mi lé dovan lo basin ». Pou fini, nou larg Kawann ansanm !",
      en: "Each pool hides a clue. At each sign, scan the QR code… or tap “I'm at the pool”. At the end, we release Kawann together!",
      classe: {
        fr: "Chaque bassin correspond à une notion du programme. Discutez en équipe avant de répondre. Attention : dans l'histoire, Kawann parle… mais c'est pour de faux, une vraie tortue ne parle pas !",
        kr: "Sak basin néna in nosion lo progranm. Lir bien bann konsign, diskit an ékip avan répond.",
        en: "Each pool matches a curriculum topic. Discuss as a team before answering. Note: Kawann talks in the story, but real turtles don't!"
      }
    }
  ];

  // ---------- les 5 stations ----------
  // lieu : nom GÉNÉRIQUE (à renommer avec Kélonia) ; jeu : identifiant du mini-jeu (games.js)
  const stations = [
    {
      id: 1, ico: "🩻", jeu: "radio", espece: "caouanne", question: 1,
      titre: { fr: "La radio de Kawann", en: "Kawann's X-ray", kr: "La radio Kawann" },
      lieu: { fr: "Le centre de soins (vu du couloir)", en: "The care centre (seen from the corridor)", kr: "Lo sant swin" },
      brief: {
        qui: "jo", expr: "parle",
        fr: "Première question : pourquoi Kawann est-elle arrivée ici ? Les soigneurs ont fait une radiographie. Promène le scanner sur son corps et trouve l'objet qui n'a rien à faire là !",
        kr: "Promié kestion : pou kosa Kawann la arivé isi ? Bann soignèr la fé in radio. Pass lo skanèr si son kor é trouv lo zafèr k'i doi pa èt la !",
        en: "First question: why did Kawann come here? The keepers took an X-ray. Move the scanner over her body and find the object that shouldn't be there!",
        soiree: { fr: "Ma lampe éclaire la salle de soins. Première question : pourquoi Kawann est-elle arrivée ? Voici sa radiographie : promène le scanner et trouve l'intrus !", kr: "Mon lanp i kler la sal swin. Promié kestion : pou kosa Kawann la arivé ? Pass lo skanèr si la radio !", en: "My lamp lights the care room. First question: why did Kawann come? Here's her X-ray: move the scanner and find the intruder!" }
      },
      consigne: { fr: "Glisse le doigt sur la radio : le cercle est un scanner. Quand tu vois l'objet, touche-le.", en: "Slide your finger over the X-ray: the circle is a scanner. When you see the object, tap it.", kr: "Glis out dwa si la radio. Kan ou oi lo zafèr, tous ali." },
      quiz: {
        q: { fr: "C'est un hameçon ! D'où vient-il, à ton avis ?", en: "It's a fish hook! Where do you think it came from?", kr: "Sé in zin ! Dousa li sort, dapré ou ?" },
        opts: [
          { fr: "D'une ligne de pêche", en: "From a fishing line", kr: "In lign la pèsh" },
          { fr: "D'un oursin", en: "From a sea urchin", kr: "In zourin" },
          { fr: "D'un rocher du lagon", en: "From a lagoon rock", kr: "In ros dann lagon" }
        ], ok: 0,
        bravo: { fr: "Oui : Kawann a avalé un hameçon accroché à une ligne de pêche. Les soigneurs l'ont repéré grâce à la radio.", en: "Yes: Kawann swallowed a hook from a fishing line. The keepers found it thanks to the X-ray.", kr: "Wi : Kawann la avale in zin la pèsh. Bann soignèr la oir ali grasa la radio." },
        rate: { fr: "Regarde bien sa forme : un crochet pointu avec un œillet pour attacher le fil…", en: "Look at its shape: a sharp curve with an eye to tie the line…", kr: "Gard bien : in kroshé pwintu ék in tou pou atash lo fil…" }
      },
      fait: { fr: "Entre 1998 et 2023, Kélonia a accueilli 558 tortues. Plus de 7 sur 10 avaient avalé un hameçon, surtout des caouannes. Et 7 sur 10 ont été confiées au centre par des pêcheurs.", en: "Between 1998 and 2023, Kélonia admitted 558 turtles. Over 7 in 10 had swallowed a hook, mostly loggerheads. And 7 in 10 were brought in by fishers.", src: "K4" },
      indice: { fr: "Pourquoi elle est arrivée : elle a avalé un hameçon de pêche (vu à la radio).", en: "Why she came: she swallowed a fishing hook (seen on the X-ray).", kr: "Pou kosa li la arivé : li la avale in zin la pèsh." },
      classe: { notion: "Impact de l'être humain sur l'environnement (pêche).", mots: ["radiographie", "hameçon", "capture accidentelle", "centre de soins"], q: "Pourquoi une tortue mord-elle à un hameçon garni d'appât ? Proposez une hypothèse." },
      fin: { qui: "kawann", expr: "soulagee", fr: "Ouf ! Grâce à la radio, les soigneurs savent où est l'hameçon et peuvent me soigner. Mais j'ai encore mal au ventre…", kr: "Ouf ! Grasa la radio, bann soignèr i koné oussa lo zin lé, zot i pé soign amwin. Mé mi gingn ankor mal vant…", en: "Phew! Thanks to the X-ray, the keepers know where the hook is and can treat me. But my tummy still hurts…" }
    },
    {
      id: 2, ico: "🫧", jeu: "tri", espece: "luth", question: 2,
      titre: { fr: "La mer à nettoyer", en: "Clean up the sea", kr: "La mèr pou netoy" },
      lieu: { fr: "Bassin 1 (à renommer avec Kélonia)", en: "Pool 1 (name to be confirmed)", kr: "Basin 1" },
      brief: {
        qui: "jo", expr: "parle",
        fr: "Deuxième question : qu'est-ce qui rend Kawann malade ? Dans la mer, elle mange des méduses, des crabes, des coquillages… mais pas seulement. Retire de l'eau tout ce qui est dangereux !",
        kr: "Dézièm kestion : kosa i rand Kawann malad ? Dann la mèr, li manz bann méduz, bann krab, bann kokiyaz… mé pa sa sèlman. Tir dann la mèr tout sat lé danzéré !",
        en: "Second question: what made Kawann ill? At sea she eats jellyfish, crabs, shellfish… but not only that. Remove everything dangerous from the water!"
      },
      consigne: { fr: "Fais glisser hors de l'eau ce qui est DANGEREUX. Laisse la nourriture de Kawann !", en: "Drag the DANGEROUS things out of the water. Leave Kawann's food!", kr: "Glis déor bann zafèr DANZÉRÉ. Kit lo manzé Kawann !" },
      fait: { fr: "La caouanne est carnivore : méduses, mollusques, crustacés. Kélonia a très souvent retrouvé du plastique avalé chez les caouannes soignées. Des chercheurs ont observé que des tortues vertes avalent surtout les déchets souples et transparents, qui ressemblent à des méduses.", en: "Loggerheads are carnivores: jellyfish, molluscs, crustaceans. Kélonia very often found swallowed plastic in the loggerheads it treated. Researchers found that green turtles mostly swallow soft, see-through debris that looks like jellyfish.", src: "K12 · K4 · K16" },
      indice: { fr: "Ce qui la rend malade : du plastique avalé, qui peut ressembler à ses proies.", en: "What made her ill: swallowed plastic, which can look like her prey.", kr: "Kosa i rand ali malad : plastik avalé, li la kroi sé manzé." },
      classe: { notion: "Chaînes alimentaires · impact des déchets.", mots: ["carnivore", "chaîne alimentaire", "déchet", "ingestion"], q: "Complétez la chaîne : plancton → … → tortue caouanne. Où le plastique s'invite-t-il ?" },
      fin: { qui: "kawann", expr: "content", fr: "Merci ! Une mer propre, ça change tout. Maintenant, il me faut un contrôle complet avant de partir.", kr: "Mersi ! In la mèr prop, i shanj tout. Astèr fo in kontrol konplé avan mi pé alé.", en: "Thank you! A clean sea changes everything. Now I need a full check-up before I leave." }
    },
    {
      id: 3, ico: "🔎", jeu: "photoid", espece: "verte", question: 3,
      titre: { fr: "Qui est cette tortue ?", en: "Who is this turtle?", kr: "Kisa tortu-la ?" },
      lieu: { fr: "Bassin 2 (à renommer avec Kélonia)", en: "Pool 2 (name to be confirmed)", kr: "Basin 2" },
      brief: {
        qui: "jo", expr: "clin",
        fr: "Un plongeur a photographié une tortue verte au large de Saint-Leu. Est-elle déjà connue ? Kélonia reconnaît les tortues sans les toucher, grâce aux écailles de leur tête : un dessin unique, comme une empreinte !",
        kr: "In plonzèr la pran an foto in tortu vèr o larg Sin-Lé. Kélonia i rokoné bann tortu san tous azot, grasa bann zékay son tèt : in desin inik, kom in lanprint !",
        en: "A diver photographed a green turtle off Saint-Leu. Is she already known? Kélonia recognises turtles without touching them, thanks to the scales on their head: a unique pattern, like a fingerprint!"
      },
      consigne: { fr: "Étape 1 : compte les écailles juste derrière l'œil (en couleur). Étape 2 : retrouve la même tortue dans le fichier.", en: "Step 1: count the scales just behind the eye (coloured). Step 2: find the same turtle in the files.", kr: "Promié : kont bann zékay zis dérièr lo zié. Dézièm : trouv lo mèm tortu dann fishié." },
      fait: { fr: "Le premier chiffre du code d'identification est le nombre d'écailles juste derrière l'œil. Et le profil gauche d'une tortue n'est pas le même que son profil droit : il faut photographier les deux !", en: "The first digit of the ID code is the number of scales just behind the eye. And a turtle's left profile differs from its right one: both must be photographed!", src: "K5" },
      indice: { fr: "Pour la reconnaître après son départ : photographier ses deux profils (le dessin des écailles de chaque tortue est unique).", en: "To recognise her after release: photograph both profiles (each turtle's scale pattern is unique).", kr: "Pou suiv ali apré : pran an foto son dé profil." },
      classe: { notion: "Classification : les tortues sont des reptiles (écailles, poumons).", mots: ["photo-identification", "écaille", "reptile", "individu"], q: "Quel caractère partagent la tortue, le lézard et le crocodile ? Pourquoi ne reconnaît-on pas une tortue à la couleur de sa carapace ?" },
      fin: { qui: "kawann", expr: "fete", fr: "Tu l'as retrouvée ! Un jour, peut-être, un plongeur me prendra en photo aussi, et on saura que je vais bien.", kr: "Ou la trouv ali ! In zour, kisa i koné, in plonzèr va pran amwin an foto osi.", en: "You found her! One day maybe a diver will photograph me too, and they'll know I'm fine." }
    },
    {
      id: 4, ico: "📏", jeu: "mesure", espece: "olivatre", question: 3,
      titre: { fr: "La visite de contrôle", en: "The check-up", kr: "La vizit kontrol" },
      lieu: { fr: "Le bassin de convalescence (à renommer)", en: "The recovery pool (name to be confirmed)", kr: "Lo basin konvalésans" },
      brief: {
        qui: "jo", expr: "parle",
        fr: "Troisième question : Kawann est-elle prête à repartir ? On la mesure, on vérifie qu'elle nage et respire bien. Prends le mètre ruban !",
        kr: "Trwazièm kestion : Kawann lé paré pou répar ? Nou mezir ali, nou gard si li najé é li rèspir bien. Pran lo mèt riban !",
        en: "Third question: is Kawann ready to leave? We measure her and check she swims and breathes well. Grab the tape measure!"
      },
      consigne: { fr: "Fais glisser le bout du mètre ruban jusqu'à l'arrière de la carapace.", en: "Drag the end of the tape to the back of the shell.", kr: "Glis lo bout lo mèt riban ziska dèrièr la karapas." },
      quiz: {
        q: { fr: "Dans son bassin, Kawann remonte souvent à la surface. Pourquoi ?", en: "In her pool, Kawann often comes up to the surface. Why?", kr: "Dann son basin, Kawann i monte souvan si la sirfas. Pou kosa ?" },
        opts: [
          { fr: "Pour respirer : elle a des poumons", en: "To breathe: she has lungs", kr: "Pou rèspir : li néna poumon" },
          { fr: "Pour boire de l'eau douce", en: "To drink fresh water", kr: "Pou boir dolo dous" },
          { fr: "Pour dormir au soleil", en: "To sleep in the sun", kr: "Pou dormi o solèy" }
        ], ok: 0,
        bravo: { fr: "Exact ! Les tortues marines sont des reptiles : elles respirent avec des poumons et doivent remonter respirer à la surface.", en: "Right! Sea turtles are reptiles: they breathe with lungs and must come up to breathe.", kr: "Lé bon ! Bann tortu la mèr lé bann reptil : zot i rèspir ék poumon." },
        rate: { fr: "Indice : la tortue est un reptile, pas un poisson. Elle n'a pas de branchies.", en: "Hint: a turtle is a reptile, not a fish. It has no gills.", kr: "Lindis : la tortu lé in reptil, pa in pwason." }
      },
      fait: { fr: "Les soigneurs mesurent la carapace en suivant sa courbe : ces mesures (la biométrie) aident à suivre la santé de la tortue. Un séjour au centre de soins dure de quelques semaines à quelques mois.", en: "Keepers measure the shell along its curve: these measurements (biometrics) help follow the turtle's health. A stay lasts from a few weeks to a few months.", src: "K4 · K2" },
      indice: { fr: "Prête à repartir : carapace mesurée, elle nage, plonge et remonte respirer seule.", en: "Ready to go: shell measured, she swims, dives and comes up to breathe alone.", kr: "Paré pou répar : li naj, li plonz, li rèspir tousèl." },
      classe: { notion: "Respiration et milieu de vie · classification (reptiles).", mots: ["biométrie", "carapace", "poumons", "convalescence"], q: "Comparez la respiration d'un poisson et d'une tortue marine. Qu'en déduisez-vous sur leur classement ?" },
      fin: { qui: "kawann", expr: "fete", fr: "Je suis en forme ! Dernière étape : il faut une plage sûre pour mon retour… et pour les bébés tortues.", kr: "Mi lé an form ! Dernié étap : fo in plaz sir pou mon rotour… é pou bann ti tortu.", en: "I'm fit! Last step: we need a safe beach for my return… and for baby turtles." }
    },
    {
      id: 5, ico: "🌙", jeu: "plage", espece: "imbriquee", question: 3,
      titre: { fr: "La plage de nuit", en: "The beach at night", kr: "La plaz la nuit" },
      lieu: { fr: "L'espace extérieur, côté plage (à renommer)", en: "Outdoor area, beach side (name to be confirmed)", kr: "Déor, koté la plaz" },
      brief: {
        qui: "jo", expr: "parle",
        fr: "Les plages de Saint-Leu sont des lieux de ponte. Mais la nuit, les lumières trop fortes perdent les bébés tortues : au lieu d'aller vers la mer, ils partent vers la route ! Éteins-les.",
        kr: "Bann plaz Sin-Lé sé bann landrwa pou ponn. Mé la nuit, bann limièr tro for i fé pèrd bann ti tortu : olie alé la mèr, zot i sava si shemin ! Tégn azot.",
        en: "Saint-Leu's beaches are nesting sites. But at night, bright lights confuse baby turtles: instead of the sea, they head for the road! Switch them off.",
        soiree: { fr: "Regarde autour de toi : ce soir, on limite les lumières. C'est pareil sur la plage : les lumières trop fortes perdent les bébés tortues… et les pétrels. Éteins-les !", kr: "Gard otour ou : asoir, nou limit bann limièr. Lé parèy si la plaz : bann limièr tro for i fé pèrd bann ti tortu… é bann pétrel. Tégn azot !", en: "Look around: tonight we keep lights low. Same on the beach: bright lights confuse baby turtles… and petrels. Switch them off!" }
      },
      consigne: { fr: "Touche chaque lumière pour l'éteindre, ou pour la changer en lumière jaune tournée vers le sol.", en: "Tap each light to switch it off, or turn it into a yellow light pointing down.", kr: "Tous sak limièr pou tégn ali, oubien pou mèt ali jône tourn vèr la tèr." },
      fait: { fr: "La lumière artificielle peut désorienter les tortues : les bébés peuvent partir vers la route au lieu de la mer. Elle perd aussi les pétrels de La Réunion. On éteint, ou on choisit une lumière jaune tournée vers le sol. Début 2026, des bébés tortues vertes sont nés sur la plage de Kélonia !", en: "Artificial light can disorient turtles: hatchlings may head for the road instead of the sea. It also confuses Réunion's petrels. Switch off, or use yellow light pointing down. In early 2026, green turtle hatchlings were born on Kélonia's beach!", src: "K6 · K9 · K7 · K10" },
      indice: { fr: "Pour repartir : une mer propre et des plages sombres la nuit.", en: "To leave: a clean sea and dark beaches at night.", kr: "Pou répar : in la mèr prop é bann plaz nwar la nuit." },
      classe: { notion: "Impact de l'être humain · pollution lumineuse · biodiversité de La Réunion.", mots: ["ponte", "pollution lumineuse", "pétrel", "espèce endémique"], q: "Citez deux aménagements simples pour protéger une plage de ponte la nuit." },
      fin: { qui: "kawann", expr: "fete", fr: "Les bébés tortues ont trouvé la mer ! Mon dossier est presque complet… Ouvre-le !", kr: "Bann ti tortu la trouv la mèr ! Mon dosié lé prèsk konplé… Ouv ali !", en: "The baby turtles found the sea! My file is nearly complete… Open it!" }
    }
  ];

  // ---------- éléments du mini-jeu « tri » (danger = à retirer) ----------
  const tri = [
    { id: "meduse", danger: false, fr: "une méduse", en: "a jellyfish" },
    { id: "sac", danger: true, fr: "un sac plastique", en: "a plastic bag" },
    { id: "crabe", danger: false, fr: "un crabe", en: "a crab" },
    { id: "fil", danger: true, fr: "un fil de pêche", en: "a fishing line" },
    { id: "coquillage", danger: false, fr: "un coquillage", en: "a shellfish" },
    { id: "bouteille", danger: true, fr: "une bouteille", en: "a bottle" },
    { id: "ballon", danger: true, fr: "un ballon de baudruche", en: "a balloon" }
  ];
  const triMsg = {
    nourriture: { fr: "Non ! {x}, c'est de la nourriture pour Kawann. On la laisse.", en: "No! {x} is food for Kawann. Leave it." },
    bien: { fr: "Bien vu : {x} n'a rien à faire dans la mer !", en: "Well spotted: {x} doesn't belong in the sea!" },
    piege: { fr: "Attention : dans l'eau, un sac plastique peut ressembler à une méduse… c'est un piège !", en: "Careful: in the water, a plastic bag can look like a jellyfish… it's a trap!" }
  };

  // ---------- les 5 espèces (carnet de collection) ----------
  // statut : Liste rouge MONDIALE de l'UICN [K11] ; à La Réunion le statut peut différer (à valider par Kélonia)
  const especes = {
    caouanne: { nom: { fr: "Tortue caouanne", en: "Loggerhead turtle" }, latin: "Caretta caretta", statut: "VU", reg: "DD", presence: { fr: "Rare près des côtes, observée au large.", en: "Rare near the coast, seen offshore." }, trait: { fr: "Carnivore : méduses, mollusques, crustacés.", en: "Carnivore: jellyfish, molluscs, crustaceans." }, couleur: "#b5652e" },
    luth: { nom: { fr: "Tortue luth", en: "Leatherback turtle" }, latin: "Dermochelys coriacea", statut: "VU", reg: "NA", presence: { fr: "Rare, observée au large.", en: "Rare, seen offshore." }, trait: { fr: "La plus grande ; sa carapace sans écailles est couverte d’une peau épaisse (à valider).", en: "The largest; its shell has no scutes, just thick skin (to be checked)." }, couleur: "#3e4a59" },
    verte: { nom: { fr: "Tortue verte (ou franche)", en: "Green turtle" }, latin: "Chelonia mydas", statut: "LC", reg: "EN", presence: { fr: "Fréquente régulièrement les côtes ; elle pond aussi à La Réunion, jusque sur la plage de Kélonia.", en: "Regularly found along the coast; it also nests in Réunion, even on Kélonia's beach." }, trait: { fr: "Adulte herbivore : à La Réunion, elle broute des algues rouges.", en: "Herbivorous adult: in Réunion it grazes on red algae." }, couleur: "#4f7d3a" },
    imbriquee: { nom: { fr: "Tortue imbriquée", en: "Hawksbill turtle" }, latin: "Eretmochelys imbricata", statut: "CR", reg: "CR", presence: { fr: "Fréquente les côtes réunionnaises.", en: "Regularly found along Réunion's coast." }, trait: { fr: "Bec pointu, écailles noires et jaunes qui se chevauchent.", en: "Pointed beak, overlapping black-and-yellow scutes." }, couleur: "#8a5a1f" },
    olivatre: { nom: { fr: "Tortue olivâtre", en: "Olive ridley turtle" }, latin: "Lepidochelys olivacea", statut: "VU", reg: "DD", presence: { fr: "Rare, observée au large.", en: "Rare, seen offshore." }, trait: { fr: "La plus petite des cinq espèces de la région (à valider).", en: "The smallest of the five (to be checked)." }, couleur: "#7b7d3a" }
  };
  const statuts = {
    LC: { fr: "Préoccupation mineure", en: "Least Concern", c: "#2f8f4e" },
    DD: { fr: "Données insuffisantes", en: "Data Deficient", c: "#5d6b70" },
    NA: { fr: "Non évaluée (de passage)", en: "Not applicable (visitor)", c: "#5d6b70" },
    VU: { fr: "Vulnérable", en: "Vulnerable", c: "#a86f00" },
    EN: { fr: "En danger", en: "Endangered", c: "#c4501a" },
    CR: { fr: "En danger critique", en: "Critically Endangered", c: "#c0262d" }
  };

  // ---------- dossier, relâcher, fin ----------
  const dossier = {
    titre: { fr: "Dossier de soin · Kawann", en: "Care file · Kawann", kr: "Dosié swin · Kawann" },
    q: [
      { fr: "1. Pourquoi est-elle arrivée ?", en: "1. Why did she come?", kr: "1. Pou kosa li la arivé ?" },
      { fr: "2. Qu'est-ce qui la rend malade ?", en: "2. What made her ill?", kr: "2. Kosa i rand ali malad ?" },
      { fr: "3. Que lui faut-il pour repartir ?", en: "3. What does she need to leave?", kr: "3. Kosa i fo pou li répar ?" }
    ],
    tampon: { fr: "APTE AU RELÂCHER", en: "FIT FOR RELEASE", kr: "PARÉ POU LARGÉ" },
    manque: { fr: "Il manque encore des indices : retourne aux bassins !", en: "Some clues are still missing: back to the pools!", kr: "I manq ankor bann lindis : artourn bann basin !" },
    bulle: { qui: "jo", expr: "fier", fr: "Dossier complet, bravo ! L'équipe soignante a tout vérifié : Kawann est apte au relâcher. Allons sur la plage !", kr: "Dosié konplé, bravo ! Mi siyn : Kawann lé paré pou largé. Anou alé si la plaz !", en: "File complete, well done! The care team has checked everything: Kawann is fit for release. To the beach!" }
  };
  const relacher = {
    bulle: { qui: "kawann", expr: "fete", fr: "La mer ! Je la sens ! Merci, soigneur junior. Je n'oublierai jamais Kélonia.", kr: "La mèr ! Mi santi ali ! Mersi, ti soignèr. Mi oubli zamé Kélonia.", en: "The sea! I can feel it! Thank you, junior keeper. I'll never forget Kélonia." },
    fait: { fr: "Une fois guéries, les tortues soignées à Kélonia sont relâchées sur la plage de Kélonia ou sur leur lieu de capture. Le centre de soins en accueille de plus en plus : plus de 40 par an depuis 2020.", en: "Once healed, turtles are released on Kélonia's beach or where they were found. The care centre takes in more and more: over 40 a year since 2020.", src: "K2 · K4" }
  };
  const fin = {
    gestes: [
      { ico: "🗑️", fr: "Je jette mes déchets à la poubelle, surtout les sacs plastiques.", en: "I put my rubbish in the bin, especially plastic bags.", src: "K3" },
      { ico: "💡", fr: "La nuit, j'éteins les lumières inutiles ; sinon, une lumière jaune tournée vers le sol.", en: "At night I switch off unneeded lights; otherwise yellow light pointing down.", src: "K7" },
      { ico: "🚤", fr: "En bateau, je ralentis près des côtes : les chocs avec les bateaux blessent aussi des tortues, surtout des tortues vertes.", en: "By boat, I slow down near the coast: boat strikes also injure turtles, especially green turtles.", src: "K3 · K4" },
      { ico: "🤿", fr: "Dans l'eau, j'approche lentement les tortues et je les laisse libres de leurs mouvements.", en: "In the water, I approach turtles slowly and leave them free to move.", src: "K3" },
      { ico: "📞", fr: "Tortue blessée ou échouée ? Je ne la remets pas à l'eau moi-même : j'appelle Kélonia, 0262 34 81 10 (ou 0692 65 37 98, numéro de la charte 2020, à confirmer).", en: "Injured or stranded turtle? Don't put it back in the water yourself: call Kélonia, +262 262 34 81 10 (or +262 692 65 37 98, to be confirmed).", src: "K1 · K3" }
    ],
    secret: { qui: "kawann", expr: "clin", fr: "Mon secret ? Les tortues marines parcourent les océans depuis près de 100 millions d'années. Aide-nous à continuer !", kr: "Mon sekré ? Bann tortu la mèr i rod la mèr dopi prèsk san milyon lané. Ède anou kontinié !", en: "My secret? Sea turtles have roamed the oceans for nearly 100 million years. Help us keep going!" }
  };

  // ---------- crédits ----------
  const credits = [
    "Prototype conçu par Jonathan Bou pour Kélonia (Réunion des Musées Régionaux), 30/10/2026. Rien n'est publié.",
    "Kawann (tortue caouanne) et Jo (soigneur) sont des personnages FICTIFS. Aucune tortue réelle n'est nommée. Kawann « parle » : convention de fiction assumée (une vraie tortue ne parle pas), signalée aux classes.",
    "Kréol : traduction PROPOSÉE, non relue, à faire valider par un locuteur et par Kélonia (graphie à choisir ensemble).",
    "Voix : synthèse vocale du navigateur (français, anglais) en attendant les vraies voix enregistrées par Jonathan.",
    "Faits scientifiques : voir SOURCES.md (Kélonia, CEDTM, Indian Ocean Turtle Newsletter, INPN, UICN). Tout est à relire par le service éducatif.",
    "Les noms de bassins sont provisoires. Les mesures de Kawann sont inventées pour le jeu.",
    "Illustrations, sons et générateur de QR codes : faits maison, sans aucune ressource externe."
  ];

  // ---------- mode démo (RDV) : écrans enchaînés par ◀ ▶ ----------
  // [écran, étape, public imposé (facultatif)]
  const demoComplet = [
    ["ouverture"], ["accueil"], ["intro", "0"], ["intro", "1"], ["hub"],
    ["st1", "brief"], ["st1", "jeu"], ["st2", "jeu"], ["st3", "jeu"], ["st4", "jeu"],
    ["st5", "brief", "soiree"], ["st5", "jeu", "soiree"], ["st5", "info", "soiree"],
    ["dossier", null, "famille"], ["relacher"], ["diplome"], ["fin"], ["carnet"],
    ["st2", "brief", "classe"], ["fiche"], ["qr"], ["kelonia"]
  ];

  // version démo (CONFIG.versionComplete = false) : le diaporama s'arrête au bassin 1
  const demoLimitee = [
    ["projet"], ["accueil"], ["intro", "0"], ["intro", "1"], ["intro", "2"], ["hub"],
    ["st1", "brief"], ["st1", "jeu"], ["st1", "quiz"], ["st1", "info"],
    ["findemo"], ["fiche"], ["kelonia"]
  ];
  const demo = CONFIG.versionComplete ? demoComplet : demoLimitee;

  window.Content = { CONFIG, apercu, UI, accueil, publics, intro, stations, tri, triMsg, especes, statuts, dossier, relacher, fin, credits, demo };
})();
