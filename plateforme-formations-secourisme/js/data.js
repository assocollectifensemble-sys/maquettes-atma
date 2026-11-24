/* ============================================================
   DONNÉES DE DÉMONSTRATION — tout est regroupé ici.
   Faits publics repris de la fédération : PSC = 7 h minimum, dès 10 ans,
   certificat de compétences ; PSE1 = 35 h minimum.
   Tous les autres chiffres (tarifs, dates, lieux, taux, personnes) sont FICTIFS.
   Les dates sont calculées à partir du jour courant pour que la démo reste vivante.
   ============================================================ */
(function () {
  const J0 = new Date(); J0.setHours(0, 0, 0, 0);
  const D = (n) => { const d = new Date(J0); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

  const secteurs = [
    { id: "secourisme", nom: "Secourisme", icone: "heart", desc: "PSC, PSE1, PSE2, SST : les gestes qui sauvent, du grand public aux équipes." },
    { id: "natation", nom: "Métiers de la natation", icone: "wave", desc: "BNSSA, BPJEPS AAN : devenez sauveteur aquatique ou maître nageur." },
    { id: "formateurs", nom: "Formateurs", icone: "award", desc: "Transmettez à votre tour : formations de formateurs en premiers secours." },
    { id: "recyclages", nom: "Recyclages", icone: "refresh", desc: "Gardez vos compétences à jour : formation continue PSE, BNSSA, SST." }
  ];

  const financements = {
    perso: { nom: "Financement personnel", court: "Personnel", delai: "Immédiat", delaiJours: 0, desc: "Vous réglez en ligne, en une fois ou avec un acompte." },
    cpf: { nom: "CPF (Mon Compte Formation)", court: "CPF", delai: "11 jours ouvrés minimum", delaiJours: 15, desc: "Vos droits CPF couvrent tout ou partie de la formation." },
    ft: { nom: "France Travail (AIF)", court: "France Travail", delai: "15 jours environ", delaiJours: 15, desc: "Votre conseiller valide une aide individuelle à la formation." },
    opco: { nom: "OPCO", court: "OPCO", delai: "3 à 4 semaines", delaiJours: 25, desc: "L'opérateur de compétences de votre employeur prend en charge la formation." },
    employeur: { nom: "Employeur (plan de développement)", court: "Employeur", delai: "1 semaine environ", delaiJours: 7, desc: "Votre employeur règle directement sur facture." }
  };

  const formations = [
    {
      id: "psc", code: "PSC", nom: "Premiers Secours Citoyen", secteur: "secourisme",
      duree: "7 h minimum", dureeH: 7, ageMin: 10, public: ["grand-public", "jeunes"],
      tarif: 65, certif: "Certificat de compétences de Premiers Secours Citoyen",
      resume: "Les gestes essentiels pour protéger, alerter et secourir une personne en attendant les secours.",
      prerequis: "Ouvert à toutes et à tous, dès 10 ans.",
      objectifs: ["Protéger une victime et son entourage", "Alerter les secours de façon efficace", "Réaliser les gestes face à un saignement, un étouffement, un arrêt cardiaque", "Utiliser un défibrillateur automatisé externe"],
      financements: ["perso", "employeur"], delaiAcces: "Inscription jusqu'à 48 h avant la session",
      reussite: 98, satisfaction: 96
    },
    {
      id: "pse1", code: "PSE1", nom: "Premiers Secours en Équipe de niveau 1", secteur: "secourisme",
      duree: "35 h minimum", dureeH: 35, ageMin: 16, public: ["adultes", "pro"],
      tarif: 390, certif: "Certificat de compétences de secouriste PSE1",
      resume: "Agir seul ou au sein d'une équipe avec le matériel de premiers secours. Prérequis du BNSSA.",
      prerequis: "Dès 16 ans. Prérequis indispensable pour le BNSSA et le métier de MNS.",
      objectifs: ["Choisir et exécuter les gestes de premiers secours", "Mettre en œuvre le matériel d'urgence aux côtés d'un équipier", "Assurer un bilan et une transmission claire", "Réagir face aux détresses vitales"],
      financements: ["perso", "cpf", "ft", "opco", "employeur"], delaiAcces: "Inscription jusqu'à 10 jours avant la session",
      reussite: 94, satisfaction: 95
    },
    {
      id: "pse2", code: "PSE2", nom: "Premiers Secours en Équipe de niveau 2", secteur: "secourisme",
      duree: "28 h", dureeH: 28, ageMin: 16, public: ["adultes", "pro"],
      tarif: 340, certif: "Certificat de compétences de secouriste PSE2",
      resume: "Prendre part à une équipe de secours, sous la responsabilité d'un chef d'équipe, jusqu'au transport de la victime.",
      prerequis: "Titulaire du PSE1 avec formation continue à jour.",
      objectifs: ["Intervenir au sein d'une équipe constituée", "Réaliser immobilisations et relevages", "Préparer le transport d'une victime", "Coordonner les gestes avec le chef d'équipe"],
      financements: ["perso", "cpf", "ft", "opco"], delaiAcces: "Inscription jusqu'à 10 jours avant la session",
      reussite: 92, satisfaction: 94
    },
    {
      id: "sst", code: "SST", nom: "Sauveteur Secouriste du Travail", secteur: "secourisme",
      duree: "12 h", dureeH: 12, ageMin: 16, public: ["pro"],
      tarif: 220, certif: "Certificat de Sauveteur Secouriste du Travail",
      resume: "Porter secours sur son lieu de travail et contribuer à la prévention des risques dans l'entreprise.",
      prerequis: "Salarié·e ou futur·e salarié·e.",
      objectifs: ["Intervenir face à une situation d'accident du travail", "Mettre en œuvre la conduite à tenir adaptée", "Contribuer à la prévention dans son entreprise"],
      financements: ["opco", "employeur", "perso"], delaiAcces: "Inscription jusqu'à 7 jours avant la session",
      reussite: 96, satisfaction: 96
    },
    {
      id: "bnssa", code: "BNSSA", nom: "Brevet National de Sécurité et de Sauvetage Aquatique", secteur: "natation",
      duree: "70 h", dureeH: 70, ageMin: 17, public: ["adultes", "jeunes"],
      tarif: 690, certif: "Brevet National de Sécurité et de Sauvetage Aquatique",
      resume: "Assurer la surveillance des plages et des piscines. La première étape vers les métiers de la natation.",
      prerequis: "Dès 17 ans, PSE1 à jour, certificat médical de moins de 3 mois.",
      objectifs: ["Surveiller une zone de baignade", "Réaliser un sauvetage aquatique", "Maîtriser le cadre réglementaire", "Coordonner l'alerte et les secours"],
      financements: ["perso", "cpf", "ft", "opco"], delaiAcces: "Dossier complet 15 jours avant la session",
      reussite: 88, satisfaction: 97
    },
    {
      id: "bpjeps", code: "BPJEPS AAN", nom: "BPJEPS Activités Aquatiques et de la Natation", secteur: "natation",
      duree: "10 mois en alternance", dureeH: 1200, ageMin: 18, public: ["adultes"],
      tarif: 6900, certif: "Diplôme d'État de niveau 4 — Maître nageur sauveteur",
      resume: "Le diplôme du maître nageur sauveteur : enseigner, animer et surveiller en toute sécurité.",
      prerequis: "Dès 18 ans, PSE1 et BNSSA à jour, tests d'exigences préalables (TEP) réussis.",
      objectifs: ["Enseigner la natation à tous les publics", "Animer des activités aquatiques", "Assurer la sécurité des pratiquants", "Participer au projet de la structure"],
      financements: ["cpf", "ft", "opco", "perso"], delaiAcces: "Sélection sur dossier et tests, 2 mois avant",
      reussite: 85, satisfaction: 93
    },
    {
      id: "fps", code: "PAE FPS", nom: "Formateur aux premiers secours", secteur: "formateurs",
      duree: "70 h", dureeH: 70, ageMin: 18, public: ["pro"],
      tarif: 1250, certif: "Certificat de compétences de formateur aux premiers secours",
      resume: "Animer à votre tour des sessions PSC et PSE avec une pédagogie active.",
      prerequis: "PSE2 à jour et pédagogie initiale et commune de formateur (PICF).",
      objectifs: ["Concevoir une séquence pédagogique", "Animer et évaluer un groupe", "Utiliser les référentiels nationaux", "Accompagner les stagiaires vers la certification"],
      financements: ["cpf", "opco", "perso"], delaiAcces: "Dossier complet 3 semaines avant",
      reussite: 90, satisfaction: 98
    },
    {
      id: "rec-pse", code: "FC PSE", nom: "Recyclage PSE1 / PSE2 (formation continue)", secteur: "recyclages",
      duree: "7 h", dureeH: 7, ageMin: 16, public: ["pro", "adultes"],
      tarif: 90, certif: "Attestation de formation continue",
      resume: "Une journée pour réactiver vos gestes et rester à jour des dernières recommandations.",
      prerequis: "Titulaire du PSE1 ou PSE2.",
      objectifs: ["Réviser les gestes et procédures", "Intégrer les nouvelles recommandations", "Valider la formation continue annuelle"],
      financements: ["perso", "opco", "employeur"], delaiAcces: "Inscription jusqu'à 48 h avant",
      reussite: 100, satisfaction: 95
    },
    {
      id: "rec-bnssa", code: "Révision BNSSA", nom: "Révision quinquennale BNSSA", secteur: "recyclages",
      duree: "7 h", dureeH: 7, ageMin: 17, public: ["pro", "adultes"],
      tarif: 120, certif: "Attestation de révision BNSSA",
      resume: "Renouvelez votre BNSSA et gardez votre aptitude à surveiller.",
      prerequis: "BNSSA, PSE1 à jour, certificat médical de moins de 3 mois.",
      objectifs: ["Valider les épreuves de révision", "Actualiser la réglementation", "Reprendre les techniques de sauvetage"],
      financements: ["perso", "opco", "employeur"], delaiAcces: "Dossier complet 10 jours avant",
      reussite: 97, satisfaction: 94
    },
    {
      id: "mac-sst", code: "MAC SST", nom: "Maintien et actualisation des compétences SST", secteur: "recyclages",
      duree: "7 h", dureeH: 7, ageMin: 16, public: ["pro"],
      tarif: 140, certif: "Certificat SST prolongé de 24 mois",
      resume: "Prolongez votre certificat SST de deux ans en une journée.",
      prerequis: "Certificat SST en cours de validité.",
      objectifs: ["Actualiser la conduite à tenir", "Revoir les situations d'accident", "Prolonger la validité du certificat"],
      financements: ["opco", "employeur", "perso"], delaiAcces: "Inscription jusqu'à 7 jours avant",
      reussite: 100, satisfaction: 97
    }
  ];

  const publics = { "grand-public": "Grand public", "jeunes": "Jeunes (dès 10 ans)", "adultes": "Adultes", "pro": "Professionnels" };

  const lieux = {
    sd: { nom: "Saint-Denis", detail: "Salle de formation, 1er étage, accès ascenseur" },
    sp: { nom: "Saint-Pierre", detail: "Piscine municipale et salle attenante" },
    sl: { nom: "Saint-Paul", detail: "Centre nautique, bassin de 25 m" },
    lp: { nom: "Le Port", detail: "Salle partenaire, zone d'activités" },
    sb: { nom: "Saint-Benoît", detail: "Salle associative, rez-de-chaussée" }
  };

  const formateurs = [
    { id: "f1", nom: "Kévin Payet", qualifs: ["PAE FPS", "PSE2", "BNSSA", "MNS"], couleur: "#0E7C8A" },
    { id: "f2", nom: "Sandrine Hoarau", qualifs: ["PAE FPS", "PSE2", "SST"], couleur: "#0B2A4A" },
    { id: "f3", nom: "Mickaël Técher", qualifs: ["MNS", "BNSSA", "PSE2"], couleur: "#8A5F36" },
    { id: "f4", nom: "Aurore Fontaine", qualifs: ["Formatrice de formateurs", "PAE FPS", "PSE2"], couleur: "#6A4FB0" },
    { id: "f5", nom: "Johan Grondin", qualifs: ["Formateur SST", "PSE1"], couleur: "#2E7D5B" }
  ];
  const moi = "f1"; // formateur connecté dans la démo

  // jours: liste d'offsets (jours de formation)
  const sessions = [
    { id: "s13", formation: "psc", debut: -8, jours: [0], lieu: "sd", places: 10, inscrits: 10, besoin: 1, qualif: "PAE FPS", equipe: [{ f: "f2", s: "confirme" }] },
    { id: "s14", formation: "pse1", debut: -20, jours: [0, 1, 2, 3, 4], lieu: "sp", places: 12, inscrits: 12, besoin: 2, qualif: "PAE FPS + PSE2 à jour", equipe: [{ f: "f1", s: "confirme" }, { f: "f4", s: "confirme" }] },
    { id: "s1", formation: "psc", debut: 6, jours: [0], lieu: "sd", places: 10, inscrits: 7, besoin: 1, qualif: "PAE FPS", equipe: [{ f: "f1", s: "confirme" }] },
    { id: "s3", formation: "sst", debut: 9, jours: [0, 1], lieu: "lp", places: 10, inscrits: 6, besoin: 1, qualif: "Formateur SST", equipe: [{ f: "f5", s: "confirme" }] },
    { id: "s2", formation: "pse1", debut: 12, jours: [0, 1, 2, 3, 4], lieu: "sp", places: 12, inscrits: 9, besoin: 2, qualif: "PAE FPS + PSE2 à jour", equipe: [{ f: "f2", s: "confirme" }] },
    { id: "s6", formation: "rec-pse", debut: 16, jours: [0], lieu: "sd", places: 12, inscrits: 10, besoin: 1, qualif: "PAE FPS", equipe: [{ f: "f1", s: "confirme" }] },
    { id: "s12", formation: "rec-bnssa", debut: 16, jours: [0], lieu: "sl", places: 14, inscrits: 9, besoin: 1, qualif: "MNS ou BNSSA + PAE FPS", equipe: [] },
    { id: "s4", formation: "bnssa", debut: 20, jours: [0, 1, 2, 3, 4, 7, 8, 9, 10], lieu: "sl", places: 14, inscrits: 8, besoin: 2, qualif: "MNS", equipe: [{ f: "f3", s: "confirme" }] },
    { id: "s5", formation: "psc", debut: 23, jours: [0], lieu: "sp", places: 10, inscrits: 3, besoin: 1, qualif: "PAE FPS", equipe: [] },
    { id: "s11", formation: "mac-sst", debut: 27, jours: [0], lieu: "lp", places: 10, inscrits: 7, besoin: 1, qualif: "Formateur SST", equipe: [{ f: "f5", s: "confirme" }] },
    { id: "s7", formation: "pse2", debut: 34, jours: [0, 1, 2, 3], lieu: "sd", places: 10, inscrits: 4, besoin: 2, qualif: "PAE FPS + PSE2 à jour", equipe: [] },
    { id: "s10", formation: "pse1", debut: 40, jours: [0, 1, 2, 3, 4], lieu: "sb", places: 12, inscrits: 2, besoin: 2, qualif: "PAE FPS + PSE2 à jour", equipe: [{ f: "f4", s: "propose" }] },
    { id: "s8", formation: "fps", debut: 45, jours: [0, 1, 2, 3, 4, 7, 8, 9, 10, 11], lieu: "sd", places: 8, inscrits: 5, besoin: 2, qualif: "Formatrice ou formateur de formateurs", equipe: [{ f: "f4", s: "confirme" }] },
    { id: "s15", formation: "psc", debut: 48, jours: [0], lieu: "sl", places: 10, inscrits: 0, besoin: 1, qualif: "PAE FPS", equipe: [] },
    { id: "s9", formation: "bpjeps", debut: 60, jours: [0, 1, 2, 3, 4], fin: 330, lieu: "sl", places: 16, inscrits: 11, besoin: 3, qualif: "MNS + expérience tutorat", equipe: [{ f: "f3", s: "confirme" }, { f: "f1", s: "confirme" }] }
  ].map((s) => Object.assign({}, s, {
    date: D(s.debut),
    dates: s.jours.map((j) => D(s.debut + j)),
    dateFin: D(s.debut + (s.fin || s.jours[s.jours.length - 1])),
    horaires: s.jours.length === 1 ? "8 h 30 – 17 h 00" : "8 h 30 – 17 h 00 chaque jour"
  }));

  // Pièces demandées selon formation et financement
  const piecesBase = {
    identite: { label: "Pièce d'identité", aide: "Carte d'identité, passeport ou titre de séjour, recto et verso." },
    photo: { label: "Photo d'identité récente", aide: "Fond clair, visage dégagé." },
    medical: { label: "Certificat médical de moins de 3 mois", aide: "Aptitude à la pratique du sauvetage aquatique." },
    pse1: { label: "Certificat PSE1 et formation continue à jour", aide: "Certificat initial et dernière attestation de formation continue." },
    pse2: { label: "Certificat PSE2 à jour", aide: "Certificat et attestation de formation continue de l'année." },
    bnssa: { label: "Diplôme BNSSA", aide: "Copie du diplôme et de la dernière révision." },
    sst: { label: "Certificat SST en cours de validité", aide: "Carte ou certificat SST." },
    autorisation: { label: "Autorisation parentale", aide: "Pour les stagiaires mineurs, signée par un représentant légal." },
    cpf: { label: "Capture de la demande Mon Compte Formation", aide: "Écran de confirmation de votre demande d'inscription." },
    ft: { label: "Attestation d'inscription France Travail", aide: "Téléchargeable dans votre espace personnel France Travail." },
    opco: { label: "Accord de prise en charge OPCO", aide: "Document transmis par votre employeur ou votre OPCO." },
    employeur: { label: "Bon de commande employeur", aide: "Signé par votre employeur, avec le cachet de l'entreprise." }
  };
  const piecesFormation = {
    psc: ["identite"], pse1: ["identite", "photo"], pse2: ["identite", "pse1"], sst: ["identite"],
    bnssa: ["identite", "photo", "medical", "pse1"], bpjeps: ["identite", "photo", "medical", "pse1", "bnssa"],
    fps: ["identite", "pse2"], "rec-pse": ["identite", "pse1"], "rec-bnssa": ["identite", "medical", "bnssa"], "mac-sst": ["identite", "sst"]
  };

  // Scénarios d'exemple pour l'assistant documents
  const scenariosIA = [
    { id: "parfait", nom: "Dossier complet", desc: "Toutes les pièces sont nettes et valides.", resultat: {} },
    { id: "flou", nom: "Photo floue et certificat ancien", desc: "Une pièce illisible, une pièce expirée.", resultat: { 0: "illisible", 1: "expire" } },
    { id: "erreur", nom: "Mauvaise pièce et oubli", desc: "Un document hors sujet, une pièce à ajouter.", resultat: { 1: "mauvaise", last: "manquant" } }
  ];
  const fichiersExemple = {
    identite: "CNI_recto-verso.jpg", photo: "photo-identite.jpg", medical: "certificat-medical.pdf", pse1: "certificat_PSE1.pdf",
    pse2: "certificat_PSE2.pdf", bnssa: "diplome_BNSSA.pdf", sst: "carte_SST.pdf", autorisation: "autorisation-parentale.pdf",
    cpf: "MonCompteFormation_demande.png", ft: "attestation_FranceTravail.pdf", opco: "accord_OPCO.pdf", employeur: "bon-de-commande.pdf"
  };

  // Stagiaires fictifs et dossiers suivis par le bureau
  const noms = ["Léa Grondin", "Thomas Rivière", "Inès Boyer", "Yanis Maillot", "Chloé Lebon", "Nathan Hoarau", "Emma Payet", "Lucas Técher",
    "Manon Fontaine", "Hugo Dijoux", "Jade Nativel", "Enzo Robert", "Camille Turpin", "Noah Lauret", "Sarah Clain", "Maël Bègue",
    "Zoé Mussard", "Raphaël Sautron", "Louise Damour", "Tom Laurent"];
  const statutsDossier = [
    { id: "recu", nom: "Reçus" }, { id: "completer", nom: "À compléter" }, { id: "valide", nom: "Validés" }, { id: "paye", nom: "Payés" }, { id: "traite", nom: "Traités" }
  ];
  const plan = [
    ["s1", "recu", "perso"], ["s1", "valide", "perso"], ["s1", "paye", "employeur"], ["s1", "paye", "perso"], ["s1", "completer", "perso"],
    ["s2", "completer", "cpf"], ["s2", "recu", "ft"], ["s2", "valide", "opco"], ["s2", "paye", "cpf"], ["s2", "completer", "ft"],
    ["s3", "paye", "opco"], ["s3", "valide", "employeur"], ["s3", "recu", "opco"],
    ["s4", "completer", "perso"], ["s4", "valide", "cpf"], ["s4", "recu", "ft"],
    ["s13", "traite", "perso"], ["s13", "traite", "employeur"], ["s14", "traite", "cpf"], ["s14", "traite", "opco"]
  ];
  const dossiers = plan.map(([sid, statut, fin], i) => {
    const s = sessions.find((x) => x.id === sid);
    const types = (piecesFormation[s.formation] || ["identite"]).concat(fin !== "perso" ? [fin] : []);
    const pieces = types.map((t, k) => {
      let st = "conforme";
      if (statut === "recu") st = k === 0 ? "conforme" : "attente";
      if (statut === "completer") st = k === types.length - 1 ? "manquant" : (k === 1 ? "illisible" : "conforme");
      return { type: t, statut: st };
    });
    const recu = Math.min(-2, s.debut - 30 + i);
    const hist = [{ date: D(recu), texte: "Inscription reçue en ligne" }, { date: D(recu), texte: "Analyse automatique des pièces par l'assistant" }];
    const relances = [];
    if (statut === "completer") {
      relances.push({ date: D(recu + 1), canal: "Mail", objet: "Votre dossier : une pièce à compléter" });
      if (i % 2) relances.push({ date: D(recu + 4), canal: "WhatsApp", objet: "Petit rappel pour finaliser votre dossier" });
      hist.push({ date: D(recu + 1), texte: "Relance automatique envoyée" });
    }
    if (["valide", "paye", "traite"].includes(statut)) hist.push({ date: D(recu + 2), texte: "Dossier validé par le bureau" });
    if (["paye", "traite"].includes(statut)) hist.push({ date: D(recu + 3), texte: fin === "perso" ? "Paiement en ligne reçu" : "Accord du financeur reçu" });
    if (statut === "traite") hist.push({ date: D(s.debut + 2), texte: "Certificat délivré et facture transmise" });
    return { id: "d" + (i + 1), nom: noms[i], session: sid, statut, financement: fin, pieces, historique: hist, relances, recuLe: D(recu), delaiTraitement: 1 + (i % 4) };
  });

  const notifications = [
    { id: "n1", type: "ok", texte: "Dossier complet pour PSC du {s1}", lien: "#/bureau/dossiers", quand: "il y a 12 min", lu: false },
    { id: "n2", type: "warn", texte: "3 pièces à relancer sur la session PSE1 du {s2}", lien: "#/bureau/dossiers", quand: "il y a 1 h", lu: false },
    { id: "n3", type: "alert", texte: "Session PSE2 du {s7} : 2 formateurs à trouver", lien: "#/bureau", quand: "il y a 3 h", lu: false },
    { id: "n4", type: "info", texte: "Aurore Fontaine se positionne sur PSE1 du {s10}", lien: "#/bureau/notifications", quand: "hier", lu: false, positionnement: { session: "s10", f: "f4" } },
    { id: "n5", type: "ok", texte: "Paiement reçu : SST du {s3}", lien: "#/bureau/dossiers", quand: "hier", lu: true },
    { id: "n6", type: "info", texte: "Session BNSSA du {s4} prête à ouvrir sur le site fédéral", lien: "#/bureau/federal", quand: "il y a 2 jours", lu: true }
  ];

  // Matériel et logistique par secteur
  const materiel = {
    secourisme: ["6 mannequins adulte, enfant et nourrisson", "3 défibrillateurs de formation", "Coupes de protection faciale et lingettes", "Sac de premiers secours complet", "Garrots et pansements compressifs de formation", "Couvertures de survie"],
    pse: ["Kit oxygène de formation", "Attelles et collier cervical", "Plan dur et sangles", "Aspirateur de mucosités de formation", "Brancard pliable"],
    natation: ["Bouées tube et bouées torpille", "Planche de sauvetage", "Mannequin immergeable", "Masques, palmes, tubas", "Trousse de secours de bassin", "Sifflets et chronomètres"],
    formateurs: ["Référentiels nationaux imprimés", "Vidéoprojecteur et paperboard", "Grilles d'évaluation", "Mannequins et défibrillateurs de formation"]
  };
  const checklist = ["Salle ou bassin réservé", "Clés ou badge d'accès récupérés", "Vidéoprojecteur et rallonge testés", "Eau et collations prévues", "Restauration du midi confirmée", "Accès personnes à mobilité réduite vérifié", "Parking et plan d'accès envoyés aux stagiaires", "Consignes de sécurité affichées"];

  // Aide aux démarches : parcours guidés
  const parcours = [
    {
      id: "cpf", titre: "Je finance avec mon CPF", icone: "wallet", duree: "15 min", intro: "Vos droits à la formation se mobilisent en ligne, en quelques clics.",
      etapes: [
        { t: "Ouvrez votre compte Mon Compte Formation", d: "Connectez-vous avec votre identité numérique (FranceConnect+). Prévoyez votre numéro de sécurité sociale.", icone: "user", min: 3 },
        { t: "Consultez vos droits disponibles", d: "Votre solde s'affiche en euros sur la page d'accueil. Notez-le pour la suite.", icone: "euro", min: 1 },
        { t: "Recherchez notre formation", d: "Tapez le nom de la formation et « La Réunion », puis choisissez notre session.", icone: "search", min: 3 },
        { t: "Envoyez votre demande d'inscription", d: "Nous vous répondons sous 2 jours ouvrés avec une proposition.", icone: "send", min: 3 },
        { t: "Validez la proposition", d: "Un délai de 11 jours ouvrés s'applique entre votre validation et le premier jour de formation. Votre place est confirmée.", icone: "check", min: 2 }
      ]
    },
    {
      id: "ft", titre: "Je suis demandeur d'emploi", icone: "briefcase", duree: "20 min", intro: "France Travail peut financer votre formation grâce à une aide individuelle (AIF).",
      etapes: [
        { t: "Parlez de votre projet à votre conseiller", d: "Expliquez en quoi la formation vous rapproche d'un emploi (sauveteur, MNS, agent de sécurité…).", icone: "chat", min: 5 },
        { t: "Demandez-nous un devis", d: "Nous vous envoyons le devis et le programme en moins de 24 h.", icone: "file", min: 2, action: "devis" },
        { t: "Nous déposons le devis pour vous", d: "Nous transmettons le devis directement à France Travail : vous gardez l'esprit libre.", icone: "upload", min: 1 },
        { t: "Votre conseiller valide l'aide", d: "Comptez environ 15 jours. Vous recevez une notification dans votre espace France Travail.", icone: "clock", min: 2 },
        { t: "Recevez votre convocation", d: "Dès l'accord reçu, votre convocation arrive par mail et dans votre espace.", icone: "mail", min: 1 }
      ]
    },
    {
      id: "employeur", titre: "Mon employeur finance", icone: "building", duree: "10 min", intro: "Votre entreprise prend en charge la formation, directement ou via son OPCO.",
      etapes: [
        { t: "Parlez-en à votre responsable ou aux RH", d: "Présentez la formation et les dates qui vous conviennent.", icone: "users", min: 3 },
        { t: "Transmettez devis et programme", d: "Téléchargez-les ici, ils sont prêts à être envoyés.", icone: "download", min: 1, action: "devis" },
        { t: "L'employeur sollicite son OPCO si besoin", d: "Comptez 3 à 4 semaines pour l'accord. Nous restons en contact avec l'OPCO.", icone: "clock", min: 2 },
        { t: "Envoyez-nous l'accord ou le bon de commande", d: "Déposez-le dans votre dossier : l'assistant le vérifie en quelques secondes.", icone: "upload", min: 2 },
        { t: "Signez la convention en ligne", d: "Une signature électronique, et tout est prêt pour le jour J.", icone: "pen", min: 2 }
      ]
    },
    {
      id: "perso", titre: "Je finance moi-même", icone: "card", duree: "5 min", intro: "Le plus rapide : réglez en ligne, en une fois ou avec un acompte de 30 %.",
      etapes: [
        { t: "Choisissez votre session", d: "Consultez le planning et les places restantes.", icone: "calendar", min: 1 },
        { t: "Déposez vos pièces", d: "L'assistant vérifie chaque document et vous guide.", icone: "upload", min: 2 },
        { t: "Réglez en ligne", d: "Paiement sécurisé, en totalité ou avec un acompte.", icone: "card", min: 1 },
        { t: "Recevez votre convocation", d: "Immédiatement par mail et dans votre espace.", icone: "mail", min: 1 }
      ]
    }
  ];

  const faq = [
    { q: "Quelle différence entre PSC et PSE1 ?", r: "Le PSC (7 h minimum, dès 10 ans) apprend les gestes essentiels du citoyen. Le PSE1 (35 h minimum, dès 16 ans) forme à agir en équipe avec du matériel : c'est aussi la porte d'entrée du BNSSA.", mots: ["psc", "pse", "différence", "difference"] },
    { q: "Combien de temps pour une prise en charge CPF ?", r: "Comptez 11 jours ouvrés minimum entre votre validation sur Mon Compte Formation et le premier jour de formation. Inscrivez-vous tôt pour garder le choix des dates.", mots: ["cpf", "compte", "délai", "delai"] },
    { q: "Quelles pièces dois-je fournir ?", r: "Cela dépend de la formation et du financement. La liste exacte s'affiche à l'étape 3 de l'inscription, avec une aide pour chaque pièce.", mots: ["pièce", "piece", "document", "fournir"] },
    { q: "Mon document a été signalé, que faire ?", r: "Cliquez sur « Redéposer » à côté de la pièce et suivez le conseil affiché. Une personne du bureau relit toujours votre dossier avant la validation finale.", mots: ["refus", "signal", "illisible", "expir", "redéposer"] },
    { q: "Puis-je payer en plusieurs fois ?", r: "Oui : vous pouvez verser un acompte de 30 % à l'inscription et régler le solde avant le premier jour.", mots: ["payer", "plusieurs", "acompte", "paiement"] },
    { q: "Je souhaite parler à une personne", r: "Avec plaisir ! L'équipe vous rappelle sous 24 h ouvrées. Vous pouvez aussi écrire à l'adresse de contact indiquée en bas de page.", mots: ["parler", "personne", "humain", "appeler", "téléphone"] }
  ];

  App.data = { J0, D, secteurs, financements, formations, publics, lieux, formateurs, moi, sessions, piecesBase, piecesFormation, scenariosIA, fichiersExemple, statutsDossier, dossiers, notifications, materiel, checklist, parcours, faq, noms };
})();
