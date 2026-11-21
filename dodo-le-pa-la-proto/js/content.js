/* Dodo lé pa là — contenu des 4 malles : énigmes, documents, solutions, repères « en vrai ».
   Les coups des parchemins sont CALCULÉS depuis DODO_DATA (export de solitaire_model.py) :
   chaque ligne de parchemin = traduction d'un coup réel ; verifierCoups() refait le chemin inverse. */
(function () {
  const D = window.DODO_DATA;
  const C = {};
  C.TEAMS = ['ROUGE', 'VERT', 'JAUNE', 'BLEU'];
  C.TEAM_COLOR = { ROUGE: '#b23a2e', VERT: '#3f7d3a', JAUNE: '#c08a1a', BLEU: '#2f5d95' };
  C.TEAM_LABEL = { ROUGE: 'rouge', VERT: 'verte', JAUNE: 'jaune', BLEU: 'bleue' };
  C.PERSO = { ROUGE: "L'Ornithologue", VERT: 'Le Braconnier', JAUNE: "L'Alchimiste", BLEU: 'Le Cartographe' };
  C.MALLE = { ROUGE: "la malle de l'Ornithologue", VERT: 'la malle du Braconnier', JAUNE: "la malle de l'Alchimiste", BLEU: 'la malle du Cartographe' };
  C.coord = n => D.holes[n - 1].coord;
  C.movesOf = t => D.moves.filter(m => m.team === t);
  C.rainbow = n => D.rainbow[n - 1];

  // ---------- catalogues qui traduisent les numéros de trous ----------
  const ELEMENTS = ['Hydrogène', 'Hélium', 'Lithium', 'Béryllium', 'Bore', 'Carbone', 'Azote', 'Oxygène', 'Fluor', 'Néon',
    'Sodium', 'Magnésium', 'Aluminium', 'Silicium', 'Phosphore', 'Soufre', 'Chlore', 'Argon', 'Potassium', 'Calcium',
    'Scandium', 'Titane', 'Vanadium', 'Chrome', 'Manganèse', 'Fer', 'Cobalt', 'Nickel', 'Cuivre', 'Zinc', 'Gallium',
    'Germanium', 'Arsenic', 'Sélénium', 'Brome', 'Krypton'];
  const SYMBOLES = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
    'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
  C.ELEMENTS = ELEMENTS; C.SYMBOLES = SYMBOLES;

  // Ornithologue : cadre d'insectes épinglés (numéros) + oiseaux bagués du carnet (numéros de bague)
  C.INSECTES = { 1: 'Moustique', 2: 'Fourmi', 3: 'Libellule', 4: 'Puceron', 5: 'Criquet', 7: 'Guêpe', 9: 'Papillon', 13: 'Cigale', 16: 'Araignée', 18: 'Mouche', 22: 'Scarabée' };
  C.BAGUES = { 6: 'Paille-en-queue', 11: 'Salangane', 14: 'Tuit-tuit', 17: 'Merle pays', 21: 'Zoizo blanc', 25: 'Chouette', 28: 'Tec-tec', 30: 'Papangue' };
  // Braconnier : permis (arme -> calibre) et tableau de trophées (animal + cadre -> points)
  C.PERMIS = [['Fusil à plomb', 12], ['Tromblon', 18], ['Carabine', 27], ['Pistolet de duel', 13], ['Arbalète', 9], ['Mousquet', 20], ['Escopette', 16]];
  C.CADRES = { rond: '◯', carre: '▢', losange: '◇' };
  C.TROPHEES = [['Ours', 'rond', 10], ['Ours', 'carre', 14], ['Cerf', 'losange', 6], ['Cerf', 'rond', 22], ['Sanglier', 'carre', 25],
    ['Sanglier', 'losange', 31], ['Tangue', 'rond', 27], ['Tangue', 'carre', 3], ['Lièvre', 'losange', 19]];

  function nameOf(team, n, i) {
    if (team === 'JAUNE') return ELEMENTS[n - 1];
    if (team === 'ROUGE') return C.INSECTES[n] || C.BAGUES[n];
    if (team === 'VERT') {
      if (i === 0) { const a = C.PERMIS.find(p => p[1] === n); return a && a[0]; }
      const t = C.TROPHEES.find(p => p[2] === n); return t && (t[0] + ' ' + C.CADRES[t[1]]);
    }
    if (team === 'BLEU') return C.coord(n);
  }
  // une ligne de parchemin = liste de maillons (texte), calculée depuis le coup réel
  C.ligne = (m) => m.path.map((n, i) => nameOf(m.team, n, i));
  C.LIEN = { JAUNE: ' se change en ', ROUGE: " nourrit ", VERT: ' ⟶ ', BLEU: ' ⟶ ' };

  // vérification : chaque maillon se retraduit en un seul numéro = le coup réel de la couleur
  function decode(team, txt, i) {
    if (team === 'JAUNE') return ELEMENTS.indexOf(txt) + 1;
    if (team === 'ROUGE') { const all = Object.assign({}, C.INSECTES, C.BAGUES); const k = Object.keys(all).filter(k => all[k] === txt); return k.length === 1 ? +k[0] : -1; }
    if (team === 'VERT') {
      if (i === 0) { const a = C.PERMIS.filter(p => p[0] === txt); return a.length === 1 ? a[0][1] : -1; }
      const t = C.TROPHEES.filter(p => (p[0] + ' ' + C.CADRES[p[1]]) === txt); return t.length === 1 ? t[0][2] : -1;
    }
    if (team === 'BLEU') { const h = D.holes.filter(h => h.coord === txt); return h.length === 1 ? h[0].n : -1; }
  }
  C.verifierCoups = () => {
    const out = [];
    for (const t of C.TEAMS) {
      const ms = C.movesOf(t);
      let ok = ms.length > 0;
      for (const m of ms) {
        const back = C.ligne(m).map((x, i) => decode(t, x, i));
        if (back.join('-') !== m.path.join('-')) ok = false;
        if (m.path[0] !== m.path[0] || !D.teamPions[t].includes(m.path[0])) ok = false;
      }
      out.push({ team: t, coups: ms.map(m => m.n), ok });
    }
    return out;
  };

  // ---------- pions cachés dans les objets ----------
  // 7 pions dans les objets de la malle, le 8e dans le coffre-fort.
  C.HUITIEME = { ROUGE: 5, VERT: 13, JAUNE: 33, BLEU: 15 };
  const OBJ = {
    JAUNE: [['fiole', 'bouchon de la fiole verte'], ['mortier', 'pilon du mortier'], ['alambic', 'col de l\'alambic'], ['sablier', 'socle du sablier'],
      ['livre', 'dos du grimoire'], ['encrier', 'couvercle de l\'encrier'], ['pierre', 'géode fendue'], ['lanterne', 'pied de la lampe à huile'], ['creuset', 'anse du creuset']],
    ROUGE: [['cage', 'pointe de la cage'], ['nichoir', 'toit du nichoir'], ['jumelles', 'molette des jumelles'], ['plume', 'tuyau de la plume'],
      ['oeufs', 'nid de démonstration'], ['loupe', 'manche de la loupe'], ['livre', 'carnet de terrain'], ['chapeau', 'ruban du chapeau'], ['encrier', 'encrier de voyage']],
    VERT: [['cartouche', 'tube de munition'], ['piege', 'ressort du piège'], ['couteau', 'manche du couteau'], ['gibeciere', 'boucle de la gibecière'],
      ['lanterne', 'lanterne sourde'], ['tabac', 'tabatière'], ['chapeau', 'chapeau de feutre'], ['balle', 'poire à poudre'], ['livre', 'permis de chasse plié']],
    BLEU: [['boussole', 'cadran de la boussole'], ['longuevue', 'bouchon de la longue-vue'], ['compas', 'tête du compas à pointes'], ['sextant', 'vernier du sextant'],
      ['rouleau', 'étui à cartes'], ['encrier', 'encrier à plume'], ['coquillage', 'coquillage-presse-papier'], ['lanterne', 'lampe tempête'], ['livre', 'carnet de relevés']]
  };
  C.fouille = (t) => {
    const pions = D.teamPions[t].filter(n => n !== C.HUITIEME[t]); // 7 pions
    const objs = OBJ[t];
    const vides = { JAUNE: [6, 8], ROUGE: [4, 7], VERT: [5, 7], BLEU: [5, 8] }[t];
    let k = 0;
    return objs.map((o, i) => ({ icon: o[0], nom: o[1], pion: vides.includes(i) ? null : pions[k++] }));
  };

  // ---------- étapes de chaque malle ----------
  // dur = minutes estimées par Alexia (ses déroulés) ; group = étape de sa trame (1 ouvrir … 5 coups)
  C.STEPS = {};

  C.STEPS.JAUNE = [
    { id: 'J-cadenas', group: '1. Ouvrir la malle', titre: 'Les lignes du couvercle', dur: 20, type: 'alchiLignes',
      code: '7362', solution: 'Cadenas 4 chiffres 7-3-6-2 : 7 croisements (ligne rouge) · fiole de 3 graduations (verte) · flèche vers l\'hexagone = 6 (bleue) · flèche posée sur la règle, graduation 2 (violette).',
      enVrai: 'Couvercle peint à l\'encre ; cadenas à 4 molettes du commerce, chaque molette repeinte de la couleur de sa ligne.',
      objets: ['Malle en bois peinte (lignes de 4 couleurs, 4 zones d\'énigme)', 'Cadenas à 4 chiffres, molettes peintes rouge/vert/bleu/violet'],
      hints: ['Chaque molette a sa couleur : suivez la ligne de la même couleur jusqu\'à son dessin. Chaque dessin donne UN chiffre.',
        'Rouge : comptez les points où deux traits se croisent (7). Verte : mesurez la fiole avec la règle (3). Bleue : la flèche vise l\'hexagone (6 côtés). Violette : la flèche tombe sur la graduation 2.'] },
    { id: 'J-carnet', group: '2. Découvrir son personnage', titre: 'Le carnet de l\'Alchimiste', dur: 5, type: 'carnet', doc: 'carnetJ',
      solution: 'Lecture du carnet.', enVrai: 'Carnet relié cuir, pages vieillies au thé ; 8 illustrations dont 6 marquées d\'un œil (servent au cryptex).',
      objets: ['Carnet de l\'Alchimiste (récit + 8 illustrations)'], hints: ['Lisez le carnet à voix haute : il servira encore pour le cryptex.', 'Gardez le carnet ouvert sur les illustrations marquées d\'un œil.'] },
    { id: 'J-pions', group: '3. Trouver ses 7 pions', titre: 'Les pions dans les objets', dur: 5, type: 'fouille',
      solution: 'Pions jaunes 24, 25, 28, 29, 30, 31, 32 cachés dans 7 objets (2 objets vides).', enVrai: 'Pions incrustés : bouchons de fioles creusés, socle de sablier, pied de lampe…',
      objets: ['9 objets d\'alchimiste dont 7 cachent un pion jaune'], hints: ['Les pions se logent dans les bouchons, les socles, les couvercles.', 'Manquants le plus souvent : le socle du sablier et la géode fendue.'] },
    { id: 'J-cryptex', group: '4. Ouvrir le coffre-fort', titre: 'Le cryptex et le tarot', dur: 10, type: 'cryptex',
      code: 'PIERRE', solution: 'Cryptex 6 lettres PIERRE : illustrations à l\'œil = ♠ ♥ ♦ ♣ ♣ ♦ ; dague ♠ 3 encoches → 3♠ = P ; fiole-cœur 7 gouttes → 7♥ = I ; creuset ♦ 9 clous → 9♦ = E ; sablier ♣ 4 traits → 4♣ = R.',
      enVrai: 'Cryptex 6 anneaux du commerce ; tarot imprimé (40 cartes, lettre + valeur + couleur) ; 4 objets gravés (dague, fiole en cœur, creuset, sablier). Option : tarot dans une boîte casse-tête si le temps est court (vocal 17/10).',
      objets: ['Cryptex 6 lettres', 'Jeu de tarot (lettre + valeur + couleur)', 'Dague ♠ 3 encoches', 'Fiole en cœur 7 gouttes gravées', 'Creuset ♦ 9 clous', 'Sablier ♣ 4 traits'],
      hints: ['Les illustrations marquées d\'un œil donnent l\'ordre des couleurs de cartes ; chaque objet donne la valeur de sa couleur.', 'Ordre : ♠ ♥ ♦ ♣ ♣ ♦. Cartes : 3♠, 7♥, 9♦, 4♣. Lisez les lettres.'] },
    { id: 'J-coups', group: '5. Trouver ses coups', titre: 'La recette alchimique', dur: 5, type: 'coups',
      solution: null, enVrai: 'Parchemin roulé dans le cryptex avec le 8e pion (33) ; tableau périodique affiché dans le couvercle. Chaque ligne de recette écrite dans sa couleur d\'arc-en-ciel + son symbole ; symbole de la fiole rappelé sur le parchemin (vocal 12/10).',
      objets: ['Parchemin-recette (4 lignes colorées)', 'Tableau périodique (1-36)', '8e pion jaune n° 33'],
      hints: ['Chaque élément du tableau porte un numéro : c\'est un numéro de trou.', 'Zinc = 30, Argon = 18 : « le pion du trou 30 va dans le trou 18 ».'] }
  ];

  C.STEPS.ROUGE = [
    { id: 'R-loupe', group: '1. Ouvrir la malle', titre: 'Les 7 différences', dur: 10, type: 'differences',
      solution: '7 différences sur l\'oiseau de droite : huppe, œil, bec, tache d\'aile, bague à la patte, plumes de queue, feuille de la branche.',
      enVrai: 'Deux oiseaux peints sur le couvercle ; sous chaque différence un interrupteur à aimant (ILS) ; loupe à réticule rouge avec aimant dans le manche, cachée sous la malle. 7 ILS en série → gâche électrique.',
      objets: ['Couvercle peint (2 oiseaux)', '7 interrupteurs à aimant (ILS) + gâche 6 V', 'Loupe aimantée à réticule (x2)'],
      hints: ['Comparez zone par zone : tête, ventre, ailes, queue, pattes, branche.', 'Regardez la huppe, l\'œil, le bout du bec, la tache de l\'aile, la patte, la queue et la feuille.'] },
    { id: 'R-carnet', group: '2. Découvrir son personnage', titre: 'Le carnet de l\'Ornithologue', dur: 5, type: 'carnet', doc: 'carnetR',
      solution: 'Lecture du carnet.', enVrai: 'Carnet de terrain avec croquis, liste des oiseaux bagués.', objets: ['Carnet de l\'Ornithologue (dont la liste des oiseaux bagués)'],
      hints: ['La liste des oiseaux bagués servira à la fin : gardez-la sous la main.', 'Notez les numéros de bague.'] },
    { id: 'R-pions', group: '3. Trouver ses 7 pions', titre: 'Les pions dans les objets', dur: 5, type: 'fouille',
      solution: 'Pions rouges 1, 2, 3, 4, 6, 9, 10.', enVrai: 'Pions dans la pointe de la cage, le toit du nichoir, la molette des jumelles…', objets: ['9 objets dont 7 cachent un pion rouge'],
      hints: ['Cherchez dans les pointes, les molettes, les toits.', 'Le nid de démonstration et le carnet de terrain se fouillent vite : ils sont vides.'] },
    { id: 'R-cables', group: '4. Ouvrir le coffre-fort', titre: 'Le walkman et le logigramme', dur: 20, type: 'cables',
      solution: 'Paille-en-queue → Falaise de Sainte-Rose → nid n° 1 ; Papangue → Forêt de Bébour → nid n° 2 ; Tuit-tuit → Plaine des Chicots → nid n° 3 ; Tec-tec → Maïdo → nid n° 4.',
      enVrai: 'Boîte en bois avec walkman encastré ; 3 colonnes de douilles bananes ; 8 câbles ; circuit fermé seulement si les 8 liaisons sont justes (contacts en série) → le moteur du walkman tourne.',
      objets: ['Walkman + cassette dans une boîte vitrée', '3 colonnes de douilles (4 oiseaux / 4 lieux / 4 nids)', '8 câbles à fiches bananes', '4 planches anatomiques', '4 polaroïds de lieux avec altitude', '4 nids numérotés', 'Grille de logigramme + 6 phrases'],
      hints: ['Commencez par l\'oiseau marin : la falaise est le seul lieu sous 100 m.', 'Le plus petit oiseau (Tec-tec, 13 cm) vit au plus haut (Maïdo). Le plus grand (Papangue) vit à Bébour.'] },
    { id: 'R-cassette', group: '4. Ouvrir le coffre-fort', titre: 'La cassette et la cage', dur: 5, type: 'cassette', code: '537',
      solution: 'Cadenas de la cage 5-3-7 : 5 « rrrou », 3 « pfit », 7 « grrr ».', enVrai: 'Cassette enregistrée (chant séquencé) ; petite cage avec cadenas 3 chiffres.',
      objets: ['Cassette du chant séquencé', 'Cage + cadenas 3 chiffres'], hints: ['Comptez chaque cri séparément, dans l\'ordre où ils arrivent.', '5 rrrou, puis 3 pfit, puis 7 grrr.'] },
    { id: 'R-perchoir', group: '5. Trouver ses coups', titre: 'Le perchoir', dur: 2, type: 'devisser', ou: 'perchoir',
      solution: 'Dévisser le perchoir (sens inverse des aiguilles d\'une montre) : 8e pion n° 5 + parchemin.', enVrai: 'Barreau de perchoir = cartouche filetée (tube bois + bouchon vissé).',
      objets: ['Perchoir-cartouche dévissable'], hints: ['Le barreau du perchoir tourne.', 'Tournez à gauche pour dévisser.'] },
    { id: 'R-coups', group: '5. Trouver ses coups', titre: 'Les chaînes alimentaires', dur: 8, type: 'coups',
      enVrai: 'Parchemin des chaînes alimentaires (chaque chaîne dans sa couleur d\'arc-en-ciel + symbole) ; cadre d\'insectes épinglés numérotés ; liste des oiseaux bagués dans le carnet.',
      objets: ['Parchemin des chaînes alimentaires', 'Cadre d\'insectes épinglés numérotés', '8e pion rouge n° 5'],
      hints: ['Chaque insecte a son numéro dans le cadre, chaque oiseau son numéro de bague : ce sont des numéros de trous.', '« Criquet est mangé par Merle pays » = 5 → 17 : le pion du trou 5 saute dans le trou 17.'] }
  ];

  C.STEPS.VERT = [
    { id: 'V-filet', group: '1. Accéder à la malle', titre: 'Le filet et ses anneaux', dur: 5, type: 'anneaux',
      solution: 'Baguenaudier à 4 anneaux, 10 gestes : anneaux 2, 1, 4, 1, 2, 1, 3, 1, 2, 1. Règle : l\'anneau 1 bouge librement ; un autre anneau bouge quand son voisin de gauche est engagé et tous ceux d\'avant libérés.',
      enVrai: 'Filet de pêche noué autour de la malle, fermé par un baguenaudier (casse-tête à anneaux) en fil d\'acier.',
      objets: ['Filet', 'Baguenaudier 4 anneaux'], hints: ['L\'anneau 1 se libère toujours. Un anneau bouge seulement si son voisin de gauche est engagé et tous ceux encore avant libérés.', 'Ordre gagnant : 2, 1, 4, 1, 2, 1, 3, 1, 2, 1.'] },
    { id: 'V-regards', group: '2. Ouvrir la malle', titre: 'Les regards des animaux', dur: 7, type: 'regards',
      solution: 'Appuyer en même temps sur les yeux de la Tangue, du Caméléon, du Paon et de l\'Ours (ni regardés, ni regardants).',
      enVrai: '14 animaux peints, boutons-pressoirs dans les yeux ; 4 bons boutons en série, les 10 leurres coupent le circuit ; boutons éloignés pour obliger 4 mains.',
      objets: ['14 animaux peints sur les flancs', '14 boutons-pressoirs (4 bons, 10 leurres)', 'Trappe latérale à gâche'],
      hints: ['Suivez chaque regard : le dodo regarde la baleine, la baleine regarde le chien… Cherchez ceux qui restent seuls.', 'Les 4 solitaires : Tangue, Caméléon, Paon, Ours. Appuyez tous en même temps.'] },
    { id: 'V-tige', group: '2. Ouvrir la malle', titre: 'La tige à dévisser', dur: 3, type: 'devisser', ou: 'tige',
      solution: 'Dévisser la tige (5 tours vers la gauche) : elle se termine par un crochet.', enVrai: 'Tige filetée M8 dans un écrou noyé ; extrémité pliée en crochet.',
      objets: ['Tige filetée à crochet'], hints: ['Tournez vers la gauche, longtemps.', 'Cinq tours complets.'] },
    { id: 'V-fente', group: '2. Ouvrir la malle', titre: 'Le crochet dans la fente', dur: 5, type: 'aveugle',
      solution: 'Labyrinthe à l\'aveugle (5×5) : droite, droite, bas, bas, gauche, gauche, bas, bas, droite, droite, droite, droite → anneau, puis « Tirer ».',
      enVrai: 'Fente sur le dessus ; labyrinthe en tasseaux à l\'intérieur ; anneau relié au loquet par une ficelle.',
      objets: ['Fente + labyrinthe intérieur en tasseaux', 'Anneau-loquet'], hints: ['Avancez petit à petit : chaque « toc » vous apprend un mur.', 'Le chemin part vers la droite puis descend.'] },
    { id: 'V-carnet', group: '3. Découvrir son personnage', titre: 'Le carnet du Braconnier', dur: 5, type: 'carnet', doc: 'carnetV',
      solution: 'Lecture du carnet (récit de traque = indice de la piste).', enVrai: 'Carnet de chasse, permis, tableau de trophées dans le couvercle, lettre d\'un acheteur.',
      objets: ['Carnet de traque', 'Permis de chasse (armes → calibres)', 'Tableau de trophées (animal → points, entourés)', 'Lettre d\'un acheteur'],
      hints: ['Le récit de traque décrit un chemin : notez les lieux.', 'Étang de Saint-Paul → Maïdo → Piton des Neiges → Plaine des Palmistes.'] },
    { id: 'V-pions', group: '4. Trouver ses 7 pions', titre: 'Les pions dans les objets', dur: 5, type: 'fouille',
      solution: 'Pions verts 11, 12, 18, 19, 20, 26, 27.', enVrai: 'Pions dans le tube de munition, le ressort du piège, la tabatière…', objets: ['9 objets dont 7 cachent un pion vert'],
      hints: ['Fouillez les tubes, les ressorts, les boucles.', 'La lanterne sourde et le chapeau sont vides.'] },
    { id: 'V-peau', group: '5. Ouvrir le coffre-fort', titre: 'La peau de bête et la cordelette', dur: 15, type: 'peau', code: 'RUSE',
      solution: 'Cordelette posée sur la piste du dodo (Étang de Saint-Paul → Maïdo → Piton des Neiges → Plaine des Palmistes) : les 4 nœuds entourent R, U, S, E → cadenas lettres RUSE.',
      enVrai: 'Peau (suédine) peinte : carte de La Réunion, 4 pistes d\'empreintes, lettres semées le long des pistes ; cordelette à 4 nœuds-boucles calibrée sur la piste du dodo ; boîte à munitions + cadenas 4 lettres.',
      objets: ['Peau de bête peinte (carte + 4 pistes)', 'Cordelette à 4 nœuds', 'Boîte à munitions + cadenas 4 lettres'],
      hints: ['La piste du dodo suit exactement le récit du carnet. Posez la cordelette sur cette piste.', 'Piste qui part de l\'étang de Saint-Paul : les nœuds entourent R, U, S, E.'] },
    { id: 'V-coups', group: '6. Trouver ses coups', titre: 'Armes et trophées', dur: 10, type: 'coups',
      enVrai: 'Parchemin roulé dans une cartouche de la boîte à munitions (lignes colorées + symboles) ; 4 balles gravées d\'un calibre ; permis + tableau de trophées.',
      objets: ['Parchemin dans une cartouche', '4 balles gravées', '8e pion vert n° 13'],
      hints: ['L\'arme donne un calibre (permis), l\'animal entouré donne des points (trophées, même cadre). Calibre et points = numéros de trous.', '« Fusil à plomb ⟶ Ours ◯ » = calibre 12 ⟶ 10 points : trou 12 → trou 10.'] }
  ];

  C.STEPS.BLEU = [
    { id: 'B-volcan', group: '1. Ouvrir la malle', titre: 'Le volcan (rouge)', dur: 4, type: 'anamorphose', dir: 'DROITE',
      solution: 'Œil posé sur l\'œilleton de la longue-vue (angle rasant) : la coulée de lave forme une flèche vers la DROITE.',
      enVrai: 'Anamorphose oblique peinte sur le couvercle ; œilleton fixe (tube en laiton) qui impose le point de vue.',
      objets: ['Anamorphose rouge (volcan + coulée)', 'Œilleton de longue-vue fixé à ras de la malle'],
      hints: ['Placez votre œil dans l\'œilleton : glissez lentement jusqu\'à voir un dessin net.', 'Œil presque au ras du bois ; la lave dessine une flèche vers la droite.'] },
    { id: 'B-taquin', group: '1. Ouvrir la malle', titre: 'Le Piton des Neiges (blanc)', dur: 6, type: 'taquin', dir: 'HAUT',
      solution: 'Taquin 3×3 reconstitué (montagne et courbes de niveau) : la case libre dévoile une flèche vers le HAUT (les petites flèches des carreaux sont des leurres).',
      enVrai: 'Taquin du commerce repeint (montagne en courbes de niveau) ; flèche peinte sur le fond, visible dans la case libre seulement.',
      objets: ['Taquin 3×3 repeint, fixé sur le flanc'],
      hints: ['Reconstituez le sommet d\'abord, puis la ligne du milieu.', 'Seule la flèche de la case libre compte : elle pointe vers le haut.'] },
    { id: 'B-fil', group: '1. Ouvrir la malle', titre: 'Cilaos, la route aux 400 virages (vert)', dur: 3, type: 'fil', dir: 'GAUCHE',
      solution: 'Boucle menée du départ à l\'arrivée en restant autour du fil : les lumières dessinent une flèche vers la GAUCHE.',
      enVrai: 'Jeu de kermesse : fil de cuivre tordu, boucle reliée à une pile ; 21 LED en cercle : toutes s\'allument au contact, la flèche s\'allume à l\'arrivée.',
      objets: ['Fil de cuivre tordu + boucle', '21 LED en rosace', 'Pile 9 V + petit circuit'],
      hints: ['Allez doucement dans les virages serrés.', 'La flèche lumineuse pointe vers la gauche.'] },
    { id: 'B-mafate', group: '1. Ouvrir la malle', titre: 'Mafate et ses ponts (marron)', dur: 5, type: 'ponts', dir: 'BAS', prop: true,
      solution: 'Ponts couplés (A bouge A+B ; B bouge B+C+D ; C bouge C+A ; D bouge D+B). Départ : seul le pont B est levé. Actionner A, B, C et D une fois chacun → les 4 ponts posés → la trappe s\'ouvre sur une flèche vers le BAS.',
      enVrai: 'PROPOSITION : chaque lamelle porte une goupille ; posée « je passe », elle libère son verrou. 4 verrous libres → un petit volet à ressort s\'ouvre au coin de la malle sur une flèche marron. Couplage par tringlerie dans la paroi. Lamelles réparties sur plusieurs faces de la malle (idée d\'Alexia) : les joueurs doivent se répartir autour et coopérer.',
      objets: ['Sentier peint tout autour de la malle', '4 ponts-lamelles couplés par tringles', '4 goupilles + volet à ressort (proposition)', 'Lamelles sur plusieurs faces pour forcer la coopération'],
      hints: ['Un pont en entraîne d\'autres : observez qui bouge avec qui.', 'Le pont B entraîne C et D : commencez par lui, puis regardez lesquels restent levés.'] },
    { id: 'B-cadenas', group: '1. Ouvrir la malle', titre: 'Le cadenas directionnel', dur: 2, type: 'directionnel', code: ['DROITE', 'HAUT', 'GAUCHE', 'BAS'],
      solution: 'Ordre du parcours Saint-Pierre → Saint-Denis : volcan → Piton des Neiges → Cilaos → Mafate = DROITE, HAUT, GAUCHE, BAS.',
      enVrai: 'Cadenas directionnel du commerce (type Master Lock 1500iD), code programmé.', objets: ['Cadenas directionnel 4 directions'],
      hints: ['Suivez la Diagonale des Fous depuis l\'ancre de Saint-Pierre : l\'ordre des étapes donne l\'ordre des flèches.', 'Droite, haut, gauche, bas.'] },
    { id: 'B-carnet', group: '2. Découvrir son personnage', titre: 'Le carnet du Cartographe', dur: 5, type: 'carnet', doc: 'carnetB', prop: true,
      solution: 'Lecture du carnet (liste de 4 relevés de nids en coordonnées).', enVrai: 'PROPOSITION : carnet de relevés + calque quadrillé (A-G × 1-7) glissé dedans.',
      objets: ['Carnet de relevés (proposition)', 'Calque quadrillé A-G × 1-7 (proposition)'], hints: ['Les relevés sont des cases : une lettre, un chiffre.', 'Le calque quadrillé aide à les trouver.'] },
    { id: 'B-pions', group: '3. Trouver ses 7 pions', titre: 'Les pions dans les objets', dur: 5, type: 'fouille',
      solution: 'Pions bleus 7, 8, 14, 16, 21, 22, 23.', enVrai: 'Pions dans le cadran de la boussole, le vernier du sextant…', objets: ['9 objets dont 7 cachent un pion bleu'],
      hints: ['Cherchez dans les cadrans, les bouchons, les têtes d\'instruments.', 'L\'étui à cartes et la lampe tempête sont vides.'] },
    { id: 'B-calque', group: '4. Ouvrir le coffre-fort', titre: 'Le calque et les nids', dur: 15, type: 'calque', code: '4185', prop: true,
      solution: 'PROPOSITION : calque posé sur la carte, repères alignés ; relevés E2, C4, D5, F4 → bagues 4, 1, 8, 5 → cadenas 4185.',
      enVrai: 'PROPOSITION : carte de l\'île sans quadrillage + calque rhodoïd quadrillé avec 4 croix de repère ; coffre = boîte d\'instruments à cadenas 4 chiffres.',
      objets: ['Carte des nids (sans quadrillage) — proposition', 'Calque rhodoïd quadrillé — proposition', 'Boîte d\'instruments + cadenas 4 chiffres — proposition'],
      hints: ['Alignez les 4 croix du calque sur celles de la carte, puis cherchez les cases du carnet.', 'E2 → 4, C4 → 1, D5 → 8, F4 → 5.'] },
    { id: 'B-coups', group: '5. Trouver ses coups', titre: 'Les vols relevés', dur: 10, type: 'coups', prop: true,
      enVrai: 'PROPOSITION : parchemin des vols (coordonnées, lignes colorées + symboles) + gabarit en croix (les 33 trous du plateau sur la grille A-G × 1-7) dans la boîte d\'instruments, avec le 8e pion 15 aimanté.',
      objets: ['Parchemin des vols — proposition', 'Gabarit en croix (coordonnées → numéros) — proposition', '8e pion bleu n° 15 AIMANTÉ (ouvre la 5e caisse)'],
      hints: ['Le gabarit en croix porte une lettre en colonne et un chiffre en ligne : chaque case est un trou numéroté.', 'A3 = trou 7, C3 = trou 9 : « le pion du trou 7 va dans le trou 9 ».'] }
  ];

  // Solutions des étapes « coups » calculées depuis les vrais coups
  for (const t of C.TEAMS) {
    const s = C.STEPS[t].find(s => s.type === 'coups');
    s.solution = C.movesOf(t).map(m => `coup ${m.n} : ${m.path.join(' → ')}`).join(' ; ');
    s.code = C.movesOf(t).map(m => m.path.join('-')).join(' | ');
  }

  // ---------- documents (sacoche) ----------
  C.DOCS = {
    carnetJ: { titre: "Carnet de l'Alchimiste", html: `<div class="carnet">
      <p>Je cherche depuis vingt ans la recette qui change une chose en une autre : le plomb en or, la cendre en braise, l'oubli en souvenir.</p>
      <p>Un marin m'a vendu une plume grise « d'un oiseau qui ne vole plus ». Il disait que l'oiseau vivait sur l'île Bourbon, qu'on l'appelait <b>dodo</b>, et qu'un seul œuf contiendrait de quoi tout recommencer.</p>
      <p>Alors j'ai rangé mes fioles, mon tarot et ma dague dans cette malle, et j'ai pris la mer. Mes huit pions jaunes m'accompagnent : ils me rappellent la partie de solitaire qu'on jouait, le soir, au comptoir de Saint-Paul.</p>
      <p class="ink-red">J'ai marqué d'un œil les gestes qui comptent. Le reste, c'est pour égarer les curieux.</p></div>` },
    carnetR: { titre: "Carnet de l'Ornithologue", html: `<div class="carnet">
      <p>J'ai bagué tous les oiseaux de mes hauts : chaque bague porte un numéro, je les garde ici.</p>
      <p>On me parle d'un gros oiseau gris, le <b>dodo</b>, qui aurait marché dans nos forêts. Je l'ai cherché à la jumelle, du Maïdo à Bébour. J'ai trouvé des plumes, des chants, des nids… et une piste.</p>
      <p>Ma cage attend son oiseau. Son perchoir garde mon secret.</p></div>
      <h3>Oiseaux bagués</h3><table class="reg">${Object.entries(C.BAGUES).map(([n, o]) => `<tr><td>Bague n° <b>${n}</b></td><td>${o}</td></tr>`).join('')}</table>` },
    carnetV: { titre: 'Carnet du Braconnier', html: `<div class="carnet">
      <p>Un acheteur de Londres paie le prix d'une maison pour un <b>dodo</b>, mort ou vif. Je le traque.</p>
      <p><b>Jour 1.</b> Ses traces partent du bord de l'<b>étang de Saint-Paul</b>, trois doigts larges, plus lourds que ceux d'une pintade.</p>
      <p><b>Jour 2.</b> Elles montent tout droit vers le <b>Maïdo</b>, puis longent le rempart.</p>
      <p><b>Jour 4.</b> Elles frôlent le <b>Piton des Neiges</b>. Il fait froid.</p>
      <p><b>Jour 6.</b> Elles redescendent vers la <b>Plaine des Palmistes</b>. Là, plus rien. Il m'a eu.</p>
      <p class="ink-red">Ma cordelette à nœuds sait suivre une piste mieux que moi.</p></div>` },
    carnetB: { titre: 'Carnet du Cartographe', prop: true, html: `<div class="carnet">
      <p>On m'a envoyé dessiner l'île pour la Compagnie des Indes. J'ai suivi le cœur de l'île, de Saint-Pierre à Saint-Denis, par les chemins les plus fous.</p>
      <p>Je cartographie aussi les oiseaux : chaque nid relevé porte sa case sur ma grille. Le <b>dodo</b>, lui, je l'ai cherché partout, et je n'ai trouvé que des solitaires blancs.</p>
      <p><b>Mes quatre nids, dans l'ordre de mes marches :</b></p>
      <p class="hand" style="font-size:1.7em;text-align:center">E2 — C4 — D5 — F4</p>
      <p class="ink-red">Mon calque quadrillé s'aligne sur les croix de la carte.</p></div>` },
    permis: { titre: 'Permis de chasse', html: `<table class="reg"><tr><th>Arme autorisée</th><th>Calibre</th></tr>${C.PERMIS.map(p => `<tr><td>${p[0]}</td><td><b>${p[1]}</b></td></tr>`).join('')}</table>` },
    trophees: { titre: 'Tableau de trophées (couvercle)', html: `<p class="small mut">Chaque nombre de points est entouré d'un cadre : rond, carré ou losange.</p><table class="reg"><tr><th>Trophée</th><th>Points</th></tr>${C.TROPHEES.map(p => `<tr><td>${p[0]}</td><td><b style="font-size:1.1em">${C.CADRES[p[1]]} ${p[2]}</b></td></tr>`).join('')}</table>` },
    insectes: { titre: "Cadre d'insectes épinglés", html: `<table class="reg">${Object.entries(C.INSECTES).map(([n, o]) => `<tr><td>n° <b>${n}</b></td><td>${o}</td></tr>`).join('')}</table>` },
    tableau: { titre: 'Tableau périodique', html: `<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px">${ELEMENTS.map((e, i) => `<div style="border:1px solid #b8a07a;border-radius:4px;padding:3px;text-align:center;background:#fbf4e2"><div class="small mut">${i + 1}</div><div style="font-family:Fell;font-size:1.25em">${SYMBOLES[i]}</div><div style="font-size:.66em;line-height:1.1">${e}</div></div>`).join('')}</div>` },
    gabarit: { titre: 'Gabarit en croix du Cartographe', prop: true, html: '' } // rempli par app.js
  };
  C.DOCS_OF = { JAUNE: ['carnetJ', 'tableau'], ROUGE: ['carnetR', 'insectes'], VERT: ['carnetV', 'permis', 'trophees'], BLEU: ['carnetB', 'gabarit'] };

  // ---------- finale ----------
  C.PHRASE_FMT = (letters) => { // letters = tableau de lettres dans l'ordre d'apparition
    const seg = [4, 2, 2, 2, 2, 9, 2, 2, 6], acc = new Set([5, 11, 22]);
    let out = '', k = 0;
    seg.forEach((n, si) => {
      for (let i = 0; i < n; i++, k++) {
        let L = letters[k];
        if (L === undefined) L = '·';
        else if (acc.has(k) && L === 'E') L = 'É';
        out += L;
      }
      out += si === 3 ? ', ' : ' ';
    });
    return out.trim();
  };
  C.FINS = {
    science: { titre: 'La science', txt: "L'œuf part au muséum. On apprend son nom, on l'enseigne, les enfants le dessinent dans leurs cahiers. Vous avez choisi la mémoire : grâce à vous, le solitaire de Bourbon reste connu de tous." },
    foret: { titre: 'La forêt', txt: "L'œuf part dans les hauts, au creux de la forêt. Peut-être qu'un matin, quelqu'un, dans vingt ans, entendra un cri inconnu… Vous avez choisi l'espoir : le solitaire garde sa part de mystère." }
  };
  window.CONTENT = C;
})();
