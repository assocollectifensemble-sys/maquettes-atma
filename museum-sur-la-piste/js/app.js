/* ============================================================
   APP.JS — Navigation, écrans et logique de « Sur la piste des animaux
   disparus » (prototype pour le Muséum d'histoire naturelle de La Réunion).
   Écrans : projet (1er écran) · accueil · intro · hub (parcours de l'étage) ·
   st1 (brief → fouille → squelette → legende → quiz → info) · marche (« Rejoins la prochaine vitrine ») ·
   st2 (brief → carte → temps → quiz → info) · findemo · carnet · fiche (enseignant) ·
   musee (« Pour le Muséum ») · stats (tableau de bord) · qr (QR de départ) · diplome (verrouillé).
   ============================================================ */
(function () {
  "use strict";
  const C = window.Content;
  const $screen = document.getElementById("screen");
  let route = { n: "projet", step: null }, jeu = null, demoMode = false, demoIdx = 0, debutEtape = {};
  // VERSION DÉMO : tant que Content.CONFIG.versionComplete est faux, seules les étapes 1 et 2 sont jouables.
  // TOUS les chemins (boutons, adresse ?station=…, reprise de partie, diaporama) passent par go() : c'est là qu'on refuse.
  const COMPLET = !!(C.CONFIG && C.CONFIG.versionComplete);
  const OUVERTES = ["1", "2"];
  const VERROU = n => !COMPLET && (/^st(3|4|5|jardin)$/.test(n) || n === "diplome");
  let installPrompt = null;
  const BULLES = {};

  // ---------- utilitaires ----------
  // typographie française : espace insécable avant ! ? ; : » et après «
  const typo = s => String(s).replace(/ ([!?;:»])/g, " $1").replace(/« /g, "« ").replace(/Ti-Vent/g, "Ti‑Vent");
  const esc = s => typo(String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
  const lang = () => Store.get("lang");
  const pub = () => Store.get("public");
  const L = o => (o && (o[lang()] || o.fr)) || "";
  const LF = o => (o && (lang() === "en" ? (o.en || o.fr) : o.fr)) || ""; // consignes : FR ou EN
  const T = (fr, en) => lang() === "en" ? en : fr;
  const classe = () => pub() === "classe";
  const tablette = () => classe() && Store.get("tablette");
  function pick(t) {
    let r = t; const p = pub();
    if (t && t[p] && typeof t[p] === "object" && t[p].fr) r = Object.assign({}, t, t[p], { _var: p });
    return r;
  }
  const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- thème ----------
  function applyTheme() {
    const th = ["projet", "stats", "musee", "fiche", "qr"].includes(route.n) ? "salle" : Store.get("theme");
    document.body.dataset.theme = th;
    document.documentElement.dataset.taille = Store.get("taille");
    document.documentElement.lang = lang() === "kr" ? "rcf" : lang();
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = th === "clair" ? "#f5ecd7" : "#0f1a16";
  }

  // ---------- briques d'affichage ----------
  function bulle(id, t0, opts) {
    opts = opts || {};
    const t = pick(t0), vid = id + (t._var ? "-" + t._var : "");
    BULLES[id] = t;
    const lb = (v, l) => '<button class="lg" data-act="lang" data-v="' + v + '" aria-pressed="' + (lang() === v) + '" ' + (t[v] ? "" : "disabled") + ' title="' + l + '">' + v.toUpperCase() + '</button>';
    return '<div class="guide' + (opts.compact ? " compact" : "") + (opts.cls ? " " + opts.cls : "") + '">' + (opts.seul ? "" : Art.tivent(t.expr || "content", "av")) +
      '<div class="bubble" data-bid="' + id + '" role="group" aria-label="Ti-Vent dit"><div class="who">Ti-Vent <small>' + esc(T("· jeune pétrel de Barau", "· young Barau's petrel")) + '</small></div>' +
      '<p class="txt" lang="' + (lang() === "kr" ? "rcf" : lang()) + '">' + esc(L(t)) + '</p>' +
      '<p class="kr-note" ' + (lang() === "kr" ? "" : "hidden") + '>Kréol : proposition à faire relire</p>' +
      '<div class="outils"><div class="langs" role="group" aria-label="Langue">' + lb("fr", "Français") + lb("kr", "Kréol") + lb("en", "English") + '</div>' +
      '<button class="ecoute" data-act="voix" data-id="' + vid + '" data-bid="' + id + '" aria-label="Écouter la bulle"><span aria-hidden="true">🔊</span> <span class="ecoute-l">' + esc(L(C.UI.ecouter)) + '</span></button></div></div></div>';
  }
  function majBulles() {
    document.querySelectorAll(".bubble[data-bid]").forEach(b => {
      const t = BULLES[b.dataset.bid]; if (!t) return;
      const p = b.querySelector(".txt"); p.textContent = typo(L(t)); p.lang = lang() === "kr" ? "rcf" : lang();
      b.querySelector(".kr-note").hidden = lang() !== "kr";
      b.querySelectorAll(".lg").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === lang()));
      const e = b.querySelector(".ecoute-l"); if (e) e.textContent = L(C.UI.ecouter);
    });
  }
  function dock(html, cls) { return '<div class="dock ' + (cls || "") + '">' + html + '</div>'; }
  function btn(label, act, cls, data) {
    let d = ""; if (data) Object.keys(data).forEach(k => { d += " data-" + k + '="' + esc(data[k]) + '"'; });
    return '<button class="btn ' + (cls || "") + '" data-act="' + act + '"' + d + '>' + label + '</button>';
  }
  function src(code) { return code ? '<p class="src">' + esc(L(C.UI.source)) + ' : ' + esc(code) + ' · SOURCES.md</p>' : ""; }
  function toast(t, ms) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), ms || 3200); return e; }
  // confettis : plumes et papiers qui tombent (sous le contenu, purement décoratifs)
  function fete() {
    if (reduit()) return;
    const d = document.createElement("div"); d.className = "fete"; d.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 26; i++) {
      const e = document.createElement("i"); e.className = i % 3 === 0 ? "plume" : i % 3 === 1 ? "papier" : "papier or";
      e.style.left = Math.random() * 100 + "%"; e.style.animationDuration = (2.4 + Math.random() * 2) + "s"; e.style.animationDelay = Math.random() * .7 + "s";
      e.style.setProperty("--r", (Math.random() * 720 - 360).toFixed(0) + "deg"); e.style.setProperty("--x", (Math.random() * 80 - 40).toFixed(0) + "px");
      d.appendChild(e);
    }
    document.body.appendChild(d); setTimeout(() => d.remove(), 5200);
  }

  // ---------- barre du haut ----------
  function topbar() {
    if (route.n === "projet") { document.getElementById("topbar").innerHTML = ""; document.getElementById("topbar").hidden = true; return; }
    document.getElementById("topbar").hidden = false;
    const f = Store.faits(); let pips = "";
    Store.ETAPES.forEach(k => { pips += Art.ICO.plume(f[k] && (COMPLET || OUVERTES.includes(k))); });
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller, horsLigne = navigator.onLine === false;
    const n = Store.ETAPES.filter(k => f[k] && (COMPLET || OUVERTES.includes(k))).length;
    document.getElementById("topbar").innerHTML =
      '<button class="brand" data-act="accueil" aria-label="Retour à l\'accueil">' + Art.tivent("content", "mini") + '<span class="brand-t"><b>' + esc(T("Sur la piste", "On the trail")) + '</b><small class="reseau ' + (sw || horsLigne ? "ok" : "") + '" id="reseau">● ' + esc(horsLigne ? T("hors ligne · tout fonctionne", "offline · all works") : sw ? T("fonctionne hors connexion", "works offline") : T("Muséum · prototype", "Museum · prototype")) + '</small></span></button>' +
      '<button class="pips" data-act="go" data-r="carnet" aria-label="Carnet : ' + n + ' planche(s) sur 6">' + pips + '</button>' +
      '<button class="iconbtn" data-act="reglages" aria-label="Réglages, langue, affichage">' + Art.ICO.reglages + '</button>';
  }

  // ---------- historique (bouton / geste RETOUR du téléphone, repris de Kélonia) ----------
  // state = { mu, n, s, i (profondeur), p (écran d'en dessous), f (sentinelle « appuyez encore pour quitter »), sh (modale) }
  const H = () => (history.state && history.state.mu ? history.state : null);
  const aPrecedent = () => { const h = H(); return !!h && h.i > 1; };
  const etat = x => Object.assign({ mu: 1, n: route.n, s: route.step }, x);
  let quitterAvant = 0;
  function armer() {
    const h = H(); if (!h || h.i !== 0 || h.f) return;
    try { history.replaceState(Object.assign({}, h, { f: 1, sh: undefined }), "", location.href); history.pushState(Object.assign({}, h, { i: 1, f: undefined, sh: undefined, p: [h.n, h.s] }), "", location.href); } catch (e) { }
  }
  function ecrireHistorique(u, mode) {
    let h = H();
    try {
      if (mode === "init") return history.replaceState(etat({ i: h && !h.f ? h.i : 0, p: h && !h.f ? h.p : undefined }), "", u);
      if (mode === "pop" || mode === "replace" || !h) return history.replaceState(etat(h ? { i: h.i, p: h.p, f: mode === "pop" ? h.f : undefined } : { i: 0 }), "", u);
      const meme = h.n === route.n && (h.s || null) === route.step;
      if (meme || h.sh) return history.replaceState(etat({ i: h.i, p: h.p, sh: meme ? h.sh : undefined }), "", u);
      armer(); h = H();
      history.pushState(etat({ i: h.i + 1, p: [h.n, h.s] }), "", u);
    } catch (e) { /* file:// */ }
  }
  function retourHistorique(e) {
    const s = e.state; if (!s || !s.mu) return;
    if (s.f) {
      if (Date.now() < quitterAvant) { quitterAvant = 0; history.back(); return; }
      closeSheets();
      if (s.n !== route.n || (s.s || null) !== route.step) go(s.n, s.s, false, "pop");
      try { history.pushState(Object.assign({}, s, { f: undefined, i: 1, p: [s.n, s.s] }), "", location.href); } catch (er) { }
      quitterAvant = Date.now() + 2000;
      document.querySelectorAll(".toast.quitter").forEach(t => t.remove());
      toast(T("Appuyez encore sur retour pour quitter", "Press back again to exit"), 2000).classList.add("quitter");
      return;
    }
    closeSheets();
    if (s.n === route.n && (s.s || null) === route.step) return;
    go(s.n, s.s, false, "pop");
  }
  window.addEventListener("popstate", retourHistorique);
  document.addEventListener("click", armer, true);
  document.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") armer(); }, true);
  const flecheRetour = parent => '<div class="retour-haut-l noprint"><button class="retour-haut" data-act="retour" data-r="' + parent + '" aria-label="Retour"><span aria-hidden="true">←</span></button></div>';

  // ---------- routeur ----------
  function go(n, step, noScroll, mode) {
    if (jeu) { jeu.destroy(); jeu = null; }
    Audio2.stopVoix(); closeSheets();
    let refus = false;
    // « Rejoins la prochaine vitrine » vers une étape verrouillée : même refus (ex. ?station=marche&etape=3)
    if (VERROU(n) || (!COMPLET && n === "marche" && step != null && !OUVERTES.includes(String(step)))) { refus = true; n = "hub"; step = null; }
    route = { n, step: step == null ? null : String(step) };
    const u = new URL(location.href); u.searchParams.delete("station");
    const code = /^st/.test(n) ? n.slice(2) : n;
    if (n !== "projet") u.searchParams.set("station", code);
    if (n === "st1" || n === "st2" || n === "intro" || n === "marche") { if (route.step) u.searchParams.set("etape", route.step); else u.searchParams.delete("etape"); } else u.searchParams.delete("etape");
    ecrireHistorique(u, mode);
    applyTheme(); render();
    if (!noScroll) window.scrollTo(0, 0);
    const h = $screen.querySelector("h1,h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    updatePresbar();
    if (refus) toast("🔒 " + T("Cette étape arrive dans l'application complète", "This stage comes in the full app"));
  }
  function render() {
    topbar();
    const fn = SCREENS[route.n]; if (!fn) return go("projet", null, false, "replace");
    $screen.classList.remove("entre"); void $screen.offsetWidth; $screen.classList.add("entre");
    $screen.innerHTML = fn(route.step);
    document.body.dataset.ecran = route.n;
    const a = AFTER[route.n]; if (a) a(route.step);
  }
  const SCREENS = {}, AFTER = {};

  // ===================== LE PROJET (1er écran) =====================
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const iOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function aideInstall() {
    if (standalone()) return "";
    const txt = iOS() ? 'Sur iPhone : touchez <b>Partager</b> <span aria-hidden="true">⬆</span> puis <b>« Sur l\'écran d\'accueil »</b>.'
      : installPrompt ? "Une icône s'ajoute à l'écran d'accueil, comme une application. Elle fonctionne ensuite hors connexion."
        : 'Android : menu <b>⋮</b> du navigateur → <b>« Installer l\'application »</b>.<br>iPhone : <b>Partager</b> → <b>« Sur l\'écran d\'accueil »</b>.';
    return '<section class="pj-install" id="pj-install"><h3>📲 Installer sur l\'écran d\'accueil</h3><p>' + typo(txt) + '</p>' +
      (installPrompt && !iOS() ? btn("Installer l'application", "installer", "pj-btn") : "") + '</section>';
  }
  function majInstall() { const b = document.getElementById("pj-install"); if (b) b.outerHTML = aideInstall(); }
  SCREENS.projet = () => {
    const cartes = [
      ["🏛️", "Toute la visite de l'étage", "5 étapes de vitrine en vitrine, puis un final au Jardin de l'État", "large"],
      ["👨‍👩‍👧", "Familles, classes, événements", "Nuit des musées, vacances, Fête de la science"],
      ["🗣️", "Français, kréol, anglais", "Voix enregistrées, texte toujours affiché"],
      ["🔳", "Un seul QR code", "Se lance dans le navigateur, l'appli guide ensuite"],
      ["📶", "Hors connexion", "Une fois chargée, elle fonctionne partout dans le bâtiment"],
      ["✏️", "Contenus relus par vos scientifiques", "Et modifiables par l'équipe du Muséum"],
      ["📊", "Statistiques anonymes", "Ce que font les visiteurs, ce qu'ils retiennent", "stats"],
      ["📱", "Mode tablette de groupe", "Une tablette pour 3 à 5 élèves, rôles tournants"]
    ];
    return '<div class="projet"><div class="pj-tete"><span class="pj-lieu">Muséum d\'histoire naturelle · Saint-Denis</span><span class="pj-badge">Prototype · proposition à co-écrire avec l\'équipe du Muséum</span></div>' +
      '<div class="pj-art">' + Art.vitrine() + '<div class="pj-tv">' + Art.tivent("clin", "flotte") + '</div></div>' +
      '<h1>Sur la piste des animaux disparus</h1><p class="pj-sous">Une aventure sur téléphone pour le Muséum d\'histoire naturelle de La Réunion</p>' +
      '<p class="pj-idee">' + typo("Ti-Vent, un jeune pétrel de Barau ébloui par les lumières de la ville, atterrit devant le Muséum : les enfants enquêtent <b>de vitrine en vitrine</b> pour découvrir qui vivait sur l'île avant lui. Ils fouillent, remontent des squelettes, voyagent dans le temps… et finissent au <b>Jardin de l'État</b> avec l'envie de protéger la faune d'aujourd'hui.") + '</p>' +
      '<div class="pj-demo"><b>Dans cette démo</b> : les étapes 1 et 2 de la salle Lacroix, jouables de bout en bout (≈ 10 min).</div>' +
      '<h2 class="pj-h">Ce que l\'application complète proposera</h2><ul class="pj-grille">' +
      cartes.map(x => x[3] === "stats" ? '<li class="pj-lien"><button data-act="go" data-r="stats"><span class="pj-i" aria-hidden="true">' + x[0] + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small><span class="pj-voir">Voir l\'aperçu ›</span></button></li>'
        : '<li class="' + (x[3] || "") + '"><span class="pj-i" aria-hidden="true">' + x[0] + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></li>').join("") + '</ul>' +
      '<section class="pj-classe"><div class="pj-c-t"><span class="pj-c-i" aria-hidden="true">🎓</span><div><h3>Version classe</h3><span class="pj-c-niv">Cycles 2 et 3 · programmes de juin 2026</span></div></div>' +
      '<p>' + esc("Avant, pendant et après la venue : consignes scolaires, encadrés « Pour la classe », mode tablette de groupe et fiche enseignant imprimable.") + '</p>' + btn("Lire la fiche enseignant ➜", "go", "pj-btn", { r: "fiche" }) + '</section>' +
      aideInstall() +
      '<div class="pj-acces">' + btn("🏛️ Pour le Muséum", "go", "pj-sec", { r: "musee" }) + btn("📊 Tableau de bord", "go", "pj-sec", { r: "stats" }) + '</div>' +
      '<p class="pj-fiction">' + esc("Ti-Vent est un personnage de fiction ; tout le reste (espèces, dates, découvertes) vient de sources publiées, listées dans SOURCES.md et à relire par l'équipe scientifique du Muséum.") + '</p></div>' +
      dock(btn("▶ Démarrer la démo", "go", "big", { r: "accueil" }));
  };

  // ===================== ACCUEIL DU JEU =====================
  SCREENS.accueil = () => {
    const p = pub(), n = Store.count(), eq = Store.get("equipe") || [];
    const pubBtn = k => '<button class="pubbtn" data-act="pub" data-v="' + k + '" aria-pressed="' + (p === k) + '"><span class="pubico" aria-hidden="true">' + C.publics[k].ico + '</span><span>' + esc(L(C.publics[k])) + '</span></button>';
    const lgBtn = (v, l) => '<button class="btn mini" data-act="lang" data-v="' + v + '" aria-pressed="' + (lang() === v) + '">' + l + '</button>';
    return '<div class="hero">' + Art.accueil() + '<div class="hero-titre"><span class="kicker">' + esc(T("Muséum d'histoire naturelle · La Réunion", "Natural History Museum · Réunion")) + '</span><h1>' + esc(L(C.titre)) + '</h1></div></div>' +
      '<p class="accroche">' + esc(T("Une enquête de vitrine en vitrine avec Ti-Vent, jeune pétrel de Barau.", "A case-by-case investigation with Ti-Vent, a young Barau's petrel.")) + '</p>' +
      '<section class="card"><h3>' + esc(T("Qui joue ?", "Who's playing?")) + '</h3><div class="pubs" role="group" aria-label="Public">' + pubBtn("famille") + pubBtn("classe") + '</div>' +
      '<p class="small dim">' + esc(LF(C.publics[p].desc)) + '</p>' +
      (p === "classe" ? '<div class="tablette"><button class="interrupteur" data-act="tablette" role="switch" aria-checked="' + !!Store.get("tablette") + '"><span class="int-rail"><span class="int-bille"></span></span><span><b>' + esc(T("Mode tablette de groupe", "Group-tablet mode")) + '</b><small>' + esc(T("Une tablette pour 3 à 5 élèves : on se la passe à chaque mission.", "One tablet for 3-5 pupils, passed round at each mission.")) + '</small></span></button>' +
        (Store.get("tablette") ? '<button class="btn sec mini" data-act="equipe">👥 ' + (eq.length ? eq.map(esc).join(", ") : esc(T("Ajouter les prénoms du groupe", "Add the group's names"))) + '</button>' : "") + '</div>' : "") + '</section>' +
      '<section class="card ligne"><h3>' + esc(T("Langue des bulles", "Bubble language")) + '</h3><div class="seg">' + lgBtn("fr", "Français") + lgBtn("kr", "Kréol") + lgBtn("en", "English") + '</div></section>' +
      '<p class="small dim center">' + esc(T("Démo ≈ 10 min · tout reste sur ce téléphone", "Demo ≈ 10 min · everything stays on this phone")) + '</p>' +
      (COMPLET ? "" : '<p class="center"><button class="lien" data-act="go" data-r="projet">← ' + esc(T("Présentation du projet", "About the project")) + '</button></p>') +
      dock(btn((n > 0 ? "🔎 " + esc(L(C.UI.continuer)) : "🔎 " + esc(L(C.UI.commencer))), "start", "big"));
  };

  // ===================== INTRO =====================
  SCREENS.intro = step => {
    const i = Math.max(0, Math.min(C.intro.length - 1, +step || 0)), t = C.intro[i], last = i === C.intro.length - 1;
    return '<h2 class="sr-only">Histoire</h2><div class="intro-scene"><div class="intro-art i' + i + '">' + (i === 1 ? '<div class="lumieres" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' : "") + Art.tivent(t.expr, "grand") + '</div>' + bulle("intro" + i, t, { seul: true }) + '</div>' +
      '<div class="dots" aria-label="Étape ' + (i + 1) + ' sur ' + C.intro.length + '">' + C.intro.map((x, k) => '<i class="' + (k === i ? "on" : "") + '"></i>').join("") + '</div>' +
      dock(last ? btn("🗺️ " + esc(L(C.UI.parcours)), "hub", "big") : btn(esc(L(C.UI.suite)) + " ➜", "intro", "big", { i: i + 1 }));
  };

  // ===================== HUB : le parcours de l'étage =====================
  SCREENS.hub = () => {
    const f = Store.faits(), fait = k => f[k] && (COMPLET || OUVERTES.includes(k)), n = OUVERTES.filter(fait).length;
    const ligne = (E, k) => {
      const ouvert = COMPLET || OUVERTES.includes(E.id), num = E.id === "jardin" ? "★" : E.id;
      if (!ouvert) return '<li class="st verrou"><div class="station" aria-disabled="true"><span class="num">' + Art.ICO.cadenas + '<span class="sr-only">Verrouillé</span></span><span class="st-t"><b>' + E.ico + " " + esc(L(E.titre)) + '</b><small>' + esc(LF(E.apercu)) + '</small><span class="badge-complet">' + esc(T("Application complète", "Full app")) + '</span></span></div></li>';
      return '<li class="st ' + (fait(E.id) ? "fait" : "") + '"><button class="station" data-act="station" data-id="' + E.id + '"><span class="num" aria-hidden="true">' + (fait(E.id) ? "✓" : num) + '</span><span class="st-t"><b>' + E.ico + " " + esc(L(E.titre)) + '</b><small>📍 ' + esc(LF(E.lieu)) + '</small></span><span class="go" aria-hidden="true">' + (fait(E.id) ? "★" : "➜") + '</span></button></li>';
    };
    const t = n === 0 ? C.hub.debut : n === 1 ? C.hub.milieu : C.hub.fin;
    return '<span class="kicker">' + esc(T("L'enquête · premier étage", "The investigation · first floor")) + '</span><h2>' + esc(T("Le parcours", "The trail")) + '</h2>' +
      '<div class="progress" role="img" aria-label="' + n + ' planches sur 2 dans la démo"><i style="width:' + n * 50 + '%"></i><span>' + n + ' / 2 ' + esc(T("planches · démo", "plates · demo")) + '</span></div>' +
      bulle("hub" + n, t, { compact: true }) +
      '<div class="hub-plan">' + Art.plan(null, OUVERTES.find(k => !fait(k)) || "jardin") + '</div>' +
      '<ul class="stations">' + C.etapes.map(ligne).join('<li class="sentier" aria-hidden="true"></li>') +
      '<li class="sentier" aria-hidden="true"></li>' + (COMPLET ? '<li class="st"><button class="station" data-act="go" data-r="diplome"><span class="num">🎓</span><span class="st-t"><b>' + esc(L(C.diplome.titre)) + '</b></span></button></li>' :
        '<li class="st verrou"><div class="station" aria-disabled="true"><span class="num">' + Art.ICO.cadenas + '</span><span class="st-t"><b>🎓 ' + esc(L(C.diplome.titre)) + '</b><small>' + esc(LF(C.diplome.apercu)) + '</small><span class="badge-complet">' + esc(T("Application complète", "Full app")) + '</span></span></div></li>') + '</ul>' +
      '<p class="note small">' + esc(T("Sur place : un seul QR code à l'accueil, puis l'appli guide de vitrine en vitrine. Ici, touche simplement une étape ouverte.", "On site: one QR code at the entrance, then the app guides you. Here, just tap an open stage.")) + '</p>' +
      (!COMPLET && n >= 2 ? dock(btn("🏁 " + esc(T("Fin de la démo", "End of demo")) + " ➜", "go", "big", { r: "findemo" })) : "");
  };

  // ===================== ÉTAPES : briques communes =====================
  const ETAPES_DEF = { st1: ["brief", "fouille", "squelette", "legende", "quiz", "info"], st2: ["brief", "carte", "temps", "quiz", "info"] };
  const ETQ = { brief: ["Mission", "Mission"], fouille: ["Fouille", "Dig"], squelette: ["Squelette", "Skeleton"], legende: ["Légende ou science ?", "Legend or science?"], carte: ["Carte", "Map"], temps: ["Le temps", "Time"], quiz: ["Question", "Question"], info: ["Planche gagnée", "Plate earned"] };
  function enTete(id, step) {
    const E = C.etapes.find(e => e.id === id), etapes = ETAPES_DEF["st" + id], k = etapes.indexOf(step);
    return '<div class="et-tete"><span class="kicker">' + esc(L(C.UI.etape)) + " " + id + " · 📍 " + esc(LF(E.lieu)) + '</span><h2><span aria-hidden="true">' + E.ico + '</span> ' + esc(L(E.titre)) + '</h2>' +
      '<ol class="et-fil" aria-label="Progression de l\'étape">' + etapes.map((s, i) => '<li class="' + (i < k ? "ok" : i === k ? "ici" : "") + '"><span>' + esc(T(ETQ[s][0], ETQ[s][1])) + '</span></li>').join("") + '</ol></div>';
  }
  function tourEquipe() {
    const eq = Store.get("equipe") || []; if (!tablette() || eq.length < 2) return "";
    const nom = eq[(Store.get("tour") || 0) % eq.length];
    return '<div class="tour">📱 ' + esc(L(C.UI.tourDe)) + ' <b>' + esc(nom) + '</b> ' + esc(L(C.UI.tenir)) + '</div>';
  }
  function classeBox(cl) {
    if (!classe()) return "";
    return '<section class="classe-box"><h3>🎓 Pour la classe</h3><p><b>Notion :</b> ' + esc(cl.notion) + '</p><p><b>Mots-clés :</b> ' + cl.mots.map(esc).join(" · ") + '</p><p><b>À débattre :</b> ' + esc(cl.q) + '</p><p class="small dim">' + esc(cl.prog) + '</p></section>';
  }
  const resoudre = () => demoMode ? '<button class="btn mini sec resoudre" data-act="resoudre">⚡ Résoudre (démo)</button>' : "";
  function consigne(t) { return '<p class="consigne">' + esc(LF(t)) + '</p>'; }
  function observer(t) { return '<p class="observer"><span aria-hidden="true">👀</span> ' + esc(LF(t)) + '</p>'; }
  function quizHTML(Q) {
    return '<section class="quiz card"><h3>' + esc(LF(Q.q)) + '</h3><div class="opts">' + Q.opts.map((o, i) => '<button class="opt" data-act="rep" data-i="' + i + '"><span class="lettre" aria-hidden="true">' + "ABC"[i] + '</span><span>' + esc(LF(o)) + '</span></button>').join("") + '</div><p class="retour-quiz" aria-live="polite"></p></section>';
  }
  let essais = 0;
  function repondre(i) {
    const id = route.n.slice(2), Q = (id === "1" ? C.st1 : C.st2).quiz, b = document.querySelectorAll(".opt"), fb = document.querySelector(".retour-quiz");
    if (!b.length || document.querySelector(".opt.juste")) return;
    const ok = i === Q.ok; essais++;
    if (essais === 1) Store.Stats.quiz(id, ok);
    if (ok) {
      b[i].classList.add("juste"); b.forEach(x => x.disabled = true);
      fb.className = "retour-quiz ok"; fb.textContent = typo(LF(Q.bravo)); Audio2.Sfx.ok(); Audio2.vibre(40);
      document.querySelector(".dock").outerHTML = dock(btn("📒 " + esc(T("Coller la planche", "Add the plate")) + " ➜", "pas", "big", { s: "info" }));
    } else {
      b[i].classList.add("faux"); b[i].disabled = true;
      fb.className = "retour-quiz ko"; fb.textContent = typo(LF(Q.rate)); Audio2.Sfx.ko(); Audio2.vibre([30, 40, 30]);
    }
  }
  function infoHTML(id, D, apres) {
    const art = id === "1" ? Art.solitaire("") : Art.dodo("");
    return enTete(id, "info") +
      '<div class="planche-gagnee"><div class="planche"><span class="pl-num">' + esc(T("Planche", "Plate")) + ' n° ' + id + '</span>' + art + '<b class="pl-nom">' + esc(LF(D.planche)) + '</b><i class="pl-latin">' + esc(D.planche.latin) + '</i><span class="pl-fam">' + esc(LF(D.planche.famille)) + '</span>' +
      '<div class="pl-tampon">' + Art.tampon(id === "1" ? "IBIS !" : "MAURICE", T("étape ", "stage ") + id) + '</div></div>' +
      '<div class="badge-gagne"><span class="bg-medaille" aria-hidden="true">🏅</span><span><small>' + esc(T("Badge gagné", "Badge earned")) + '</small><b>' + esc(LF(D.badge)) + '</b></span></div></div>' +
      '<section class="savais card"><h3>💡 ' + esc(T("Le savais-tu ?", "Did you know?")) + '</h3><p>' + esc(LF(D.fait)) + '</p>' + src(D.fait.src) + '</section>' +
      classeBox(D.classe) + bulle("st" + id + "-fin", D.fin, { compact: true }) + apres;
  }
  function finEtape(id) {
    if (!Store.faits()[id]) { Store.fait(id); Store.Stats.etape(id, debutEtape[id] ? (Date.now() - debutEtape[id]) / 1000 : 0); }
    topbar();
    setTimeout(() => { Audio2.Sfx.tampon(); Audio2.vibre([60, 40, 60]); }, 650);
    setTimeout(() => Audio2.Sfx.fanfare(), 900);
    fete();
  }
  function montrerSuite(html) { const d = document.querySelector(".dock"); if (d) d.outerHTML = dock(html); }
  function montrerBulle(id, t) { const z = document.querySelector(".zone-bulle"); if (z) { z.innerHTML = bulle(id, t, { compact: true }); z.hidden = false; z.scrollIntoView({ behavior: reduit() ? "auto" : "smooth", block: "nearest" }); } }
  const N = o => L(o); // nom d'os / d'animal dans la langue (FR ou EN)

  // ===================== ÉTAPE 1 · L'énigme du Solitaire =====================
  SCREENS.st1 = step => {
    const D = C.st1; step = ETAPES_DEF.st1.includes(step) ? step : "brief";
    if (step === "brief") return enTete("1", step) + '<div class="brief-art">' + Art.solitaire("brief-sil") + '<span class="brief-q" aria-hidden="true">?</span></div>' + bulle("st1-brief", D.brief) + observer(D.observer) + dock(btn("🦴 " + esc(T("Commencer la fouille", "Start digging")) + " ➜", "pas", "big", { s: "fouille" }));
    if (step === "fouille") return enTete("1", step) + tourEquipe() + consigne(D.fouille) + '<div class="jeu" id="jeu"></div><div class="zone-bulle" hidden></div>' + resoudre() + dock(btn(esc(T("Dégage les 5 os…", "Uncover the 5 bones…")), "rien", "big attente", {}));
    if (step === "squelette") return enTete("1", step) + tourEquipe() + consigne(D.squelette) + '<div class="jeu" id="jeu"></div><div class="zone-bulle" hidden></div>' + resoudre() + dock(btn(esc(T("Place les 5 os…", "Place the 5 bones…")), "rien", "big attente", {}));
    if (step === "legende") return enTete("1", step) + consigne(D.legende) + '<div class="jeu" id="jeu"></div><div class="zone-bulle" hidden></div>' + resoudre() + dock(btn(esc(T("Fais glisser le volet…", "Slide the panel…")), "rien", "big attente", {}));
    if (step === "quiz") return enTete("1", step) + tourEquipe() + quizHTML(D.quiz) + dock(btn(esc(T("Choisis une réponse…", "Pick an answer…")), "rien", "big attente", {}));
    return infoHTML("1", D, dock(btn("🧭 " + esc(T("Rejoins la prochaine vitrine", "Head to the next case")) + " ➜", "go", "big", { r: "marche", s: "2" })));
  };
  AFTER.st1 = step => {
    const D = C.st1, el = document.getElementById("jeu"), noms = {}, court = {}, bravo = {}, rate = {};
    Object.keys(D.noms).forEach(k => { noms[k] = LF(D.noms[k]); court[k] = LF(D.court[k]); bravo[k] = LF(D.sqBravo[k]); rate[k] = LF(D.sqRate[k]); });
    if (step === "brief" || !step) { debutEtape["1"] = debutEtape["1"] || Date.now(); }
    if (step === "fouille") jeu = Games.fouille(el, { noms, motOs: T("os", "bones"), motIndice: "💡 " + T("Un indice", "A hint"), onFin: () => { montrerBulle("st1-fouille", D.fouilleFin); montrerSuite(btn("🦴 " + esc(T("Remonter le squelette", "Rebuild the skeleton")) + " ➜", "pas", "big", { s: "squelette" })); } });
    if (step === "squelette") jeu = Games.squelette(el, { noms, court, bravo, rate, annot: { bec: esc(LF(D.annot.bec)), ailes: esc(LF(D.annot.ailes)), pattes: esc(LF(D.annot.pattes)) }, choisi: LF(D.sqChoisi), lacher: LF(D.sqLacher), depart: "",
      onFin: () => { montrerBulle("st1-sq", D.sqFin); montrerSuite(btn(esc(LF(D.habiller)), "habiller", "big")); } });
    if (step === "legende") jeu = Games.legende(el, { etqMythe: LF(D.etqMythe), etqScience: LF(D.etqScience), note: esc(LF(D.lgNote)) + ' <span class="src">[' + D.lgNote.src + ']</span>', aria: T("Volet de comparaison", "Comparison slider"),
      onFin: () => { montrerBulle("st1-revelation", D.revelation); Audio2.vibre([40, 30, 80]); fete(); montrerSuite(btn("❓ " + esc(T("Une dernière question", "One last question")) + " ➜", "pas", "big", { s: "quiz" })); } });
    if (step === "quiz") essais = 0;
    if (step === "info") finEtape("1");
  };

  // ===================== MARCHE : « Rejoins la prochaine vitrine » =====================
  SCREENS.marche = step => {
    const vers = String(step || "2"), M = C.marche[vers] || C.marche[2], de = String(+vers - 1), E = C.etapes.find(e => e.id === vers);
    return '<span class="kicker">' + esc(T("En route", "On the way")) + ' · ' + esc(T("étape", "stage")) + ' ' + de + ' → ' + vers + '</span><h2>' + esc(T("Rejoins la prochaine vitrine", "Head to the next case")) + '</h2>' +
      '<div class="plan-l">' + Art.plan(de, vers) + '<p class="plan-info">📍 <b>' + esc(LF(E.lieu)) + '</b> · ' + esc(T("tout près", "close by")) + '</p></div>' +
      bulle("marche" + vers, M, { compact: true }) +
      '<section class="card repere"><h3>' + Art.ICO.loupe + ' ' + esc(T("Le repère à chercher", "The landmark to look for")) + '</h3><div class="repere-l">' + Art.dodo("repere-art") + '<p>' + esc(LF(M.repere)) + '</p></div></section>' +
      '<p class="note small">' + esc(T("Ordre des vitrines proposé, à valider avec l'équipe du Muséum. Démo : touche « Je suis arrivé·e ».", "Proposed order, to confirm with the Museum team. Demo: tap “I'm here”.")) + '</p>' +
      dock(btn("📍 " + esc(L(C.UI.arrive)), "station", "big", { id: vers }) + btn("🗺️ " + esc(T("Voir le parcours", "See the trail")), "hub", "sec"), "flow");
  };

  // ===================== ÉTAPE 2 · Les îles sœurs =====================
  const animauxL = () => C.animaux.map(a => ({ id: a.id, ile: a.ile, nom: esc(LF(a.nom)) }));
  SCREENS.st2 = step => {
    const D = C.st2; step = ETAPES_DEF.st2.includes(step) ? step : "brief";
    if (step === "brief") return enTete("2", step) + '<div class="brief-art duo">' + Art.dodo("") + '<span class="brief-q" aria-hidden="true">?</span></div>' + bulle("st2-brief", D.brief) + observer(D.observer) + dock(btn("🗺️ " + esc(T("Ouvrir la carte des îles", "Open the island map")) + " ➜", "pas", "big", { s: "carte" }));
    if (step === "carte") return enTete("2", step) + tourEquipe() + consigne(D.carte) + '<div class="jeu" id="jeu"></div><div class="zone-bulle" hidden></div>' + resoudre() + dock(btn(esc(T("Place les 5 animaux…", "Place the 5 animals…")), "rien", "big attente", {}));
    if (step === "temps") return enTete("2", step) + tourEquipe() + consigne(D.temps) + '<div class="jeu" id="jeu"></div><div class="zone-bulle" hidden></div>' + resoudre() + dock(btn(esc(T("Fais avancer le temps…", "Move time forward…")), "rien", "big attente", {}));
    if (step === "quiz") return enTete("2", step) + tourEquipe() + quizHTML(D.quiz) + dock(btn(esc(T("Choisis une réponse…", "Pick an answer…")), "rien", "big attente", {}));
    return infoHTML("2", D, COMPLET ? dock(btn("🧭 " + esc(T("Rejoins la prochaine vitrine", "Head to the next case")) + " ➜", "go", "big", { r: "hub" }))
      : dock(btn("🏁 " + esc(T("Voir la suite de l'aventure", "See what comes next")) + " ➜", "go", "big", { r: "findemo" }) + btn("🗺️ " + esc(T("Voir le parcours", "See the trail")), "hub", "sec"), "flow"));
  };
  AFTER.st2 = step => {
    const D = C.st2, el = document.getElementById("jeu");
    if (step === "brief" || !step) { debutEtape["2"] = debutEtape["2"] || Date.now(); }
    if (step === "carte") jeu = Games.carte(el, { animaux: animauxL(), choisi: LF(D.caChoisi), lacher: LF(D.caLacher),
      bravo: a => typo(LF(C.animaux.find(x => x.id === a.id).bravo)), rate: a => typo(LF(C.animaux.find(x => x.id === a.id).rate)),
      onFin: () => { montrerBulle("st2-carte", D.carteFin); montrerSuite(btn("⏳ " + esc(T("Voyager dans le temps", "Travel in time")) + " ➜", "pas", "big", { s: "temps" })); } });
    if (step === "temps") jeu = Games.temps(el, { animaux: animauxL(), debut: 1600, fin: 2026, motAn: T("année", "year"), motVers: T("vers", "around"), motNoter: T("Noter dans le carnet ✓", "Note it down ✓"), motFrise: T("Frise du carnet", "Notebook timeline"), aria: T("Règle du temps, de 1600 à aujourd'hui", "Time ruler, 1600 to today"),
      evenements: D.evenements.map(e => Object.assign({}, e, { texte: esc(LF(e.texte)), court: esc(LF(e.court)), src: e.src ? esc(L(C.UI.source)) + " : " + e.src : "" })),
      onFin: () => { montrerBulle("st2-temps", D.tempsFin); montrerSuite(btn("❓ " + esc(T("Une dernière question", "One last question")) + " ➜", "pas", "big", { s: "quiz" })); } });
    if (step === "quiz") essais = 0;
    if (step === "info") finEtape("2");
  };

  // ===================== FIN DE LA DÉMO =====================
  SCREENS.findemo = () => '<div class="findemo"><span class="kicker">Version démo · 2 étapes sur 6</span><h2>Fin de la démo</h2>' +
    '<div class="fd-art" aria-hidden="true">' + Art.tivent("fete", "flotte") + '</div>' +
    '<p class="fd-lead">' + esc("Vous venez de vivre les deux premières étapes de la salle Lacroix.") + '</p><p class="fd-txt">' + esc("L'application complète accompagne toute la visite de l'étage, puis le grand départ de Ti-Vent depuis le Jardin de l'État.") + '</p>' +
    '<ul class="fd-suite">' + C.etapes.filter(e => !OUVERTES.includes(e.id)).map(e => '<li><span class="fd-i" aria-hidden="true">' + e.ico + '</span><span class="fd-t"><b>' + esc(e.titre.fr) + '</b><small>' + esc(e.apercu.fr) + '</small></span><span class="fd-badge">Appli complète</span></li>').join("") +
    '<li><span class="fd-i" aria-hidden="true">🎓</span><span class="fd-t"><b>' + esc(C.diplome.titre.fr) + '</b><small>' + esc(C.diplome.apercu.fr) + '</small></span><span class="fd-badge">Appli complète</span></li></ul></div>' +
    dock(btn("✨ Revoir le projet", "go", "big", { r: "projet" }) + '<div class="rang-btn">' + btn("🎓 Version classe", "go", "sec", { r: "fiche" }) + btn("🏛️ Pour le Muséum", "go", "sec", { r: "musee" }) + '</div>' + btn("📊 Tableau de bord (aperçu)", "go", "sec", { r: "stats" }) + btn("🔁 Recommencer", "recommencer", "sec"), "flow");
  AFTER.findemo = () => { Store.Stats.fin(); if (!navigator.userActivation || navigator.userActivation.hasBeenActive) Audio2.Sfx.fanfare(); fete(); };

  // ===================== CARNET =====================
  SCREENS.carnet = () => {
    const f = Store.faits(), cases = [["1", Art.solitaire(""), C.st1.planche], ["2", Art.dodo(""), C.st2.planche]];
    return flecheRetour("hub") + '<span class="kicker">' + esc(T("Mon carnet de naturaliste", "My naturalist's notebook")) + '</span><h2>' + esc(T("Les planches", "The plates")) + '</h2><div class="carnet">' +
      C.etapes.map(E => {
        const c = cases.find(x => x[0] === E.id), ok = c && f[E.id];
        return '<div class="case ' + (ok ? "ok" : "") + '">' + (ok ? c[1] + '<b>' + esc(LF(c[2])) + '</b><i>' + esc(c[2].latin) + '</i>' : '<span class="case-q">' + (COMPLET || OUVERTES.includes(E.id) ? "?" : Art.ICO.cadenas) + '</span><b>' + esc(L(E.titre)) + '</b><small>' + esc(T("Étape", "Stage")) + " " + (E.id === "jardin" ? "★" : E.id) + '</small>') + '</div>';
      }).join("") + '</div>' + dock(btn("🗺️ " + esc(T("Voir le parcours", "See the trail")), "hub", "big"));
  };

  // ===================== DIPLÔME (verrouillé dans la démo) =====================
  SCREENS.diplome = () => '<h2>' + esc(L(C.diplome.titre)) + '</h2><div class="diplome-l"><svg viewBox="0 0 400 280" class="diplome-svg"><rect x="6" y="6" width="388" height="268" rx="8" fill="#f5ecd7" stroke="#8a6f45" stroke-width="3"/><text x="200" y="60" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="#2a2119">Jeune naturaliste du Muséum</text><text x="200" y="140" text-anchor="middle" font-family="Georgia,serif" font-size="26" fill="#2a2119">' + esc(Store.get("nom") || "…") + '</text></svg></div>' + dock(btn("🖨️ Imprimer", "print", "big"));

  // ===================== FICHE ENSEIGNANT (imprimable) =====================
  SCREENS.fiche = () => flecheRetour("projet") + '<article class="doc fiche"><p class="arelire">À relire par l\'équipe du Muséum · proposition</p><span class="kicker">Version classe · cycles 2 et 3</span><h2>Fiche enseignant · « Sur la piste des animaux disparus »</h2>' +
    '<p>' + esc("Une enquête sur tablette ou téléphone au premier étage du Muséum d'histoire naturelle (Saint-Denis), de vitrine en vitrine, avec un final au Jardin de l'État. Durée visée : 45 à 60 min pour l'application complète (à mesurer sur place).") + '</p>' +
    '<h3>Objectifs</h3><ul><li>Observer de vrais spécimens et squelettes, et en tirer des indices.</li><li>Distinguer un récit, une image et une preuve matérielle (les os).</li><li>Classer des animaux selon leurs attributs ; chercher « qui est plus proche de qui ».</li><li>Situer des disparitions dans le temps et comprendre le rôle des activités humaines.</li><li>Repartir avec des gestes concrets pour la faune vivante de La Réunion.</li></ul>' +
    '<h3>Liens avec les programmes (BO n° 24 du 11 juin 2026)</h3><ul>' +
    '<li><b>Cycle 2</b> · « Les êtres vivants dans leur environnement » : unité et diversité du vivant (CP), régimes alimentaires des animaux (CE1), fiches d\'identité d\'êtres vivants, aile d\'oiseau et locomotion, effets des activités humaines sur la biodiversité (CE2). <span class="src">[M78]</span></li>' +
    '<li><b>Cycle 3</b> · CM1 « Unité et diversité du vivant » : classification en groupes emboîtés à partir de 4 à 6 espèces, liens de parenté ; « Biodiversité actuelle et passée ». CM2 : biodiversité passée, fossiles, extinctions. Le programme invite aussi à « distinguer les savoirs scientifiques – qui reposent sur des faits éprouvés – des croyances ou de la simple opinion » : c\'est le duel « légende ou science » de l\'étape 1. <span class="src">[M79, M84]</span></li>' +
    '<li><b>Calendrier</b> : en vigueur en CP et CM1 dès 2026-2027, en CE1, CE2, CM2 et 6e en 2027-2028. <span class="src">[M77]</span></li>' +
    '<li>Textes : <a href="https://www.education.gouv.fr/bo/2026/Hebdo24/MENE2611650A">BO n° 24 du 11/06/2026</a> · <a href="https://eduscol.education.gouv.fr/4356/enseigner-au-cycle-3">éduscol · Enseigner au cycle 3</a>. Intitulés exacts à vérifier avec l\'équipe.</li></ul>' +
    '<h3>Avant la venue (en classe, 30 min)</h3><ul><li>Montrer une carte des Mascareignes : La Réunion, Maurice, Rodrigues.</li><li>Question de départ : « Comment sait-on à quoi ressemblait un animal disparu bien avant l\'invention de la photographie ? »</li><li>Former les groupes de 3 à 5 et répartir les rôles : lecteur, observateur, manipulateur, secrétaire.</li></ul>' +
    '<h3>Pendant la visite</h3><ul><li><b>Mode tablette de groupe</b> : une tablette par groupe (prêtée par l\'école ou fournie par le Muséum, à définir). L\'appli indique à chaque mission qui tient la tablette : chacun manipule à son tour.</li><li>À chaque étape, un encadré « Pour la classe » : notion, mots-clés, question à débattre.</li><li>Étape 1 : fouille, squelette, légende ou science. Étape 2 : carte des îles, frise du temps.</li></ul>' +
    '<h3>Après la venue</h3><ul><li>Construire en classe un arbre de parenté (groupes emboîtés) : ibis, pigeons, dodo, Solitaire de Rodrigues.</li><li>Réaliser la frise des disparitions et des arrivées humaines.</li><li>Projet « protéger la faune d\'aujourd\'hui » : pétrel de Barau, tuit-tuit, gecko vert de Manapany, papangue ; campagne « Nuits sans lumière » de la SEOR en avril. <span class="src">[M65-M71]</span></li></ul>' +
    '<h3>Point de vigilance : la fiction</h3><p>' + esc("Ti-Vent parle : c'est une convention de récit, annoncée aux élèves dès l'introduction. Un vrai pétrel communique par des cris. Tous les faits sur les espèces sont sourcés (SOURCES.md).") + '</p>' +
    '<h3>Corrigés</h3><ul><li>Étape 1 : les os retrouvés à La Réunion (grotte, fouilles de l\'ouest) ont permis d\'identifier le Solitaire comme un ibis : ibis décrit en 1987, rapproché du Solitaire en 1995 (Threskiornis solitarius). Le « dodo blanc » vient de tableaux de dodos blancs du XVIIe siècle, rattachés au Solitaire par des savants du XIXe siècle. <span class="src">[M41, M42]</span></li><li>Étape 2 : dodo → Maurice ; Solitaire, Huppe de Bourbon, tortue → La Réunion ; Solitaire de Rodrigues → Rodrigues. Cousin du dodo : le Solitaire de Rodrigues (pigeons). <span class="src">[M44, M81]</span></li></ul>' +
    '<p class="small dim">Accueil des scolaires : réservation auprès du service éducatif du Muséum ; pré-visite enseignants proposée par le Muséum (modalités à confirmer). <span class="src">[M29]</span></p></article>' +
    dock(btn("🖨️ Imprimer la fiche", "print", "big") + btn("← Retour au projet", "go", "sec", { r: "projet" }), "flow noprint");

  // ===================== POUR LE MUSÉUM =====================
  SCREENS.musee = () => flecheRetour("projet") + '<div class="doc musee"><span class="kicker">Pour le Muséum</span><h2>Ce que le Muséum y gagne</h2><ul class="gains">' +
    [["⏱️", "Des familles qui regardent les vitrines plus longtemps", "Chaque mission renvoie à un détail réel : couleur des ailes, forme du bec, cartel, squelette."],
    ["🎓", "Des scolaires préparés et prolongés en classe", "Avant / pendant / après, programmes de juin 2026, mode tablette de groupe."],
    ["🌙", "Un temps fort pour vos événements", "Nuit européenne des musées (samedi 22 mai 2027, date annoncée, à confirmer), vacances, Fête de la science."],
    ["🔬", "Une crédibilité scientifique intacte", "Chaque fait est sourcé ; vos scientifiques relisent et corrigent tout avant diffusion."],
    ["✏️", "Des contenus modifiables par votre équipe", "Textes, ordre des vitrines, questions : un fichier de contenus simple à mettre à jour."],
    ["📊", "Des statistiques anonymes", "Départs, étapes terminées, réponses justes, langues, publics : de quoi piloter la médiation."],
    ["🗣️", "Trois langues, voix enregistrées", "Français, kréol, anglais : une visite accueillante pour tous."],
    ["🌿", "Un lien direct avec la faune vivante", "Le final au Jardin de l'État relie les collections aux espèces protégées d'aujourd'hui."]]
      .map(g => '<li><span aria-hidden="true">' + g[0] + '</span><div><b>' + esc(g[1]) + '</b><small>' + esc(g[2]) + '</small></div></li>').join("") + '</ul>' +
    '<section class="card"><h3>Ancré dans votre histoire</h3><ul class="ancre">' + [
      ["🏛️", "Le bâtiment de 1834, Muséum depuis 1855 : le premier musée créé à La Réunion, labellisé musée de France et rattaché au Département.", "M1 · M3 · M5 · M8"],
      ["🦴", "Le squelette de dodo venu de l'île Maurice et les reconstitutions de la salle Lacroix deviennent les « indices » des étapes 1 et 2.", "M16"],
      ["🎞️", "En 2006, le Muséum et l'ILOI ont fait revivre le Solitaire en 3D d'après son anatomie : une suite naturelle à l'étape 1 (à confirmer avec vous).", "M86"],
      ["📜", "Le carnet de « planches » fait écho aux planches de Buffon de votre bibliothèque et à Auguste Lantz, conservateur de 1864 à 1893.", "M19 · M87"],
      ["🧰", "L'aventure prolonge vos actions : Vacances au Muséum (6-12 ans), Coulisses du Muséum, ateliers des Journées du patrimoine (taxidermie, « Histoires sous verre »).", "M27 · M28 · M88"]
    ].map(a => '<li><span aria-hidden="true">' + a[0] + '</span><p>' + esc(a[1]) + ' <span class="src">[' + a[2] + ']</span></p></li>').join("") + '</ul></section>' +
    '<section class="card"><h3>À co-écrire ensemble</h3><p>' + esc("L'ordre réel des vitrines, les noms des salles, le contenu des mezzanines, les textes et les questions : tout se construit avec votre équipe, en atelier.") + '</p></section>' +
    '<div class="pj-acces">' + btn("📊 Aperçu du tableau de bord", "go", "pj-sec", { r: "stats" }) + btn("🔳 QR code de départ", "go", "pj-sec", { r: "qr" }) + '</div></div>' +
    dock(btn("▶ Démarrer la démo", "go", "big", { r: "accueil" }) + btn("← Retour au projet", "go", "sec", { r: "projet" }), "flow");

  // ===================== QR CODE DE DÉPART =====================
  function baseURL() { return Store.get("baseqr") || (location.origin + location.pathname); }
  SCREENS.qr = () => {
    const u = baseURL();
    return flecheRetour("musee") + '<div class="doc qr"><span class="kicker">Pour l\'équipe · à imprimer</span><h2>Le QR code de départ</h2><p>' + esc("Un seul QR code, à l'accueil ou au pied de l'escalier : il ouvre l'aventure dans le navigateur, puis l'appli guide de vitrine en vitrine.") + '</p>' +
      '<div class="qr-carte"><div class="qr-img">' + QR.svg(u + "?station=accueil", { taille: 240 }) + '</div><b>' + esc(C.titre.fr) + '</b><small>' + esc("Scanne avec l'appareil photo du téléphone") + '</small><code>' + esc(u + "?station=accueil") + '</code></div>' +
      '<label class="small">Adresse du site (modifiable) <input id="qr-base" value="' + esc(u) + '"></label>' + btn("Mettre à jour", "qrbase", "sec mini") + '</div>' +
      dock(btn("🖨️ Imprimer", "print", "big"), "noprint");
  };

  // ===================== TABLEAU DE BORD =====================
  SCREENS.stats = () => (window.Stats ? Stats.ecran({ esc, flecheRetour, btn }) : "");

  // ===================== modales =====================
  function closeSheets() { document.querySelectorAll(".sheet").forEach(s => s.remove()); }
  function fermerFeuille() { const h = H(); if (h && h.sh) history.back(); else closeSheets(); }
  function sheet(label, html) {
    closeSheets();
    const s = document.createElement("div"); s.className = "sheet"; s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true"); s.setAttribute("aria-label", label);
    s.innerHTML = '<div class="sheet-fond" data-act="fermer"></div><div class="sheet-in">' + html + btn(T("Fermer", "Close"), "fermer", "sec") + '</div>';
    document.body.appendChild(s);
    const h = H(); if (h && !h.sh) { try { history.pushState(Object.assign({}, h, { i: h.i + 1, sh: 1, p: [h.n, h.s] }), "", location.href); } catch (e) { } }
    const f = s.querySelector("button"); if (f) f.focus();
  }
  const seg = (act, cur, items) => '<div class="seg">' + items.map(i => '<button class="btn mini" data-act="' + act + '" data-v="' + i[0] + '" aria-pressed="' + (String(cur) === String(i[0])) + '">' + i[1] + '</button>').join("") + '</div>';
  function reglages() {
    sheet("Réglages", '<h3>' + esc(T("Réglages", "Settings")) + '</h3>' +
      '<p class="small dim">' + esc(T("Langue des bulles", "Bubble language")) + '</p>' + seg("lang", lang(), [["fr", "Français"], ["kr", "Kréol"], ["en", "English"]]) +
      '<p class="small dim">' + esc(T("Affichage", "Display")) + '</p>' + seg("th", Store.get("theme"), [["salle", T("Salle (sombre)", "Gallery (dark)")], ["clair", T("Papier (clair)", "Paper (light)")]]) +
      '<p class="small dim">' + esc(T("Taille du texte", "Text size")) + '</p>' + seg("taille", Store.get("taille"), [[1, "A"], [2, "A+"], [3, "A++"]]) +
      '<p class="small dim">' + esc(T("Sons et vibrations", "Sound and vibration")) + '</p>' + seg("son", Store.get("son") ? 1 : 0, [[1, T("Activés", "On")], [0, T("En silence", "Silent")]]) +
      '<p class="small dim">' + esc(T("Public", "Audience")) + '</p>' + seg("pub", pub(), [["famille", L(C.publics.famille)], ["classe", L(C.publics.classe)]]) +
      '<div class="rang-btn">' + btn("📒 " + esc(T("Carnet", "Notebook")), "go", "sec", { r: "carnet" }) + btn("ℹ️ " + esc(T("Crédits", "Credits")), "credits", "sec") + '</div>' +
      btn("🔁 " + esc(T("Recommencer l'aventure", "Restart the adventure")), "reset", "sec"));
  }
  function equipe() {
    const eq = Store.get("equipe") || [];
    sheet("Groupe", '<h3>' + esc(T("Le groupe de la tablette", "The tablet group")) + '</h3><p class="small dim">' + esc(T("2 à 5 prénoms : l'appli dira qui tient la tablette à chaque mission.", "2 to 5 names: the app says who holds the tablet at each mission.")) + '</p>' +
      [0, 1, 2, 3, 4].map(i => '<input class="eqn" maxlength="14" aria-label="Prénom ' + (i + 1) + '" placeholder="' + esc(T("Prénom", "Name")) + " " + (i + 1) + '" value="' + esc(eq[i] || "") + '">').join("") + btn(T("Enregistrer", "Save"), "eqok", "big"));
  }
  function credits() {
    sheet("Crédits", '<h3>Crédits</h3><p>' + esc("Prototype réalisé par Atma Digital (Aurélie et Jonathan Bou) pour le Muséum d'histoire naturelle de La Réunion. Illustrations et sons créés pour l'occasion ; silhouettes d'espèces d'après les descriptions publiées, à valider par l'équipe scientifique.") + '</p><p>' + esc("Ti-Vent est un personnage de fiction. Les faits affichés sont sourcés dans SOURCES.md. Le kréol est une proposition à faire relire.") + '</p>');
  }

  // ===================== mode démo (?demo=1) =====================
  const DEMO = [["projet"], ["accueil"], ["intro", "0"], ["intro", "3"], ["hub"], ["st1", "brief"], ["st1", "fouille"], ["st1", "squelette"], ["st1", "legende"], ["st1", "quiz"], ["st1", "info"], ["marche", "2"], ["st2", "brief"], ["st2", "carte"], ["st2", "temps"], ["st2", "quiz"], ["st2", "info"], ["findemo"], ["fiche"], ["musee"], ["stats"]];
  const NOMS_DEMO = { projet: "Le projet", accueil: "Accueil", intro: "Histoire", hub: "Le parcours", st1: "Étape 1", st2: "Étape 2", marche: "Rejoins la vitrine", findemo: "Fin de la démo", fiche: "Version classe", musee: "Pour le Muséum", stats: "Tableau de bord" };
  function updatePresbar() {
    let b = document.getElementById("presbar");
    document.body.classList.toggle("demo", demoMode);
    if (!demoMode) { if (b) b.remove(); return; }
    // compteur synchronisé quand on joue à la main pendant le diaporama
    const k = DEMO.findIndex(x => x[0] === route.n && (x[1] || null) === route.step); if (k >= 0) demoIdx = k;
    if (!b) { b = document.createElement("div"); b.id = "presbar"; b.className = "presbar noprint"; document.body.appendChild(b); }
    const fin = demoIdx >= DEMO.length - 1;
    b.innerHTML = '<button data-act="dprev" aria-label="Écran précédent" ' + (demoIdx <= 0 ? "disabled" : "") + '>◀</button><span>' + (demoIdx + 1) + ' / ' + DEMO.length + ' · ' + esc(NOMS_DEMO[route.n] || route.n) + (route.step && /^st/.test(route.n) ? " · " + esc(route.step) : "") + '</span><button data-act="dnext" aria-label="Écran suivant" ' + (fin ? "disabled" : "") + '>▶</button>';
  }
  function demoGo(d) { demoIdx = Math.max(0, Math.min(DEMO.length - 1, demoIdx + d)); const x = DEMO[demoIdx]; go(x[0], x[1] || null); }

  // ===================== actions =====================
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    const a = b.dataset.act; Audio2.Sfx.unlock();
    switch (a) {
      case "start": { Audio2.Sfx.page(); Store.Stats.depart(); const premiere = !Store.get("intro"); Store.set("intro", true); premiere ? go("intro", "0") : go("hub"); break; }
      case "accueil": go("accueil"); break;
      case "pub": Store.set("public", b.dataset.v); Audio2.Sfx.tap(); if (b.closest(".sheet")) { go(route.n, route.step, true, "replace"); reglages(); } else go(route.n, route.step, true, "replace"); break;
      case "lang": Store.set("lang", b.dataset.v); Audio2.Sfx.tap(); applyTheme(); if (b.closest(".bubble")) majBulles(); else if (b.closest(".sheet")) { if (!jeu) go(route.n, route.step, true, "replace"); else majBulles(); reglages(); } else go(route.n, route.step, true, "replace"); break;
      case "th": Store.set("theme", b.dataset.v); applyTheme(); reglages(); break;
      case "taille": Store.set("taille", +b.dataset.v); applyTheme(); reglages(); break;
      case "son": Store.set("son", b.dataset.v === "1"); reglages(); break;
      case "tablette": Store.set("tablette", !Store.get("tablette")); Audio2.Sfx.tap(); go("accueil", null, true, "replace"); break;
      case "voix": {
        const t = BULLES[b.dataset.bid]; if (!t) break;
        b.classList.add("joue"); setTimeout(() => b.classList.remove("joue"), 1600);
        Audio2.parle(b.dataset.id, lang(), L(t)).then(r => { if (r === "attente") toast(lang() === "kr" ? "Voix kréol : l'enregistrement de Jonathan arrive bientôt." : T("Voix : enregistrement à venir.", "Voice recording coming soon.")); });
        break;
      }
      case "intro": Audio2.Sfx.page(); go("intro", b.dataset.i); break;
      case "hub": go("hub"); break;
      case "station": Audio2.Sfx.page(); go("st" + b.dataset.id, "brief"); break;
      case "pas": { Audio2.Sfx.page(); const eq = Store.get("equipe") || []; if (tablette() && eq.length > 1 && b.dataset.s !== "info") Store.set("tour", (Store.get("tour") || 0) + 1); go(route.n, b.dataset.s); break; }
      case "go": { if (aPrecedent() && history.state.p && history.state.p[0] === b.dataset.r && !b.dataset.s) { history.back(); break; } go(b.dataset.r, b.dataset.s || null); break; }
      case "retour": Audio2.Sfx.tap(); if (aPrecedent()) history.back(); else go(b.dataset.r || "projet", null, false, "replace"); break;
      case "rep": repondre(+b.dataset.i); break;
      case "resoudre": if (jeu) jeu.solve(); break;
      case "habiller": if (jeu && jeu.habiller) { jeu.habiller(); b.disabled = true; setTimeout(() => montrerSuite(btn("🖼️ " + esc(T("Légende ou science ?", "Legend or science?")) + " ➜", "pas", "big", { s: "legende" })), 1700); } break;
      case "print": window.print(); break;
      case "equipe": equipe(); break;
      case "eqok": { const v = Array.from(document.querySelectorAll(".eqn")).map(i => i.value.trim()).filter(Boolean).slice(0, 5); Store.set("equipe", v); Store.set("tour", 0); fermerFeuille(); render(); toast(v.length > 1 ? T("Groupe de ", "Group of ") + v.length + " ✓" : T("Prénom enregistré ✓", "Name saved ✓")); break; }
      case "reset": if (confirm(T("Recommencer l'aventure depuis le début ?", "Restart from the beginning?"))) { Store.reset(); closeSheets(); go("accueil"); } break;
      case "recommencer": Store.reset(); go("accueil"); break;
      case "reglages": reglages(); break;
      case "fermer": fermerFeuille(); break;
      case "credits": credits(); break;
      case "installer": if (installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; majInstall(); }); } break;
      case "qrbase": { const v = document.getElementById("qr-base").value.trim(); if (v) { Store.set("baseqr", v); go("qr", null, true, "replace"); } break; }
      case "stexemple": if (window.Stats) { Stats.basculer(); go("stats", null, true, "replace"); } break;
      case "dprev": demoGo(-1); break;
      case "dnext": demoGo(1); break;
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { if (document.querySelector(".sheet")) fermerFeuille(); }
    if (demoMode && (e.key === "PageDown" || e.key === "ArrowRight" && e.altKey)) demoGo(1);
    if (demoMode && (e.key === "PageUp" || e.key === "ArrowLeft" && e.altKey)) demoGo(-1);
  });

  // ===================== démarrage =====================
  function init() {
    const q = new URLSearchParams(location.search);
    if (q.get("lang") && ["fr", "kr", "en"].includes(q.get("lang"))) Store.set("lang", q.get("lang"));
    if (q.get("public") && C.publics[q.get("public")]) Store.set("public", q.get("public"));
    Store.Stats.lancement();
    window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; majInstall(); });
    window.addEventListener("online", topbar); window.addEventListener("offline", topbar);
    if (q.get("demo") === "1") { demoMode = true; demoIdx = 0; Store.reset(); go("projet", null, false, "init"); return; }
    const h = H();
    if (h && h.n && !q.get("station")) return go(h.n, h.s, false, "init");
    const st = q.get("station"), et = q.get("etape");
    if (!st || st === "projet") return go("projet", null, false, "init");
    if (/^(1|2|3|4|5|jardin)$/.test(st)) return go("st" + st, et || "brief", false, "init");
    go(st, et, false, "init");
  }
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).then(() => setTimeout(topbar, 300)).catch(() => { });
    navigator.serviceWorker.addEventListener("controllerchange", topbar);
  }
  window.App = { go, route: () => Object.assign({}, route), demo: () => demoMode, jeu: () => jeu, VERROU, COMPLET };
  init();
})();
