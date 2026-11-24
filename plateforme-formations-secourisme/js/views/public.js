/* Site public : accueil, catalogue, fiche formation, planning. */
(function () {
  const ui = App.ui, I = App.icon, D = App.data;
  const S = () => App.store.get();
  App.parts = App.parts || {};

  const futures = () => S().sessions.filter((s) => ui.diff(ui.today(), s.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const form = (id) => App.store.formation(id);
  const secteur = (id) => D.secteurs.find((s) => s.id === id);
  App.parts.futures = futures;

  App.parts.dateBlock = (iso) => { const d = ui.parse(iso); return '<div class="date-block" aria-hidden="true"><b>' + d.getDate() + '</b><small>' + ui.MC[d.getMonth()].replace(".", "") + '</small></div>'; };

  App.parts.sessionCard = function (s, opts) {
    const f = form(s.formation);
    opts = opts || {};
    return '<article class="card session-card sec-' + f.secteur + '">' + App.parts.dateBlock(s.date) +
      '<div><div class="row" style="gap:8px"><span class="tag">' + f.code + '</span>' + ui.placesBadge(s) + '</div>' +
      '<h3>' + f.nom + '</h3>' +
      '<div class="meta"><span>' + I("calendar") + ui.plage(s) + '</span><span>' + I("pin") + D.lieux[s.lieu].nom + '</span><span>' + I("euro") + ui.prix(f.tarif) + '</span></div>' +
      '<div class="row mt" style="gap:8px">' +
      (ui.restantes(s) > 0 ? '<a class="btn btn-primary btn-sm" href="#/inscription/' + s.id + '">Je m\'inscris</a>' : '<a class="btn btn-ghost btn-sm" href="#/inscription/' + s.id + '">Liste d\'attente</a>') +
      (opts.fiche === false ? '' : '<a class="btn btn-ghost btn-sm" href="#/formation/' + f.id + '">La formation</a>') +
      '</div></div></article>';
  };

  /* ---------------- ACCUEIL ---------------- */
  App.views.home = function (el) {
    const next = futures().slice(0, 4);
    const count = (sid) => D.formations.filter((f) => f.secteur === sid).length;
    el.innerHTML =
      '<section class="hero"><div class="container hero-in"><div>' +
      '<span class="eyebrow" style="color:#7FD3DD">' + I("wave") + App.config.region + '</span>' +
      '<h1>Apprenez les gestes qui <em>sauvent</em>, au bord de l\'océan.</h1>' +
      '<p class="lead">Secourisme, sauvetage aquatique, métiers de la natation : des formations animées par des maîtres nageurs-sauveteurs reconnus, avec une inscription simple et un accompagnement à chaque étape.</p>' +
      '<div class="row"><a class="btn btn-accent" href="#/formations">' + I("book") + 'Voir les formations</a><a class="btn btn-light" href="#/inscription">Je m\'inscris ' + I("arrowRight") + '</a></div>' +
      '<div class="hero-badges"><span>' + I("award") + 'Certificats reconnus</span><span>' + I("wallet") + 'CPF, OPCO, France Travail</span><span>' + I("sparkle") + 'Dossier vérifié en direct</span></div>' +
      '</div><div class="hero-art"><div class="hero-card"><h3>' + I("calendar") + ' Prochaines sessions</h3>' +
      next.slice(0, 3).map((s) => { const f = form(s.formation), d = ui.parse(s.date); return '<a class="hero-session" href="#/inscription/' + s.id + '"><span class="date"><b>' + d.getDate() + '</b><small>' + ui.MC[d.getMonth()].replace(".", "") + '</small></span><span><b>' + f.code + '</b> · ' + D.lieux[s.lieu].nom + '<br><small>' + ui.restantes(s) + ' places disponibles</small></span></a>'; }).join("") +
      '</div></div></div>' +
      '<svg class="hero-waves" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 C 240 20 480 100 720 60 S 1200 20 1440 60 V110 H0Z" fill="#12A4B6" opacity=".25"/><path d="M0 78 C 260 40 520 112 780 74 S 1240 44 1440 80 V110 H0Z" fill="#7FD3DD" opacity=".3"/><path d="M0 92 C 300 66 560 116 840 90 S 1260 70 1440 96 V110 H0Z" fill="#FBF8F3"/></svg></section>' +

      '<section class="section"><div class="container"><div class="row-between"><div><span class="eyebrow">' + I("calendar") + 'À venir</span><h2>Prochaines sessions</h2></div><a class="btn btn-ghost btn-sm" href="#/planning">Tout le planning ' + I("arrowRight") + '</a></div>' +
      '<div class="grid g2 mt">' + next.map((s) => App.parts.sessionCard(s)).join("") + '</div></div></section>' +

      '<section class="section" style="padding-top:8px"><div class="container"><span class="eyebrow">' + I("grid") + 'Quatre secteurs</span><h2>Trouvez votre formation</h2>' +
      '<div class="grid g4 mt">' + D.secteurs.map((s) => '<a class="card card-link sector-card sec-' + s.id + '" href="#/formations?secteur=' + s.id + '"><div class="s-ico">' + I(s.icone) + '</div><h3>' + s.nom + '</h3><p class="muted small">' + s.desc + '</p><span class="count">' + count(s.id) + ' formation' + (count(s.id) > 1 ? "s" : "") + ' ' + I("arrowRight") + '</span></a>').join("") + '</div></div></section>' +

      '<section class="section" style="background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line)"><div class="container"><span class="eyebrow">' + I("flow") + 'Simple et guidé</span><h2>Comment ça marche</h2><p class="muted">Quatre étapes, depuis votre téléphone, en quelques minutes.</p>' +
      '<div class="steps mt">' +
      [["Je choisis ma session", "Par formation, par secteur ou sur le planning, avec les places restantes en direct."],
       ["Je dépose mes pièces", "L'assistant vérifie chaque document en quelques secondes et vous guide si besoin."],
       ["Je règle ou je fais financer", "Paiement en ligne, acompte, CPF, OPCO ou France Travail : on vous accompagne."],
       ["Je reçois ma convocation", "Tout arrive par mail et dans votre espace : lieu, horaires, matériel."]].map((x) => '<div class="card step"><h3>' + x[0] + '</h3><p>' + x[1] + '</p></div>').join("") +
      '</div></div></section>' +

      '<section class="section"><div class="container"><span class="eyebrow">' + I("shield") + 'Gage de sérieux</span><h2>Une formation qui compte</h2>' +
      '<div class="proofs mt">' +
      '<div class="proof">' + I("award") + '<b>Certificat de compétences</b><span>Délivré à l\'issue de chaque formation réussie.</span></div>' +
      '<div class="proof">' + I("lifebuoy") + '<b>Formateurs MNS</b><span>Des maîtres nageurs-sauveteurs reconnus du secteur.</span></div>' +
      '<div class="proof">' + I("clipboard") + '<b>Démarche qualité</b><span>Organisation pensée pour le référentiel Qualiopi.</span></div>' +
      '<div class="proof">' + I("star") + '<b>96 % satisfaits</b><span>Moyenne de satisfaction des stagiaires (démo).</span></div>' +
      '</div><div class="card card-tint mt-l"><h3>Prises en charge acceptées</h3><p class="muted small">Votre formation peut être financée en tout ou partie. Nous vous guidons pour chaque démarche.</p><div class="funders">' +
      Object.values(D.financements).map((f) => '<span class="funder">' + I("check") + f.court + '</span>').join("") +
      '</div><a class="btn btn-ghost btn-sm mt" href="#/aide">Être guidé dans mes démarches ' + I("arrowRight") + '</a></div></div></section>';
  };

  /* ---------------- CATALOGUE ---------------- */
  App.views.catalogue = function (el) {
    const q = new URLSearchParams(location.hash.split("?")[1] || "");
    const f = { secteur: q.get("secteur") || "", public: "", fin: "", lieu: "", txt: "" };
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("book") + 'Catalogue</span><h1>Nos formations</h1><p class="lead">Secourisme, natation, formateurs et recyclages : chaque fiche détaille durée, tarif, prises en charge et prochaines dates.</p></div>' +
      '<div class="chips" role="group" aria-label="Filtrer par secteur"><button class="chip" data-sec="" aria-pressed="false">Toutes</button>' + D.secteurs.map((s) => '<button class="chip sec-' + s.id + '" data-sec="' + s.id + '" aria-pressed="false"><span class="sector-dot"></span>' + s.nom + '</button>').join("") + '</div>' +
      '<div class="card filters"><div class="field"><label for="f-txt">Rechercher</label><div class="search-wrap">' + I("search") + '<input id="f-txt" class="input" type="search" placeholder="PSE1, sauvetage, SST…"></div></div>' +
      '<div class="field"><label for="f-pub">Public</label><select id="f-pub" class="input"><option value="">Tous publics</option>' + Object.entries(D.publics).map(([k, v]) => '<option value="' + k + '">' + v + '</option>').join("") + '</select></div>' +
      '<div class="field"><label for="f-fin">Prise en charge</label><select id="f-fin" class="input"><option value="">Toutes</option>' + Object.entries(D.financements).map(([k, v]) => '<option value="' + k + '">' + v.court + '</option>').join("") + '</select></div>' +
      '<div class="field"><label for="f-lieu">Lieu</label><select id="f-lieu" class="input"><option value="">Toute l\'île</option>' + Object.entries(D.lieux).map(([k, v]) => '<option value="' + k + '">' + v.nom + '</option>').join("") + '</select></div>' +
      '<div class="field"><span class="label">&nbsp;</span><button class="btn btn-ghost" id="f-reset">Tout afficher</button></div></div>' +
      '<p class="result-count" id="f-count" aria-live="polite"></p><div class="grid g3" id="f-list"></div><div class="section-sm"></div></div>';

    const list = el.querySelector("#f-list");
    function render() {
      el.querySelectorAll("[data-sec]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sec === f.secteur)));
      const t = f.txt.trim().toLowerCase();
      const res = D.formations.filter((x) => (!f.secteur || x.secteur === f.secteur) && (!f.public || x.public.includes(f.public)) && (!f.fin || x.financements.includes(f.fin)) &&
        (!f.lieu || S().sessions.some((s) => s.formation === x.id && s.lieu === f.lieu)) &&
        (!t || (x.nom + " " + x.code + " " + x.resume).toLowerCase().includes(t)));
      el.querySelector("#f-count").textContent = res.length + " formation" + (res.length > 1 ? "s" : "") + " correspond" + (res.length > 1 ? "ent" : "") + " à votre recherche";
      list.innerHTML = res.length ? res.map((x) => {
        const n = futures().filter((s) => s.formation === x.id);
        return '<a class="card card-link formation-card sec-' + x.secteur + '" href="#/formation/' + x.id + '"><div class="top"><span class="tag">' + x.code + '</span><span class="small muted row" style="gap:6px"><span class="sector-dot"></span>' + secteur(x.secteur).nom + '</span></div>' +
          '<h3>' + x.nom + '</h3><p>' + x.resume + '</p><div class="meta"><span>' + I("clock") + x.duree + '</span><span>' + I("user") + 'Dès ' + x.ageMin + ' ans</span></div>' +
          '<div class="chips">' + x.financements.map((k) => '<span class="badge badge-sand">' + D.financements[k].court + '</span>').join("") + '</div>' +
          '<div class="foot"><span class="price">' + ui.prix(x.tarif) + ' <small>TTC</small></span><span class="small">' + (n.length ? n.length + " session" + (n.length > 1 ? "s" : "") + " à venir" : "Dates sur demande") + '</span></div></a>';
      }).join("") : '<div style="grid-column:1/-1">' + ui.vide("search", "Élargissons la recherche", "Essayez un autre lieu ou une autre prise en charge : toutes nos formations restent accessibles sur demande.", '<button class="btn btn-primary" id="f-reset2">Voir toutes les formations</button>') + '</div>';
      const r2 = el.querySelector("#f-reset2"); if (r2) r2.onclick = reset;
      ui.typo(list);
    }
    function reset() { Object.assign(f, { secteur: "", public: "", fin: "", lieu: "", txt: "" }); el.querySelectorAll(".filters .input").forEach((i) => (i.value = "")); render(); }
    el.querySelectorAll("[data-sec]").forEach((b) => b.addEventListener("click", () => { f.secteur = b.dataset.sec; render(); }));
    el.querySelector("#f-txt").addEventListener("input", (e) => { f.txt = e.target.value; render(); });
    el.querySelector("#f-pub").addEventListener("change", (e) => { f.public = e.target.value; render(); });
    el.querySelector("#f-fin").addEventListener("change", (e) => { f.fin = e.target.value; render(); });
    el.querySelector("#f-lieu").addEventListener("change", (e) => { f.lieu = e.target.value; render(); });
    el.querySelector("#f-reset").addEventListener("click", reset);
    render();
  };

  /* ---------------- FICHE ---------------- */
  App.views.fiche = function (el, [id]) {
    const f = form(id);
    if (!f) return App.views.notFound(el);
    const ss = futures().filter((s) => s.formation === f.id);
    const sec = secteur(f.secteur);
    el.innerHTML = '<div class="fiche-hero sec-' + f.secteur + '"><div class="container"><a class="back" href="#/formations">' + I("arrowLeft") + 'Toutes les formations</a>' +
      '<div class="row" style="gap:8px"><span class="tag">' + f.code + '</span><span class="small muted row" style="gap:6px"><span class="sector-dot"></span>' + sec.nom + '</span></div>' +
      '<h1 style="margin-top:8px">' + f.nom + '</h1><p class="lead muted" style="max-width:62ch">' + f.resume + '</p>' +
      '<div class="facts mt">' +
      '<div class="fact">' + I("clock") + '<small>Durée</small><b>' + f.duree + '</b></div>' +
      '<div class="fact">' + I("user") + '<small>Âge</small><b>Dès ' + f.ageMin + ' ans</b></div>' +
      '<div class="fact">' + I("euro") + '<small>Tarif</small><b>' + ui.prix(f.tarif) + '</b></div>' +
      '<div class="fact">' + I("award") + '<small>Validation</small><b>Certificat</b></div></div></div></div>' +
      '<div class="container section"><div class="fiche-grid"><div class="stack">' +
      '<section class="card"><h2 class="h3" style="font-size:1.25rem">Objectifs</h2><ul class="checklist-ul">' + f.objectifs.map((o) => '<li>' + I("checkCircle") + '<span>' + o + '</span></li>').join("") + '</ul></section>' +
      '<section class="card"><h2 style="font-size:1.25rem">Prérequis et public</h2><p>' + f.prerequis + '</p><p class="mb0 muted small">Public : ' + f.public.map((p) => D.publics[p]).join(", ") + '. À l\'issue : ' + f.certif + '.</p></section>' +
      '<section class="card"><h2 style="font-size:1.25rem">Prises en charge possibles</h2><div class="grid g2">' + f.financements.map((k) => { const x = D.financements[k]; return '<div class="radio-card" style="cursor:default">' + I("wallet") + '<span><b>' + x.nom + '</b><span class="sub">' + x.desc + ' Délai : ' + x.delai + '.</span></span></div>'; }).join("") + '</div>' +
      '<a class="link-btn" href="#/aide" style="display:inline-flex;align-items:center;gap:6px;margin-top:8px">' + I("help") + 'Être guidé pour mon financement</a></section>' +
      '<section class="card"><h2 style="font-size:1.25rem">Accès et accessibilité</h2><ul class="checklist-ul"><li>' + I("clock") + '<span><b>Délai d\'accès :</b> ' + f.delaiAcces + '.</span></li><li>' + I("users") + '<span><b>Accessibilité :</b> salles de plain-pied ou avec ascenseur ; un référent handicap adapte le déroulé avec vous.</span></li><li>' + I("chart") + '<span><b>Indicateurs (démo) :</b> ' + f.reussite + ' % de réussite, ' + f.satisfaction + ' % de satisfaction.</span></li></ul></section>' +
      '</div><aside class="sticky-box"><div class="card"><span class="price" style="font-size:1.8rem">' + ui.prix(f.tarif) + '</span><span class="muted small"> TTC · ' + f.duree + '</span>' +
      '<h3 class="mt">Prochaines dates</h3><div class="stack">' + (ss.length ? ss.map((s) => '<div class="row-between" style="padding:10px 0;border-top:1px solid var(--line)"><div><b style="color:var(--navy)">' + ui.plage(s) + '</b><div class="small muted">' + D.lieux[s.lieu].nom + '</div>' + ui.placesBadge(s) + '</div><a class="btn btn-primary btn-sm" href="#/inscription/' + s.id + '">Choisir</a></div>').join("")
        : '<p class="muted">Les prochaines dates s\'ouvrent bientôt : laissez-nous vos coordonnées pour être prévenu en premier.</p><a class="btn btn-ghost btn-block" href="#/aide">Être prévenu</a>') + '</div></div></aside></div></div>';
  };

  /* ---------------- PLANNING ---------------- */
  App.views.planning = function (el) {
    const st = { vue: "liste", secteur: "", mois: ui.today().slice(0, 7) };
    el.innerHTML = '<div class="container"><div class="page-head"><span class="eyebrow">' + I("calendar") + 'Planning général</span><h1>Toutes les sessions</h1><p class="lead">Vue d\'ensemble des sessions à venir, avec les places restantes en temps réel.</p></div>' +
      '<div class="toolbar"><div class="chips" role="group" aria-label="Filtrer par secteur"><button class="chip" data-sec="" aria-pressed="true">Tous</button>' + D.secteurs.map((s) => '<button class="chip sec-' + s.id + '" data-sec="' + s.id + '" aria-pressed="false"><span class="sector-dot"></span>' + s.nom + '</button>').join("") + '</div>' +
      '<div class="seg" role="group" aria-label="Type de vue"><button data-vue="liste" aria-pressed="true">' + I("list") + 'Liste</button><button data-vue="cal" aria-pressed="false">' + I("calendar") + 'Calendrier</button></div></div>' +
      '<div id="pl-body"></div><div class="section-sm"></div></div>';
    const body = el.querySelector("#pl-body");
    const filt = () => futures().filter((s) => !st.secteur || form(s.formation).secteur === st.secteur);
    function render() {
      el.querySelectorAll("[data-sec]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sec === st.secteur)));
      el.querySelectorAll("[data-vue]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.vue === st.vue)));
      const ss = filt();
      if (st.vue === "liste") {
        const groups = {};
        ss.forEach((s) => { const k = s.date.slice(0, 7); (groups[k] = groups[k] || []).push(s); });
        body.innerHTML = ss.length ? Object.entries(groups).map(([k, arr]) => '<h2 class="month-title">' + ui.mois(k + "-01") + '</h2><div class="grid g2">' + arr.map((s) => App.parts.sessionCard(s)).join("") + '</div>').join("")
          : ui.vide("calendar", "De nouvelles dates arrivent", "Les sessions de ce secteur s'ouvrent prochainement.", '<button class="btn btn-primary" data-sec-all>Voir tous les secteurs</button>');
      } else {
        const [y, m] = st.mois.split("-").map(Number);
        const first = new Date(y, m - 1, 1), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
        let cells = "";
        for (let i = 0; i < 42; i++) {
          const d = new Date(start); d.setDate(start.getDate() + i);
          const iso = ui.iso(d);
          const evs = ss.filter((s) => s.dates.includes(iso));
          cells += '<div class="cal-day' + (d.getMonth() !== m - 1 ? " out" : "") + (iso === ui.today() ? " today" : "") + '"><span class="num">' + d.getDate() + '</span>' +
            evs.map((s) => { const f = form(s.formation); return '<button class="cal-ev sec-' + f.secteur + '" data-s="' + s.id + '" title="' + f.code + ' · ' + D.lieux[s.lieu].nom + '">' + f.code + '</button>'; }).join("") + '</div>';
          if (i === 34 && new Date(start.getTime() + 35 * 864e5).getMonth() !== m - 1) break;
        }
        body.innerHTML = '<div class="cal"><div class="cal-head"><button class="icon-btn" id="cal-prev" aria-label="Mois précédent">' + I("chevronLeft") + '</button><h2>' + ui.MOIS[m - 1] + ' ' + y + '</h2><button class="icon-btn" id="cal-next" aria-label="Mois suivant">' + I("chevronRight") + '</button></div>' +
          '<div class="cal-grid">' + ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((x) => '<div class="cal-dow">' + x + '</div>').join("") + cells + '</div></div>' +
          '<div class="legend mt">' + D.secteurs.map((s) => '<span class="sec-' + s.id + '"><i class="sector-dot"></i>' + s.nom + '</span>').join("") + '<span>Touchez une session pour le détail</span></div>';
        const move = (n) => { const d = new Date(y, m - 1 + n, 1); st.mois = ui.iso(d).slice(0, 7); render(); };
        body.querySelector("#cal-prev").onclick = () => move(-1);
        body.querySelector("#cal-next").onclick = () => move(1);
        body.querySelectorAll(".cal-ev").forEach((b) => b.addEventListener("click", () => {
          const s = App.store.session(b.dataset.s);
          ui.modal({ title: form(s.formation).nom, body: App.parts.sessionCard(s) + '<p class="small muted mt">' + D.lieux[s.lieu].detail + ' · ' + s.horaires + '</p>' });
        }));
      }
      const all = body.querySelector("[data-sec-all]"); if (all) all.onclick = () => { st.secteur = ""; render(); };
      ui.typo(body);
    }
    el.querySelectorAll("[data-sec]").forEach((b) => b.addEventListener("click", () => { st.secteur = b.dataset.sec; render(); }));
    el.querySelectorAll("[data-vue]").forEach((b) => b.addEventListener("click", () => { st.vue = b.dataset.vue; render(); }));
    render();
  };
})();
