/* ============================================================
   APP.JS — Navigation, écrans et logique de « Enquête au bord du lagon »
   (prototype pour la Réserve naturelle marine de La Réunion).
   Architecture reprise du prototype Kélonia (« Le dossier Kawann »).
   Écrans : projet (1er écran) · accueil · intro · hub (carte de la plage) ·
   st1…st5 (brief → jeu → quiz → info) · marche (« Rejoins le prochain point », entre deux étapes) ·
   findemo · fiche (enseignant) · qr (le QR code de départ).
   Déclenchement comme au Croc Parc : un seul départ (QR code ou GPS, à choisir avec la Réserve), puis on marche ;
   l'étape suivante s'ouvre à l'arrivée (bouton « Je suis arrivé », ou position si le joueur l'autorise).
   Version démo : étapes 1 et 2 jouables ; 3, 4 et 5 présentées, verrouillées (« Dans l'application complète »).
   ============================================================ */
(function () {
  "use strict";
  const C = window.Content;
  const $screen = document.getElementById("screen");
  const JOUABLES = C.CONFIG.versionComplete ? C.CONFIG.total : C.CONFIG.etapesJouables, TOTAL = C.CONFIG.total;
  let route = { n: "projet", step: null }, jeu = null, demoMode = false, demoIdx = 0, installPrompt = null, resultat = {};
  // Tous les chemins passent par go() : c'est là que les étapes verrouillées sont refusées.
  const VERROU = (n, step) => { if (n === "marche") return step != null && +step > JOUABLES; const m = /^st(\d)$/.exec(n); return !!m && +m[1] > JOUABLES; };

  // typographie française : espace insécable avant ! ? ; : » et après « (jamais de « ! » seul en début de ligne)
  const typo = s => String(s).replace(/ ([!?;:»])/g, " $1").replace(/« /g, "« ");
  const esc = s => typo(String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
  const pub = () => Store.get("public");
  const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- thème ----------
  function applyTheme() {
    const sombre = route.n === "projet";
    const th = sombre ? "lagon" : Store.get("theme");
    document.body.dataset.theme = th;
    document.documentElement.dataset.taille = Store.get("taille");
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = sombre ? "#031c24" : th === "soleil" ? "#ffffff" : "#063b4c";
  }

  // ---------- briques d'affichage ----------
  function bulle(t, opts) {
    opts = opts || {};
    return '<div class="guide' + (opts.compact ? " compact" : "") + (opts.seul ? " seul" : "") + '">' + (opts.seul ? "" : Art.zouzou(t.expr, "av")) +
      '<div class="bubble" role="group" aria-label="Zouzou dit"><div class="who">Zouzou <span>la zourite</span></div><p class="txt">' + esc(t.t) + '</p></div></div>';
  }
  const dock = (html, cls) => '<div class="dock ' + (cls || "") + '">' + html + '</div>';
  function btn(label, act, cls, data) {
    let d = ""; if (data) Object.keys(data).forEach(k => { d += " data-" + k + '="' + esc(data[k]) + '"'; });
    return '<button class="btn ' + (cls || "") + '" data-act="' + act + '"' + d + '>' + label + '</button>';
  }
  const src = code => code ? '<p class="src">Source : ' + esc(code) + '</p>' : "";
  function toast(t, ms) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = typo(t); document.body.appendChild(e); setTimeout(() => e.remove(), ms || 3200); return e; }
  function fete() { // bulles et étoiles qui montent, SOUS le contenu (ne cachent jamais le texte)
    if (reduit()) return;
    const d = document.createElement("div"); d.className = "fete"; d.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 22; i++) { const e = document.createElement("i"); e.style.left = Math.random() * 100 + "%"; e.style.animationDuration = (2.2 + Math.random() * 2) + "s"; e.style.animationDelay = Math.random() * .7 + "s"; const s = 8 + Math.random() * 18; e.style.width = e.style.height = s + "px"; if (i % 3 === 0) e.className = "corail"; if (i % 5 === 0) e.className = "etoile"; d.appendChild(e); }
    document.body.appendChild(d); setTimeout(() => d.remove(), 4800);
  }
  function vague() { // transition : une vague balaie l'écran (entrée dans une étape)
    if (reduit()) return;
    const v = document.createElement("div"); v.className = "vague-trans"; v.setAttribute("aria-hidden", "true");
    v.innerHTML = '<svg viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M0 40 Q50 0 100 40 T200 40 T300 40 T400 40 V200 H0Z" fill="#19b3c4"/><path d="M0 70 Q50 30 100 70 T200 70 T300 70 T400 70 V200 H0Z" fill="#0b7480"/><path d="M0 40 Q50 0 100 40 T200 40 T300 40 T400 40" fill="none" stroke="#fff" stroke-width="6" opacity=".8"/></svg>';
    document.body.appendChild(v); Audio2.Sfx.vague(); setTimeout(() => v.remove(), 1100);
  }

  // ---------- barre du haut ----------
  function topbar() {
    const f = Store.faits(); let pips = "";
    for (let i = 1; i <= TOTAL; i++) pips += Art.ICO.pip(f[i]);
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller, hl = navigator.onLine === false;
    document.getElementById("topbar").innerHTML =
      '<button class="brand" data-act="go" data-r="accueil" aria-label="Retour à l\'accueil du jeu">' + Art.ICO.marque() + '<span class="brand-t"><b>Au bord du lagon</b><small class="reseau ' + (sw || hl ? "ok" : "") + '">● ' + (hl ? "hors ligne · tout fonctionne" : sw ? "fonctionne sans réseau" : "prototype · Réserve marine") + '</small></span></button>' +
      '<div class="pips" role="img" aria-label="' + Store.count() + ' indice(s) sur ' + TOTAL + '">' + pips + '</div>' +
      '<button class="iconbtn" data-act="reglages" aria-label="Réglages et accessibilité">⚙️</button>';
  }

  // ---------- historique : bouton / geste RETOUR du téléphone ----------
  // Chaque écran = une entrée d'historique (state = { lg: 1, n, s }) ; le retour réaffiche l'écran précédent.
  const H = () => (history.state && history.state.lg ? history.state : null);
  function ecrireHistorique(u, mode) {
    const st = { lg: 1, n: route.n, s: route.step, i: ((H() && H().i) || 0) };
    try {
      if (mode === "init" || mode === "pop" || mode === "replace" || !H()) history.replaceState(st, "", u);
      else { const h = H(); if (h.n === route.n && (h.s || null) === route.step) history.replaceState(st, "", u); else history.pushState(Object.assign(st, { i: h.i + 1 }), "", u); }
    } catch (e) { /* file:// */ }
  }
  window.addEventListener("popstate", e => { const s = e.state; if (!s || !s.lg) return; fermerFeuille(true); go(s.n, s.s, false, "pop"); });
  const aPrecedent = () => !!H() && H().i > 0;
  const flecheRetour = parent => '<div class="retour-haut-l noprint"><button class="retour-haut" data-act="retour" data-r="' + parent + '" aria-label="Retour"><span aria-hidden="true">←</span></button></div>';

  // ---------- routeur ----------
  function go(n, step, noScroll, mode) {
    if (jeu) { jeu.destroy(); jeu = null; }
    stopGeo();
    fermerFeuille(true);
    let refus = false;
    if (VERROU(n, step)) { refus = true; n = "hub"; step = null; }
    if (!SCREENS[n]) { n = "projet"; step = null; }
    route = { n, step: step == null ? null : String(step) };
    const u = new URL(location.href); u.searchParams.delete("station");
    if (n !== "projet") u.searchParams.set("station", /^st\d$/.test(n) ? n.slice(2) : n);
    ecrireHistorique(u, mode);
    applyTheme(); render();
    if (!noScroll) window.scrollTo(0, 0);
    const h = $screen.querySelector("h1,h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    updatePresbar();
    if (refus) toast("🔒 Cette étape arrive dans l'application complète");
  }
  function render() {
    topbar();
    $screen.classList.remove("entre"); void $screen.offsetWidth; $screen.classList.add("entre");
    $screen.innerHTML = SCREENS[route.n](route.step);
    document.body.dataset.ecran = route.n;
    const a = AFTER[route.n]; if (a) a(route.step);
  }
  const SCREENS = {}, AFTER = {};

  // ===================== LE PROJET (1er écran) =====================
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const iOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function aideInstall() {
    if (standalone()) return "";
    const txt = iOS() ? 'Sur iPhone : touchez <b>Partager</b> <span class="pj-partage" aria-hidden="true">⬆</span> puis <b>« Sur l\'écran d\'accueil »</b>.'
      : installPrompt ? "Une icône Zouzou s'ajoute à l'écran d'accueil, comme une application. Elle fonctionne ensuite sans réseau."
        : 'Android : menu <b>⋮</b> du navigateur → <b>« Installer l\'application »</b>.<br>iPhone : <b>Partager</b> → <b>« Sur l\'écran d\'accueil »</b>.';
    return '<section class="pj-install" id="pj-install"><h3>📲 Installer sur l\'écran d\'accueil</h3><p>' + typo(txt) + '</p>' +
      (installPrompt && !iOS() ? btn("Installer l'application", "installer", "pj-btn") : "") + '</section>';
  }
  const majInstall = () => { const b = document.getElementById("pj-install"); if (b) b.outerHTML = aideInstall(); };
  SCREENS.projet = () => {
    const P = C.projet;
    return (aPrecedent() ? flecheRetour("accueil") : "") + '<div class="projet">' +
      '<div class="pj-rayons" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '<div class="pj-tete"><span class="pj-lieu">' + esc(P.lieu) + '</span><span class="pj-badge">' + esc(P.badge) + '</span></div>' +
      '<div class="pj-art" aria-hidden="true"><span class="pj-halo"></span><span class="pj-bulles"><i></i><i></i><i></i><i></i><i></i></span>' + Art.zouzou("content", "flotte") + '</div>' +
      '<h1>' + esc(P.titre) + '</h1><p class="pj-sous">' + esc(P.sous) + '</p>' +
      '<p class="pj-idee">' + typo(P.idee) + '</p>' +
      '<h2 class="pj-h">Ce que l\'application complète proposerait</h2><ul class="pj-grille">' +
      P.complete.map(x => '<li class="' + (x[3] || "") + '"><span class="pj-i" aria-hidden="true">' + x[0] + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></li>').join("") + '</ul>' +
      '<section class="pj-possible"><h2 class="pj-h">Et si on allait plus loin ?</h2><p>' + esc("Ce prototype n'est qu'un point de départ : une proposition pour ouvrir la discussion. On peut aussi partir sur tout autre chose.") + '</p><ul>' +
      P.possible.map(x => '<li><span aria-hidden="true">' + x[0] + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></li>').join("") + '</ul></section>' +
      '<section class="pj-cycle3"><div class="pj-c3-t"><span class="pj-c3-i" aria-hidden="true">🎓</span><div><h3>Version classe</h3><span class="pj-c3-niv">Du CE1 à la 6<sup>e</sup>, comme vos animations</span></div></div>' +
      '<p>' + esc("Travail en équipes, consignes scolaires, mots-clés, une question à débattre par étape, liens avec les programmes de sciences, d'EMC et d'EDD, et une fiche enseignant imprimable, à relire par votre pôle éducation.") + '</p>' + btn("Lire la fiche enseignant ➜", "go", "pj-btn", { r: "fiche" }) + '</section>' +
      aideInstall() +
      '<div class="pj-acces">' + btn("🔳 Le QR code de départ", "go", "pj-sec", { r: "qr" }) + btn("ℹ️ Crédits", "credits", "pj-sec") + '</div>' +
      '<p class="pj-fiction">' + esc(P.fiction) + '</p></div>' +
      dock(btn("▶ Démarrer la démo", "go", "big", { r: "accueil" }));
  };

  // ===================== ACCUEIL =====================
  SCREENS.accueil = () => {
    const p = pub(), n = Store.count(), A = C.accueil;
    const pubBtn = k => '<button class="pubbtn" data-act="pub" data-v="' + k + '" aria-pressed="' + (p === k) + '"><span class="pubico" aria-hidden="true">' + C.publics[k].ico + '</span><span>' + esc(C.publics[k].t) + '</span></button>';
    return '<div class="hero">' + Art.accueil() + '<div class="hero-titre"><span class="kicker">' + esc(A.kicker) + '</span><h1>' + esc(A.titre) + '</h1></div></div>' +
      '<p class="accroche">' + esc(A.accroche) + '</p>' +
      '<ul class="promesses" aria-label="En bref">' + A.promesses.map(x => '<li><b>' + x.n + '</b>' + esc(x.t) + '</li>').join("") + '</ul>' +
      '<section class="card"><h3>Qui joue ?</h3><div class="pubs" role="group" aria-label="Public">' + pubBtn("famille") + pubBtn("classe") + '</div>' +
      '<p class="small dim pubdesc">' + esc(C.publics[p].desc) + '</p></section>' +
      '<p class="small dim center">' + esc("Version démo : 2 étapes jouables sur 5 · aucune donnée envoyée · * durée à mesurer sur place") + '</p>' +
      '<p class="center retour-projet"><button class="lien" data-act="go" data-r="projet">← Présentation du projet</button></p>' +
      dock(btn(n > 0 && n < JOUABLES ? "🐙 Continuer l'enquête (" + n + "/" + JOUABLES + ")" : "🐙 Commencer l'enquête", "start", "big"));
  };
  AFTER.accueil = () => {
    const sc = $screen.querySelector(".scene-accueil"); if (!sc || reduit()) return;
    // léger effet de profondeur : les plans bougent un peu quand on fait défiler ou qu'on touche l'écran
    const hero = $screen.querySelector(".hero");
    hero.addEventListener("pointermove", e => { const r = hero.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5; hero.style.setProperty("--px", dx.toFixed(3)); hero.style.setProperty("--py", dy.toFixed(3)); });
  };

  // ===================== INTRO =====================
  SCREENS.intro = step => {
    const i = Math.max(0, Math.min(C.intro.length - 1, +step || 0)), t = C.intro[i], last = i === C.intro.length - 1;
    return '<h2 class="sr-only">L\'histoire</h2><div class="intro-scene"><div class="intro-art">' + (i === 0 ? '<div class="radar" aria-hidden="true"></div>' : "") +
      '<div class="intro-fond" aria-hidden="true"></div>' + Art.zouzou(t.expr, "grand") + '</div>' + bulle(t, { seul: true }) + '</div>' +
      (i === 0 && pub() === "classe" ? '<p class="note small">' + esc("Pour la classe : Zouzou parle… mais c'est pour de faux ! Une zourite ne parle pas : c'est une histoire pour enquêter.") + '</p>' : "") +
      '<div class="dots" aria-label="Étape ' + (i + 1) + ' sur ' + C.intro.length + '">' + C.intro.map((x, k) => '<i class="' + (k === i ? "on" : "") + '"></i>').join("") + '</div>' +
      dock(last ? btn("🗺️ Voir la carte de la plage", "go", "big", { r: "hub" }) : btn("Suite ➜", "intro", "big", { i: i + 1 }));
  };

  // ===================== HUB : la carte de la plage =====================
  function prochaine() { const f = Store.faits(); for (let i = 1; i <= JOUABLES; i++) if (!f[i]) return i; return 0; }
  SCREENS.hub = () => {
    const f = Store.faits(), n = Store.count(), nx = prochaine(), etats = {};
    C.etapes.forEach(E => { etats[E.id] = E.id > JOUABLES ? "verrou" : f[E.id] ? "fait" : E.id === nx ? "suivant" : "ouvert"; });
    const rows = C.etapes.map((E, k) => {
      const lien = k < TOTAL - 1 ? '<li class="sentier" aria-hidden="true"></li>' : "";
      if (E.id > JOUABLES) return '<li class="st verrou"><div class="station" aria-disabled="true"><span class="num">' + Art.ICO.cadenas + '<span class="sr-only">Verrouillée</span></span><span class="st-t"><b>' + E.ico + " " + esc(E.titre) + '</b><small>' + esc(E.apercu) + '</small><span class="badge-complet">Dans l’application complète</span></span></div></li>' + lien;
      const et = (Store.get("etoiles") || {})[E.id] || 0;
      return '<li class="st ' + etats[E.id] + '"><button class="station" data-act="station" data-id="' + E.id + '"><span class="num" aria-hidden="true">' + (f[E.id] ? "✓" : E.id) + '</span><span class="st-t"><b>' + E.ico + " " + esc(E.titre) + '</b><small>📍 ' + esc(E.lieu) + '</small>' +
        (f[E.id] ? '<span class="mini-etoiles" aria-label="' + et + ' étoile(s)">' + [1, 2, 3].map(k2 => Art.ICO.etoile(k2 <= et)).join("") + '</span>' : "") + '</span><span class="go" aria-hidden="true">' + (f[E.id] ? "↻" : "➜") + '</span></button></li>' + lien;
    }).join("");
    const t = n >= JOUABLES ? { expr: "fete", t: "Deux indices réunis ! Pour la démo, l'enquête s'arrête ici. Les trois autres étapes t'attendent dans l'application complète." }
      : n === 0 ? { expr: "clin", t: "Voici la plage vue du ciel. Commence par l'étape 1 : touche-la sur la carte ou dans la liste. Sur place, tu commences au point de départ, puis tu marches d'un point à l'autre." }
        : { expr: "content", t: "Encore " + (JOUABLES - n) + " étape" + (JOUABLES - n > 1 ? "s" : "") + " jouable" + (JOUABLES - n > 1 ? "s" : "") + " dans cette démo. L'étape " + nx + " t'attend !" };
    return '<span class="kicker">L\'enquête</span><h2>La plage de Zouzou</h2>' +
      '<div class="carte-box">' + Art.carte(etats) + '</div>' +
      '<div class="progress" role="img" aria-label="' + n + ' indices sur ' + TOTAL + '"><i style="width:' + (n / TOTAL * 100) + '%"></i><span>' + n + ' / ' + TOTAL + ' indices</span></div>' +
      bulle(t, { compact: true }) + '<ul class="stations">' + rows + '</ul>' +
      '<p class="note small">📍 Sur place, comme au Croc Parc : <b>un seul départ</b> (un QR code ou le GPS du téléphone), puis l\'étape suivante s\'ouvre <b>quand on arrive au bon endroit</b>. Mode et emplacements à choisir avec vous.</p>' +
      (n >= JOUABLES ? dock(btn("🏁 Fin de la démo ➜", "go", "big", { r: "findemo" })) : nx ? dock(btn(nx > 1 ? "🚶 Rejoindre l'étape " + nx : "➜ Aller à l'étape " + nx, "station", "big", { id: nx })) : "");
  };

  // ===================== ÉTAPES =====================
  const ET = id => C.etapes[id - 1];
  const enTete = E => '<span class="kicker">Étape ' + E.id + ' sur ' + TOTAL + ' · 📍 ' + esc(E.lieu) + '</span><h2><span aria-hidden="true">' + E.ico + '</span> ' + esc(E.titre) + '</h2>';
  function classeBox(E) {
    if (pub() !== "classe") return "";
    const c = E.classe;
    return '<section class="classe-box"><h3>🎓 Pour la classe</h3><p><b>Notion :</b> ' + esc(c.notion) + '</p><p class="mots">' + c.mots.map(m => '<span>' + esc(m) + '</span>').join("") + '</p><p><b>À débattre :</b> ' + esc(c.q) + '</p></section>';
  }
  function etapeEcran(id, step) {
    const E = ET(id);
    if (step === "brief") return enTete(E) + '<div class="brief-art" aria-hidden="true">' + Art.zouzou(E.brief.expr, "brief-zz") + '</div>' + bulle(E.brief, { seul: true }) + classeBox(E) +
      '<div class="consigne"><b>🎯 Ta mission</b><p>' + esc(E.consigne) + '</p></div>' + dock(btn("C'est parti ➜", "go", "big", { r: "st" + id, s: "jeu" }));
    if (step === "jeu") return enTete(E) + '<div id="jeuhost"></div>' + (demoMode ? dock(btn("⏭ Résoudre (démo)", "resoudre", "sec"), "discret") : "");
    if (step === "quiz") {
      const q = E.quiz;
      return enTete(E) + '<div class="card question"><span class="q-ico" aria-hidden="true">❓</span><h3>' + esc(q.q) + '</h3></div><div class="opts" id="opts">' +
        q.opts.map((o, i) => '<button class="opt" data-act="rep" data-i="' + i + '"><span class="lettre">' + "ABC"[i] + '</span><span>' + esc(o) + '</span></button>').join("") + '</div><div id="fb" aria-live="polite"></div>' +
        dock('<p class="small dim center" style="margin:0">Choisis une réponse</p>', "discret");
    }
    if (step === "info") {
      if (!Store.faits()[id]) Store.fait(id, true, (resultat[id] && resultat[id].etoiles) || 2);
      const K = C.cartes[E.carte], et = (Store.get("etoiles") || {})[id] || 0, r = resultat[id];
      const suite = id < JOUABLES ? btn("🚶 Rejoindre l'étape " + (id + 1), "go", "big", { r: "marche", s: id + 1 }) + btn("🗺️ La carte de la plage", "go", "sec", { r: "hub" })
        : btn("🏁 Terminer la démo ➜", "go", "big", { r: "findemo" }) + btn("🗺️ La carte de la plage", "go", "sec", { r: "hub" });
      return '<span class="kicker">Indice trouvé · ' + Store.count() + ' / ' + TOTAL + '</span><h2>' + E.ico + " " + esc(E.titre) + '</h2>' +
        '<div class="score"><div class="etoiles" aria-label="' + et + ' étoile(s) sur 3">' + [1, 2, 3].map(k => Art.ICO.etoile(k <= et)).join("") + '</div>' + (r ? '<small>' + esc(r.detail) + '</small>' : "") + '</div>' +
        '<div class="indice-papier"><span class="trombone" aria-hidden="true"></span><small>Carnet d\'enquête</small><p>' + esc(E.indice) + '</p></div>' +
        bulle(E.fin) +
        '<section class="card savais"><h3>💡 Le savais-tu ?</h3><p>' + esc(E.fait) + '</p>' + src(E.src) + '</section>' +
        '<div class="carte-gain"><span class="cg-art">' + Art.habitants[E.carte]() + '</span><span class="cg-t"><small>Nouvelle carte · carnet du lagon</small><b>' + esc(K.nom) + '</b><i>' + esc(K.sous) + '</i><span>' + esc(K.t) + '</span>' + src(K.src) + '</span></div>' +
        dock(suite);
    }
    return "";
  }
  for (let i = 1; i <= TOTAL; i++) {
    SCREENS["st" + i] = step => etapeEcran(i, step || "brief");
    AFTER["st" + i] = step => {
      if (step === "jeu") {
        const E = ET(i);
        jeu = Games.mount(E.jeu, document.getElementById("jeuhost"), { onWin: res => { resultat[i] = res; go("st" + i, "quiz", false, demoMode ? "replace" : undefined); } });
      }
      if (step === "info") { topbar(); Audio2.Sfx.indice(); Audio2.vibre([50, 30, 50]); fete(); }
    };
  }
  function repondre(i) {
    const E = ET(+route.n.slice(2)), q = E.quiz, opts = $screen.querySelectorAll(".opt"), fb = document.getElementById("fb");
    if (opts[i].classList.contains("ok")) return;
    if (i === q.ok) {
      opts.forEach(o => o.disabled = true); opts[i].classList.add("ok"); Audio2.Sfx.ok(); Audio2.vibre(60);
      fb.innerHTML = '<div class="feedback ok"><span class="ic" aria-hidden="true">✅</span><span>' + esc(q.bravo) + '</span></div>';
      const d = $screen.querySelector(".dock"); d.innerHTML = btn("Voir l'indice ➜", "go", "big", { r: route.n, s: "info" }); d.classList.remove("discret");
    } else {
      opts[i].classList.add("ko"); opts[i].disabled = true; Audio2.Sfx.ko(); Audio2.vibre(120);
      fb.innerHTML = '<div class="feedback ko"><span class="ic" aria-hidden="true">🔁</span><span>' + esc(q.rate) + '</span></div>';
    }
  }


  // ===================== MARCHE : « Rejoins le prochain point » =====================
  // Comme au Croc Parc : la carte sous les yeux, on marche jusqu'au repère, puis « Je suis arrivé » ouvre l'étape.
  // GPS facultatif : demandé seulement si le joueur touche « Utiliser ma position » ; refus, absence ou test à la maison = aucun souci.
  let geoWatch = null, geoTimer = null;
  function stopGeo() { if (geoWatch != null && navigator.geolocation) navigator.geolocation.clearWatch(geoWatch); geoWatch = null; clearTimeout(geoTimer); geoTimer = null; }
  const cibleMarche = () => { const v = +route.step; return v >= 2 && v <= JOUABLES ? v : Math.max(2, prochaine() || 2); };
  function distM(a, b) { const R = 6371000, r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dg = r(b.lng - a.lng);
    const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dg / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
  function geoMsg(t, cls) { const e = document.getElementById("geo-etat"); if (e) { e.className = "geo-etat small " + (cls || ""); e.textContent = typo(t); } }
  function activerGeo() {
    const id = cibleMarche(), pt = C.DECLENCHEMENT.points[id];
    if (!("geolocation" in navigator) || !window.isSecureContext) { geoMsg("Ce téléphone ne donne pas sa position ici. Aucun souci : touche « Je suis arrivé » devant le repère.", "info"); return; }
    stopGeo(); geoMsg("Recherche de ta position…", "info");
    const b = document.querySelector("[data-act=geo]"); if (b) b.disabled = true;
    const fin = () => { const bb = document.querySelector("[data-act=geo]"); if (bb) bb.disabled = false; };
    geoTimer = setTimeout(() => { stopGeo(); fin(); geoMsg("Pas de position pour l'instant (réseau, intérieur…). Touche « Je suis arrivé » devant le repère.", "info"); }, 20000);
    try {
      geoWatch = navigator.geolocation.watchPosition(pos => {
        if (route.n !== "marche") return stopGeo();
        clearTimeout(geoTimer);
        const ici = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!pt) { stopGeo(); fin(); geoMsg("Position reçue ✓ Les emplacements des étapes restent à choisir avec la Réserve : pour cette démo, touche « Je suis arrivé ».", "ok"); return; }
        const d = Math.round(distM(ici, pt));
        if (d <= C.DECLENCHEMENT.rayon) { stopGeo(); arriver("gps"); } else geoMsg("Encore environ " + d + " m. Continue vers le repère !", "ok");
      }, err => {
        stopGeo(); fin();
        geoMsg(err && err.code === 1 ? "Position non autorisée : aucun souci. Touche « Je suis arrivé » une fois devant le repère." : "Position indisponible (réseau, intérieur…). Touche « Je suis arrivé » devant le repère.", "info");
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    } catch (e) { stopGeo(); fin(); geoMsg("Position indisponible. Touche « Je suis arrivé » devant le repère.", "info"); }
  }
  function arriver(par) {
    if (route.n !== "marche") return;
    const id = cibleMarche(); stopGeo();
    Audio2.Sfx.ok(); Audio2.vibre([40, 30, 40]); vague();
    go("st" + id, "brief", false, demoMode ? "replace" : undefined);
    toast(par === "gps" ? "📍 Tu es arrivé ! L'étape " + id + " s'ouvre." : "📍 Bien arrivé ! L'étape " + id + " s'ouvre.", 2600);
  }
  SCREENS.marche = () => {
    const id = cibleMarche(), E = ET(id), M = E.marche || {}, de = id - 1;
    return '<span class="kicker">En route · étape ' + de + ' → étape ' + id + '</span><h2>Rejoins le prochain point</h2>' +
      '<div class="marche-box">' + Art.marcheCarte(de, id) +
      '<p class="marche-dist"><span><b>' + esc(M.distance || "quelques pas") + '</b> environ*</span><span>🚶 ' + esc(M.duree || "") + '</span></p></div>' +
      bulle({ expr: "clin", t: "Bravo pour l'indice ! Maintenant, on marche, sans courir et sans entrer dans l'eau. La prochaine étape s'ouvre quand tu arrives au bon endroit." }, { compact: true }) +
      '<section class="card repere"><h3>🔎 Le repère à chercher</h3>' + Art.vignette(M.vignette) + '<p>' + esc(M.repere || "") + '</p><p class="small dim">📍 ' + esc(E.lieu) + '</p></section>' +
      '<section class="card geo"><h3>📡 Arrivée automatique (facultatif)</h3><p class="small">' + esc("Sur place, le téléphone peut reconnaître le bon endroit tout seul, si tu l'autorises. Ta position reste sur le téléphone.") + '</p>' +
      btn("Utiliser ma position", "geo", "sec") + '<p id="geo-etat" class="geo-etat small" aria-live="polite"></p></section>' +
      '<p class="note small">' + esc("Démo ou test à distance : touche « Je suis arrivé » pour simuler l'arrivée. GPS ou QR code de départ, emplacements et distances* : à voir ensemble.") + '</p>' +
      dock(btn("📍 Je suis arrivé", "arrive", "big") + btn("🗺️ La carte de la plage", "go", "sec", { r: "hub" }));
  };

  // ===================== FIN DE LA DÉMO =====================
  SCREENS.findemo = () => '<div class="findemo"><span class="kicker">Version démo · 2 étapes sur 5</span><h2>Fin de la démo</h2>' +
    '<div class="fd-art" aria-hidden="true"><span class="pj-halo"></span>' + Art.zouzou("fete", "flotte") + '</div>' +
    '<p class="fd-lead">' + esc("Merci, enquêteur !") + '</p><p class="fd-txt">' + esc("Vous venez de jouer les 2 premières étapes. Dans l'application complète, l'enquête continuerait sur trois autres étapes, jusqu'à la grande révélation.") + '</p>' +
    '<ul class="fd-suite">' + C.findemo.suite.map(x => '<li><span class="fd-i" aria-hidden="true">' + x[0] + '</span><span class="fd-t"><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></span></li>').join("") + '</ul>' +
    '<section class="fd-gestes"><h3>Les bons gestes de Zouzou</h3><ul>' + C.gestes.map(g => '<li><span aria-hidden="true">' + g[0] + '</span>' + esc(g[1]) + '</li>').join("") + '</ul>' + src("R5 · guide des écogestes de la Réserve") + '</section>' +
    '<section class="fd-ensemble"><b>' + esc("Et maintenant ?") + '</b><p>' + esc("Tout reste à imaginer avec vos équipes : l'histoire, le personnage, les lieux, et pourquoi pas la réalité augmentée ou un parcours sonore.") + '</p></section></div>' +
    dock(btn("✨ Revoir le projet", "go", "big", { r: "projet" }) + '<div class="rang-btn">' + btn("🎓 Fiche enseignant", "go", "sec", { r: "fiche" }) + btn("🔁 Recommencer", "recommencer", "sec") + '</div>', "flow");
  AFTER.findemo = () => { if (!navigator.userActivation || navigator.userActivation.hasBeenActive) Audio2.Sfx.fanfare(); fete(); };

  // ===================== FICHE ENSEIGNANT =====================
  SCREENS.fiche = () => '<div class="doc fiche">' + flecheRetour("projet") + '<span class="kicker">Version classe · du CE1 à la 6<sup>e</sup> · proposition</span><h2>Fiche enseignant</h2>' +
    '<p class="badge alert">À relire et réécrire avec le pôle éducation de la Réserve</p>' +
    '<h3>L\'idée</h3><p>' + esc("Par équipes de 3 à 4 élèves, un téléphone ou une tablette par équipe, les élèves mènent l'enquête de Zouzou sur la plage, sans entrer dans l'eau. Chaque étape associe un défi tactile, une question et un « Le savais-tu ? » tiré du guide des écogestes de la Réserve.") + '</p>' +
    '<h3>Objectifs</h3><ul class="clean"><li>' + esc("Comprendre que le corail est un animal et que le récif est vivant.") + '</li><li>' + esc("Relier des gestes du quotidien (déchets, crème solaire, nourrissage) à leurs effets sur le lagon.") + '</li><li>' + esc("Coopérer en équipe et argumenter à partir d'une question ouverte.") + '</li></ul>' +
    '<h3>Liens avec les programmes</h3><ul class="clean"><li><b>Sciences :</b> ' + esc("le vivant et son environnement, les effets des activités humaines (cycle 2) ; les écosystèmes et les conséquences des actions humaines (cycle 3).") + '</li><li><b>EMC :</b> ' + esc("respect dû à l'environnement et au vivant, écogestes et intérêt général.") + '</li><li><b>EDD :</b> ' + esc("biodiversité et écosystèmes, gestion des ressources et des déchets.") + '</li></ul>' +
    '<h3>Déroulé proposé</h3><ul class="clean"><li><b>Avant :</b> ' + esc("en classe, découverte de Zouzou et des équipes (15 min).") + '</li><li><b>Sur la plage :</b> ' + esc("un seul départ (un QR code, ou le GPS), puis les équipes marchent d'un point à l'autre : chaque étape s'ouvre à l'arrivée, environ 5 minutes chacune (à mesurer ensemble).") + '</li><li><b>Après :</b> ' + esc("retour sur les questions « À débattre », et les bons gestes.") + '</li></ul>' +
    C.etapes.filter(E => E.jeu && E.id <= JOUABLES).map(E => '<h3>Étape ' + E.id + ' · ' + esc(E.titre) + '</h3><p><b>Notion :</b> ' + esc(E.classe.notion) + '</p><p class="mots">' + E.classe.mots.map(m => '<span>' + esc(m) + '</span>').join("") + '</p><p><b>À débattre :</b> ' + esc(E.classe.q) + '</p><p><b>Corrigé de la question :</b> ' + esc(E.quiz.opts[E.quiz.ok]) + '. ' + esc(E.quiz.bravo) + '</p>').join("") +
    '<h3>Dans l\'application complète</h3><ul class="clean">' + C.etapes.filter(E => E.id > JOUABLES).map(E => '<li><b>Étape ' + E.id + ' · ' + esc(E.titre) + ' :</b> ' + esc(E.apercu) + '</li>').join("") + '</ul>' +
    '<h3>Point de vigilance</h3><p>' + esc("Zouzou « parle » : c'est une convention de fiction, à expliciter avec les élèves. Une zourite ne parle pas et ne « comprend » pas ce qui arrive au récif.") + '</p>' +
    '<h3>À définir ensemble</h3><ul class="clean"><li>' + esc("Les niveaux visés en priorité (vos animations vont du CE1 à la 6e).") + '</li><li>' + esc("Le lieu, la durée, le rôle de l'enseignant pendant que l'animateur est dans le lagon.") + '</li><li>' + esc("Le déclenchement des étapes (GPS ou QR code de départ) et leurs emplacements.") + '</li></ul>' +
    '<p class="src">Sources : R5 (guide des écogestes), R3 (mission de sensibilisation), programmes officiels E1 à E4. Voir SOURCES.md.</p>' +
    '<div class="rang-btn noprint">' + btn("🖨️ Imprimer", "print", "sec") + btn("← Retour au projet", "go", "sec", { r: "projet" }) + '</div></div>';

  // ===================== LE QR CODE DE DÉPART (un seul, pas de QR par étape) =====================
  const baseURL = () => location.origin + location.pathname;
  SCREENS.qr = () => '<div class="doc qrdoc">' + flecheRetour("projet") + '<span class="kicker">Pour l\'équipe · un seul QR code</span><h2>Le QR code de départ</h2>' +
    '<p>' + esc("Généré sur ce téléphone, sans réseau. Comme au Croc Parc, un seul QR code suffit : on le scanne au départ, puis on marche, et chaque étape s'ouvre en arrivant au bon endroit. Pas de QR code à chaque étape.") + '</p>' +
    '<p class="small dim">' + esc("GPS ou QR code de départ, et emplacements : à voir ensemble.") + '</p>' +
    '<div class="qr-grille">' + [["Le QR code de départ", baseURL()]].map(q => '<figure class="qr-carte">' + QR.svg(q[1], { taille: 150 }) + '<figcaption><b>' + esc(q[0]) + '</b><small>' + esc(q[1]) + '</small></figcaption></figure>').join("") + '</div>' +
    '<div class="rang-btn noprint">' + btn("🖨️ Imprimer", "print", "sec") + btn("← Retour au projet", "go", "sec", { r: "projet" }) + '</div></div>';

  // ===================== FEUILLES (réglages, crédits) =====================
  function fermerFeuille(sansAnim) { document.querySelectorAll(".sheet").forEach(s => s.remove()); }
  function sheet(label, html) {
    fermerFeuille(true);
    const s = document.createElement("div"); s.className = "sheet"; s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", label);
    s.innerHTML = '<div class="sheet-fond" data-act="fermer"></div><div class="sheet-in">' + html + '</div>';
    document.body.appendChild(s); const f = s.querySelector("button"); if (f) f.focus();
  }
  function reglages() {
    const seg = (act, v, cur, l) => '<button class="btn mini" data-act="' + act + '" data-v="' + v + '" aria-pressed="' + (String(cur) === String(v)) + '">' + l + '</button>';
    sheet("Réglages", '<h3>⚙️ Réglages</h3>' +
      '<p class="lab">Affichage</p><div class="seg">' + seg("th", "lagon", Store.get("theme"), "🌊 Lagon") + seg("th", "soleil", Store.get("theme"), "☀️ Plein soleil") + '</div>' +
      '<p class="lab">Taille du texte</p><div class="seg">' + seg("taille", 1, Store.get("taille"), "A") + seg("taille", 2, Store.get("taille"), "A+") + seg("taille", 3, Store.get("taille"), "A++") + '</div>' +
      '<p class="lab">Sons et vibrations</p><div class="seg">' + seg("son", 1, Store.get("son") ? 1 : 0, "🔊 Oui") + seg("son", 0, Store.get("son") ? 1 : 0, "🔇 Non") + '</div>' +
      '<div class="rang-btn">' + btn("ℹ️ Le projet", "go", "sec", { r: "projet" }) + btn("🔁 Recommencer", "reset", "sec") + btn("Crédits", "credits", "sec") + '</div>' + btn("Fermer", "fermer"));
  }
  function credits() {
    sheet("Crédits", '<h3>ℹ️ Crédits</h3><span class="badge alert">Prototype · contenus à relire par la Réserve</span><ul class="clean">' + C.credits.map(c => "<li>" + esc(c) + "</li>").join("") + '</ul>' + btn("Fermer", "fermer"));
  }

  // ===================== BARRE DE PRÉSENTATION (?demo=1) =====================
  const NOMS = { projet: "Le projet", accueil: "Accueil", intro: "Histoire", hub: "La carte", marche: "En marche vers l'étape 2", st1: "Étape 1 · la plage", st2: "Étape 2 · le paddle", findemo: "Fin de la démo", fiche: "Fiche enseignant", qr: "QR code de départ" };
  const ETAPE = { brief: "mission", jeu: "jeu", quiz: "question", info: "indice" };
  function updatePresbar() {
    let p = document.getElementById("presbar");
    if (!demoMode) { if (p) p.remove(); document.body.classList.remove("has-presbar"); return; }
    if (!p) { p = document.createElement("nav"); p.id = "presbar"; p.className = "presbar"; p.setAttribute("aria-label", "Barre de démonstration"); document.body.appendChild(p); }
    document.body.classList.add("has-presbar");
    const i = C.demo.findIndex(x => x[0] === route.n && (x[1] || null) === (route.step || null)); if (i >= 0) demoIdx = i;
    const x = C.demo[demoIdx];
    p.innerHTML = '<button data-act="dprev" aria-label="Écran précédent">◀</button><span class="lbl"><b>' + (demoIdx + 1) + '/' + C.demo.length + '</b> ' + esc(NOMS[x[0]] || x[0]) + (ETAPE[x[1]] ? " · " + ETAPE[x[1]] : "") + '</span><button data-act="dnext" aria-label="Écran suivant">▶</button>';
  }
  function demoGo(d) {
    demoIdx = Math.max(0, Math.min(C.demo.length - 1, demoIdx + d));
    const x = C.demo[demoIdx];
    C.demo.forEach((y, k) => { if (k < demoIdx && /^st\d$/.test(y[0]) && y[1] === "info") Store.fait(+y[0].slice(2), true, 3); });
    go(x[0], x[1] || null);
  }

  // ===================== ÉVÉNEMENTS =====================
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    const a = b.dataset.act; Audio2.Sfx.unlock();
    switch (a) {
      case "start": { Audio2.Sfx.bulle(); const premiere = !Store.get("intro"); Store.set("intro", true); premiere ? go("intro", "0") : go("hub"); break; }
      case "pub": Store.set("public", b.dataset.v); Audio2.Sfx.tap(); go(route.n, route.step, true, "replace"); break;
      case "intro": Audio2.Sfx.page(); go("intro", b.dataset.i); break;
      case "station": { const id = +b.dataset.id; if (id > JOUABLES) { toast("🔒 Cette étape arrive dans l'application complète"); break; }
        if (id > 1 && !Store.faits()[id]) { Audio2.Sfx.tap(); go("marche", id); break; } // on y va à pied ; une étape déjà faite se rejoue directement
        vague(); go("st" + id, "brief"); break; }
      case "arrive": arriver("bouton"); break;
      case "geo": activerGeo(); break;
      case "go": Audio2.Sfx.tap(); go(b.dataset.r, b.dataset.s || null); break;
      case "retour": Audio2.Sfx.tap(); if (aPrecedent()) history.back(); else go(b.dataset.r || "projet", null, false, "replace"); break;
      case "rep": repondre(+b.dataset.i); break;
      case "resoudre": if (jeu) jeu.solve(); break;
      case "print": window.print(); break;
      case "reglages": reglages(); break;
      case "credits": credits(); break;
      case "fermer": fermerFeuille(); break;
      case "th": Store.set("theme", b.dataset.v); applyTheme(); reglages(); break;
      case "taille": Store.set("taille", +b.dataset.v); applyTheme(); reglages(); break;
      case "son": Store.set("son", b.dataset.v === "1"); reglages(); break;
      case "reset": Store.reset(); resultat = {}; fermerFeuille(); go("accueil"); toast("Nouvelle partie"); break;
      case "recommencer": Store.reset(); resultat = {}; go("accueil"); break;
      case "installer": if (installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; majInstall(); }); } break;
      case "dprev": demoGo(-1); break;
      case "dnext": demoGo(1); break;
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") fermerFeuille();
    if ((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest(".pin[data-act]")) { e.preventDefault(); e.target.closest(".pin").dispatchEvent(new MouseEvent("click", { bubbles: true })); }
    if (demoMode && !e.target.closest("input,textarea,select")) { if (e.key === "PageDown") demoGo(1); if (e.key === "PageUp") demoGo(-1); }
  });
  window.addEventListener("online", topbar); window.addEventListener("offline", topbar);

  // ===================== DÉMARRAGE =====================
  function init() {
    const q = new URLSearchParams(location.search);
    if (q.get("theme") && ["lagon", "soleil"].includes(q.get("theme"))) Store.set("theme", q.get("theme"));
    if (q.get("public") && C.publics[q.get("public")]) Store.set("public", q.get("public"));
    demoMode = q.get("demo") === "1";
    Object.keys(Store.faits()).forEach(k => { if (+k > JOUABLES) Store.fait(+k, false); }); // ancienne partie allant plus loin
    const s = q.get("station");
    if (demoMode) { demoIdx = 0; Store.reset(); go("projet", null, false, "init"); }
    else if (/^\d$/.test(s || "")) go("st" + s, "brief", false, "init");
    else if (s && SCREENS[s]) go(s, null, false, "init");
    else go("projet", null, false, "init");
    window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; majInstall(); });
    window.addEventListener("appinstalled", () => { installPrompt = null; const b = document.getElementById("pj-install"); if (b) b.remove(); });
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).then(() => setTimeout(topbar, 300)).catch(() => { });
      navigator.serviceWorker.addEventListener("controllerchange", topbar);
    }
  }
  window.App = { go, route: () => route, jeu: () => jeu, demoGo };
  init();
})();
