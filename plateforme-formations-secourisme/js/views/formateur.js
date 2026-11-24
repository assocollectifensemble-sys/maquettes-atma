/* Espace formateur : sessions à pourvoir, mes sessions, kit de session, émargement numérique. */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;
  const MOI = D.moi;
  const S = () => App.store.get();
  const form = (id) => App.store.formation(id);
  const moiNom = () => App.store.formateur(MOI).nom;
  const chevauche = (a, b) => a.dates.some((d) => b.dates.includes(d));
  const mesSessions = () => S().sessions.filter((s) => s.equipe.some((e) => e.f === MOI && e.s === "confirme")).sort((a, b) => a.date.localeCompare(b.date));

  App.parts.stagiairesDe = function (s) {
    const fromDossiers = S().dossiers.filter((d) => d.session === s.id).map((d) => d.nom);
    const n = Math.min(Math.max(s.inscrits, fromDossiers.length), 14);
    const res = fromDossiers.slice();
    let k = s.id.length * 3 + s.debut;
    while (res.length < n) { const nm = D.noms[Math.abs(k++) % D.noms.length]; if (!res.includes(nm)) res.push(nm); else k += 2; if (k > 400) break; }
    const f = form(s.formation);
    return res.map((nom, i) => ({ nom, aptitude: i === 2 ? "Apte · asthme léger, inhalateur à portée" : (f.id === "psc" && i === 4) ? "Mineur · autorisation parentale reçue" : (f.secteur === "natation" && i === 1) ? "Apte · certificat médical du " + ui.dCourt(ui.add(s.date, -40)) : "Apte" }));
  };
  const slots = (s) => {
    let h = "";
    for (let i = 0; i < s.besoin; i++) {
      const e = s.equipe[i];
      if (e) { const fo = App.store.formateur(e.f); h += '<i class="fill" style="background:' + fo.couleur + (e.s === "propose" ? ";opacity:.55" : "") + '" title="' + fo.nom + (e.s === "propose" ? " (proposé)" : "") + '">' + ui.initiales(fo.nom) + '</i>'; }
      else h += "<i>+</i>";
    }
    return '<span class="slots" aria-label="' + s.equipe.length + ' sur ' + s.besoin + ' formateurs">' + h + "</span>";
  };
  App.parts.slots = slots;

  /* ---------- Sessions à pourvoir ---------- */
  App.views.formateurPourvoir = function (el) {
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("target") + 'Espace formateur · ' + moiNom() + '</span><h1>Sessions à pourvoir</h1><p class="lead">Positionnez-vous sur les sessions qui vous conviennent : le bureau confirme, et votre kit de session arrive automatiquement.</p></div><div class="grid g2" id="fp-list"></div><div class="section-sm"></div></div>';
    const list = el.querySelector("#fp-list");
    function render() {
      const mes = mesSessions();
      const ss = App.parts.futures().filter((s) => {
        const moi = s.equipe.find((e) => e.f === MOI);
        if (moi && moi.s === "confirme") return false;
        return moi || s.equipe.length < s.besoin;
      });
      list.innerHTML = ss.length ? ss.map((s) => {
        const f = form(s.formation), moi = s.equipe.find((e) => e.f === MOI);
        const conflit = mes.find((m) => chevauche(m, s));
        const qualifOk = App.store.formateur(MOI).qualifs.some((q) => s.qualif.includes(q));
        return '<article class="card sec-' + f.secteur + '"><div class="session-card">' + App.parts.dateBlock(s.date) + '<div><span class="tag">' + f.code + '</span><h2 style="font-size:1.1rem;margin:6px 0 4px">' + f.nom + '</h2>' +
          '<div class="meta"><span>' + I("calendar") + ui.plage(s) + '</span><span>' + I("pin") + D.lieux[s.lieu].nom + '</span><span>' + I("users") + s.inscrits + ' stagiaires</span></div></div></div>' +
          '<div class="need mt"><b style="color:var(--navy)">Besoin :</b> ' + s.besoin + ' formateur' + (s.besoin > 1 ? "s" : "") + ' ' + slots(s) + '</div>' +
          '<p class="small mt mb0"><b>Qualification requise :</b> ' + s.qualif + (qualifOk ? ' <span class="badge badge-ok">' + I("check") + 'Votre profil correspond</span>' : "") + '</p>' +
          (conflit ? '<div class="conflict mt">' + I("alert") + '<span><b>Conflit d\'agenda :</b> vous animez le ' + form(conflit.formation).code + ' à ' + D.lieux[conflit.lieu].nom + ' le ' + ui.dLong(conflit.dates.find((d) => s.dates.includes(d))) + '.</span></div>' : "") +
          '<div class="row mt">' + (moi ? '<span class="state-pill propose">' + I("clock") + 'Proposé · en attente du bureau</span><button class="link-btn" data-sim="' + s.id + '">Simuler la réponse du bureau</button><button class="link-btn" data-retire="' + s.id + '">Retirer ma proposition</button>'
            : '<button class="btn ' + (conflit ? "btn-ghost" : "btn-primary") + ' btn-sm" data-pos="' + s.id + '">' + I("plus") + 'Je me positionne</button>') + '</div></article>';
      }).join("") : '<div style="grid-column:1/-1">' + ui.vide("checkCircle", "Toutes les sessions sont pourvues", "Merci à toute l'équipe ! Les nouvelles sessions apparaissent ici dès leur ouverture.", '<a class="btn btn-primary" href="#/formateur/sessions">Voir mes sessions</a>') + '</div>';
      list.querySelectorAll("[data-pos]").forEach((b) => b.addEventListener("click", () => {
        const s = App.store.session(b.dataset.pos), f = form(s.formation);
        App.store.update(() => { s.equipe.push({ f: MOI, s: "propose" }); });
        App.store.addNotif({ type: "info", texte: moiNom() + " se positionne sur " + f.code + " du " + ui.dCourt(s.date), lien: "#/bureau/notifications", positionnement: { session: s.id, f: MOI } });
        ui.toast("Proposition envoyée au bureau pour " + f.code + " du " + ui.dCourt(s.date) + ".");
        render();
      }));
      list.querySelectorAll("[data-sim]").forEach((b) => b.addEventListener("click", () => {
        const s = App.store.session(b.dataset.sim);
        App.store.update(() => { s.equipe.find((e) => e.f === MOI).s = "confirme"; });
        ui.toast("Le bureau a confirmé votre présence. Votre kit de session est prêt !");
        render();
      }));
      list.querySelectorAll("[data-retire]").forEach((b) => b.addEventListener("click", () => {
        const s = App.store.session(b.dataset.retire);
        App.store.update(() => { s.equipe = s.equipe.filter((e) => e.f !== MOI); });
        ui.toast("Proposition retirée.", "info");
        render();
      }));
      ui.typo(list);
    }
    render();
  };

  /* ---------- Mes sessions ---------- */
  App.views.formateurSessions = function (el) {
    const mes = mesSessions();
    const fut = mes.filter((s) => ui.diff(ui.today(), s.dateFin) >= 0), pas = mes.filter((s) => ui.diff(ui.today(), s.dateFin) < 0);
    const card = (s) => { const f = form(s.formation); return '<article class="card sec-' + f.secteur + '"><div class="session-card">' + App.parts.dateBlock(s.date) + '<div><div class="row" style="gap:8px"><span class="tag">' + f.code + '</span><span class="state-pill confirme" style="padding:3px 10px;font-size:.8rem">' + I("check") + 'Confirmé</span></div><h2 style="font-size:1.1rem;margin:6px 0 4px">' + f.nom + '</h2><div class="meta"><span>' + I("calendar") + ui.plage(s) + ' · ' + ui.relatif(s.date) + '</span><span>' + I("pin") + D.lieux[s.lieu].nom + '</span><span>' + I("users") + s.inscrits + ' stagiaires</span></div>' +
      '<div class="row mt" style="gap:8px"><a class="btn btn-primary btn-sm" href="#/formateur/kit/' + s.id + '">' + I("package") + 'Kit de session</a><a class="btn btn-ghost btn-sm" href="#/formateur/emargement/' + s.id + '">' + I("signature") + 'Émargement</a></div></div></div></article>'; };
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("calendar") + 'Espace formateur</span><h1>Mes sessions</h1><p class="lead">Tout ce qu\'il vous faut pour chaque session : documents, matériel, logistique et émargement.</p></div>' +
      (fut.length ? '<div class="grid g2">' + fut.map(card).join("") + '</div>' : ui.vide("calendar", "Votre agenda est libre", "Positionnez-vous sur une session à pourvoir.", '<a class="btn btn-primary" href="#/formateur">Sessions à pourvoir</a>')) +
      (pas.length ? '<h2 class="month-title">Sessions réalisées</h2><div class="grid g2">' + pas.map(card).join("") + '</div>' : "") + '<div class="section-sm"></div></div>';
  };

  /* ---------- Kit de session ---------- */
  function fichiers(s) {
    const f = form(s.formation), c = f.code.replace(/\s+/g, "-"), d = ui.dNum(s.date).replace(/\//g, "-");
    return [
      { id: "emarg", nom: "Feuille-emargement_" + c + "_" + d + ".pdf", type: "PDF", desc: "Une ligne par stagiaire et par demi-journée", pages: s.dates.length * 2 },
      { id: "liste", nom: "Liste-stagiaires-aptitudes_" + c + "_" + d + ".xlsx", type: "XLS", desc: s.inscrits + " stagiaires, aptitudes et aménagements" },
      { id: "convoc", nom: "Convocation-type_" + c + ".docx", type: "DOC", desc: "Modèle envoyé aux stagiaires" },
      { id: "prog", nom: "Programme-deroule-pedagogique_" + c + ".pdf", type: "PDF", desc: "Séquences, horaires, objectifs" },
      { id: "mat", nom: "Fiche-materiel_" + c + "_" + d + ".pdf", type: "PDF", desc: "Mannequins, défibrillateurs, consommables" },
      { id: "logi", nom: "Checklist-logistique_" + c + ".pdf", type: "PDF", desc: "Salle, accès, restauration" },
      { id: "pv", nom: "PV-bilan-fin-de-session_" + c + "_" + d + ".docx", type: "DOC", desc: "À remplir en fin de session" }
    ];
  }
  const materielDe = (f) => f.secteur === "natation" ? D.materiel.natation.concat(D.materiel.secourisme.slice(1, 3)) : f.secteur === "formateurs" ? D.materiel.formateurs : f.id.startsWith("pse") || f.id === "rec-pse" ? D.materiel.secourisme.concat(D.materiel.pse) : D.materiel.secourisme;
  function contenu(id, s) {
    const f = form(s.formation), st = App.parts.stagiairesDe(s);
    switch (id) {
      case "emarg": return "<h1>Feuille d'émargement</h1><p>" + f.nom + " · " + ui.plage(s) + " · " + D.lieux[s.lieu].nom + "</p><table><tr><th>Stagiaire</th>" + s.dates.map((d) => "<th>" + ui.dCourt(d) + " matin</th><th>" + ui.dCourt(d) + " après-midi</th>").join("") + "</tr>" + st.map((x) => "<tr><td>" + x.nom + "</td>" + s.dates.map(() => "<td></td><td></td>").join("") + "</tr>").join("") + "</table>";
      case "liste": return "<h1>Liste des stagiaires et aptitudes</h1><table><tr><th>#</th><th>Stagiaire</th><th>Aptitude / aménagement</th></tr>" + st.map((x, i) => "<tr><td>" + (i + 1) + "</td><td>" + x.nom + "</td><td>" + x.aptitude + "</td></tr>").join("") + "</table>";
      case "convoc": return "<h1>Convocation</h1><p>Madame, Monsieur,</p><p>Nous avons le plaisir de vous accueillir en formation <b>" + f.nom + "</b> " + ui.plage(s) + ", de 8 h 30 à 17 h 00, " + D.lieux[s.lieu].nom + " (" + D.lieux[s.lieu].detail + ").</p><p>À très bientôt !</p>";
      case "prog": return "<h1>Programme et déroulé pédagogique</h1><p>" + f.nom + " · " + f.duree + "</p><table><tr><th>Séquence</th><th>Objectif</th></tr>" + f.objectifs.map((o, i) => "<tr><td>Séquence " + (i + 1) + "</td><td>" + o + "</td></tr>").join("") + "<tr><td>Évaluation</td><td>Mises en situation et validation des compétences</td></tr></table>";
      case "mat": return "<h1>Fiche matériel</h1><ul>" + materielDe(f).map((m) => "<li>" + m + "</li>").join("") + "</ul>";
      case "logi": return "<h1>Checklist logistique</h1><ul>" + D.checklist.map((m) => "<li>☐ " + m + "</li>").join("") + "</ul>";
      case "pv": return "<h1>Procès-verbal et bilan de fin de session</h1><p>" + f.nom + " · " + ui.plage(s) + "</p><p>Présents : ___ / " + s.inscrits + " · Certifiés : ___</p><p>Observations :</p><p>______________________________</p>";
    }
  }

  App.views.formateurKit = function (el, [sid]) {
    const s = App.store.session(sid);
    if (!s) return App.views.notFound(el);
    const f = form(s.formation);
    const files = fichiers(s);
    let tab = "docs";
    el.innerHTML = '<div class="container"><div class="page-head"><a class="back" href="#/formateur/sessions">' + I("arrowLeft") + 'Mes sessions</a><span class="eyebrow" style="display:flex">' + I("package") + 'Kit de session</span><h1>' + f.code + ' · ' + ui.plage(s) + '</h1><p class="lead">' + f.nom + ' · ' + D.lieux[s.lieu].nom + ' · ' + s.inscrits + ' stagiaires</p>' +
      '<div class="row"><button class="btn btn-primary" id="kit-all">' + I("download") + 'Télécharger le kit complet</button><a class="btn btn-ghost" href="#/formateur/emargement/' + s.id + '">' + I("signature") + 'Ouvrir l\'émargement</a></div></div>' +
      '<div class="tabs" role="tablist">' + [["docs", "Documents"], ["stag", "Stagiaires"], ["mat", "Matériel"], ["logi", "Logistique"], ["pv", "Bilan de fin"]].map(([k, l]) => '<button role="tab" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + l + '</button>').join("") + '</div><div id="kit-body" role="tabpanel"></div><div class="section-sm"></div></div>';
    const body = el.querySelector("#kit-body");
    function render() {
      el.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
      const st = App.store.get();
      if (tab === "docs") {
        body.innerHTML = '<div class="kit-list">' + files.map((x) => '<div class="kit-file"><span class="f-ico ' + (x.type === "XLS" ? "xls" : x.type === "DOC" ? "doc" : "") + '">' + x.type + '</span><div style="min-width:0"><span class="name">' + x.nom + '</span><small>' + x.desc + (x.pages ? " · " + x.pages + " colonnes" : "") + '</small></div><button class="icon-btn" data-prev="' + x.id + '" aria-label="Aperçu de ' + x.nom + '">' + I("eye") + '</button><button class="icon-btn" data-dl="' + x.id + '" aria-label="Télécharger ' + x.nom + '">' + I("download") + '</button></div>').join("") + '</div><p class="small muted mt">Documents générés automatiquement à partir des dossiers validés · versions de démonstration au format HTML.</p>';
      } else if (tab === "stag") {
        body.innerHTML = '<div class="presence">' + App.parts.stagiairesDe(s).map((x) => '<div class="presence-row"><span class="avatar">' + ui.initiales(x.nom) + '</span><div><b style="color:var(--navy)">' + x.nom + '</b><div class="small muted">' + x.aptitude + '</div></div>' + (x.aptitude === "Apte" ? '<span class="badge badge-ok">Apte</span>' : '<span class="badge badge-info">À noter</span>') + '</div>').join("") + '</div>';
      } else if (tab === "mat") {
        body.innerHTML = '<div class="card"><h2 style="font-size:1.2rem">Fiche matériel</h2><ul class="checklist-ul">' + materielDe(f).map((m) => '<li>' + I("package") + '<span>' + m + '</span></li>').join("") + '</ul><div class="info-box mt">' + I("info") + '<p>Matériel à retirer au local de Saint-Denis à J-2, ou livré sur site sur demande.</p></div></div>';
      } else if (tab === "logi") {
        const ck = st.checklists[s.id] || [];
        const n = ck.filter(Boolean).length;
        body.innerHTML = '<div class="card"><div class="row-between"><h2 style="font-size:1.2rem;margin:0">Checklist logistique</h2><span class="badge ' + (n === D.checklist.length ? "badge-ok" : "badge-info") + '">' + n + '/' + D.checklist.length + '</span></div><div class="progress mt"><i style="width:' + (n / D.checklist.length * 100) + '%"></i></div><div class="mt">' +
          D.checklist.map((c, i) => '<label class="check"><input type="checkbox" data-ck="' + i + '"' + (ck[i] ? " checked" : "") + '><span>' + c + '</span></label>').join("") + '</div></div>';
        body.querySelectorAll("[data-ck]").forEach((c) => c.addEventListener("change", () => { App.store.update((x) => { x.checklists[s.id] = x.checklists[s.id] || []; x.checklists[s.id][+c.dataset.ck] = c.checked; }); render(); }));
      } else {
        const bl = st.bilans[s.id] || {};
        body.innerHTML = '<form class="card" id="pv-form"><h2 style="font-size:1.2rem">Procès-verbal et bilan de fin de session</h2><div class="grid g2"><div class="field"><label for="pv-pres">Stagiaires présents</label><input class="input" id="pv-pres" type="number" min="0" max="' + s.inscrits + '" value="' + (bl.pres != null ? bl.pres : s.inscrits) + '"></div><div class="field"><label for="pv-cert">Stagiaires certifiés</label><input class="input" id="pv-cert" type="number" min="0" value="' + (bl.cert != null ? bl.cert : s.inscrits) + '"></div>' +
          '<div class="field"><label for="pv-sat">Satisfaction moyenne (sur 5)</label><input class="input" id="pv-sat" type="number" step=".1" min="0" max="5" value="' + (bl.sat || "4.7") + '"></div><div class="field"><label for="pv-mat">État du matériel</label><select class="input" id="pv-mat">' + ["Complet et en bon état", "Consommables à réassortir", "Un équipement à réviser"].map((o) => '<option' + (bl.mat === o ? " selected" : "") + '>' + o + '</option>').join("") + '</select></div></div>' +
          '<div class="field mt"><label for="pv-obs">Observations</label><textarea class="input" id="pv-obs" placeholder="Points forts du groupe, axes de progression…">' + ui.esc(bl.obs || "") + '</textarea></div><div class="row mt"><button class="btn btn-primary" type="submit">' + I("check") + 'Enregistrer le bilan</button>' + (bl.saved ? '<span class="badge badge-ok">' + I("check") + 'Transmis au bureau</span>' : "") + '</div></form>';
        body.querySelector("#pv-form").addEventListener("submit", (e) => {
          e.preventDefault();
          App.store.update((x) => { x.bilans[s.id] = { pres: +body.querySelector("#pv-pres").value, cert: +body.querySelector("#pv-cert").value, sat: body.querySelector("#pv-sat").value, mat: body.querySelector("#pv-mat").value, obs: body.querySelector("#pv-obs").value, saved: true }; });
          ui.toast("Bilan enregistré et transmis au bureau.");
          render();
        });
      }
      body.querySelectorAll("[data-prev]").forEach((b) => b.addEventListener("click", () => {
        const x = files.find((y) => y.id === b.dataset.prev);
        const m = ui.modal({ title: x.nom, large: true, body: '<div class="convoc doc-preview">' + contenu(x.id, s).replace(/<h1>/g, '<h3>').replace(/<\/h1>/g, '</h3>').replace(/<table>/g, '<div style="overflow-x:auto"><table class="alert-table">').replace(/<\/table>/g, '</table></div>') + '</div>', foot: '<button class="btn btn-primary" id="m-dl">' + I("download") + 'Télécharger</button>' });
        m.querySelector("#m-dl").onclick = () => dl(x);
      }));
      body.querySelectorAll("[data-dl]").forEach((b) => b.addEventListener("click", () => dl(files.find((y) => y.id === b.dataset.dl))));
      ui.typo(body);
    }
    function dl(x) { ui.download(x.nom.replace(/\.\w+$/, ".html"), ui.docHTML(x.nom, contenu(x.id, s))); ui.toast(x.nom + " téléchargé."); }
    el.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.tab; render(); }));
    el.querySelector("#kit-all").onclick = () => { ui.download("Kit-session_" + f.code.replace(/\s+/g, "-") + "_" + s.date + ".html", ui.docHTML("Kit de session", files.map((x) => contenu(x.id, s)).join("<hr>"))); ui.toast("Kit complet téléchargé (7 documents)."); };
    render();
  };

  /* ---------- Émargement ---------- */
  App.views.formateurEmargement = function (el, [sid]) {
    const mes = mesSessions().filter((s) => ui.diff(ui.today(), s.dateFin) >= -30);
    const s = sid ? App.store.session(sid) : (mes.find((x) => ui.diff(ui.today(), x.dateFin) >= 0) || mes[0]);
    if (!s) { el.innerHTML = '<div class="container section">' + ui.vide("signature", "L'émargement s'ouvre avec votre première session", "Positionnez-vous sur une session pour commencer.", '<a class="btn btn-primary" href="#/formateur">Sessions à pourvoir</a>') + '</div>'; return; }
    const f = form(s.formation);
    const st0 = App.parts.stagiairesDe(s);
    let jour = s.dates.includes(ui.today()) ? ui.today() : s.dates[0], demi = "matin";
    el.innerHTML = '<div class="container narrow"><div class="page-head"><span class="eyebrow">' + I("signature") + 'Émargement numérique</span><h1>Feuille de présence</h1>' +
      '<div class="field"><label for="em-s">Session</label><select class="input" id="em-s">' + mes.map((x) => '<option value="' + x.id + '"' + (x.id === s.id ? " selected" : "") + '>' + form(x.formation).code + ' · ' + ui.plage(x) + '</option>').join("") + '</select></div>' +
      '<div class="row mt"><div class="field" style="flex:1;min-width:150px"><label for="em-j">Jour</label><select class="input" id="em-j">' + s.dates.map((d) => '<option value="' + d + '"' + (d === jour ? " selected" : "") + '>' + ui.dLong(d, true) + '</option>').join("") + '</select></div>' +
      '<div class="seg" role="group" aria-label="Demi-journée" style="margin-top:26px"><button data-demi="matin" aria-pressed="true">Matin</button><button data-demi="aprem" aria-pressed="false">Après-midi</button></div></div></div>' +
      '<div class="row-between mt"><span id="em-count" class="badge badge-info"></span><div class="row" style="gap:8px"><button class="btn btn-ghost btn-sm" id="em-all">' + I("check") + 'Tous présents</button><button class="btn btn-primary btn-sm" id="em-exp">' + I("download") + 'Exporter</button></div></div>' +
      '<div class="presence mt" id="em-list"></div><p class="small muted mt">Touchez un nom pour faire signer la personne au doigt, directement sur le téléphone.</p><div class="section-sm"></div></div>';
    const key = () => jour + "-" + demi;
    const data = () => { const st = App.store.get(); st.emargements[s.id] = st.emargements[s.id] || {}; st.emargements[s.id][key()] = st.emargements[s.id][key()] || {}; return st.emargements[s.id][key()]; };
    function render() {
      const d = data();
      el.querySelectorAll("[data-demi]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.demi === demi)));
      const n = st0.filter((x) => d[x.nom] && d[x.nom].sig).length;
      el.querySelector("#em-count").textContent = n + " / " + st0.length + " signatures";
      el.querySelector("#em-list").innerHTML = st0.map((x, i) => {
        const r = d[x.nom];
        return '<button type="button" class="presence-row' + (r && r.sig ? " ok" : "") + '" data-i="' + i + '" style="font:inherit;text-align:left;cursor:pointer;width:100%"><span class="avatar">' + ui.initiales(x.nom) + '</span><span><b style="color:var(--navy)">' + x.nom + '</b><span class="small muted" style="display:block">' + (r && r.sig ? "Signé à " + r.h : "Touchez pour signer") + '</span></span>' +
          (r && r.sig ? '<img class="sig" src="' + r.sig + '" alt="Signature de ' + x.nom + '">' : '<span class="badge badge-muted">' + I("pen") + 'Signer</span>') + '</button>';
      }).join("");
      el.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => signer(st0[+b.dataset.i])));
      ui.typo(el.querySelector("#em-list"));
    }
    function signer(x) {
      const m = ui.modal({ title: "Signature de " + x.nom, body: '<p class="small muted">' + f.code + ' · ' + ui.dLong(jour, true) + ' · ' + (demi === "matin" ? "matin" : "après-midi") + '</p><canvas class="sign-pad" id="pad" aria-label="Zone de signature, dessinez avec le doigt ou la souris"></canvas><button class="link-btn" id="pad-clear">Effacer et recommencer</button>', foot: '<button class="btn btn-ghost" data-close>Retour</button><button class="btn btn-primary" id="pad-ok">' + I("check") + 'Valider la signature</button>' });
      const c = m.querySelector("#pad"), ctx = c.getContext("2d");
      const fit = () => { const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; c.width = r.width * dpr; c.height = r.height * dpr; ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0B2A4A"; };
      requestAnimationFrame(fit);
      let draw = false, has = false, last = null;
      const pt = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      c.addEventListener("pointerdown", (e) => { draw = true; last = pt(e); c.setPointerCapture(e.pointerId); });
      c.addEventListener("pointermove", (e) => { if (!draw) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p; has = true; });
      ["pointerup", "pointercancel"].forEach((ev) => c.addEventListener(ev, () => { draw = false; }));
      m.querySelector("#pad-clear").onclick = () => { ctx.clearRect(0, 0, c.width, c.height); has = false; };
      m.querySelector("#pad-ok").onclick = () => {
        if (!has) { ui.toast("Dessinez la signature dans le cadre.", "info"); return; }
        const t = new Date();
        App.store.update(() => { data()[x.nom] = { sig: c.toDataURL("image/png"), h: String(t.getHours()).padStart(2, "0") + " h " + String(t.getMinutes()).padStart(2, "0") }; });
        ui.closeModal(); ui.toast("Signature enregistrée pour " + x.nom + "."); render();
      };
    }
    el.querySelector("#em-s").onchange = (e) => App.go("#/formateur/emargement/" + e.target.value);
    el.querySelector("#em-j").onchange = (e) => { jour = e.target.value; render(); };
    el.querySelectorAll("[data-demi]").forEach((b) => b.addEventListener("click", () => { demi = b.dataset.demi; render(); }));
    el.querySelector("#em-all").onclick = () => {
      const t = new Date();
      const cv = document.createElement("canvas"); cv.width = 220; cv.height = 70; const cx = cv.getContext("2d");
      App.store.update(() => { const d = data(); st0.forEach((x, i) => { if (!(d[x.nom] && d[x.nom].sig)) { cx.clearRect(0, 0, 220, 70); cx.strokeStyle = "#0B2A4A"; cx.lineWidth = 2.4; cx.beginPath(); cx.moveTo(10, 45); for (let k = 0; k < 8; k++) cx.quadraticCurveTo(20 + k * 24, (k + i) % 2 ? 10 : 60, 32 + k * 24, 40); cx.stroke(); d[x.nom] = { sig: cv.toDataURL(), h: String(t.getHours()).padStart(2, "0") + " h " + String(t.getMinutes()).padStart(2, "0") }; } }); });
      ui.toast("Présences complétées (signatures de démonstration)."); render();
    };
    el.querySelector("#em-exp").onclick = () => {
      const d = data();
      ui.download("Emargement_" + f.code.replace(/\s+/g, "-") + "_" + jour + "_" + demi + ".csv", "﻿Stagiaire;Session;Jour;Demi-journée;Statut;Heure\n" + st0.map((x) => [x.nom, f.code, jour, demi === "matin" ? "Matin" : "Après-midi", d[x.nom] && d[x.nom].sig ? "Présent·e (signé)" : "À signer", d[x.nom] ? d[x.nom].h : ""].join(";")).join("\n"), "text/csv;charset=utf-8");
      ui.toast("Feuille d'émargement exportée (CSV).");
    };
    render();
  };
})();
