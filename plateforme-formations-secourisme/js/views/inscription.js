/* Inscription en 6 étapes avec enregistrement automatique. */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;
  const ETAPES = ["Session", "Identité", "Financement", "Pièces", "Paiement", "Confirmation"];
  const SITUATIONS = [
    ["salarie", "Salarié·e", "En poste dans une entreprise ou une collectivité"],
    ["emploi", "Demandeur d'emploi", "Inscrit·e à France Travail"],
    ["etudiant", "Étudiant·e ou lycéen·ne", "En cours d'études"],
    ["independant", "Indépendant·e", "Auto-entrepreneur, profession libérale"],
    ["autre", "Autre situation", "Retraité·e, bénévole, particulier"]
  ];
  const CONSEIL = { salarie: ["opco", "employeur", "cpf"], emploi: ["ft", "cpf"], etudiant: ["perso"], independant: ["cpf", "perso"], autre: ["perso"] };

  function nouveau(sid) {
    const s = sid ? App.store.session(sid) : null;
    return { etape: 1, formation: s ? s.formation : "", session: sid || "", identite: {}, situation: "", financement: "", pieces: [], reglement: "", paye: false, fini: false, savedAt: null };
  }

  App.views.inscription = function (el, [sid]) {
    let b = App.store.get().brouillon;
    if (!b || b.fini || (sid && b.session !== sid)) { b = nouveau(sid); App.store.update((s) => { s.brouillon = b; }); }
    const save = () => { b.savedAt = new Date().toTimeString().slice(0, 5); App.store.update((s) => { s.brouillon = b; }); const a = el.querySelector("#autosave"); if (a) a.innerHTML = I("checkCircle") + "Enregistré automatiquement à " + b.savedAt.replace(":", " h "); };
    const sess = () => App.store.session(b.session);
    const form = () => App.store.formation(b.formation);

    el.innerHTML = '<div class="wizard-top"><div class="container wizard-w"><div class="row-between" style="margin-bottom:8px"><h1 style="font-size:1.35rem;margin:0">Inscription</h1><span class="autosave" id="autosave" aria-live="polite"></span></div>' +
      '<div class="progress" role="progressbar" aria-label="Progression de l\'inscription" aria-valuemin="1" aria-valuemax="6"><i id="prog"></i></div><ol class="stepper" id="stepper" style="padding:0;margin:10px 0 0"></ol></div></div>' +
      '<div class="container wizard-w"><div class="wizard-body" id="wb"></div><div class="wizard-nav" id="wn"></div></div>';
    const wb = el.querySelector("#wb"), wn = el.querySelector("#wn");
    const topH = () => { const t = document.querySelector(".topbar"); el.querySelector(".wizard-top").style.setProperty("--sticky-top", (t ? t.offsetHeight : 100) + "px"); };
    topH();

    function head() {
      el.querySelector("#prog").style.width = (b.etape / 6 * 100) + "%";
      el.querySelector(".progress").setAttribute("aria-valuenow", b.etape);
      el.querySelector("#stepper").innerHTML = ETAPES.map((t, i) => '<li class="' + (i + 1 < b.etape ? "done" : i + 1 === b.etape ? "cur" : "") + '"' + (i + 1 === b.etape ? ' aria-current="step"' : "") + '><span class="n">' + (i + 1 < b.etape ? I("check") : i + 1) + '</span><span class="t">' + t + '</span></li>').join("");
      if (b.savedAt) el.querySelector("#autosave").innerHTML = I("checkCircle") + "Enregistré automatiquement à " + b.savedAt.replace(":", " h ");
    }
    function nav(nextLabel, onNext, opts) {
      opts = opts || {};
      wn.innerHTML = (b.etape > 1 && !opts.noBack ? '<button class="btn btn-ghost" id="prev">' + I("arrowLeft") + 'Retour</button>' : "<span></span>") +
        (nextLabel ? '<button class="btn btn-primary" id="next">' + nextLabel + ' ' + I("arrowRight") + '</button>' : "");
      const p = wn.querySelector("#prev"); if (p) p.onclick = () => go(b.etape - 1);
      const n = wn.querySelector("#next"); if (n) n.onclick = onNext;
    }
    function go(n) { b.etape = n; save(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); const h = wb.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }

    /* Étape 1 */
    function etape1() {
      const forms = D.formations.filter((f) => App.parts.futures().some((s) => s.formation === f.id));
      if (!b.formation) b.formation = forms[0].id;
      const ss = App.parts.futures().filter((s) => s.formation === b.formation);
      wb.innerHTML = '<h2>Quelle session vous fait envie ?</h2><p class="muted">Choisissez la formation puis la date qui vous convient.</p>' +
        '<div class="field"><label for="i-form">Formation</label><select id="i-form" class="input">' + forms.map((f) => '<option value="' + f.id + '"' + (f.id === b.formation ? " selected" : "") + '>' + f.code + ' · ' + f.nom + '</option>').join("") + '</select></div>' +
        '<fieldset class="stack mt" style="border:0;padding:0;margin-left:0;margin-right:0"><legend class="label" style="margin-bottom:8px">Date et lieu</legend>' +
        ss.map((s) => '<label class="radio-card"><input type="radio" name="sess" value="' + s.id + '"' + (s.id === b.session ? " checked" : "") + '><span style="flex:1"><b>' + ui.plage(s) + '</b><span class="sub">' + D.lieux[s.lieu].nom + ' · ' + s.horaires + '</span><span style="display:block;margin-top:6px">' + ui.placesBadge(s) + '</span></span><span class="price" style="font-size:1.1rem">' + ui.prix(form().tarif) + '</span></label>').join("") +
        '</fieldset><div class="info-box sand mt">' + I("info") + '<p>' + form().duree + ' · dès ' + form().ageMin + ' ans · ' + form().certif + '.</p></div>';
      wb.querySelector("#i-form").onchange = (e) => { b.formation = e.target.value; b.session = ""; b.financement = ""; b.pieces = []; save(); render(); };
      wb.querySelectorAll("[name=sess]").forEach((r) => r.onchange = () => { b.session = r.value; b.pieces = []; save(); });
      nav("Continuer", () => { if (!b.session) { ui.toast("Choisissez une date pour continuer.", "info"); return; } go(2); });
    }

    /* Étape 2 */
    const CHAMPS = [["prenom", "Prénom", "text", "given-name"], ["nom", "Nom", "text", "family-name"], ["naissance", "Date de naissance", "date", "bday"], ["email", "Adresse mail", "email", "email"], ["tel", "Téléphone", "tel", "tel"], ["commune", "Commune", "text", "address-level2"]];
    function etape2() {
      const id = b.identite;
      wb.innerHTML = '<div class="row-between"><h2 class="mb0">Faisons connaissance</h2><button class="btn btn-ghost btn-sm" id="demo-fill">' + I("sparkle") + 'Profil exemple</button></div><p class="muted mt">Ces informations figurent sur votre convocation et votre certificat.</p>' +
        '<div class="grid g2">' + CHAMPS.map(([k, l, t, ac]) => '<div class="field"><label for="id-' + k + '">' + l + '</label><input class="input" id="id-' + k + '" type="' + t + '" autocomplete="' + ac + '" value="' + ui.esc(id[k] || "") + '"><span class="hint" id="h-' + k + '"></span></div>').join("") + '</div>' +
        '<div class="info-box mt">' + I("lock") + '<p>Vos données restent confidentielles, hébergées en France et utilisées uniquement pour votre formation.</p></div>';
      CHAMPS.forEach(([k]) => wb.querySelector("#id-" + k).addEventListener("input", (e) => { id[k] = e.target.value; e.target.classList.remove("invalid"); save(); }));
      wb.querySelector("#demo-fill").onclick = () => {
        const age = Math.max(form().ageMin + 2, 24);
        Object.assign(id, { prenom: "Léa", nom: "Grondin", naissance: (new Date().getFullYear() - age) + "-04-12", email: "lea.grondin@exemple.re", tel: "0692 00 00 00", commune: "Saint-Paul" });
        save(); render();
      };
      nav("Continuer", () => {
        let ok = true;
        CHAMPS.forEach(([k]) => { const inp = wb.querySelector("#id-" + k), h = wb.querySelector("#h-" + k); h.textContent = ""; if (!String(id[k] || "").trim()) { inp.classList.add("invalid"); h.textContent = "À compléter"; ok = false; } });
        if (id.email && !/^\S+@\S+\.\S+$/.test(id.email)) { wb.querySelector("#id-email").classList.add("invalid"); wb.querySelector("#h-email").textContent = "Format attendu : prenom@exemple.fr"; ok = false; }
        if (id.naissance) {
          const age = (new Date(ui.parse(sess().date)) - ui.parse(id.naissance)) / 31557600000;
          if (age < form().ageMin) { wb.querySelector("#id-naissance").classList.add("invalid"); wb.querySelector("#h-naissance").textContent = "Cette formation est accessible dès " + form().ageMin + " ans : le PSC accueille dès 10 ans."; ok = false; }
        }
        if (ok) go(3); else { const f = wb.querySelector(".invalid"); f && f.focus(); }
      });
    }

    /* Étape 3 */
    function etape3() {
      const f = form(), s = sess();
      const conseil = CONSEIL[b.situation] || [];
      const fin = b.financement ? D.financements[b.financement] : null;
      const jours = ui.diff(ui.today(), s.date);
      wb.innerHTML = '<h2>Votre situation et votre financement</h2><p class="muted">Votre choix adapte automatiquement la liste des pièces à fournir.</p>' +
        '<fieldset style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Votre situation</legend><div class="grid g2">' +
        SITUATIONS.map(([k, l, d]) => '<label class="radio-card"><input type="radio" name="sit" value="' + k + '"' + (b.situation === k ? " checked" : "") + '><span><b>' + l + '</b><span class="sub">' + d + '</span></span></label>').join("") + '</div></fieldset>' +
        '<fieldset style="border:0;padding:0;margin:22px 0 0"><legend class="label" style="margin-bottom:8px">Mode de financement</legend><div class="stack">' +
        f.financements.map((k) => { const x = D.financements[k]; return '<label class="radio-card"><input type="radio" name="fin" value="' + k + '"' + (b.financement === k ? " checked" : "") + '><span style="flex:1"><b>' + x.nom + '</b>' + (conseil.includes(k) ? ' <span class="badge badge-info">Conseillé pour vous</span>' : "") + '<span class="sub">' + x.desc + '</span></span></label>'; }).join("") + '</div></fieldset>' +
        (fin ? '<div class="delai mt-l">' + I("clock") + '<div><small>Délai de prise en charge</small><b>' + fin.delai + '</b><small>' + (fin.delaiJours === 0 ? "Votre place est confirmée dès le règlement." : (fin.delaiJours <= jours ? "Parfait : votre session commence dans " + jours + " jours, le délai est respecté." : "Votre session commence dans " + jours + " jours : la session suivante vous laissera le temps idéal, nous vous la proposerons.")) + '</small></div></div>' +
          '<div class="card mt"><h3>Pièces demandées</h3><ul class="checklist-ul">' + App.docAI.piecesPour(f.id, b.financement).map((p) => '<li>' + I("file") + '<span><b>' + p.label + '</b><br><span class="small muted">' + p.aide + '</span></span></li>').join("") + '</ul></div>' : "");
      wb.querySelectorAll("[name=sit]").forEach((r) => r.onchange = () => { b.situation = r.value; if (!b.financement) { const c = (CONSEIL[r.value] || []).find((k) => f.financements.includes(k)); if (c) b.financement = c; } b.pieces = []; save(); render(); });
      wb.querySelectorAll("[name=fin]").forEach((r) => r.onchange = () => { b.financement = r.value; b.pieces = []; save(); render(); });
      nav("Continuer", () => { if (!b.situation || !b.financement) { ui.toast("Choisissez votre situation et votre financement.", "info"); return; } go(4); });
    }

    /* Étape 4 */
    function etape4() {
      const pieces = App.docAI.piecesPour(b.formation, b.financement);
      wb.innerHTML = '<h2>Vos pièces justificatives</h2><p class="muted">Déposez vos documents : l\'assistant les vérifie en quelques secondes et vous aide à corriger si besoin.</p><div id="docai"></div>';
      App.docAI.mount(wb.querySelector("#docai"), {
        pieces, etat: b.pieces, prenom: () => b.identite.prenom || "Léa", code: () => form().code + " du " + ui.dCourt(sess().date),
        onChange: (etat) => { b.pieces = etat; save(); }
      });
      nav("Continuer vers le paiement", () => {
        const reste = b.pieces.filter((p) => p.statut !== "conforme").length;
        if (!b.pieces.some((p) => p.statut)) { ui.toast("Déposez vos pièces ou testez un exemple pour continuer.", "info"); return; }
        if (reste) ui.toast(reste + " pièce" + (reste > 1 ? "s" : "") + " à compléter depuis votre espace : votre place reste réservée.", "info");
        go(5);
      });
    }

    /* Étape 5 */
    function etape5() {
      const f = form(), perso = b.financement === "perso";
      if (!b.reglement) b.reglement = perso ? "acompte" : "financeur";
      const acompte = Math.round(f.tarif * 0.3);
      const montant = b.reglement === "acompte" ? acompte : b.reglement === "total" ? f.tarif : 0;
      wb.innerHTML = '<h2>Règlement</h2><p class="muted">Paiement en ligne sécurisé, ou prise en charge par votre financeur.</p>' +
        '<div class="split"><div><fieldset style="border:0;padding:0;margin:0"><legend class="label" style="margin-bottom:8px">Mode de règlement</legend><div class="stack">' +
        (perso ? "" : '<label class="radio-card"><input type="radio" name="reg" value="financeur"' + (b.reglement === "financeur" ? " checked" : "") + '><span><b>Pris en charge : ' + D.financements[b.financement].court + '</b><span class="sub">Reste à charge : ' + ui.prix(0) + '. Nous facturons directement le financeur.</span></span></label>') +
        '<label class="radio-card"><input type="radio" name="reg" value="acompte"' + (b.reglement === "acompte" ? " checked" : "") + '><span><b>Acompte de 30 % : ' + ui.prix(acompte) + '</b><span class="sub">Le solde de ' + ui.prix(f.tarif - acompte) + ' se règle avant le premier jour.</span></span></label>' +
        '<label class="radio-card"><input type="radio" name="reg" value="total"' + (b.reglement === "total" ? " checked" : "") + '><span><b>Totalité : ' + ui.prix(f.tarif) + '</b><span class="sub">Tout est réglé en une fois.</span></span></label>' +
        '</div></fieldset>' +
        '<div class="card mt"><dl class="recap" style="margin:0"><div><dt>Formation</dt><dd class="v" style="margin:0">' + f.code + '</dd></div><div><dt>Session</dt><dd class="v" style="margin:0">' + ui.plage(sess()) + '</dd></div><div><dt>Tarif</dt><dd class="v" style="margin:0">' + ui.prix(f.tarif) + '</dd></div><div><dt>À régler aujourd\'hui</dt><dd class="v total" style="margin:0">' + ui.prix(montant) + '</dd></div></dl></div></div>' +
        '<div id="pay-zone">' + (montant > 0 ?
          '<div class="pay-card" aria-hidden="true"><div class="row-between"><span>' + I("card") + '</span><small>Carte de démonstration</small></div><div class="num">4242 4242 4242 4242</div><div class="row-between small"><span>' + ui.esc((b.identite.prenom || "") + " " + (b.identite.nom || "")).toUpperCase() + '</span><span>12/29</span></div></div>' +
          '<div class="grid mt" style="gap:12px"><div class="field"><label for="cc-num">Numéro de carte</label><input class="input" id="cc-num" inputmode="numeric" value="4242 4242 4242 4242" autocomplete="cc-number"></div><div class="grid g2" style="grid-template-columns:1fr 1fr"><div class="field"><label for="cc-exp">Expiration</label><input class="input" id="cc-exp" value="12/29" autocomplete="cc-exp"></div><div class="field"><label for="cc-cvc">Cryptogramme</label><input class="input" id="cc-cvc" value="123" inputmode="numeric" autocomplete="cc-csc"></div></div>' +
          '<p class="pay-secure">' + I("lock") + 'Paiement sécurisé simulé : la démo reste 100 % locale.</p></div>'
          : '<div class="info-box ok">' + I("shield") + '<p><b>Votre financeur règle la formation.</b> Nous lui transmettons la convention et la facture. Vous validez simplement votre engagement.</p></div>') + '</div></div>';
      wb.querySelectorAll("[name=reg]").forEach((r) => r.onchange = () => { b.reglement = r.value; save(); render(); });
      nav(montant > 0 ? "Payer " + ui.prix(montant) : "Confirmer la prise en charge", () => payer(montant));
    }
    function payer(montant) {
      wn.innerHTML = "";
      wb.querySelector("#pay-zone").innerHTML = '<div class="card" style="text-align:center;padding:36px"><div class="spinner" role="status" aria-label="Paiement en cours"></div><p class="mt mb0"><b>' + (montant ? "Paiement en cours…" : "Validation de la prise en charge…") + '</b></p><p class="small muted">Connexion sécurisée simulée</p></div>';
      setTimeout(() => { b.paye = true; b.montant = montant; finaliser(); go(6); }, 1500);
    }
    function finaliser() {
      if (b.fini) return;
      const s = sess(), f = form();
      const complet = b.pieces.length && b.pieces.every((p) => p.statut === "conforme");
      const nom = ((b.identite.prenom || "") + " " + (b.identite.nom || "")).trim() || "Stagiaire";
      const id = "i" + Date.now();
      App.store.update((st) => {
        st.inscriptions.unshift({ id, session: b.session, nom, financement: b.financement, statut: complet ? "convoque" : "pieces", creeLe: ui.today(), pieces: b.pieces.map((p) => Object.assign({}, p)), montant: b.montant, regle: b.reglement });
        const ss = st.sessions.find((x) => x.id === b.session); if (ss) ss.inscrits = Math.min(ss.places, ss.inscrits + 1);
        st.dossiers.unshift({ id: "d" + Date.now(), nom, session: b.session, statut: complet ? "paye" : "completer", financement: b.financement, nouveau: true,
          pieces: b.pieces.map((p) => ({ type: p.type, statut: p.statut || "manquant" })), recuLe: ui.today(), delaiTraitement: 0,
          historique: [{ date: ui.today(), texte: "Inscription reçue en ligne" }, { date: ui.today(), texte: "Analyse automatique des pièces par l'assistant" }, { date: ui.today(), texte: b.reglement === "financeur" ? "Prise en charge " + D.financements[b.financement].court + " déclarée" : "Paiement en ligne reçu : " + ui.prix(b.montant) }],
          relances: complet ? [] : [{ date: ui.today(), canal: "Mail", objet: "Votre dossier : pièces à compléter" }] });
      });
      App.store.addNotif({ type: complet ? "ok" : "warn", texte: (complet ? "Dossier complet : " : "Nouvelle inscription, pièces à compléter : ") + nom + " · " + f.code + " du " + ui.dCourt(s.date), lien: "#/bureau/dossiers" });
      b.fini = true; b.inscriptionId = id; save();
    }

    /* Étape 6 */
    function etape6() {
      const s = sess(), f = form(), id = b.identite;
      const complet = b.pieces.every((p) => p.statut === "conforme");
      const nom = ((id.prenom || "") + " " + (id.nom || "")).trim();
      wb.innerHTML = '<div style="text-align:center"><div class="success-mark">' + I("check") + '</div><h2>Bienvenue dans la formation, ' + ui.esc(id.prenom || "") + ' !</h2><p class="muted">Votre inscription est enregistrée. Un mail de confirmation vous attend dans votre boîte.</p></div>' +
        '<div class="card"><h3>Récapitulatif</h3><dl class="recap" style="margin:0">' +
        [["Formation", f.code + " · " + f.nom], ["Dates", ui.plage(s)], ["Lieu", D.lieux[s.lieu].nom], ["Financement", D.financements[b.financement].nom], ["Réglé aujourd'hui", ui.prix(b.montant || 0)], ["Pièces", complet ? "Toutes conformes" : b.pieces.filter((p) => p.statut === "conforme").length + " sur " + b.pieces.length + " conformes"]].map(([k, v]) => '<div><dt>' + k + '</dt><dd class="v" style="margin:0">' + ui.esc(v) + '</dd></div>').join("") + '</dl></div>' +
        (complet ? "" : '<div class="info-box sand mt">' + I("info") + '<p>Il reste une ou deux pièces à compléter : retrouvez-les dans votre espace, votre convocation se confirme dès leur validation.</p></div>') +
        '<div class="convoc mt" id="convoc"><span class="eyebrow">' + I("file") + 'Convocation</span><h3>' + f.nom + '</h3><p class="mb0"><b>' + ui.esc(nom) + '</b>, vous êtes attendu·e ' + ui.plage(s) + ', de 8 h 30 à 17 h 00.</p>' +
        '<ul class="checklist-ul mt"><li>' + I("pin") + '<span>' + D.lieux[s.lieu].nom + ' · ' + D.lieux[s.lieu].detail + '</span></li><li>' + I("package") + '<span>À apporter : tenue confortable, de quoi prendre des notes' + (f.secteur === "natation" ? ", maillot, bonnet et serviette" : "") + '.</span></li><li>' + I("users") + '<span>Formateur référent : ' + (s.equipe[0] ? App.store.formateur(s.equipe[0].f).nom : "communiqué à J-7") + '</span></li></ul></div>' +
        '<div class="grid g3 mt"><button class="btn btn-primary" id="dl-convoc">' + I("download") + 'Ma convocation</button><button class="btn btn-ghost" id="dl-ics">' + I("calendar") + 'Ajouter à mon agenda</button><a class="btn btn-ghost" href="#/espace">' + I("user") + 'Mon espace</a></div>';
      wb.querySelector("#dl-convoc").onclick = () => { ui.download("Convocation_" + f.code.replace(/\s/g, "-") + "_" + s.date + ".html", ui.docHTML("Convocation", wb.querySelector("#convoc").innerHTML)); ui.toast("Convocation téléchargée."); };
      wb.querySelector("#dl-ics").onclick = () => {
        const dt = s.date.replace(/-/g, "");
        ui.download(f.code.replace(/\s/g, "-") + ".ics", "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Demo//FR\r\nBEGIN:VEVENT\r\nUID:" + b.inscriptionId + "@demo\r\nDTSTART:" + dt + "T083000\r\nDTEND:" + dt + "T170000\r\nSUMMARY:" + f.nom + "\r\nLOCATION:" + D.lieux[s.lieu].nom + "\r\nEND:VEVENT\r\nEND:VCALENDAR", "text/calendar");
        ui.toast("Événement ajouté à votre agenda.");
      };
      wn.innerHTML = '<a class="btn btn-ghost" href="#/formations">Découvrir d\'autres formations</a>';
    }

    function render() {
      if (b.etape === 6 && !b.fini) b.etape = 5;
      if (b.etape > 1 && !b.session) b.etape = 1;
      if (b.fini && b.etape < 6) b.etape = 6;
      head();
      [null, etape1, etape2, etape3, etape4, etape5, etape6][b.etape]();
      ui.typo(el);
    }
    render();
  };
})();
