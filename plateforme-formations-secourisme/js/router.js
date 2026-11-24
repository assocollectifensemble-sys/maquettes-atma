/* Routeur par hash + navigation selon le rôle. */
(function () {
  App.views = App.views || {};
  const NAV = {
    stagiaire: [
      { href: "#/", label: "Accueil", ico: "home" },
      { href: "#/formations", label: "Formations", ico: "book" },
      { href: "#/planning", label: "Planning", ico: "calendar" },
      { href: "#/aide", label: "Démarches", ico: "help" },
      { href: "#/espace", label: "Mon espace", ico: "user" }
    ],
    formateur: [
      { href: "#/formateur", label: "À pourvoir", ico: "target" },
      { href: "#/formateur/sessions", label: "Mes sessions", ico: "calendar" },
      { href: "#/formateur/emargement", label: "Émargement", ico: "signature" },
      { href: "#/coulisses", label: "Coulisses", ico: "flow" }
    ],
    bureau: [
      { href: "#/bureau", label: "Rétro-planning", short: "Planning", ico: "gantt" },
      { href: "#/bureau/dossiers", label: "Dossiers", ico: "kanban" },
      { href: "#/bureau/notifications", label: "Alertes", ico: "bell" },
      { href: "#/bureau/federal", label: "Fédération", ico: "globe" },
      { href: "#/bureau/stats", label: "Stats", ico: "chart" }
    ]
  };
  const ROUTES = [
    [/^\/$/, "home", "stagiaire"],
    [/^\/formations$/, "catalogue", "stagiaire"],
    [/^\/formation\/([\w-]+)$/, "fiche", "stagiaire"],
    [/^\/planning$/, "planning", "stagiaire"],
    [/^\/inscription(?:\/([\w-]+))?$/, "inscription", "stagiaire"],
    [/^\/aide(?:\/([\w-]+))?$/, "aide", "stagiaire"],
    [/^\/espace$/, "espace", "stagiaire"],
    [/^\/formateur$/, "formateurPourvoir", "formateur"],
    [/^\/formateur\/sessions$/, "formateurSessions", "formateur"],
    [/^\/formateur\/kit\/([\w-]+)$/, "formateurKit", "formateur"],
    [/^\/formateur\/emargement(?:\/([\w-]+))?$/, "formateurEmargement", "formateur"],
    [/^\/bureau$/, "bureauRetro", "bureau"],
    [/^\/bureau\/dossiers$/, "bureauDossiers", "bureau"],
    [/^\/bureau\/notifications$/, "bureauNotifs", "bureau"],
    [/^\/bureau\/federal$/, "bureauFederal", "bureau"],
    [/^\/bureau\/stats$/, "bureauStats", "bureau"],
    [/^\/coulisses$/, "coulisses", null]
  ];
  App.HOME = { stagiaire: "#/", formateur: "#/formateur", bureau: "#/bureau" };

  function renderNav(role, path) {
    const items = NAV[role];
    const isActive = (href) => {
      const p = href.slice(1);
      if (p === "/") return path === "/" ;
      if (p === "/formations") return path === "/formations" || path.startsWith("/formation/");
      if (p === "/formateur/sessions") return path === p || path.startsWith("/formateur/kit");
      if (p === "/formateur" || p === "/bureau") return path === p;
      return path === p || path.startsWith(p + "/");
    };
    const html = items.map((i) => '<a href="' + i.href + '" class="nav-link' + (isActive(i.href) ? " active" : "") + '"' + (isActive(i.href) ? ' aria-current="page"' : "") + ">" + App.icon(i.ico) + "<span>" + i.label + "</span></a>").join("");
    document.getElementById("nav-top").innerHTML = html + (role !== "formateur" ? '<a href="#/coulisses" class="nav-link nav-extra' + (path === "/coulisses" ? " active" : "") + '">' + App.icon("flow") + "<span>Les coulisses</span></a>" : "");
    document.getElementById("nav-bottom").innerHTML = items.map((i) => '<a href="' + i.href + '" class="nav-link' + (isActive(i.href) ? " active" : "") + '"' + (isActive(i.href) ? ' aria-current="page"' : "") + ">" + App.icon(i.ico) + "<span>" + (i.short || i.label) + "</span></a>").join("");
    document.getElementById("nav-bottom").style.setProperty("--n", items.length);
    document.querySelectorAll(".role-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.role === role)));
    document.body.dataset.role = role;
  }

  function route() {
    const path = (location.hash.replace(/^#/, "") || "/").split("?")[0] || "/";
    const st = App.store.get();
    let match = null, viewName = "notFound", params = [];
    for (const [rx, v, role] of ROUTES) {
      const m = path.match(rx);
      if (m) { match = role; viewName = v; params = m.slice(1); break; }
    }
    if (match && match !== st.role) App.store.update((s) => { s.role = match; });
    const role = App.store.get().role;
    renderNav(role, path);
    const main = document.getElementById("app");
    main.className = "view view-" + viewName + (role === "bureau" && viewName !== "coulisses" ? " wide" : "");
    App.ui.closeModal();
    try {
      (App.views[viewName] || App.views.notFound)(main, params);
    } catch (e) {
      console.error(e);
      main.innerHTML = '<div class="container"><p>Un souci d\'affichage est survenu.</p></div>';
    }
    App.ui.typo(main);
    if (App.chat) App.chat.sync();
    const h1 = main.querySelector("h1");
    document.title = (h1 ? h1.textContent.trim() + " · " : "") + App.config.nom;
    if (!App._first) { window.scrollTo(0, 0); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); } }
    App._first = false;
  }
  App.rerender = route;
  App.go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
  App.router = { start() { App._first = true; window.addEventListener("hashchange", route); route(); } };

  App.views.notFound = function (el) {
    el.innerHTML = '<div class="container narrow section">' + '<h1 class="sr">Page à retrouver</h1>' + App.ui.vide("pin", "Cette page a changé d'adresse", "Retrouvez toutes nos formations depuis l'accueil.", '<a class="btn btn-primary" href="#/">Revenir à l\'accueil</a>') + "</div>";
  };
})();
