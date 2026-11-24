/* Rétro-planning du bureau : diagramme de Gantt par formation et par session, jalons, aujourd'hui, zoom. */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;
  const JALONS = [
    { id: "ouv", nom: "Ouverture des inscriptions", off: -60 },
    { id: "rel", nom: "Relance des pièces", off: -21 },
    { id: "val", nom: "Validation des dossiers", off: -14 },
    { id: "conv", nom: "Envoi des convocations", off: -10 },
    { id: "mat", nom: "J-7 : matériel et logistique", off: -7 },
    { id: "cert", nom: "Certificats délivrés", off: "fin+2" },
    { id: "fact", nom: "Facturation et suivi financeur", off: "fin+15" }
  ];
  App.data.jalons = JALONS;

  App.views.bureauRetro = function (el) {
    const st = App.store.get();
    let zoom = window.innerWidth < 700 ? "mois" : "semaine";
    let filtre = "";
    const debut = ui.add(ui.today(), -35), fin = ui.add(ui.today(), 110);
    const nbJ = ui.diff(debut, fin);

    function jalonsDe(s) {
      const ds = st.dossiers.filter((d) => d.session === s.id);
      const pb = ds.some((d) => d.statut === "completer");
      return JALONS.map((j) => {
        const date = typeof j.off === "number" ? ui.add(s.date, j.off) : ui.add(s.dateFin, +j.off.split("+")[1]);
        const n = ui.diff(ui.today(), date);
        let etat = n < 0 ? "done" : n <= 7 ? "soon" : "todo";
        if (j.id === "val" && n < 0 && pb) etat = "late";
        if (j.id === "rel" && n < 0 && pb) etat = "late";
        return Object.assign({}, j, { date, etat });
      });
    }
    const ETAT = { done: "Réalisé", soon: "Dans les 7 jours", todo: "À venir", late: "À rattraper" };
    const sess = () => st.sessions.filter((s) => (!filtre || App.store.formation(s.formation).secteur === filtre) && ui.diff(debut, ui.add(s.dateFin, 15)) >= 0 && ui.diff(s.date, fin) >= -60).sort((a, b) => a.date.localeCompare(b.date));

    const all = st.sessions.flatMap((s) => jalonsDe(s).map((j) => Object.assign(j, { s })));
    const semaine = all.filter((j) => { const n = ui.diff(ui.today(), j.date); return n >= 0 && n <= 7; });
    const retard = all.filter((j) => j.etat === "late");
    const manque = st.sessions.filter((s) => ui.diff(ui.today(), s.date) >= 0 && s.equipe.filter((e) => e.s === "confirme").length < s.besoin);

    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("gantt") + 'Espace bureau</span><h1>Rétro-planning</h1><p class="lead">Toutes les sessions et leurs jalons sur une seule vue : ce qui est fait, ce qui arrive, ce qui demande votre attention.</p></div>' +
      '<div class="kpis"><div class="kpi accent"><b>' + App.parts.futures().length + '</b><span>sessions à venir</span></div><div class="kpi"><b>' + semaine.length + '</b><span>jalons cette semaine</span></div><div class="kpi"><b style="color:var(--red-ink)">' + retard.length + '</b><span>jalons à rattraper</span></div><div class="kpi"><b>' + manque.length + '</b><span>sessions à compléter en formateurs</span></div></div>' +
      '<div class="toolbar"><div class="chips" role="group" aria-label="Filtrer par secteur"><button class="chip" data-sec="" aria-pressed="true">Tous</button>' + D.secteurs.map((s) => '<button class="chip sec-' + s.id + '" data-sec="' + s.id + '" aria-pressed="false"><span class="sector-dot"></span>' + s.nom + '</button>').join("") + '</div>' +
      '<div class="row" style="gap:8px"><button class="btn btn-ghost btn-sm" id="g-today">' + I("target") + 'Aujourd\'hui</button><div class="seg" role="group" aria-label="Zoom"><button data-z="semaine" aria-pressed="false">' + I("zoomIn") + 'Semaine</button><button data-z="mois" aria-pressed="false">' + I("zoomOut") + 'Mois</button></div></div></div>' +
      '<div class="gantt" id="gantt"><div class="gantt-scroll" id="g-scroll"></div></div>' +
      '<div class="g-legend mt"><span><i style="background:var(--ok);border-color:var(--ok)"></i>Réalisé</span><span><i style="background:#F2B544;border-color:#B97D00"></i>Dans les 7 jours</span><span><i style="background:#fff;border-color:var(--navy-3)"></i>À venir</span><span><i style="background:var(--red);border-color:var(--red-ink)"></i>À rattraper</span><span><b style="display:inline-block;width:14px;height:10px;border-radius:3px;background:var(--navy-3)"></b>Session</span><span><b style="display:inline-block;width:2px;height:14px;background:var(--red)"></b>Aujourd\'hui</span></div>' +
      '<section class="card mt-l"><h2 style="font-size:1.15rem">' + I("clock") + ' Cette semaine</h2>' + (semaine.length ? '<ul class="timeline">' + semaine.sort((a, b) => a.date.localeCompare(b.date)).map((j) => '<li><b>' + j.nom + '</b> · ' + App.store.formation(j.s.formation).code + ' du ' + ui.dCourt(j.s.date) + '<small>' + ui.dLong(j.date, true) + '</small></li>').join("") + '</ul>' : '<p class="muted">Semaine calme : profitez-en pour préparer les prochaines ouvertures.</p>') + '</section><div class="section-sm"></div></div>';

    const scroll = el.querySelector("#g-scroll");
    function render() {
      const px = zoom === "semaine" ? 30 : 8;
      const W = nbJ * px;
      el.querySelectorAll("[data-z]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.z === zoom)));
      el.querySelectorAll("[data-sec]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sec === filtre)));
      const x = (iso) => Math.max(0, Math.min(W, ui.diff(debut, iso) * px));
      // échelle
      let ticks = "", labels = "";
      for (let i = 0; i <= nbJ; i++) {
        const iso = ui.add(debut, i), d = ui.parse(iso);
        const isMonth = d.getDate() === 1;
        if (zoom === "semaine") {
          if (d.getDay() === 0 || d.getDay() === 6) ticks += '<div class="g-tick weekend" style="left:' + i * px + 'px;width:' + px + 'px"></div>';
          ticks += '<div class="g-tick' + (isMonth ? " month" : "") + '" style="left:' + i * px + 'px"></div>';
          labels += '<span class="g-ticklabel" style="left:' + i * px + 'px;width:' + px + 'px;text-align:center;padding:4px 0">' + d.getDate() + '</span>';
        } else if (d.getDay() === 1) {
          ticks += '<div class="g-tick" style="left:' + i * px + 'px"></div>';
          labels += '<span class="g-ticklabel" style="left:' + i * px + 'px">' + d.getDate() + '</span>';
        }
        if (isMonth || i === 0) { if (zoom !== "semaine") ticks += '<div class="g-tick month" style="left:' + i * px + 'px"></div>'; labels += '<span class="g-ticklabel month" style="left:' + i * px + 'px">' + ui.MOIS[d.getMonth()] + ' ' + d.getFullYear() + '</span>'; }
      }
      const todayX = x(ui.today());
      const groups = {};
      sess().forEach((s) => { (groups[s.formation] = groups[s.formation] || []).push(s); });
      let rows = '<div class="g-row g-scale" style="min-height:40px"><div class="g-label">Formation · session</div><div class="g-track" style="width:' + W + 'px;height:40px">' + labels + '</div></div>';
      Object.entries(groups).forEach(([fid, arr]) => {
        const f = App.store.formation(fid);
        rows += '<div class="g-row group sec-' + f.secteur + '"><div class="g-label"><span class="sector-dot"></span>' + f.code + ' · ' + arr.length + ' session' + (arr.length > 1 ? "s" : "") + '</div><div class="g-track" style="width:' + W + 'px">' + ticks + '</div></div>';
        arr.forEach((s) => {
          const js = jalonsDe(s);
          const ouv = js[0].date, fac = js[js.length - 1].date;
          const conf = s.equipe.filter((e) => e.s === "confirme").length;
          rows += '<div class="g-row sec-' + f.secteur + '"><div class="g-label"><b>' + ui.dCourt(s.date) + ' · ' + D.lieux[s.lieu].nom + '</b><small>' + s.inscrits + '/' + s.places + ' inscrits · ' + (conf < s.besoin ? '<span style="color:var(--red-ink);font-weight:700">' + (s.besoin - conf) + ' formateur' + (s.besoin - conf > 1 ? "s" : "") + ' à trouver</span>' : conf + ' formateur' + (conf > 1 ? "s" : "") + ' ✓') + '</small></div>' +
            '<div class="g-track" style="width:' + W + 'px">' + ticks +
            '<div class="g-bar" style="left:' + x(ouv) + 'px;width:' + Math.max(0, x(fac) - x(ouv)) + 'px"></div>' +
            '<div class="g-bar session" title="Session ' + f.code + '" style="left:' + x(s.date) + 'px;width:' + Math.max(px, x(ui.add(s.dateFin, 1)) - x(s.date)) + 'px"></div>' +
            js.filter((j) => ui.diff(debut, j.date) >= 0 && ui.diff(j.date, fin) >= 0).map((j) => '<button class="g-ms ' + j.etat + '" style="left:' + x(j.date) + 'px" data-s="' + s.id + '" data-j="' + j.id + '" aria-label="' + j.nom + ', ' + f.code + ' du ' + ui.dCourt(s.date) + ' : ' + ui.dLong(j.date) + ', ' + ETAT[j.etat] + '"></button>').join("") +
            '</div></div>';
        });
      });
      scroll.innerHTML = '<div class="gantt-inner">' + rows + '<div class="g-today" style="left:calc(var(--lw) + ' + todayX + 'px)"><span>Aujourd\'hui</span></div></div>';
      const lw = scroll.querySelector(".g-label").offsetWidth;
      scroll.querySelector(".gantt-inner").style.setProperty("--lw", lw + "px");
      scroll.querySelector(".gantt-inner").style.width = (lw + W) + "px";
      scroll.querySelectorAll(".g-ms").forEach((b) => b.addEventListener("click", (e) => pop(b, e)));
      ui.typo(scroll);
    }
    function versAujourdhui(smooth) {
      const lw = scroll.querySelector(".g-label").offsetWidth;
      const px = zoom === "semaine" ? 30 : 8;
      scroll.scrollTo({ left: Math.max(0, ui.diff(debut, ui.today()) * px - (scroll.clientWidth - lw) * 0.25), behavior: smooth ? "smooth" : "auto" });
    }
    function pop(b) {
      const old = el.querySelector(".pop"); if (old) old.remove();
      const s = App.store.session(b.dataset.s), j = jalonsDe(s).find((y) => y.id === b.dataset.j), f = App.store.formation(s.formation);
      const p = document.createElement("div");
      p.className = "pop"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", j.nom);
      const action = j.id === "val" || j.id === "rel" ? ['#/bureau/dossiers', "Voir les dossiers"] : j.id === "ouv" ? ['#/bureau/federal', "Préparer l'ouverture"] : j.id === "conv" ? ['#/bureau/notifications', "Voir les alertes"] : ['#/bureau/stats', "Voir les statistiques"];
      p.innerHTML = '<b>' + j.nom + '</b>' + f.code + ' du ' + ui.dCourt(s.date) + ' · ' + D.lieux[s.lieu].nom + '<br>' + ui.dLong(j.date, true) + ' · <span style="color:#7FD3DD;font-weight:700">' + ETAT[j.etat] + '</span><br><a class="btn btn-accent btn-sm" href="' + action[0] + '">' + action[1] + '</a> <button class="link-btn" style="color:#fff" data-x>Fermer</button>';
      const g = el.querySelector("#gantt"), r = b.getBoundingClientRect(), gr = g.getBoundingClientRect();
      p.style.left = Math.max(8, Math.min(gr.width - 268, r.left - gr.left - 120)) + "px";
      p.style.top = (r.bottom - gr.top + 8) + "px";
      g.appendChild(p);
      ui.typo(p);
      p.querySelector("[data-x]").onclick = () => { p.remove(); b.focus(); };
      p.querySelector("a").focus();
    }
    el.querySelectorAll("[data-z]").forEach((b) => b.addEventListener("click", () => { zoom = b.dataset.z; render(); versAujourdhui(); }));
    el.querySelectorAll("[data-sec]").forEach((b) => b.addEventListener("click", () => { filtre = b.dataset.sec; render(); versAujourdhui(); }));
    el.querySelector("#g-today").onclick = () => versAujourdhui(true);
    scroll.addEventListener("scroll", () => { const p = el.querySelector(".pop"); if (p) p.remove(); });
    render();
    requestAnimationFrame(() => versAujourdhui());
  };
})();
