/* ============================================================
   APP.JS — Navigation et écrans de « Ti-Komèt et le ciel du Sud »
   (prototype pour l'Observatoire des Makes).
   Écrans : projet (1er écran) · accueil · intro · hub (parcours) ·
   st1 (brief → axe → visee → quiz → info) · marche (« Rejoins le prochain espace ») ·
   st2 (brief → coupole → quiz → info) · findemo · fiche (version classe) ·
   observatoire (« Pour l'Observatoire ») · stats (tableau de bord) · qr (QR code de départ).
   VERSION DÉMO : tout passe par go() ; c'est là que les étapes verrouillées sont refusées.
   ============================================================ */
(function () {
  "use strict";
  const C = window.Content, $screen = document.getElementById("screen");
  const COMPLET = !!C.CONFIG.versionComplete;
  const JOUABLE = id => COMPLET || C.CONFIG.jouables.includes(+id);
  // écrans refusés en version démo (QR, liens, reprise de partie, diaporama, réglages…)
  const VERROU = n => !COMPLET && (/^st[3-9]$/.test(n) || ["soiree", "st6", "brevet", "fin"].includes(n));
  let route = { n: "projet", step: null }, jeu = null, demoMode = false, demoIdx = 0, installPrompt = null, t0Etape = {};
  let statsVue = "exemple", statsOrigine = "projet", cible2 = null;
  const BULLES = {};

  // ---------- outils ----------
  const typo = s => String(s).replace(/ ([!?;:»])/g, " $1").replace(/« /g, "« ");
  const esc = s => typo(String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
  const lang = () => Store.get("lang"), pub = () => Store.get("public"), en = () => lang() === "en";
  const L = o => (o && (o[lang()] || o.fr)) || "";                       // bulles : FR / KR / EN
  const LF = o => (o && (en() ? (o.en || o.fr) : o.fr)) || "";           // consignes : FR ou EN (le kréol est réservé aux bulles)
  const T = (fr, enT) => (en() ? enT : fr);
  const I = k => Art.ICO[k] || "";
  const nuit = () => pub() === "soiree";
  const reduit = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function pick(t) { const p = pub(); return t && t[p] && typeof t[p] === "object" && t[p].fr ? Object.assign({}, t, t[p], { _var: p }) : t; }

  // ---------- thème ----------
  // ciel (sombre) · jour (contraste fort, plein soleil) · rouge (soirée : vision nocturne)
  function themeJeu() {
    if (nuit()) return "rouge";
    const t = Store.get("theme"); if (t === "ciel" || t === "jour") return t;
    try { return Sky.sunAlt(new Date()) > 0 ? "jour" : "ciel"; } catch (e) { return "jour"; } // automatique : il fait jour aux Makes ?
  }
  function applyTheme() {
    const n = route.n, th = ["projet", "observatoire", "stats", "findemo"].includes(n) ? (nuit() && n === "findemo" ? "rouge" : "ciel") : n === "fiche" || n === "qr" ? "doc" : themeJeu();
    document.body.dataset.theme = th;
    document.documentElement.classList.toggle("nuit", th === "rouge" && !document.body.classList.contains("aim-full"));
    document.documentElement.dataset.taille = Store.get("taille");
    document.documentElement.lang = lang() === "kr" ? "rcf" : lang();
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = th === "rouge" ? "#000000" : th === "jour" || th === "doc" ? "#f4f6fb" : "#050a2c";
    Sky.setSim(nuit() && Sky.sunAlt(new Date()) > -6 ? 21 : "now"); // soirée jouée de jour (RDV, test) : ciel simulé de ce soir, 21 h
  }

  // ---------- briques ----------
  function bulle(id, t0, opts) {
    opts = opts || {}; const t = pick(t0); BULLES[id] = t;
    const lb = (v, l) => '<button class="lg" data-act="lang" data-v="' + v + '" aria-pressed="' + (lang() === v) + '" ' + (t[v] ? "" : "disabled") + ' title="' + l + '">' + v.toUpperCase() + '</button>';
    return '<div class="guide' + (opts.compact ? " compact" : "") + '">' + Art.komet(t.expr || "content", "av") +
      '<div class="bubble" data-bid="' + id + '" role="group" aria-label="Ti-Komèt dit"><div class="who">Ti-Komèt <span>' + esc(L(C.guide.sous)) + '</span></div>' +
      '<p class="txt" lang="' + (lang() === "kr" ? "rcf" : lang()) + '">' + esc(L(t)) + '</p>' +
      '<p class="kr-note" ' + (lang() === "kr" && t.kr ? "" : "hidden") + '>Kréol : proposition à faire relire</p>' +
      '<div class="outils"><div class="langs" role="group" aria-label="Langue">' + lb("fr", "Français") + lb("kr", "Kréol") + lb("en", "English") + '</div>' +
      '<button class="ecoute" data-act="voix" data-id="' + id + (t._var ? "-" + t._var : "") + '" data-bid="' + id + '" aria-label="' + esc(L(C.UI.ecouter)) + '">' + I("son") + '</button></div></div></div>';
  }
  function majBulles() {
    document.querySelectorAll(".bubble[data-bid]").forEach(b => {
      const t = BULLES[b.dataset.bid]; if (!t) return;
      const p = b.querySelector(".txt"); p.textContent = typo(L(t)); p.lang = lang() === "kr" ? "rcf" : lang();
      b.querySelector(".kr-note").hidden = !(lang() === "kr" && t.kr);
      b.querySelectorAll(".lg").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === lang()));
    });
  }
  const dock = (h, cls) => '<div class="dock ' + (cls || "") + '">' + h + '</div>';
  function btn(label, act, cls, data) {
    let d = ""; if (data) Object.keys(data).forEach(k => { d += " data-" + k + '="' + esc(data[k]) + '"'; });
    return '<button class="btn ' + (cls || "") + '" data-act="' + act + '"' + d + '>' + label + '</button>';
  }
  const src = code => code ? '<p class="src">' + esc(L(C.UI.source)) + ' : ' + code + ' · SOURCES.md</p>' : "";
  function toast(t, ms) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), ms || 3200); return e; }
  function fete() { // étoiles de fête (passent en rouge en soirée : filtre global)
    if (reduit()) return;
    const d = document.createElement("div"); d.className = "fete"; d.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 22; i++) { const e = document.createElement("i"); e.style.left = Math.random() * 100 + "%"; e.style.animationDuration = (2.2 + Math.random() * 2) + "s"; e.style.animationDelay = Math.random() * .5 + "s"; const s = 10 + Math.random() * 14; e.style.width = e.style.height = s + "px"; e.className = ["a", "b", "c"][i % 3]; d.appendChild(e); }
    document.body.appendChild(d); setTimeout(() => d.remove(), 4800);
  }

  // ---------- barre du haut ----------
  function topbar() {
    const tb = document.getElementById("topbar"), cache = ["projet", "observatoire", "stats", "fiche", "qr"].includes(route.n);
    tb.hidden = cache; if (cache) return;
    const f = Store.faits(); let pips = ""; for (let i = 1; i <= 6; i++) pips += '<span class="pip ' + (f[i] ? "on" : "") + '">' + I(f[i] ? "etoile" : "etoileVide") + '</span>';
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller, off = navigator.onLine === false;
    tb.innerHTML = '<button class="brand" data-act="accueil" aria-label="Retour à l\'accueil"><span class="brand-ico">' + Art.komet("content", "mini") + '</span><span class="brand-t"><b>Ti-Komèt</b><small class="reseau ' + (sw || off ? "ok" : "") + '">' + esc(off ? T("hors ligne · tout fonctionne", "offline · all good") : sw ? T("fonctionne sans réseau", "works offline") : T("prototype · Makes", "prototype · Les Makes")) + '</small></span></button>' +
      '<div class="pips" role="img" aria-label="' + Store.count() + ' repère(s) sur 6">' + pips + '</div>' +
      '<button class="iconbtn" data-act="reglages" aria-label="Réglages : public, langue, affichage">' + I("reglages") + '</button>';
  }

  // ---------- historique : bouton / geste RETOUR du téléphone (repris de Kélonia) ----------
  // state = { tk, n, s, i (profondeur), p ([écran, étape] d'en dessous), f (sentinelle « appuyez encore »), sh (modale), o (origine du tableau de bord) }
  const H = () => (history.state && history.state.tk ? history.state : null);
  const aPrecedent = () => { const h = H(); return !!h && h.i > 1; };
  const etat = x => Object.assign({ tk: 1, n: route.n, s: route.step, o: route.n === "stats" ? statsOrigine : undefined }, x);
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
    } catch (e) { }
  }
  function retourHistorique(e) {
    const s = e.state; if (!s || !s.tk) return;
    if (s.f) {
      if (Date.now() < quitterAvant) { quitterAvant = 0; history.back(); return; }
      closeSheets();
      if (s.n !== route.n || (s.s || null) !== route.step) { if (s.o) statsOrigine = s.o; go(s.n, s.s, false, "pop"); }
      try { history.pushState(Object.assign({}, s, { f: undefined, i: 1, p: [s.n, s.s] }), "", location.href); } catch (er) { }
      quitterAvant = Date.now() + 2000;
      document.querySelectorAll(".toast.quitter").forEach(t => t.remove());
      toast(T("Appuyez encore sur retour pour quitter", "Press back again to exit"), 2000).classList.add("quitter");
      return;
    }
    if (document.querySelector(".sheet")) { closeSheets(); if (s.n === route.n && (s.s || null) === route.step) return; }
    if (s.n === route.n && (s.s || null) === route.step) return;
    if (s.o) statsOrigine = s.o;
    go(s.n, s.s, false, "pop");
  }
  window.addEventListener("popstate", retourHistorique);
  document.addEventListener("click", armer, true);
  document.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") armer(); }, true);
  const flecheRetour = parent => '<div class="retour-haut-l noprint"><button class="retour-haut" data-act="retour" data-r="' + parent + '" aria-label="Retour">' + I("retour") + '</button></div>';

  // ---------- routeur ----------
  function go(n, step, noScroll, mode) {
    if (jeu) { try { jeu.destroy(); } catch (e) { } jeu = null; }
    Audio2.stopVoix(); Audio2.stopPing(); closeSheets(); document.body.classList.remove("aim-full");
    let refus = false;
    if (VERROU(n)) { refus = true; n = "hub"; step = null; }
    if (n === "marche" && !JOUABLE(step)) { n = Store.faits()[2] ? "findemo" : "hub"; step = null; }
    if (n === "stats" && route.n !== "stats" && ORIGINES[route.n] && mode !== "pop" && mode !== "init") statsOrigine = route.n;
    route = { n, step: step == null ? null : String(step) };
    const u = new URL(location.href); u.searchParams.delete("station");
    if (n !== "projet") u.searchParams.set("station", /^st\d$/.test(n) ? n.slice(2) : n);
    ecrireHistorique(u, mode);
    applyTheme(); render();
    if (!noScroll) window.scrollTo(0, 0);
    const h = $screen.querySelector("h1,h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    updatePresbar();
    if (refus) toast(T("Cette étape arrive dans l'application complète", "This stage comes in the full app"));
  }
  function render() {
    topbar();
    const fn = SCREENS[route.n]; if (!fn) return go("projet", null, false, "replace");
    $screen.classList.remove("entre"); void $screen.offsetWidth; $screen.classList.add("entre");
    $screen.innerHTML = fn(route.step);
    document.body.dataset.ecran = route.n + (route.step ? "-" + route.step : "");
    const a = AFTER[route.n]; if (a) a(route.step);
  }
  const SCREENS = {}, AFTER = {};

  // ===================== LE PROJET (1er écran) =====================
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const iOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  function aideInstall() {
    if (standalone()) return "";
    const txt = iOS() ? 'Sur iPhone : touchez <b>Partager</b> puis <b>« Sur l\'écran d\'accueil »</b>.'
      : installPrompt ? "Une icône Ti-Komèt s'ajoute à l'écran d'accueil, comme une application."
        : 'Android : menu <b>⋮</b> du navigateur → <b>« Installer l\'application »</b>.<br>iPhone : <b>Partager</b> → <b>« Sur l\'écran d\'accueil »</b>.';
    return '<section class="pj-install" id="pj-install"><span class="pj-ii">' + I("installer") + '</span><div><h3>Installer sur l\'écran d\'accueil</h3><p>' + typo(txt) + '</p>' +
      (installPrompt && !iOS() ? btn("Installer l'application", "installer", "mini") : "") + '</div></section>';
  }
  function majInstall() { const b = document.getElementById("pj-install"); if (b) b.outerHTML = aideInstall(); }
  SCREENS.projet = () => {
    const cartes = [
      ["carte", "5 étapes pour toute la visite + un temps de soirée", "Jaï Sing, coupoles, Newton, Ptolémée, Einstein, puis la terrasse de nuit. Aujourd'hui, vous en jouez deux.", "large"],
      ["famille", "3 publics", "Familles · classes · soirées et vacances"],
      ["langue", "Français, kréol, anglais", "Voix enregistrées, texte toujours affiché"],
      ["qr", "Un seul QR code", "Rien à télécharger ; l'appli guide d'espace en espace"],
      ["horsligne", "Pensée pour le hors connexion", "Une fois ouverte, elle continue sans réseau (à vérifier sur place, à 1 000 m)"],
      ["oeilRouge", "Mode nuit rouge", "Tout l'écran en rouge pour préserver la vision de nuit", "rouge"],
      ["crayon", "Contenus relus par l'Observatoire", "Et modifiables par votre équipe"],
      ["stats", "Statistiques anonymes", "Fréquentation, étapes terminées, ce que les visiteurs retiennent", "stats"]
    ];
    const carte = x => x[3] === "stats" ? '<li class="pj-lien large"><button data-act="go" data-r="stats"><span class="pj-i">' + I(x[0]) + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small><span class="pj-voir">Voir l\'aperçu ›</span></button></li>'
      : x[3] === "rouge" ? '<li class="pj-lien"><button data-act="essairouge"><span class="pj-i">' + I(x[0]) + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small><span class="pj-voir">Essayer 5 secondes ›</span></button></li>'
        : '<li class="' + (x[3] || "") + '"><span class="pj-i">' + I(x[0]) + '</span><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></li>';
    return (aPrecedent() ? flecheRetour("accueil") : "") + '<div class="projet">' +
      '<div class="pj-hero">' + Art.ciel({ court: true }) + '<div class="pj-tete"><span class="pj-lieu">Observatoire des Makes · Saint-Louis</span><span class="pj-badge">Prototype · proposition à co-écrire avec votre équipe pédagogique</span></div></div>' +
      '<h1>Ti-Komèt <span>et le ciel du Sud</span></h1><p class="pj-sous">Une aventure sur téléphone pour l\'Observatoire des Makes</p>' +
      '<p class="pj-idee">' + typo("Une petite comète s'est perdue au-dessus des Makes : les enfants l'aident à <b>se repérer dans le ciel austral</b>, espace après espace, pendant la visite. À chaque étape, <b>une aventure digitale</b> liée à ce qu'on voit sur place et aux programmes de sciences.") + '</p>' +
      '<section class="pj-classe"><div class="pj-c-t"><span class="pj-c-i">' + I("ecole") + '</span><div><h3>Version classe</h3><span class="pj-c-niv">Cycles 3 et 4 · avant, pendant, après</span></div></div>' +
      '<p>' + esc("Préparer le séjour en classe, jouer sur place, prolonger au retour. Liens possibles avec vos ateliers Système solaire, Mythologie et histoire du ciel, LASCAR, et avec les programmes de sciences (mouvement de la Terre, système solaire, ombres d'un gnomon).") + '</p>' + btn("Lire la proposition " + I("suite"), "go", "pj-btn", { r: "fiche" }) + '</section>' +
      '<h2 class="pj-h">Ce que l\'application complète proposera</h2><ul class="pj-grille">' + cartes.map(carte).join("") + '</ul>' +
      '<div class="pj-acces">' + btn(I("coupole") + " Pour l'Observatoire", "go", "sec", { r: "observatoire" }) + btn(I("lune") + " Essayer en soirée", "saut", "sec", { n: "accueil", p: "soiree" }) + '</div>' +
      aideInstall() +
      '<p class="pj-fiction">' + esc("Ti-Komèt est un personnage inventé. L'idée vient d'une vraie histoire : l'Observatoire des Makes est né au passage de la comète de Halley, en 1986.") + '</p></div>' +
      dock(btn(I("play") + " Démarrer la démo", "go", "big", { r: "accueil" }));
  };

  // ===================== ACCUEIL =====================
  SCREENS.accueil = () => {
    const p = pub(), n = Store.count();
    const pubBtn = k => '<button class="pubbtn" data-act="pub" data-v="' + k + '" aria-pressed="' + (p === k) + '"><span class="pubico">' + I(C.publics[k].ico) + '</span><span>' + esc(L(C.publics[k])) + '</span></button>';
    const lgBtn = (v, l) => '<button class="btn mini" data-act="lang" data-v="' + v + '" aria-pressed="' + (lang() === v) + '">' + l + '</button>';
    return '<div class="hero">' + Art.ciel({ expr: nuit() ? "content" : "wow" }) + '<div class="hero-titre"><span class="kicker">' + esc(L(C.accueil.kicker)) + '</span><h1>' + esc(L(C.accueil.titre)) + '</h1></div></div>' +
      '<p class="accroche">' + esc(L(C.accueil.sous)) + '</p>' +
      '<ul class="promesses">' + C.accueil.promesses.map(x => '<li><b>' + x.n + '</b>' + esc(LF(x)) + '</li>').join("") + '</ul>' +
      '<section class="card"><h3>' + esc(T("Qui joue ?", "Who's playing?")) + '</h3><div class="pubs" role="group" aria-label="Public">' + pubBtn("famille") + pubBtn("classe") + pubBtn("soiree") + '</div>' +
      '<p class="small dim pubdesc">' + esc(LF(C.publics[p].desc)) + '</p></section>' +
      '<section class="card ligne"><h3>' + esc(T("Langue des bulles et des voix", "Language")) + '</h3><div class="seg">' + lgBtn("fr", "Français") + lgBtn("kr", "Kréol") + lgBtn("en", "English") + '</div></section>' +
      '<p class="small dim center">' + esc(T("≈ 10 min pour la démo (2 étapes) · aucune donnée envoyée", "≈ 10 min for the demo (2 stages) · no data sent")) + '</p>' +
      (COMPLET ? "" : '<p class="center"><button class="lien" data-act="go" data-r="projet">← ' + esc(T("Présentation du projet", "About the project")) + '</button></p>') +
      dock(btn(n > 0 ? I("play") + " " + esc(L(C.UI.continuer)) + " (" + n + "/6)" : I("play") + " " + esc(L(C.UI.commencer)), "start", "big"));
  };
  AFTER.accueil = () => { if (navigator.userActivation && navigator.userActivation.hasBeenActive) Audio2.Sfx.comete(); };

  // ===================== INTRO =====================
  SCREENS.intro = step => {
    const i = Math.max(0, Math.min(C.intro.length - 1, +step || 0)), t = C.intro[i], last = i === C.intro.length - 1;
    return '<h2 class="sr-only">' + esc(T("L'histoire", "The story")) + '</h2><div class="intro-scene"><div class="intro-art">' + Art.ciel({ court: true, komet: false }) + Art.komet(pick(t).expr, "grand") + '</div>' + bulle("intro" + i, t) + src(t.src) + '</div>' +
      '<div class="dots" aria-label="' + (i + 1) + '/' + C.intro.length + '">' + C.intro.map((x, k) => '<i class="' + (k === i ? "on" : "") + '"></i>').join("") + '</div>' +
      dock(last ? btn(I("carte") + " " + esc(L(C.UI.parcours)), "hub", "big") : btn(esc(L(C.UI.suite)) + " " + I("suite"), "intro", "big", { i: i + 1 }));
  };

  // ===================== HUB : le parcours =====================
  SCREENS.hub = () => {
    const f = Store.faits(), n = Store.count();
    const ligne = (S, k) => {
      if (!JOUABLE(S.id)) return '<li class="st verrou' + (S.soir ? " soir" : "") + '"><div class="station" aria-disabled="true"><span class="num">' + I("cadenas") + '<span class="sr-only">' + T("Verrouillé", "Locked") + '</span></span><span class="st-t"><small class="st-lieu">' + esc(LF(S.lieu)) + '</small><b>' + esc(LF(S.titre)) + '</b><small>' + esc(LF(S.court)) + '</small><span class="badge-complet">' + esc(T("Application complète", "Full app")) + '</span></span></div></li>';
      return '<li class="st ' + (f[S.id] ? "fait" : "") + '"><button class="station" data-act="station" data-id="' + S.id + '"><span class="num">' + (f[S.id] ? I("check") : S.id) + '</span><span class="st-t"><small class="st-lieu">' + esc(LF(S.lieu)) + '</small><b>' + esc(L(S.titre)) + '</b><small>' + esc(LF(S.court)) + '</small></span><span class="go">' + (f[S.id] ? I("etoile") : I("suite")) + '</span></button></li>';
    };
    const rows = C.stations.map((S, k) => ligne(S, k) + '<li class="sentier" aria-hidden="true"></li>').join("") +
      '<li class="st verrou brevet"><div class="station" aria-disabled="true"><span class="num">' + I("brevet") + '</span><span class="st-t"><small class="st-lieu">' + esc(T("Fin de l'aventure", "End of the adventure")) + '</small><b>' + esc(LF(C.brevet.titre)) + '</b><small>' + esc(LF(C.brevet.court)) + '</small><span class="badge-complet">' + esc(T("Application complète", "Full app")) + '</span></span></div></li>';
    const t = !COMPLET ? (f[2] ? { expr: "fete", fr: "Deux repères sur ma carte ! La suite du parcours arrive dans l'application complète.", kr: "Dé rèpèr si mon kart ! La swit i ariv dan l'aplikasyon konplèt.", en: "Two landmarks on my map! The rest of the route comes in the full app." }
      : f[1] ? { expr: "content", fr: "Bravo ! Direction les coupoles pour l'étape 2.", kr: "Bravo ! Alé, bann koupol pou l'étap 2.", en: "Well done! Off to the domes for stage 2." }
        : { expr: "clin", fr: "Pour cette démo, les étapes 1 et 2 sont ouvertes. Touche l'étape 1 pour commencer !", kr: "Pou la démo, l'étap 1 ék 2 lé ouvèr. Tous l'étap 1 pou komansé !", en: "For this demo, stages 1 and 2 are open. Tap stage 1 to begin!" })
      : { expr: "clin", fr: "Choisis l'étape où tu es.", en: "Pick the stage where you are." };
    return '<span class="kicker">' + esc(T("La visite de jour, puis la soirée", "The day visit, then the evening")) + '</span><h2>' + esc(T("Le parcours de Ti-Komèt", "Ti-Komèt's route")) + '</h2>' +
      '<div class="progress" role="img" aria-label="' + n + ' repères sur 6"><i style="width:' + (n / 6 * 100).toFixed(1) + '%"></i><span>' + n + ' / 6 ' + esc(T("repères", "landmarks")) + '</span></div>' +
      bulle("hub", t, { compact: true }) + '<ul class="stations">' + rows + '</ul>' +
      '<p class="note small">' + I("qr") + ' ' + esc(T("Sur place : un seul QR code à l'accueil, puis l'appli guide d'espace en espace. Ici, touche simplement l'étape.", "On site: one QR code at reception, then the app guides you. Here, just tap the stage.")) + '</p>' +
      (!COMPLET && f[2] ? dock(btn(esc(T("Fin de la démo", "End of the demo")) + " " + I("suite"), "go", "big", { r: "findemo" })) : !f[1] ? dock(btn(I("play") + " " + esc(T("Étape 1 : l'axe du Monde", "Stage 1: the World's Axis")), "station", "big", { id: 1 })) : !f[2] ? dock(btn(I("play") + " " + esc(T("Rejoindre l'étape 2", "Go to stage 2")), "go", "big", { r: "marche", s: 2 })) : "");
  };

  // ===================== ÉTAPES : briques communes =====================
  const ST = id => C.stations[id - 1];
  const enTete = S => '<span class="kicker">' + esc(L(C.UI.etape)) + " " + S.id + " " + esc(L(C.UI.sur)) + ' 5 · ' + esc(LF(S.lieu)) + '</span><h2>' + esc(L(S.titre)) + '</h2>';
  function classeBox(S) {
    if (pub() !== "classe") return ""; const c = S.classe;
    return '<section class="classe-box"><h3>' + I("ecole") + ' Pour la classe</h3><p><b>Notion :</b> ' + esc(c.notion) + '</p><p class="mots">' + c.mots.map(m => '<span>' + esc(m) + '</span>').join("") + '</p><p><b>À débattre :</b> ' + esc(c.q) + '</p></section>';
  }
  const surPlace = S => '<section class="surplace"><span class="sp-i">' + I("pin") + '</span><p><b>' + esc(L(C.UI.surPlace)) + '</b> · ' + esc(LF(S.surPlace).replace(/^(Sur place|On site) : ?/i, "")) + '</p></section>';
  function quizScreen(S) {
    const q = S.quiz;
    return enTete(S) + '<div class="card question"><span class="q-i">?</span><h3>' + esc(LF(q.q)) + '</h3></div><div class="opts" id="opts">' +
      q.opts.map((o, i) => '<button class="opt" data-act="rep" data-i="' + i + '"><span class="lettre">' + "ABC"[i] + '</span><span>' + esc(LF(o)) + '</span></button>').join("") + '</div><div id="fb" aria-live="polite"></div>' +
      dock('<p class="small dim center" style="margin:0">' + esc(T("Choisis une réponse", "Choose an answer")) + '</p>', "discret");
  }
  let essais = 0;
  function repondre(i) {
    const id = +route.n.slice(2), S = ST(id), q = S.quiz, opts = $screen.querySelectorAll(".opt"), fb = document.getElementById("fb");
    if (opts[i].classList.contains("ok") || opts[i].disabled) return;
    essais++;
    if (i === q.ok) {
      Store.Stats.quiz(id, essais === 1);
      opts.forEach(o => o.disabled = true); opts[i].classList.add("ok"); Audio2.Sfx.ok(); Audio2.vibre(60);
      fb.innerHTML = '<div class="feedback ok"><span class="ic-r">' + I("check") + '</span>' + esc(LF(q.bravo)) + '</div>';
      const d = $screen.querySelector(".dock"); d.classList.remove("discret"); d.innerHTML = btn(esc(L(C.UI.suite)) + " " + I("suite"), "go", "big", { r: route.n, s: "info" });
    } else {
      opts[i].classList.add("ko"); opts[i].disabled = true; Audio2.Sfx.ko(); Audio2.vibre(120);
      fb.innerHTML = '<div class="feedback ko"><span class="ic-r">' + I("recommencer") + '</span>' + esc(LF(q.rates[i])) + '</div>';
    }
  }
  function infoScreen(S, extra) {
    if (!Store.faits()[S.id]) { Store.fait(S.id, true); Store.Stats.fin(S.id, t0Etape[S.id] ? (Date.now() - t0Etape[S.id]) / 1000 : 0); }
    const suite = S.id === 1 ? btn(I("pin") + " " + esc(T("Rejoindre l'étape 2", "Go to stage 2")), "go", "big", { r: "marche", s: 2 }) + btn(I("carte") + " " + esc(L(C.UI.retourParcours)), "hub", "sec")
      : (!COMPLET ? btn(esc(T("Terminer la démo", "Finish the demo")) + " " + I("suite"), "go", "big", { r: "findemo" }) + btn(I("carte") + " " + esc(L(C.UI.retourParcours)), "hub", "sec") : btn(I("carte") + " " + esc(L(C.UI.retourParcours)), "hub", "big"));
    return '<span class="kicker">' + esc(L(C.UI.repereGagne)) + ' · ' + S.id + ' / 6</span><h2>' + esc(L(S.repere)) + '</h2>' +
      '<div class="gain"><div class="gain-art">' + (S.id === 1 ? gainPole() : gainAdresse()) + '</div><div class="gain-t"><small>' + esc(T("Carte du ciel de Ti-Komèt", "Ti-Komèt's sky map")) + '</small><b>' + esc(T("Repère", "Landmark")) + ' ' + S.id + '</b>' +
      '<span class="gain-pips">' + [1, 2, 3, 4, 5, 6].map(k => '<i class="' + (Store.faits()[k] ? "on" : "") + '">' + I(Store.faits()[k] ? "etoile" : "etoileVide") + '</i>').join("") + '</span></div></div>' +
      bulle("st" + S.id + "-fin", S.fin) + (extra || "") + dock(suite, "flow");
  }
  const gainPole = () => '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" class="g-fond"/>' + [16, 28, 40, 52].map((r, i) => '<circle cx="60" cy="60" r="' + r + '" fill="none" stroke="currentColor" stroke-width="1.4" stroke-dasharray="' + (6 + i * 3) + ' ' + (10 + i * 4) + '" opacity=".55"/>').join("") + '<path d="M60 46v28M46 60h28" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="60" r="5" fill="#ffd23f"/></svg>';
  const gainAdresse = () => '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" class="g-fond"/><path d="M14 92 H106" stroke="currentColor" stroke-width="2"/><path d="M60 92 L92 40" stroke="#ffd23f" stroke-width="3" stroke-dasharray="5 5"/><path d="M78 92 A18 18 0 0 0 69 77" fill="none" stroke="#ffd23f" stroke-width="3"/><circle cx="92" cy="40" r="8" fill="#ffd23f"/><path d="M30 92 a30 12 0 0 1 60 0" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/></svg>';

  // ===================== ÉTAPE 1 · L'axe du Monde =====================
  SCREENS.st1 = step => {
    const S = ST(1); step = step || "brief";
    if (step === "brief") return enTete(S) + bulle("st1-brief", S.brief) + surPlace(S) + classeBox(S) +
      '<section class="mission"><h3>' + I("boussole") + ' ' + esc(L(C.UI.mission)) + '</h3><ol><li>' + esc(T("Incline l'instrument pour viser le centre du ciel qui tourne.", "Tilt the instrument to aim at the centre of the turning sky.")) + '</li><li>' + esc(T("Vise ce point avec ton téléphone.", "Aim at that point with your phone.")) + '</li><li>' + esc(T("Réponds à la question de Ti-Komèt.", "Answer Ti-Komèt's question.")) + '</li></ol></section>' +
      dock(btn(esc(L(C.UI.pret)) + " " + I("suite"), "go", "big", { r: "st1", s: "axe" }));
    if (step === "axe") return enTete(S) + '<p class="consigne-courte">' + esc(LF(S.consigneAxe)) + '</p><div id="jeuhost"></div><div id="apres"></div>' +
      dock(demoMode ? btn(esc(T("Résoudre (démo)", "Solve (demo)")), "resoudre", "sec") : '<p class="small dim center" style="margin:0">' + esc(T("Astuce : la poignée se règle aussi avec − et +", "Tip: you can also use − and +")) + '</p>', "discret");
    if (step === "visee") return enTete(S) + bulle("st1-visee", S.visee, { compact: true }) + '<div id="jeuhost"></div>' +
      dock(btn(esc(T("Je n'y arrive pas : passer", "I can't: skip")), "go", "sec", { r: "st1", s: "quiz" }), "discret");
    if (step === "quiz") return quizScreen(S);
    if (step === "info") return infoScreen(S, '<section class="card savais"><h3>' + I("info") + ' ' + esc(L(C.UI.savais)) + '</h3><p>' + esc(LF(S.fait)) + '</p>' + src(S.fait.src) + '</section>' +
      '<section class="card jaising"><h3>' + I("boussole") + ' Jaï Sing</h3><p>' + esc(LF(S.jaiSing)) + '</p>' + src(S.jaiSing.src) + '</section>');
    return "";
  };
  AFTER.st1 = step => {
    const S = ST(1); step = step || "brief";
    if (step === "brief") { t0Etape[1] = t0Etape[1] || Date.now(); if (!Store.faits()[1]) Store.Stats.debut(1); }
    if (step === "axe") jeu = Games.axe(document.getElementById("jeuhost"), {
      lang: lang(), onWin: () => {
        document.getElementById("apres").innerHTML = bulle("st1-axe", S.axeOk, { compact: true });
        const d = $screen.querySelector(".dock"); d.classList.remove("discret"); d.innerHTML = btn(I("boussole") + " " + esc(T("Vise le pôle avec ton téléphone", "Aim at the pole with your phone")), "go", "big", { r: "st1", s: "visee" });
        fete(); if (!demoMode) document.getElementById("apres").scrollIntoView({ behavior: reduit() ? "auto" : "smooth", block: "nearest" });
      }
    });
    if (step === "visee") jeu = Aim.mount(document.getElementById("jeuhost"), {
      targetId: "pole", etoiles: true, lang: lang(), skipNow: demoMode, nomCible: T("le pôle sud céleste", "the south celestial pole"),
      titreCourt: T("Vise le pôle sud céleste", "Aim at the south celestial pole"),
      mission: T("tourne-toi vers le sud, puis lève le téléphone d'environ 21°", "face south, then raise your phone about 21°"),
      apres: T("C'est le point autour duquel tourne tout le ciel du Sud !", "It's the point the whole southern sky turns around!"),
      onSuccess: () => { Store.Stats.visee(Sensors.isSensor()); go("st1", "quiz"); }
    });
    if (step === "quiz") essais = 0;
    if (step === "info") { topbar(); Audio2.Sfx.repere(); Audio2.vibre([50, 30, 50]); fete(); }
  };

  // ===================== MARCHE : « Rejoins le prochain espace » =====================
  SCREENS.marche = step => {
    const vers = +step || 2, de = vers - 1, M = C.marche[vers], S = ST(vers);
    return '<span class="kicker">' + esc(T("En route", "On the way")) + ' · ' + esc(T("étape", "stage")) + ' ' + de + ' → ' + vers + '</span><h2>' + esc(T("Rejoins le prochain espace", "Head to the next space")) + '</h2>' +
      '<div class="plan-l">' + Art.plan(de, vers) + '<div class="plan-info"><span>' + I("pin") + ' <b>' + esc(LF(S.lieu)) + '</b></span><span>' + esc(T("≈ 1 à 2 min à pied (à mesurer)", "≈ 1-2 min walk (to be measured)")) + '</span></div></div>' +
      bulle("marche" + vers, M, { compact: true }) +
      '<section class="card repere"><h3>' + I("loupe") + ' ' + esc(T("Le repère à chercher", "The landmark to look for")) + '</h3><div class="repere-l"><svg viewBox="0 0 160 90" aria-hidden="true" class="repere-art"><path d="M0 80 H160" stroke="currentColor" stroke-width="2"/><rect x="14" y="44" width="70" height="36" fill="currentColor" opacity=".18"/><path d="M22 44 a18 18 0 0 1 36 0z" fill="#eef2ff" stroke="currentColor" stroke-width="2"/><path d="M96 54 a16 16 0 0 1 32 0z" fill="#eef2ff" stroke="currentColor" stroke-width="2"/><rect x="92" y="54" width="40" height="26" fill="currentColor" opacity=".18"/><path d="M38 28 l2 -6 2 6 6 2 -6 2 -2 6 -2 -6 -6 -2z" fill="#ffd23f"/></svg><p>' + esc(LF(M.repere)) + '</p></div></section>' +
      '<p class="note small">' + esc(T("Dans l'application complète, l'arrivée peut aussi se faire par un petit panneau ou un code à l'entrée de chaque espace : à choisir ensemble. Démo : touche « Je suis arrivé·e ».", "In the full app, arrival can also use a small sign or code at each space: to be decided together. Demo: tap “I'm here”.")) + '</p>' +
      dock(btn(I("pin") + " " + esc(L(C.UI.arrive)), "arrive", "big", { id: vers }) + btn(I("carte") + " " + esc(L(C.UI.retourParcours)), "hub", "sec"), "flow");
  };

  // ===================== ÉTAPE 2 · Ouvre la coupole =====================
  function cible() { if (!cible2) cible2 = Games.cibleDuSoir(new Date()); return cible2; }
  const nomC = c => c.nom[en() ? "en" : "fr"];
  function savais2(c) {
    const A = window.Astronomy, t = A.MakeTime(c.date);
    if (c.id === "Saturn") { const b = Math.abs(A.Illumination("Saturn", t).ring_tilt); return { t: T("Les anneaux de Saturne sont faits d'innombrables morceaux de glace et de roche. Ce soir, ils sont inclinés de " + b.toFixed(1).replace(".", ",") + "° seulement vers nous : en 2025, on les voyait par la tranche, presque invisibles !", "Saturn's rings are made of countless chunks of ice and rock. Tonight they are tilted only " + b.toFixed(1) + "° towards us: in 2025 we saw them edge-on, almost invisible!"), s: "M11 · calcul astronomy-engine" }; }
    if (c.id === "Jupiter") return { t: T("Les petits points autour de Jupiter sont ses quatre plus grandes lunes, découvertes par Galilée en 1610. Leur position change d'une nuit à l'autre : celle-ci est calculée pour ce soir.", "The dots around Jupiter are its four largest moons, discovered by Galileo in 1610. Their positions change every night: these are computed for tonight."), s: "M12 · calcul astronomy-engine" };
    if (c.id === "Moon") { const f = Math.round(A.Illumination("Moon", t).phase_fraction * 100); return { t: T("Ce soir, la Lune est éclairée à " + f + " %. Ses grandes taches sombres, les « mers », sont en fait d'immenses plaines de lave refroidie.", "Tonight the Moon is " + f + "% lit. Its dark patches, the “seas”, are vast plains of cooled lava."), s: "M13 · calcul astronomy-engine" }; }
    if (c.id === "Mars") return { t: T("Mars paraît orangée : son sol est couvert de poussière riche en oxyde de fer, comme de la rouille.", "Mars looks orange: its soil is covered with iron-oxide dust, like rust."), s: "M14" };
    if (c.id === "Venus") return { t: T("Vénus montre des phases, comme la Lune. Galilée les a observées en 1610 : c'était une preuve que Vénus tourne autour du Soleil.", "Venus shows phases, like the Moon. Galileo saw them in 1610: proof that Venus orbits the Sun."), s: "M15" };
    return { t: T("Ce soir, aucune planète brillante n'est assez haute : la démo te montre Ti-Komèt (inventée).", "Tonight no bright planet is high enough: the demo shows Ti-Komèt (made up)."), s: "" };
  }
  SCREENS.st2 = step => {
    const S = ST(2), c = cible(); step = step || "brief";
    const fiche = '<section class="fiche-obs"><span class="fo-t">' + I("telescope") + ' ' + esc(T("Fiche d'observation", "Observing card")) + '</span><b class="fo-nom">' + esc(nomC(c)) + '</b><span class="fo-quand">' + esc(c.fictif ? T("astre inventé (aucune planète haute ce soir)", "made-up object (no high planet tonight)") : T("ce soir à ", "tonight at ") + Games.hh(c.heure) + T(" · calculé pour les Makes", " · computed for Les Makes")) + '</span>' +
      '<div class="fo-coord"><span><small>' + esc(T("Azimut", "Azimuth")) + '</small><b>' + Math.round(c.az) + '°</b><em>' + (en() ? Games.dir8(c.az).replace("O", "W") : Games.dir8(c.az)) + '</em></span><span><small>' + esc(T("Hauteur", "Altitude")) + '</small><b>' + Math.round(c.alt) + '°</b><em>' + esc(T("au-dessus de l'horizon", "above horizon")) + '</em></span></div></section>';
    if (step === "brief") return enTete(S) + bulle("st2-brief", S.brief) + surPlace(S) + fiche +
      '<section class="card explique"><h3>' + I("boussole") + ' ' + esc(T("L'adresse d'un astre", "A sky object's address")) + '</h3><p>' + esc(LF(S.explique)) + '</p></section>' + classeBox(S) +
      dock(btn(esc(L(C.UI.pret)) + " " + I("suite"), "go", "big", { r: "st2", s: "coupole" }));
    if (step === "coupole") return enTete(S) + fiche.replace('class="fiche-obs"', 'class="fiche-obs mini"') + '<div id="jeuhost"></div><div id="apres"></div>' +
      dock(demoMode ? btn(esc(T("Résoudre (démo)", "Solve (demo)")), "resoudre", "sec") : '<p class="small dim center" style="margin:0">' + esc(T("Tourne · ouvre · lève · regarde : suis les 4 étapes", "Turn · open · raise · look: follow the 4 steps")) + '</p>', "discret");
    if (step === "quiz") return quizScreen(S);
    if (step === "info") { const sv = savais2(c); return infoScreen(S, '<section class="card savais"><h3>' + I("info") + ' ' + esc(L(C.UI.savais)) + '</h3><p>' + esc(sv.t) + '</p>' + src(sv.s) + '</section>' + '<section class="card"><h3>' + I("coupole") + ' ' + esc(T("La coupole", "The dome")) + '</h3><p>' + esc(LF(S.faitCoupole)) + '</p>' + src(S.faitCoupole.src) + '</section>'); }
    return "";
  };
  AFTER.st2 = step => {
    const S = ST(2); step = step || "brief";
    if (step === "brief") { t0Etape[2] = t0Etape[2] || Date.now(); if (!Store.faits()[2]) Store.Stats.debut(2); }
    if (step === "coupole") jeu = Games.coupole(document.getElementById("jeuhost"), {
      cible: cible(), lang: lang(), demo: demoMode,
      onDerive: () => { document.getElementById("apres").innerHTML = bulle("st2-derive", S.derive, { compact: true }); },
      onWin: () => {
        const d = $screen.querySelector(".dock"); d.classList.remove("discret"); d.innerHTML = btn(esc(L(C.UI.suite)) + " " + I("suite"), "go", "big", { r: "st2", s: "quiz" }); fete();
      }
    });
    if (step === "quiz") essais = 0;
    if (step === "info") { topbar(); Audio2.Sfx.repere(); Audio2.vibre([50, 30, 50]); fete(); }
  };

  // ===================== FIN DE LA DÉMO =====================
  SCREENS.findemo = () => '<div class="findemo"><div class="fd-hero">' + Art.ciel({ court: true, expr: "fete" }) + '</div><span class="kicker">' + esc(T("Version démo · étapes 1 et 2 terminées", "Demo version · stages 1 and 2 done")) + '</span><h2>' + esc(T("Fin de la démo", "End of the demo")) + '</h2>' +
    '<p class="fd-lead">' + esc(T("Vous venez de vivre les deux premières étapes de la visite.", "You have just played the first two stages of the visit.")) + '</p><p class="fd-txt">' + esc(T("Dans l'application complète, Ti-Komèt continue jusqu'à la fin de la visite de jour, puis sur la terrasse de nuit.", "In the full app, Ti-Komèt carries on to the end of the day visit, then onto the night terrace.")) + '</p>' +
    '<ul class="fd-suite">' + [
      ["telescope", "Newton · le bon télescope", "Taches du Soleil, planètes, astéroïdes : à chaque mission son instrument"],
      ["cadran", "Ptolémée · l'ombre à l'envers", "Le cadran réglé à 21° sud, heure solaire contre heure du téléphone"],
      ["planetes", "Einstein · le système solaire en poche", "Planètes à l'échelle, et un astéroïde à dévier comme DART"],
      ["lune", "La soirée en nuit rouge", "Croix du Sud, pôle retrouvé, étoiles comptées comme dans LASCAR"],
      ["brevet", "Le brevet d'astronome junior", "Imprimable ou à partager, avec les 6 repères"],
      ["ecole", "La version classe complète", "Fiches avant et après la venue, corrigés, mode équipe"]
    ].map(x => '<li><span class="fd-i">' + I(x[0]) + '</span><span class="fd-t"><b>' + esc(x[1]) + '</b><small>' + esc(x[2]) + '</small></span><span class="fd-badge">' + I("cadenas") + '</span></li>').join("") + '</ul></div>' +
    dock(btn(I("play") + " " + esc(T("Revoir le projet", "Back to the project")), "go", "big", { r: "projet" }) + '<div class="rang-btn">' + btn(I("ecole") + " " + esc(T("Version classe", "School version")), "go", "sec", { r: "fiche" }) + btn(I("coupole") + " " + esc(T("Pour l'Observatoire", "For the Observatory")), "go", "sec", { r: "observatoire" }) + '</div>' + btn(I("recommencer") + " " + esc(T("Recommencer", "Start again")), "recommencer", "sec"), "flow");
  AFTER.findemo = () => { Store.Stats.findemo(); if (!navigator.userActivation || navigator.userActivation.hasBeenActive) Audio2.Sfx.fanfare(); fete(); };

  // ===================== VERSION CLASSE (fiche enseignant imprimable) =====================
  SCREENS.fiche = () => flecheRetour("projet") + '<article class="doc fiche">' +
    '<div class="bandeau-relire">À RELIRE PAR L\'ÉQUIPE PÉDAGOGIQUE DE L\'OBSERVATOIRE · version de travail du 6/11/2026</div>' +
    '<h2>Version classe · « Ti-Komèt et le ciel du Sud »</h2><p class="doc-sous">Aventure sur téléphone · cycle 3 (CM1, CM2, 6e) et cycle 4 (5e, 4e, 3e) · séjour court ou classe de découverte · 1 téléphone pour 2 à 4 élèves</p>' +
    '<h3>Objectifs</h3><ul><li>Comprendre que le ciel semble tourner autour de l\'axe du Monde, parallèle à l\'axe de rotation de la Terre, et que la hauteur du pôle céleste est égale à la latitude (21° aux Makes).</li><li>Repérer un astre par deux angles : azimut et hauteur.</li><li>Relier le mouvement apparent des astres à la rotation de la Terre (15° par heure).</li><li>Dans l\'application complète : lire un cadran solaire de l\'hémisphère Sud, comparer heure solaire et heure légale ; situer la Terre dans le système solaire à l\'échelle ; comprendre la pollution lumineuse.</li></ul>' +
    '<h3>Avant · pendant · après la venue</h3><table><tr><th>Quand</th><th>Ce que font les élèves</th></tr>' +
    '<tr><td><b>Avant</b><br><small>en classe, 45 min</small></td><td>Faire tourner une lampe autour d\'un globe ; tracer les ombres d\'un bâton (gnomon) dans la cour à trois heures de la journée ; noter ses questions pour l\'Observatoire. Option : l\'intro de l\'appli projetée en classe.</td></tr>' +
    '<tr><td><b>Pendant</b><br><small>visite de jour, ≈ 30 à 40 min dans les 5 espaces</small></td><td>Une étape par espace, guidée par le médiateur : instrument, mini-jeu, question, « Pour la classe » à débattre en équipe. Le soir (classe de découverte) : étape en nuit rouge sur la terrasse.</td></tr>' +
    '<tr><td><b>Après</b><br><small>en classe</small></td><td>Expliquer à l\'écrit pourquoi l\'axe du Monde monte de 21° aux Makes et de 49° à Paris ; refaire le relevé d\'ombres et comparer au cadran des Makes ; brevet affiché en classe.</td></tr></table>' +
    '<h3>Liens possibles avec les programmes</h3>' +
    '<p><b>Cycle 3 · sciences et technologie</b> (nouveau programme, BO n° 24 du 11 juin 2026 ; entrée en vigueur progressive à partir de 2026-2027, à vérifier), thème « La matière, les mouvements et les signaux » :</p><ul>' +
    '<li>« Décrire le mouvement de la Terre par rapport au Soleil et la situer dans le système solaire » → étapes 1, 2 et 5.</li>' +
    '<li>« Interpréter l\'alternance du jour et de la nuit du point de vue d\'un observateur sur Terre » (modèle géocentrique) et « associer la durée d\'un jour au mouvement de rotation de la Terre autour de l\'axe des pôles » → étapes 1 et 2.</li>' +
    '<li>Démarche proposée par le programme : « le tracé des ombres d\'un gnomon au cours d\'une journée » → étape 4 (cadrans de l\'espace Ptolémée).</li>' +
    '<li>Maquette du système solaire à l\'échelle (le programme cite un Soleil de 10 cm et une Terre de 1 mm à 10 m) → étape 5 (salle Einstein).</li></ul>' +
    '<p><b>Cycle 4 · physique-chimie</b>, « Décrire l\'organisation de la matière dans l\'Univers » : structure du système solaire (5e) et de l\'Univers (4e), unités de distance → étapes 5 et soirée ; mouvement apparent des astres → étapes 1 et 2.</p>' +
    '<p class="mini-note">Citations relevées sur education.gouv.fr et eduscol (voir SOURCES.md) : intitulés et calendrier à confirmer par l\'équipe pédagogique.</p>' +
    '<h3>Liens avec les ateliers de l\'Observatoire (proposition à discuter)</h3><ul><li><b>Système solaire</b> → étapes 2 (planète de ce soir) et 5 (échelle, astéroïdes).</li><li><b>Mythologie et histoire du ciel</b> → étape 1 (Jai Singh, instruments anciens) et soirée (légendes de la Croix du Sud, dont celles de l\'océan Indien, à recueillir avec vous).</li><li><b>LASCAR</b> (pollution lumineuse, comptage d\'étoiles) → soirée : compter les étoiles dans un carré du ciel.</li></ul>' +
    '<h3>Corrigés des étapes jouables</h3><table><tr><th>Étape</th><th>Réponse attendue</th></tr>' +
    '<tr><td>1 · Jaï Sing</td><td>Arête inclinée de 21° vers le sud ; le pôle sud céleste est à 21° au-dessus de l\'horizon sud parce que les Makes sont à 21° de latitude sud. Piège : confondre avec l\'inclinaison de l\'axe terrestre (23°).</td></tr>' +
    '<tr><td>2 · Coupoles</td><td>Coupole tournée vers l\'azimut de l\'astre, tube levé à sa hauteur. L\'astre sort de l\'oculaire à cause de la rotation de la Terre ; le moteur de suivi tourne autour d\'un axe parallèle à l\'axe du Monde (monture équatoriale).</td></tr></table>' +
    '<h3>Points de vigilance</h3><ul><li>Ti-Komèt « parle » : convention de fiction annoncée aux élèves. Une comète ne se perd pas et ne parle pas. Une étoile filante n\'est pas une étoile : c\'est une poussière, souvent laissée par une comète, qui brûle dans l\'atmosphère.</li><li>Ne jamais regarder le Soleil, même avec des lunettes de soleil : l\'appli ne fait jamais viser le Soleil.</li><li>La planète de l\'étape 2 est calculée pour le soir même : elle change selon la date.</li></ul>' +
    '<p class="mini-note">Sources détaillées : SOURCES.md. Document de travail, non validé.</p></article>' +
    dock(btn(I("imprimer") + " Imprimer la fiche", "print", "sec") + btn(I("retour") + " Retour", "retour", "sec", { r: "projet" }), "flow noprint");

  // ===================== POUR L'OBSERVATOIRE =====================
  SCREENS.observatoire = () => flecheRetour("projet") + '<div class="obs-p"><span class="kicker">Pour l\'Observatoire des Makes</span><h2>Ce que le lieu y gagne</h2>' +
    '<ul class="gagne">' + [
      ["ecole", "Des séjours scolaires préparés et prolongés", "Une version classe avant, pendant et après la venue, alignée sur vos ateliers et les programmes : la visite devient une séquence."],
      ["famille", "Des familles actives pendant la visite de jour", "Chaque espace a son aventure : les enfants observent, manipulent, répondent. Le médiateur garde la main."],
      ["lune", "Soirées et vacances", "Soirée Immersion, soirées d'observation, Astronome d'un jour, Parenté cosmique : un écran en nuit rouge qui ne gêne pas les observateurs."],
      ["etoile", "Vos grands rendez-vous", "Nuit des étoiles, Fête de la science : un parcours spécial, avec un personnage joué sur place (Jonathan est comédien)."],
      ["crayon", "Un contenu à vous", "Textes écrits avec votre équipe pédagogique, modifiables ensuite ; voix en français, kréol, anglais."],
      ["stats", "Des chiffres pour vos bilans", "Fréquentation, étapes terminées, notions retenues : anonymes, utiles aux financeurs."]
    ].map(x => '<li><span class="g-i">' + I(x[0]) + '</span><div><b>' + esc(x[1]) + '</b><p>' + esc(x[2]) + '</p></div></li>').join("") + '</ul>' +
    '<section class="card"><h3>' + I("info") + ' Ce qui reste à décider ensemble</h3><ul class="clean"><li>L\'ordre réel des espaces et la durée de chaque arrêt.</li><li>Les instruments de l\'espace Jaï Sing et des coupoles à montrer (photos).</li><li>Le mode d\'arrivée entre deux espaces : simple bouton, petit panneau, code.</li><li>Les légendes du ciel à recueillir, les voix, la relecture du kréol.</li></ul></section>' +
    '<div class="rang-btn">' + btn(I("stats") + " Tableau de bord (aperçu)", "go", "sec", { r: "stats" }) + btn(I("qr") + " Le QR code de départ", "go", "sec", { r: "qr" }) + '</div>' +
    '<p class="small dim">Repères historiques affichés dans l\'appli : idée née en 1986 au passage de la comète de Halley, inauguration le 21 septembre 1991 en présence d\'Hubert Reeves, télescope de 60 cm installé en 2011 avec l\'IMCCE (source : page « historique » de votre site).</p></div>' +
    dock(btn(I("play") + " Démarrer la démo", "go", "big", { r: "accueil" }) + btn(I("retour") + " Le projet", "retour", "sec", { r: "projet" }), "flow");

  // ===================== TABLEAU DE BORD =====================
  const ORIGINES = { projet: "Le projet", observatoire: "Pour l'Observatoire", findemo: "Fin de la démo" };
  SCREENS.stats = () => Tableau.html({ vue: statsVue, retour: flecheRetour(statsOrigine || "projet") });

  // ===================== QR CODE DE DÉPART =====================
  const baseURL = () => location.origin + location.pathname;
  SCREENS.qr = () => flecheRetour("observatoire") + '<div class="qr-p"><span class="kicker noprint">Pour l\'accueil de l\'Observatoire</span><h2>Un seul QR code pour démarrer</h2>' +
    '<p class="small noprint">Généré sur ce téléphone (aucun service en ligne). À poser à l\'accueil : on le scanne une fois, l\'appli guide ensuite d\'espace en espace.</p>' +
    '<article class="qrcarte">' + QR.svg(baseURL() + "?station=accueil", { taille: 220 }) + '<h3>Ti-Komèt et le ciel du Sud</h3><p>Scanne-moi pour commencer l\'aventure</p><code>' + esc(baseURL() + "?station=accueil") + '</code></article></div>' +
    dock(btn(I("imprimer") + " Imprimer", "print", "sec") + btn(I("retour") + " Retour", "retour", "sec", { r: "observatoire" }), "flow noprint");

  // ===================== FEUILLES (réglages, crédits) =====================
  function closeSheets() { document.querySelectorAll(".sheet").forEach(s => s.remove()); }
  function ouvrirFeuille(html) {
    closeSheets(); const d = document.createElement("div"); d.className = "sheet"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
    d.innerHTML = '<div class="sheet-fond" data-act="fermer"></div><div class="sheet-in">' + html + '</div>'; document.body.appendChild(d);
    const h = H(); if (h && !h.sh) { try { armer(); const h2 = H(); history.pushState(Object.assign({}, h2, { sh: 1, i: h2.i + 1, p: [h2.n, h2.s] }), "", location.href); } catch (e) { } }
    const f = d.querySelector("button"); if (f) f.focus();
  }
  function fermerFeuille() { const h = H(); if (h && h.sh && document.querySelector(".sheet")) history.back(); else closeSheets(); }
  const seg = (act, cur, items) => '<div class="seg">' + items.map(i => '<button class="btn mini" data-act="' + act + '" data-v="' + i[0] + '" aria-pressed="' + (String(cur) === String(i[0])) + '">' + i[1] + '</button>').join("") + '</div>';
  function reglages() {
    ouvrirFeuille('<h3>' + I("reglages") + ' ' + esc(T("Réglages", "Settings")) + '</h3>' +
      '<p class="lbl">' + esc(T("Public", "Audience")) + '</p>' + seg("pub", pub(), [["famille", L(C.publics.famille)], ["classe", L(C.publics.classe)], ["soiree", L(C.publics.soiree)]]) +
      '<p class="lbl">' + esc(T("Langue", "Language")) + '</p>' + seg("lang", lang(), [["fr", "FR"], ["kr", "KR"], ["en", "EN"]]) +
      '<p class="lbl">' + esc(T("Affichage", "Display")) + (nuit() ? ' <small>(' + esc(T("soirée : nuit rouge", "evening: red night")) + ')</small>' : "") + '</p>' + seg("th", Store.get("theme"), [["auto", T("Auto", "Auto")], ["jour", T("Plein soleil", "Bright sun")], ["ciel", T("Ciel", "Sky")]]) +
      '<p class="lbl">' + esc(T("Taille du texte", "Text size")) + '</p>' + seg("taille", Store.get("taille"), [[1, "A"], [2, "A+"], [3, "A++"]]) +
      '<p class="lbl">' + esc(T("Sons et vibrations", "Sounds")) + '</p>' + seg("son", Store.get("son") ? 1 : 0, [[1, T("Oui", "On")], [0, T("Non", "Off")]]) +
      '<div class="rang-btn">' + btn(I("info") + " " + esc(T("Crédits", "Credits")), "credits", "sec") + btn(I("recommencer") + " " + esc(T("Recommencer", "Restart")), "reset", "sec") + '</div>' +
      (COMPLET ? "" : btn(esc(T("Présentation du projet", "About the project")), "go", "sec", { r: "projet" })) + btn(esc(T("Fermer", "Close")), "fermer", ""));
  }
  function credits() { ouvrirFeuille('<h3>' + I("info") + ' Crédits</h3><span class="badge-alerte">PROTOTYPE · CONTENUS À FAIRE RELIRE PAR L\'OBSERVATOIRE</span><ul class="clean">' + C.credits.map(c => "<li>" + esc(c) + "</li>").join("") + '</ul>' + btn("Fermer", "fermer")); }

  // ===================== BARRE DE DÉMONSTRATION (?demo=1) =====================
  const NOMS_DEMO = { projet: "Le projet", accueil: "Accueil", intro: "Histoire", hub: "Le parcours", st1: "Étape 1", st2: "Étape 2", marche: "Rejoins l'espace", findemo: "Fin de la démo", fiche: "Version classe", observatoire: "Pour l'Observatoire", stats: "Tableau de bord" };
  function updatePresbar() {
    let p = document.getElementById("presbar");
    if (!demoMode) { if (p) p.remove(); document.body.classList.remove("has-presbar"); return; }
    if (!p) { p = document.createElement("nav"); p.id = "presbar"; p.className = "presbar"; p.setAttribute("aria-label", "Barre de démonstration"); document.body.appendChild(p); }
    document.body.classList.add("has-presbar");
    const m = x => x && x[0] === route.n && (x[1] || null) === (route.step || null); if (!m(C.demo[demoIdx])) { const i = C.demo.findIndex(m); if (i >= 0) demoIdx = i; }
    const x = C.demo[demoIdx], fin = demoIdx === C.demo.length - 1;
    p.innerHTML = '<button data-act="dprev" aria-label="Écran précédent" ' + (demoIdx === 0 ? "disabled" : "") + '>◀</button><span class="lbl"><b>' + (demoIdx + 1) + '/' + C.demo.length + '</b> ' + esc(NOMS_DEMO[x[0]] || x[0]) + (x[1] && /^st/.test(x[0]) ? " · " + x[1] : "") + '</span><button data-act="dnext" aria-label="Écran suivant" ' + (fin ? "disabled" : "") + '>▶</button>';
  }
  function demoGo(d) {
    const n = Math.max(0, Math.min(C.demo.length - 1, demoIdx + d)); if (n === demoIdx && d) return; demoIdx = n;
    const x = C.demo[demoIdx];
    C.demo.forEach((y, k) => { if (k < demoIdx && /^st\d$/.test(y[0]) && y[1] === "info") Store.fait(+y[0].slice(2), true); });
    if (x[0] === "findemo") { Store.fait(1, true); Store.fait(2, true); }
    go(x[0], x[1]);
  }

  // ===================== ÉVÉNEMENTS =====================
  let rougeTimer = 0;
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    const a = b.dataset.act; Audio2.Sfx.unlock();
    switch (a) {
      case "start": { Audio2.Sfx.bulle(); Store.Stats.session(pub(), lang()); const premiere = !Store.get("intro"); Store.set("intro", true); premiere ? go("intro", "0") : go("hub"); break; }
      case "accueil": go("accueil"); break;
      case "pub": Store.set("public", b.dataset.v); Audio2.Sfx.tap(); if (b.closest(".sheet")) { closeSheets(); go(route.n, route.step, true, "replace"); reglages(); } else go(route.n, route.step, true, "replace"); break;
      case "lang": Store.set("lang", b.dataset.v); Audio2.Sfx.tap(); applyTheme(); if (b.closest(".bubble")) majBulles(); else if (b.closest(".sheet")) { closeSheets(); go(route.n, route.step, true, "replace"); reglages(); } else go(route.n, route.step, true, "replace"); break;
      case "th": Store.set("theme", b.dataset.v); applyTheme(); closeSheets(); reglages(); break;
      case "taille": Store.set("taille", +b.dataset.v); applyTheme(); closeSheets(); reglages(); break;
      case "son": Store.set("son", b.dataset.v === "1"); closeSheets(); reglages(); break;
      case "voix": {
        const t = BULLES[b.dataset.bid]; if (!t) break;
        b.classList.add("playing"); setTimeout(() => b.classList.remove("playing"), 1400);
        Audio2.parle(b.dataset.id, lang(), L(t)).then(r => { if (r === "aucune") toast(lang() === "kr" ? "Voix kréol à enregistrer (texte à relire avant)" : "Voix indisponible sur cet appareil : lis le texte !"); });
        break;
      }
      case "intro": Audio2.Sfx.page(); go("intro", b.dataset.i); break;
      case "hub": go("hub"); break;
      case "station": Audio2.Sfx.bulle(); go("st" + b.dataset.id, "brief"); break;
      case "arrive": Audio2.Sfx.ok(); toast(T("Bien arrivé·e ! L'étape " + b.dataset.id + " s'ouvre.", "You're here! Stage " + b.dataset.id + " opens."), 2200); go("st" + b.dataset.id, "brief"); break;
      case "go": {
        Audio2.Sfx.tap(); const h = H();
        if (h && h.i > 1 && !h.sh && h.p && h.p[0] === b.dataset.r && (h.p[1] || null) === (b.dataset.s || null)) history.back(); else go(b.dataset.r, b.dataset.s || null);
        break;
      }
      case "retour": Audio2.Sfx.tap(); if (aPrecedent()) history.back(); else go(b.dataset.r || "projet", null, false, "replace"); break;
      case "saut": if (b.dataset.p) Store.set("public", b.dataset.p); go(b.dataset.n, b.dataset.s || null); break;
      case "rep": repondre(+b.dataset.i); break;
      case "resoudre": if (jeu && jeu.solve) jeu.solve(); break;
      case "print": window.print(); break;
      case "reset": if (confirm(T("Recommencer l'aventure depuis le début ?", "Restart the adventure?"))) { Store.reset(); cible2 = null; t0Etape = {}; closeSheets(); go("accueil"); } break;
      case "recommencer": Store.reset(); cible2 = null; t0Etape = {}; go("accueil"); break;
      case "reglages": reglages(); break;
      case "fermer": fermerFeuille(); break;
      case "credits": credits(); break;
      case "installer": if (installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; majInstall(); }); } break;
      case "essairouge": { // aperçu du mode nuit rouge directement sur « Le projet »
        clearTimeout(rougeTimer); document.documentElement.classList.add("nuit"); document.body.dataset.theme = "rouge";
        toast("Mode nuit rouge : tout l'écran passe en rouge", 2400);
        rougeTimer = setTimeout(() => { applyTheme(); }, 5000); break;
      }
      case "stvue": statsVue = b.dataset.v; Audio2.Sfx.tap(); go("stats", null, true, "replace"); break;
      case "stexport": toast("Disponible dans l'application complète"); break;
      case "steffacer": Store.Stats.effacer(); go("stats", null, true, "replace"); toast("Compteurs effacés"); break;
      case "dprev": demoGo(-1); break;
      case "dnext": demoGo(1); break;
    }
  });
  window.addEventListener("online", topbar); window.addEventListener("offline", topbar);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && document.querySelector(".sheet")) fermerFeuille(); if (demoMode && !e.target.closest("input,textarea,select")) { if (e.key === "PageDown") demoGo(1); if (e.key === "PageUp") demoGo(-1); } });

  // ===================== DÉMARRAGE =====================
  function init() {
    const q = new URLSearchParams(location.search);
    if (q.get("theme") && ["auto", "jour", "ciel"].includes(q.get("theme"))) Store.set("theme", q.get("theme"));
    if (q.get("public") && C.publics[q.get("public")]) Store.set("public", q.get("public"));
    if (q.get("lang") && ["fr", "kr", "en"].includes(q.get("lang"))) Store.set("lang", q.get("lang"));
    if (q.get("sim")) Sky.setSim(q.get("sim"));
    demoMode = q.get("demo") === "1";
    if (!COMPLET) [3, 4, 5, 6].forEach(k => { if (Store.faits()[k]) Store.fait(k, false); }); // ancienne partie allant plus loin : ramenée à la démo
    const s = q.get("station"), h0 = H();
    if (h0 && h0.n === "stats" && h0.o && ORIGINES[h0.o]) statsOrigine = h0.o;
    if (demoMode && !s) { demoIdx = 0; Store.reset(); Store.set("public", "famille"); go("projet", null, false, "init"); }
    else if (/^\d$/.test(s || "")) go("st" + s, h0 && h0.n === "st" + s && h0.s ? h0.s : "brief", false, "init");
    else if (s && SCREENS[s]) go(s, h0 && h0.n === s ? h0.s : null, false, "init");
    else if (s && VERROU(s)) go(s, null, false, "init");
    else go("projet", null, false, "init");
    window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; majInstall(); });
    window.addEventListener("appinstalled", () => { installPrompt = null; const b = document.getElementById("pj-install"); if (b) b.remove(); });
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).then(() => setTimeout(topbar, 300)).catch(() => { });
      navigator.serviceWorker.addEventListener("controllerchange", topbar);
    }
    document.documentElement.classList.add("pret");
  }
  window.App = { go, route: () => route, jeu: () => jeu, demoGo, Content: C, cible };
  init();
})();
