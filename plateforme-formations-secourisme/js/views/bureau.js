/* Espace bureau : suivi des dossiers, notifications, statistiques. */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;
  const S = () => App.store.get();
  const form = (id) => App.store.formation(id);
  const ORDRE = D.statutsDossier.map((s) => s.id);
  App.parts.remplir = (t) => t.replace(/\{(\w+)\}/g, (m, id) => { const s = App.store.session(id); return s ? ui.dCourt(s.date) : m; });

  /* ---------- Tableau de suivi des dossiers ---------- */
  App.views.bureauDossiers = function (el) {
    let filtre = "";
    const formsAvec = () => D.formations.filter((f) => S().dossiers.some((d) => App.store.session(d.session).formation === f.id));
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("kanban") + 'Espace bureau</span><h1>Suivi des dossiers</h1><p class="lead">Chaque inscription, de la réception au traitement final. Cliquez sur un dossier pour l\'ouvrir.</p></div>' +
      '<div class="kpis" id="bd-kpis"></div><div class="toolbar"><div class="field" style="min-width:240px"><label for="bd-f">Formation</label><select class="input" id="bd-f"><option value="">Toutes les formations</option>' + formsAvec().map((f) => '<option value="' + f.id + '">' + f.code + ' · ' + f.nom + '</option>').join("") + '</select></div>' +
      '<div class="legend">' + D.secteurs.map((s) => '<span class="sec-' + s.id + '"><i class="sector-dot"></i>' + s.nom + '</span>').join("") + '</div></div>' +
      '<div class="kanban" id="bd-k"></div><div class="section-sm"></div></div>';
    function render() {
      const ds = S().dossiers.filter((d) => !filtre || App.store.session(d.session).formation === filtre);
      const n = (st) => ds.filter((d) => d.statut === st).length;
      const complets = ds.filter((d) => d.pieces.every((p) => p.statut === "conforme")).length;
      const delais = ds.filter((d) => d.delaiTraitement).map((d) => d.delaiTraitement);
      el.querySelector("#bd-kpis").innerHTML = '<div class="kpi accent"><b>' + ds.length + '</b><span>dossiers suivis</span></div><div class="kpi"><b>' + n("completer") + '</b><span>à compléter</span></div><div class="kpi"><b>' + (ds.length ? Math.round(complets / ds.length * 100) : 0) + ' %</b><span>dossiers complets</span></div><div class="kpi"><b>' + (delais.length ? (delais.reduce((a, b) => a + b, 0) / delais.length).toFixed(1).replace(".", ",") : "–") + ' j</b><span>délai moyen de traitement</span></div>';
      el.querySelector("#bd-k").innerHTML = D.statutsDossier.map((c) => '<section class="k-col" aria-label="' + c.nom + '"><h3>' + c.nom + '<span class="count">' + n(c.id) + '</span></h3>' +
        ds.filter((d) => d.statut === c.id).map((d) => {
          const s = App.store.session(d.session), f = form(s.formation);
          const ok = d.pieces.filter((p) => p.statut === "conforme").length;
          return '<button class="k-card sec-' + f.secteur + '" data-d="' + d.id + '"><b>' + ui.esc(d.nom) + (d.nouveau ? ' <span class="badge badge-info">Nouveau</span>' : "") + '</b><small>' + f.code + ' du ' + ui.dCourt(s.date) + ' · ' + D.financements[d.financement].court + '</small>' +
            '<span class="row"><span class="badge ' + (ok === d.pieces.length ? "badge-ok" : "badge-warn") + '">' + I("file") + ok + '/' + d.pieces.length + '</span>' + (d.relances.length ? '<span class="badge badge-muted">' + I("mail") + d.relances.length + '</span>' : "") + '</span></button>';
        }).join("") + (n(c.id) ? "" : '<p class="small muted" style="text-align:center;padding:16px 4px">Colonne libre</p>') + '</section>').join("");
      el.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => ouvrir(b.dataset.d)));
      ui.typo(el);
    }
    function ouvrir(id) {
      const d = S().dossiers.find((x) => x.id === id), s = App.store.session(d.session), f = form(s.formation);
      const i = ORDRE.indexOf(d.statut), suivant = D.statutsDossier[i + 1];
      const m = ui.modal({
        title: ui.esc(d.nom), drawer: true,
        body: '<p class="mb0"><span class="tag">' + f.code + '</span> <b>' + f.nom + '</b></p><p class="small muted">' + ui.plage(s) + ' · ' + D.lieux[s.lieu].nom + ' · ' + D.financements[d.financement].nom + '</p>' +
          '<div class="row"><span class="badge badge-navy">' + D.statutsDossier[i].nom + '</span><span class="small muted">Reçu le ' + ui.dNum(d.recuLe) + '</span></div>' +
          '<h3 class="mt-l">Pièces</h3><div class="stack">' + d.pieces.map((p, k) => '<div class="row-between card" style="padding:12px 14px"><span><b style="color:var(--navy)">' + (D.piecesBase[p.type] || {}).label + '</b></span><span class="row" style="gap:6px">' + ui.badgePiece(p.statut) + (p.statut !== "conforme" ? '<button class="link-btn" data-ok="' + k + '">Valider</button>' : "") + '</span></div>').join("") + '</div>' +
          '<div class="info-box mt">' + I("sparkle") + '<p class="small">Pré-contrôle réalisé par l\'assistant documents. <b>Votre validation fait foi.</b></p></div>' +
          '<h3 class="mt-l">Relances envoyées</h3>' + (d.relances.length ? '<ul class="timeline">' + d.relances.map((r) => '<li>' + I(r.canal === "WhatsApp" ? "whatsapp" : "mail") + ' ' + r.objet + '<small>' + r.canal + ' · ' + ui.dNum(r.date) + '</small></li>').join("") + '</ul>' : '<p class="small muted">Dossier fluide, zéro relance à ce jour.</p>') +
          '<h3 class="mt-l">Historique</h3><ul class="timeline">' + d.historique.slice().reverse().map((h) => '<li>' + h.texte + '<small>' + ui.dNum(h.date) + '</small></li>').join("") + '</ul>' +
          '<div id="ask" class="mt"></div>',
        foot: '<button class="btn btn-ghost" id="dm-ask">' + I("mail") + 'Demander une pièce</button>' + (d.statut === "recu" || d.statut === "completer" ? '<button class="btn btn-primary" id="dm-val">' + I("check") + 'Valider le dossier</button>' : suivant ? '<button class="btn btn-primary" id="dm-next">' + I("arrowRight") + 'Passer en « ' + suivant.nom + ' »</button>' : '<span class="badge badge-ok">' + I("checkCircle") + 'Dossier traité</span>')
      });
      const maj = (fn, msg) => { App.store.update(() => { fn(); d.nouveau = false; }); ui.toast(msg); render(); ouvrir(id); };
      m.querySelectorAll("[data-ok]").forEach((b) => b.addEventListener("click", () => maj(() => { d.pieces[+b.dataset.ok].statut = "conforme"; d.historique.push({ date: ui.today(), texte: "Pièce validée manuellement par le bureau" }); }, "Pièce validée.")));
      const val = m.querySelector("#dm-val");
      if (val) val.onclick = () => maj(() => { d.pieces.forEach((p) => { if (p.statut === "attente") p.statut = "conforme"; }); d.statut = "valide"; d.historique.push({ date: ui.today(), texte: "Dossier validé par le bureau" }); }, "Dossier validé. Le stagiaire est prévenu par mail.");
      const nx = m.querySelector("#dm-next");
      if (nx) nx.onclick = () => maj(() => { d.statut = suivant.id; d.historique.push({ date: ui.today(), texte: "Statut : " + suivant.nom }); }, "Dossier passé en « " + suivant.nom + " ».");
      m.querySelector("#dm-ask").onclick = () => {
        const z = m.querySelector("#ask");
        const opts = d.pieces.map((p, k) => '<option value="' + k + '">' + (D.piecesBase[p.type] || {}).label + '</option>').join("");
        z.innerHTML = '<div class="card"><div class="field"><label for="ask-p">Pièce à demander</label><select class="input" id="ask-p">' + opts + '</select></div><div class="field mt"><label for="ask-m">Message (pré-rédigé)</label><textarea class="input" id="ask-m">Bonjour ' + ui.esc(d.nom.split(" ")[0]) + ', pour finaliser votre dossier, pouvez-vous déposer une version récente de cette pièce ? Merci beaucoup !</textarea></div><div class="row mt"><label class="switch"><input type="checkbox" id="ask-wa" checked><span>Aussi par WhatsApp</span></label><button class="btn btn-primary btn-sm" id="ask-go">' + I("send") + 'Envoyer la demande</button></div></div>';
        ui.typo(z);
        z.querySelector("#ask-go").onclick = () => {
          const k = +z.querySelector("#ask-p").value, wa = z.querySelector("#ask-wa").checked;
          maj(() => {
            d.pieces[k].statut = "manquant"; d.statut = "completer";
            d.relances.push({ date: ui.today(), canal: "Mail", objet: "Une pièce à compléter : " + (D.piecesBase[d.pieces[k].type] || {}).label });
            if (wa) d.relances.push({ date: ui.today(), canal: "WhatsApp", objet: "Petit rappel pour votre dossier" });
            d.historique.push({ date: ui.today(), texte: "Pièce demandée par le bureau" });
          }, "Demande envoyée (simulation).");
        };
        z.scrollIntoView({ behavior: "smooth", block: "nearest" });
      };
    }
    el.querySelector("#bd-f").onchange = (e) => { filtre = e.target.value; render(); };
    render();
  };

  /* ---------- Notifications ---------- */
  App.views.bureauNotifs = function (el) {
    const TYPES = [["dossier", "Dossier complet"], ["pieces", "Pièces à relancer"], ["formateur", "Positionnement et besoin formateur"], ["paiement", "Paiement reçu"], ["federal", "Session prête pour la fédération"]];
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("bell") + 'Espace bureau</span><h1>Notifications</h1><p class="lead">L\'essentiel arrive à vous : par ici, par mail ou par WhatsApp, selon vos préférences.</p></div>' +
      '<div class="split-3-2 grid" style="gap:24px"><div><div class="row-between"><h2 style="font-size:1.2rem;margin:0">Fil d\'activité</h2><button class="link-btn" id="nt-read">Tout marquer comme lu</button></div><div class="stack mt" id="nt-list"></div></div>' +
      '<aside class="card"><h2 style="font-size:1.2rem">' + I("settings") + ' Réglages des alertes</h2><p class="small muted">Choisissez le canal de chaque alerte.</p><table class="alert-table"><thead><tr><th>Alerte</th><th>Mail</th><th>WhatsApp</th></tr></thead><tbody>' +
      TYPES.map(([k, l]) => '<tr><td>' + l + '</td><td><label class="switch"><input type="checkbox" data-al="' + k + '" data-c="mail"' + (S().alertes[k].mail ? " checked" : "") + '><span class="sr">' + l + ' par mail</span></label></td><td><label class="switch"><input type="checkbox" data-al="' + k + '" data-c="whatsapp"' + (S().alertes[k].whatsapp ? " checked" : "") + '><span class="sr">' + l + ' par WhatsApp</span></label></td></tr>').join("") +
      '</tbody></table><div class="info-box sand mt">' + I("clock") + '<p class="small">Résumé quotidien à 18 h, envoyé à tous les membres du bureau.</p></div></aside></div><div class="section-sm"></div></div>';
    const ICO = { ok: "checkCircle", warn: "alert", alert: "users", info: "bell" };
    function render() {
      const ns = S().notifications;
      el.querySelector("#nt-list").innerHTML = ns.map((n) => {
        const pos = n.positionnement ? App.store.session(n.positionnement.session) : null;
        const eq = pos ? pos.equipe.find((e) => e.f === n.positionnement.f) : null;
        return '<div class="notif' + (n.lu ? "" : " unread") + '"><span class="n-ico ' + n.type + '">' + I(ICO[n.type] || "bell") + '</span><div><p>' + App.parts.remplir(n.texte) + '</p><small>' + n.quand + '</small>' +
          '<div class="row" style="gap:8px;margin-top:6px">' + (eq && eq.s === "propose" ? '<button class="btn btn-primary btn-sm" data-conf="' + n.id + '">' + I("check") + 'Confirmer le formateur</button>' : eq ? '<span class="badge badge-ok">' + I("check") + 'Confirmé</span>' : "") + '<a class="link-btn" style="display:inline-flex;align-items:center" href="' + n.lien + '" data-lu="' + n.id + '">Ouvrir</a></div></div></div>';
      }).join("");
      el.querySelectorAll("[data-conf]").forEach((b) => b.addEventListener("click", () => {
        const n = S().notifications.find((x) => x.id === b.dataset.conf);
        App.store.update(() => { const s = App.store.session(n.positionnement.session); s.equipe.find((e) => e.f === n.positionnement.f).s = "confirme"; n.lu = true; });
        ui.toast(App.store.formateur(n.positionnement.f).nom + " est confirmé·e. Le kit de session lui est envoyé.");
        render();
      }));
      el.querySelectorAll("[data-lu]").forEach((a) => a.addEventListener("click", () => App.store.update((s) => { s.notifications.find((x) => x.id === a.dataset.lu).lu = true; })));
      ui.typo(el.querySelector("#nt-list"));
    }
    el.querySelector("#nt-read").onclick = () => { App.store.update((s) => s.notifications.forEach((n) => (n.lu = true))); render(); ui.toast("Tout est à jour."); };
    el.querySelectorAll("[data-al]").forEach((c) => c.addEventListener("change", () => { App.store.update((s) => { s.alertes[c.dataset.al][c.dataset.c] = c.checked; }); ui.toast("Préférence enregistrée."); }));
    render();
  };

  /* ---------- Statistiques ---------- */
  App.views.bureauStats = function (el) {
    const st = S();
    const parSecteur = D.secteurs.map((s) => ({ s, n: st.sessions.filter((x) => form(x.formation).secteur === s.id).reduce((a, x) => a + x.inscrits, 0) }));
    const max = Math.max(...parSecteur.map((x) => x.n));
    const ds = st.dossiers;
    const taux = Math.round(ds.filter((d) => d.pieces.every((p) => p.statut === "conforme")).length / ds.length * 100);
    const parForm = D.formations.map((f) => { const l = ds.filter((d) => App.store.session(d.session).formation === f.id && d.delaiTraitement); return { f, j: l.length ? l.reduce((a, d) => a + d.delaiTraitement, 0) / l.length : 0 }; }).filter((x) => x.j);
    const maxJ = Math.max(...parForm.map((x) => x.j), 1);
    const total = parSecteur.reduce((a, x) => a + x.n, 0);
    const C = 2 * Math.PI * 64;
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("chart") + 'Espace bureau</span><h1>Statistiques</h1><p class="lead">Une vue simple de l\'activité, mise à jour en continu (données de démonstration).</p></div>' +
      '<div class="kpis"><div class="kpi accent"><b>' + total + '</b><span>inscrits sur la période</span></div><div class="kpi"><b>' + st.sessions.length + '</b><span>sessions programmées</span></div><div class="kpi"><b>' + taux + ' %</b><span>dossiers complets</span></div><div class="kpi"><b>96 %</b><span>satisfaction moyenne</span></div></div>' +
      '<div class="grid g3 mt-l"><section class="card"><h2 style="font-size:1.15rem">Inscrits par secteur</h2><div class="bars mt">' + parSecteur.map((x) => '<div class="bar-row sec-' + x.s.id + '"><span>' + x.s.nom + '</span><span class="track-b"><i data-w="' + (x.n / max * 100) + '"></i></span><b>' + x.n + '</b></div>').join("") + '</div></section>' +
      '<section class="card"><h2 style="font-size:1.15rem">Dossiers complets</h2><div class="ring mt"><svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="' + taux + ' % de dossiers complets"><circle cx="80" cy="80" r="64" fill="none" stroke="#EFEAE2" stroke-width="18"/><circle id="ring-c" cx="80" cy="80" r="64" fill="none" stroke="#0A7483" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" transform="rotate(-90 80 80)" style="transition:stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)"/></svg><b>' + taux + ' %</b></div><p class="small muted mt" style="text-align:center">dès le premier dépôt, grâce au contrôle des pièces</p></section>' +
      '<section class="card"><h2 style="font-size:1.15rem">Délai moyen de traitement</h2><div class="bars mt">' + parForm.map((x) => '<div class="bar-row sec-' + x.f.secteur + '"><span>' + x.f.code + '</span><span class="track-b"><i data-w="' + (x.j / maxJ * 100) + '"></i></span><b>' + x.j.toFixed(1).replace(".", ",") + ' j</b></div>').join("") + '</div><p class="small muted mt">De la réception du dossier à sa validation.</p></section></div><div class="section-sm"></div></div>';
    requestAnimationFrame(() => setTimeout(() => {
      el.querySelectorAll("[data-w]").forEach((i) => (i.style.width = i.dataset.w + "%"));
      const r = el.querySelector("#ring-c"); if (r) r.style.strokeDashoffset = C * (1 - taux / 100);
    }, 60));
  };
})();
