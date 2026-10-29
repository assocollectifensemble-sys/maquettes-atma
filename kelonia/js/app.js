/* ============================================================
   APP.JS — Navigation, écrans et logique de « Le dossier Kawann »
   (prototype pour Kélonia, l'observatoire des tortues marines).
   Écrans : ouverture (démo) · accueil · intro · hub (bassins) ·
   st1…st5 (brief → jeu → quiz → info) · dossier · relacher · diplome ·
   fin · carnet · fiche (enseignant) · qr (pour l'équipe) · kelonia.
   ============================================================ */
(function () {
  "use strict";
  const C = window.Content;
  const $screen = document.getElementById("screen");
  let route = { n: "accueil", step: null }, jeu = null, demoMode = false, demoIdx = 0;
  const BULLES = {}; // textes des bulles affichées (pour changer de langue sans recharger l'écran)

  // échappement HTML + typographie française : espace insécable avant ! ? ; : » (jamais de « ! » seul en début de ligne)
  const typo = s => String(s).replace(/ ([!?;:»])/g, " $1").replace(/« /g, "« ");
  const esc = s => typo(String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])));
  const lang = () => Store.get("lang");
  const pub = () => Store.get("public");
  const L = o => (o && (o[lang()] || o.fr)) || "";
  const LF = o => (o && (lang() === "en" ? (o.en || o.fr) : o.fr)) || ""; // consignes : FR ou EN (le créole est réservé aux voix/bulles)
  const nuit = () => pub() === "soiree";
  // texte adapté au public (variante soiree / classe) + modifications de l'éditeur
  function pick(t, id) {
    let r = t; const p = pub();
    if (t && t[p] && typeof t[p] === "object" && t[p].fr) r = Object.assign({}, t, t[p], { _var: p });
    const e = id && (Store.get("edits") || {})[id + (r._var ? "-" + r._var : "")];
    if (e) r = Object.assign({}, r, e, { _edit: true });
    return r;
  }

  // ---------- thème ----------
  function applyTheme() {
    const th = nuit() ? "nuit" : Store.get("theme");
    document.body.dataset.theme = th;
    document.documentElement.classList.toggle("nuit", th === "nuit");
    document.documentElement.dataset.taille = Store.get("taille");
    document.documentElement.classList.toggle("facile", !!Store.get("facile"));
    document.documentElement.lang = lang() === "kr" ? "rcf" : lang();
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = th === "nuit" ? "#120803" : th === "soleil" ? "#ffffff" : "#063b4c";
  }

  // ---------- briques d'affichage ----------
  function avatar(qui, expr, cls) {
    return qui === "kawann" ? Art.kawann(expr || "content", cls, { pansement: route.n !== "relacher" && route.n !== "diplome" && route.n !== "fin" }) : Art.jo(expr || "parle", nuit(), cls);
  }
  function txtBulle(t) { return L(t); }
  function bulle(id, t0, opts) {
    opts = opts || {};
    const t = pick(t0, id), vid = id + (t._var ? "-" + t._var : "");
    BULLES[id] = t;
    const qui = t.qui || "jo", nom = qui === "kawann" ? "Kawann" : "Jo · " + L(nuit() ? { fr: "soigneur de nuit", en: "night keeper", kr: "soignèr la nuit" } : { fr: "soigneur", en: "keeper", kr: "soignèr" });
    const lb = (v, l) => '<button class="lg" data-act="lang" data-v="' + v + '" aria-pressed="' + (lang() === v) + '" ' + (t[v] ? "" : "disabled") + ' title="' + l + '">' + v.toUpperCase().replace("KR", "KR") + '</button>';
    return '<div class="guide qui-' + qui + (opts.compact ? " compact" : "") + (opts.seul ? " seul" : "") + '">' + (opts.seul ? "" : avatar(qui, t.expr, "av")) +
      '<div class="bubble" data-bid="' + id + '" role="group" aria-label="' + esc(nom) + ' dit"><div class="who">' + esc(nom) + (t._edit ? ' <span class="badge">modifié</span>' : "") + '</div>' +
      '<p class="txt" lang="' + (lang() === "kr" ? "rcf" : lang()) + '">' + esc(txtBulle(t)) + '</p>' +
      '<p class="kr-note" ' + (lang() === "kr" ? "" : "hidden") + '>Kréol : proposition à faire relire</p>' +
      '<div class="outils"><div class="langs" role="group" aria-label="Langue">' + lb("fr", "Français") + lb("kr", "Kréol") + lb("en", "English") + '</div>' +
      '<button class="ecoute" data-act="voix" data-id="' + vid + '" data-bid="' + id + '" aria-label="Écouter la bulle"><span aria-hidden="true">🔊</span> <span class="ecoute-l">' + esc(L(C.UI.ecouter)) + '</span></button></div></div></div>';
  }
  function majBulles() { // change la langue des bulles affichées sans réinitialiser le jeu en cours
    document.querySelectorAll(".bubble[data-bid]").forEach(b => {
      const t = BULLES[b.dataset.bid]; if (!t) return;
      const p = b.querySelector(".txt"); p.textContent = typo(txtBulle(t)); p.lang = lang() === "kr" ? "rcf" : lang();
      b.querySelector(".kr-note").hidden = lang() !== "kr";
      b.querySelectorAll(".lg").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === lang()));
      const e = b.querySelector(".ecoute-l"); if (e) e.textContent = L(C.UI.ecouter);
    });
    document.querySelectorAll("[data-ui]").forEach(e => { e.textContent = L(C.UI[e.dataset.ui]); });
  }
  const ui = k => '<span data-ui="' + k + '">' + esc(L(C.UI[k])) + '</span>';
  function dock(html, cls) { return '<div class="dock ' + (cls || "") + '">' + html + '</div>'; }
  function btn(label, act, cls, data) {
    let d = ""; if (data) Object.keys(data).forEach(k => { d += " data-" + k + '="' + esc(data[k]) + '"'; });
    return '<button class="btn ' + (cls || "") + '" data-act="' + act + '"' + d + '>' + label + '</button>';
  }
  function src(code) { return code ? '<p class="src">' + esc(L(C.UI.source)) + ' : ' + esc(code) + ' (voir SOURCES.md)</p>' : ""; }
  function toast(t) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 3400); }
  function bullesFete() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = document.createElement("div"); d.className = "fete"; d.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 18; i++) { const e = document.createElement("i"); e.style.left = Math.random() * 100 + "%"; e.style.animationDuration = (2 + Math.random() * 2) + "s"; e.style.animationDelay = Math.random() * .6 + "s"; const s = 8 + Math.random() * 18; e.style.width = e.style.height = s + "px"; if (i % 4 === 0) e.className = "corail"; d.appendChild(e); }
    document.body.appendChild(d); setTimeout(() => d.remove(), 4600);
  }

  // ---------- barre du haut ----------
  function topbar() {
    const f = Store.faits(); let pips = "";
    for (let i = 1; i <= 5; i++) pips += Art.ICO.coquille(f[i]);
    const sw = navigator.serviceWorker && navigator.serviceWorker.controller, horsLigne = navigator.onLine === false;
    document.getElementById("topbar").innerHTML =
      '<button class="brand" data-act="accueil" aria-label="Retour à l\'accueil">' + Art.ICO.tortue + '<span class="brand-t"><b>' + esc(L(C.accueil.titre)) + '</b><small class="reseau ' + (sw || horsLigne ? "ok" : "") + '" id="reseau">' + "● " + L(horsLigne ? { fr: "hors ligne · tout fonctionne", en: "offline · everything works", kr: "san rézo · tout i marsh" } : sw ? { fr: "fonctionne sans réseau", en: "works without network", kr: "i marsh san rézo" } : { fr: "Kélonia · prototype", en: "Kélonia · prototype" }) + '</small></span></button>' +
      '<div class="pips" role="img" aria-label="' + Store.count() + ' indice(s) sur 5">' + pips + '</div>' +
      '<button class="iconbtn" data-act="reglages" aria-label="Réglages, langue, accessibilité">⚙️</button>';
  }

  // ---------- routeur ----------
  function go(n, step, noScroll) {
    if (jeu) { jeu.destroy(); jeu = null; }
    Audio2.stopVoix(); closeSheets();
    route = { n, step: step == null ? null : String(step) };
    const u = new URL(location.href); u.searchParams.delete("station");
    const code = /^st\d$/.test(n) ? n.slice(2) : n;
    if (n !== "accueil") u.searchParams.set("station", code);
    try { history.replaceState(null, "", u); } catch (e) { /* file:// */ }
    applyTheme(); render();
    if (!noScroll) window.scrollTo(0, 0);
    const h = $screen.querySelector("h1,h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    updatePresbar();
  }
  function render() {
    topbar();
    const fn = SCREENS[route.n]; if (!fn) return go("accueil");
    $screen.classList.remove("entre"); void $screen.offsetWidth; $screen.classList.add("entre");
    $screen.innerHTML = fn(route.step);
    document.body.dataset.ecran = route.n;
    const a = AFTER[route.n]; if (a) a(route.step);
  }
  const SCREENS = {}, AFTER = {};

  // ===================== OUVERTURE (mode démo) =====================
  SCREENS.ouverture = () => {
    const items = [
      ["🌙", "Pensée pour vos soirées", "« Jours de la Nuit » ou Nuit des musées : écran ambré, lumière limitée.", "st5", "brief", "soiree"],
      ["🐢", "Une tortue en convalescence demande de l'aide", "Kawann, tortue caouanne (personnage fictif), et Jo, le soigneur de nuit.", "intro", "0"],
      ["🫧", "L'enquête bassin par bassin", "5 stations, 5 mini-jeux tactiles, un dossier de soin à remplir.", "hub"],
      ["🗣️", "Voix en français et en créole", "Bascule FR · KR (+ EN) sur chaque bulle.", "intro", "1"],
      ["📶", "QR codes, y compris hors connexion", "QR générés sur place, appli installée dans le téléphone.", "qr"],
      ["🎓", "Version cycle 3 à relire", "Consignes scolaires et fiche enseignant imprimable.", "fiche"]
    ];
    return '<div class="ouverture"><p class="kicker">Prototype · confidentiel</p><h1>Préparé pour <span>Kélonia</span></h1>' +
      '<p class="ouv-meta">Vendredi 30 octobre 2026 · 8 h 30 · Saint-Leu<br>Jonathan Bou · aventures sur téléphone</p>' +
      '<div class="ouv-art">' + Art.kawann("content", "flotte") + Art.jo("parle", true, "ouv-jo") + '</div>' +
      '<h2 class="h-sec">La promesse du mail, point par point</h2><ul class="promesse">' +
      items.map(i => '<li><button data-act="saut" data-n="' + i[3] + '" data-s="' + (i[4] || "") + '" data-p="' + (i[5] || "") + '"><span class="pi" aria-hidden="true">' + i[0] + '</span><span><b>' + esc(i[1]) + '</b><br><small>' + esc(i[2]) + '</small></span><span class="ok" aria-hidden="true">✓</span></button></li>').join("") + '</ul>' +
      '<p class="small dim center">Tout fonctionne sans réseau. Aucun texte n\'est définitif : contenus à relire avec le service éducatif.</p></div>' +
      dock(btn("▶ Lancer la démo", "dnext", "big"));
  };

  // ===================== ACCUEIL =====================
  SCREENS.accueil = () => {
    const p = pub(), n = Store.count(), eq = Store.get("equipe") || [];
    const pubBtn = k => '<button class="pubbtn" data-act="pub" data-v="' + k + '" aria-pressed="' + (p === k) + '"><span class="pubico" aria-hidden="true">' + C.publics[k].ico + '</span><span>' + esc(L(C.publics[k])) + '</span></button>';
    const lgBtn = (v, l) => '<button class="btn mini" data-act="lang" data-v="' + v + '" aria-pressed="' + (lang() === v) + '">' + l + '</button>';
    return '<div class="hero">' + Art.accueil(nuit()) + '<div class="hero-titre"><span class="kicker">' + esc(L(C.accueil.kicker)) + '</span><h1>' + esc(L(C.accueil.titre)) + '</h1></div></div>' +
      '<p class="accroche">' + esc(L(pick(C.accueil.sous))) + '</p>' +
      '<ul class="promesses" aria-label="En bref">' + C.accueil.promesses.map(x => '<li><b>' + x.n + '</b>' + esc(L(x)) + '</li>').join("") + '</ul>' +
      '<section class="card"><h3>' + esc(L({ fr: "Qui joue ?", en: "Who's playing?", kr: "Kisa i zoué ?" })) + '</h3><div class="pubs" role="group" aria-label="Public">' + pubBtn("famille") + pubBtn("soiree") + pubBtn("classe") + '</div>' +
      '<p class="small dim pubdesc">' + esc(L(C.publics[p].desc)) + '</p></section>' +
      '<section class="card ligne"><h3>' + esc(L({ fr: "Langue des voix", en: "Voice language", kr: "Lang bann vwa" })) + '</h3><div class="seg">' + lgBtn("fr", "Français") + lgBtn("kr", "Kréol") + lgBtn("en", "English") + '</div></section>' +
      '<section class="card ligne"><h3>' + esc(L({ fr: "Joueurs sur ce téléphone", en: "Players on this phone", kr: "Zouèr si sa téléfone" })) + '</h3><button class="btn sec" data-act="equipe">👥 ' + (eq.length ? eq.map(esc).join(", ") : esc(L({ fr: "1 à 5 enfants : ajouter les prénoms", en: "1 to 5 kids: add names" }))) + '</button></section>' +
      '<p class="small dim center">' + esc(L({ fr: "≈ 30 à 40 min (à mesurer sur place) · aucune donnée envoyée", en: "≈ 30-40 min · no data sent" })) + '</p>' +
      dock(btn((n > 0 && n < 5 ? "🐢 " + esc(L(C.UI.continuer)) + " (" + n + "/5)" : "🐢 " + esc(L(C.UI.commencer))), "start", "big"));
  };
  AFTER.accueil = () => { };

  // ===================== INTRO =====================
  SCREENS.intro = step => {
    const i = Math.max(0, Math.min(C.intro.length - 1, +step || 0)), t = C.intro[i], last = i === C.intro.length - 1;
    return '<h2 class="sr-only">Histoire</h2><div class="intro-scene ' + (t.qui === "kawann" ? "k" : "j") + '"><div class="intro-art">' + (i === 0 ? '<div class="radar" aria-hidden="true"></div>' : "") + avatar(t.qui, t.expr, "grand") + '</div>' + bulle("intro" + i, t, { seul: true }) + '</div>' +
      '<div class="dots" aria-label="Étape ' + (i + 1) + ' sur ' + C.intro.length + '">' + C.intro.map((x, k) => '<i class="' + (k === i ? "on" : "") + '"></i>').join("") + '</div>' +
      dock(last ? btn("🗺️ " + ui("parcours"), "hub") : btn(ui("suite") + " ➜", "intro", "", { i: i + 1 }));
  };

  // ===================== HUB : les 5 bassins =====================
  SCREENS.hub = () => {
    const f = Store.faits(), n = Store.count();
    const rows = C.stations.map((S, k) => '<li class="st ' + (f[S.id] ? "fait" : "") + '"><button class="station" data-act="station" data-id="' + S.id + '"><span class="num" aria-hidden="true">' + (f[S.id] ? "✓" : S.id) + '</span><span class="st-t"><b>' + S.ico + " " + esc(L(S.titre)) + '</b><small>📍 ' + esc(LF(S.lieu)) + '</small></span><span class="go" aria-hidden="true">' + (f[S.id] ? "★" : "➜") + '</span></button></li>' + (k < 4 ? '<li class="sentier" aria-hidden="true"></li>' : "")).join("");
    const t = n === 0 ? { qui: "jo", expr: "clin", fr: "Choisis un bassin. Sur place, scanne le QR code du panneau avec l'appareil photo ; ici, touche simplement le bassin.", kr: "Swazi in basin. Si plas, skann lo KR kod ék lapareil foto ; isi, tous zis lo basin.", en: "Pick a pool. On site, scan the sign's QR code with your camera; here, just tap the pool." }
      : n === 5 ? { qui: "kawann", expr: "fete", fr: "Les 5 indices sont trouvés ! Ouvre mon dossier de soin.", kr: "Lé 5 lindis lé trouvé ! Ouv mon dosié swin.", en: "All 5 clues found! Open my care file." }
        : { qui: "kawann", expr: "content", fr: "Encore " + (5 - n) + " bassin" + (5 - n > 1 ? "s" : "") + " ! L'ordre n'a pas d'importance.", kr: "Ankor " + (5 - n) + " basin ! Lord lé pa inportan.", en: (5 - n) + " pool" + (5 - n > 1 ? "s" : "") + " to go! Any order." };
    return '<span class="kicker">' + esc(L({ fr: "L'enquête", en: "The investigation", kr: "Lankèt" })) + '</span><h2>' + esc(L({ fr: "Les bassins de Kélonia", en: "Kélonia's pools", kr: "Bann basin Kélonia" })) + '</h2>' +
      '<div class="progress" role="img" aria-label="' + n + ' indices sur 5"><i style="width:' + n * 20 + '%"></i><span>' + n + ' / 5 ' + esc(L({ fr: "indices", en: "clues", kr: "lindis" })) + '</span></div>' +
      bulle("hub", t) + '<ul class="stations">' + rows + '</ul>' +
      '<p class="note small">🔗 ' + esc(L({ fr: "Chaque QR code ouvre son bassin :", en: "Each QR code opens its pool:" })) + ' <b>?station=1</b> … <b>?station=5</b></p>' +
      (n >= 5 ? dock(btn("📋 " + ui("dossier"), "go", "big", { r: "dossier" })) : n > 0 ? dock(btn("📋 " + esc(L({ fr: "Voir le dossier (" + n + "/5)", en: "See the file (" + n + "/5)", kr: "Oir lo dosié" })), "go", "sec", { r: "dossier" })) : "");
  };

  // ===================== STATIONS =====================
  const ST = id => C.stations[id - 1];
  function enTete(S) {
    return '<span class="kicker">' + esc(L(C.UI.station)) + " " + S.id + " " + esc(L(C.UI.sur)) + ' 5 · 📍 ' + esc(LF(S.lieu)) + '</span><h2><span aria-hidden="true">' + S.ico + '</span> ' + esc(L(S.titre)) + '</h2>';
  }
  function tourEquipe() {
    const eq = Store.get("equipe") || []; if (eq.length < 2) return "";
    const nom = eq[(Store.get("tour") || 0) % eq.length];
    return '<div class="tour">📱 ' + esc(L(C.UI.tourDe)) + ' <b>' + esc(nom) + '</b> ' + esc(L(C.UI.tenir)) + '</div>';
  }
  function classeBox(S) {
    if (pub() !== "classe") return "";
    const c = S.classe;
    return '<section class="classe-box"><h3>🎓 Pour la classe</h3><p><b>Notion :</b> ' + esc(c.notion) + '</p><p class="mots">' + c.mots.map(m => '<span>' + esc(m) + '</span>').join("") + '</p><p><b>À débattre :</b> ' + esc(c.q) + '</p></section>';
  }
  function stationScreen(id, step) {
    const S = ST(id);
    if (step === "brief") return enTete(S) + tourEquipe() + bulle("st" + id + "-brief", S.brief) + classeBox(S) +
      '<div class="consigne"><b>🎯 ' + esc(L({ fr: "Ta mission", en: "Your mission", kr: "Out misyon" })) + '</b><p>' + esc(LF(S.consigne)) + '</p></div>' + dock(btn(ui("pret") + " ➜", "go", "big", { r: "st" + id, s: "jeu" }));
    if (step === "jeu") return enTete(S) + '<p class="consigne-courte">' + esc(LF(S.consigne)) + '</p><div id="jeuhost"></div>' +
      (demoMode ? dock(btn("⏭ Résoudre (démo)", "resoudre", "sec"), "discret") : "");
    if (step === "quiz") {
      const q = S.quiz;
      return enTete(S) + '<div class="card question"><h3>❓ ' + esc(LF(q.q)) + '</h3></div><div class="opts" id="opts">' +
        q.opts.map((o, i) => '<button class="opt" data-act="rep" data-i="' + i + '"><span class="lettre">' + "ABC"[i] + '</span><span>' + esc(LF(o)) + '</span></button>').join("") + '</div><div id="fb" aria-live="polite"></div>' +
        dock('<p class="small dim center" style="margin:0">' + esc(L({ fr: "Choisis une réponse", en: "Choose an answer", kr: "Swazi in répons" })) + '</p>', "discret");
    }
    if (step === "info") {
      if (!Store.faits()[id]) Store.fait(id, true); // l'indice est acquis dès l'affichage (le dossier peut s'ouvrir tout de suite)
      const E = C.especes[S.espece], st = C.statuts[E.statut], tous = Store.count() >= 5;
      return '<span class="kicker">' + esc(L(C.UI.indice)) + '</span><h2>' + S.ico + " " + esc(L(S.titre)) + '</h2>' +
        '<div class="indice-papier"><span class="trombone" aria-hidden="true"></span><small>' + esc(L({ fr: "Dossier de soin · indice " + id + "/5", en: "Care file · clue " + id + "/5" })) + '</small><p>' + esc(L(S.indice)) + '</p></div>' +
        bulle("st" + id + "-fin", S.fin) +
        '<section class="card"><h3>💡 ' + esc(L(C.UI.savais)) + '</h3><p>' + esc(LF(S.fait)) + '</p>' + src(S.fait.src) + '</section>' +
        '<button class="carte-gain" data-act="go" data-r="carnet"><span class="cg-art">' + Art.espece(S.espece, E.couleur) + '</span><span><small>' + esc(L(C.UI.carte)) + '</small><b>' + esc(LF(E.nom)) + '</b><i>' + esc(E.latin) + '</i><span class="statut" style="--c:' + st.c + '">' + esc(L({ fr: "Monde", en: "World" })) + ' : ' + esc(LF(st)) + '</span><span class="statut" style="--c:' + C.statuts[E.reg].c + '">' + esc(L({ fr: "La Réunion", en: "Réunion" })) + ' : ' + esc(LF(C.statuts[E.reg])) + '</span></span></button>' +
        dock(tous ? btn("📋 " + ui("dossier"), "go", "big", { r: "dossier" }) : btn("🗺️ " + ui("retourParcours"), "hub", "big"));
    }
    return "";
  }
  for (let i = 1; i <= 5; i++) {
    SCREENS["st" + i] = step => stationScreen(i, step || "brief");
    AFTER["st" + i] = step => {
      if (step === "brief") { Store.set("tour", (Store.get("tour") || 0) + 1); }
      if (step === "jeu") {
        const S = ST(i);
        jeu = Games.mount(S.jeu, document.getElementById("jeuhost"), { lang: lang(), nuit: nuit(), onWin: () => { go("st" + i, S.quiz ? "quiz" : "info"); } });
      }
      if (step === "info") { topbar(); Audio2.Sfx.indice(); Audio2.vibre([50, 30, 50]); bullesFete(); }
    };
  }
  function repondre(i) {
    const S = ST(+route.n.slice(2)), q = S.quiz, opts = $screen.querySelectorAll(".opt"), fb = document.getElementById("fb");
    if (opts[i].classList.contains("ok")) return;
    if (i === q.ok) {
      opts.forEach(o => o.disabled = true); opts[i].classList.add("ok"); Audio2.Sfx.ok(); Audio2.vibre(60);
      fb.innerHTML = '<div class="feedback ok"><span class="ic">✅</span>' + esc(LF(q.bravo)) + '</div>';
      $screen.querySelector(".dock").innerHTML = btn(ui("suite") + " ➜", "go", "big", { r: route.n, s: "info" });
      $screen.querySelector(".dock").classList.remove("discret");
    } else {
      opts[i].classList.add("ko"); opts[i].disabled = true; Audio2.Sfx.ko(); Audio2.vibre(120);
      fb.innerHTML = '<div class="feedback ko"><span class="ic">🔁</span>' + esc(LF(q.rate)) + '</div>';
    }
  }

  // ===================== DOSSIER DE SOIN =====================
  SCREENS.dossier = () => {
    const f = Store.faits(), D = C.dossier, complet = Store.count() >= 5;
    const court = s => s.replace(/^[^:]{3,48}?\s?:\s/, "");
    const rep = ids => ids.map(id => f[id] ? '<li class="ok">✔ ' + esc(court(L(ST(id).indice))) + '</li>' : '<li class="vide">' + esc(L({ fr: "Indice du bassin " + id + " à trouver…", en: "Clue from pool " + id + " to find…", kr: "Lindis basin " + id + " pou trouv…" })) + '</li>').join("");
    return '<span class="kicker">' + esc(L({ fr: "Centre de soins de Kélonia", en: "Kélonia care centre", kr: "Sant swin Kélonia" })) + '</span><h2>📋 ' + esc(L(D.titre)) + '</h2>' +
      '<div class="dossier ' + (complet ? "complet" : "") + '"><div class="dossier-tete">' + Art.kawann(complet ? "content" : "triste", "mini", { pansement: true }) +
      '<dl><dt>' + esc(L({ fr: "Nom", en: "Name", kr: "Non" })) + '</dt><dd>Kawann <small>(fictif)</small></dd><dt>' + esc(L({ fr: "Espèce", en: "Species", kr: "Lèspès" })) + '</dt><dd>' + esc(LF(C.especes.caouanne.nom)) + '</dd><dt>' + esc(L({ fr: "Carapace", en: "Shell", kr: "Karapas" })) + '</dt><dd>' + (f[4] ? "62 cm*" : "—") + '</dd></dl></div>' +
      D.q.map((q, k) => '<section class="dq"><h3>' + esc(L(q)) + '</h3><ul>' + rep([[1], [2], [3, 4, 5]][k]) + '</ul></section>').join("") +
      (complet ? '<div class="tampon" aria-label="' + esc(L(D.tampon)) + '"><span>' + esc(L(D.tampon)) + '</span><small>Jo · ' + new Date().toLocaleDateString("fr-FR") + '</small></div>' : "") +
      '<p class="mini-note">* ' + esc(L({ fr: "valeur inventée pour le jeu", en: "made-up value", kr: "valèr envanté" })) + '</p></div>' +
      (complet ? bulle("dossier", D.bulle) + dock(btn("🌊 " + ui("relacher"), "go", "big", { r: "relacher" })) : '<p class="note">' + esc(L(D.manque)) + '</p>' + dock(btn("🗺️ " + ui("retourParcours"), "hub", "big")));
  };
  AFTER.dossier = () => { if (Store.count() >= 5) setTimeout(() => { const t = $screen.querySelector(".tampon"); if (t) { t.classList.add("frappe"); Audio2.Sfx.clic(); Audio2.vibre(90); } }, 500); };

  // ===================== RELÂCHER =====================
  SCREENS.relacher = () => '<span class="kicker">' + esc(L({ fr: "Le grand jour", en: "The big day", kr: "Lo gran zour" })) + '</span><h2>🌊 ' + esc(L({ fr: "Retour à la mer", en: "Back to the sea", kr: "Rotour la mèr" })) + '</h2>' +
    '<div class="relacher-box" id="relbox">' + Art.relacher(nuit()) + '</div>' + bulle("relacher", C.relacher.bulle) +
    '<section class="card"><h3>💡 ' + esc(L(C.UI.savais)) + '</h3><p>' + esc(LF(C.relacher.fait)) + '</p>' + src(C.relacher.fait.src) + '</section>' +
    dock(btn("🏅 " + ui("diplome"), "go", "big", { r: "diplome" }));
  AFTER.relacher = () => { setTimeout(() => { const b = document.getElementById("relbox"); if (b) b.classList.add("go"); Audio2.Sfx.vague(); }, 400); setTimeout(() => { Audio2.Sfx.fanfare(); bullesFete(); }, 2600); };

  // ===================== DIPLÔME =====================
  function nomDiplome() { const eq = Store.get("equipe") || []; return Store.get("nom") || (eq.length ? eq.join(" · ") : ""); }
  function diplomeSVG() {
    const f = Store.faits();
    return Art.diplome({ nom: nomDiplome(), date: new Date().toLocaleDateString(lang() === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Indian/Reunion" }), tampons: [1, 2, 3, 4, 5].map(i => !!f[i]), langue: lang() });
  }
  SCREENS.diplome = () => '<span class="kicker">' + esc(L({ fr: "Mission accomplie", en: "Mission complete", kr: "Misyon fini" })) + '</span><h2>🏅 ' + esc(L({ fr: "Soigneur junior de Kélonia", en: "Kélonia junior keeper", kr: "Ti soignèr Kélonia" })) + '</h2>' +
    '<section class="card"><h3><label for="nom">✍️ ' + esc(L({ fr: "Prénom(s) sur le diplôme", en: "Name(s) on the certificate", kr: "Non si lo diplom" })) + '</label></h3><input class="field" id="nom" maxlength="40" autocomplete="off" placeholder="' + esc(L({ fr: "Ton prénom", en: "Your name", kr: "Out non" })) + '" value="' + esc(nomDiplome()) + '"></section>' +
    '<div class="diplome-wrap" id="diplome">' + diplomeSVG() + '</div>' +
    '<div class="rang-btn">' + btn("🖨️ " + esc(L({ fr: "Imprimer", en: "Print", kr: "Inprim" })), "print", "sec") + btn("🖼️ " + esc(L({ fr: "Enregistrer l'image", en: "Save image", kr: "Gard limaz" })), "png", "sec") + '</div>' +
    dock(btn("➜ " + ui("fin"), "go", "big", { r: "fin" }));
  AFTER.diplome = () => {
    const i = document.getElementById("nom");
    if (i) i.addEventListener("input", () => { Store.set("nom", i.value.trim()); document.getElementById("diplome").innerHTML = diplomeSVG(); });
  };
  function exportPNG() {
    const svg = diplomeSVG(), img = new Image(), blob = new Blob([svg], { type: "image/svg+xml" }), url = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = 1600; c.height = 1120; const x = c.getContext("2d"); x.drawImage(img, 0, 0, 1600, 1120); URL.revokeObjectURL(url);
      c.toBlob(b => {
        const f = new File([b], "diplome-soigneur-junior-kelonia.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: "Soigneur junior de Kélonia" }).catch(() => { }); return; }
        const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); toast("Image enregistrée ✓");
      }, "image/png");
    };
    img.src = url;
  }

  // ===================== FIN =====================
  SCREENS.fin = () => '<span class="kicker">' + esc(L({ fr: "Et maintenant ?", en: "What now?", kr: "É astèr ?" })) + '</span><h2>🐢 ' + esc(L({ fr: "Kawann compte sur toi", en: "Kawann counts on you", kr: "Kawann i kont si ou" })) + '</h2>' +
    bulle("secret", C.fin.secret) +
    '<section class="card"><h3>🏠 ' + esc(L({ fr: "Mes gestes pour les tortues", en: "What I can do", kr: "Mon bann zès" })) + '</h3><ul class="gestes">' + C.fin.gestes.map(g => '<li><span aria-hidden="true">' + g.ico + '</span><span>' + esc(LF(g)) + ' <small class="src-i">[' + g.src + ']</small></span></li>').join("") + '</ul></section>' +
    '<section class="card parrain"><h3>💛 ' + esc(L({ fr: "Parrainer une tortue", en: "Sponsor a turtle", kr: "Parin in tortu" })) + '</h3><p>' + esc(L({ fr: "Le service éducatif de Kélonia propose aux classes de parrainer à distance une tortue soignée et de suivre son retour en mer (renseignements sur place). À la boutique, la gamme « Citoyen » participe au financement de la recherche et de la conservation.", en: "Kélonia's education team offers schools a remote sponsorship of a turtle in care, to follow its return to the sea (ask on site). In the shop, the “Citoyen” range helps fund research and conservation." })) + '</p>' +
    '<a class="btn" href="https://museesreunion.fr/kelonia/" target="_blank" rel="noopener">' + esc(L({ fr: "Découvrir Kélonia", en: "Discover Kélonia", kr: "Dékouv Kélonia" })) + ' ↗</a>' + src("K1 · K2") + '</section>' +
    '<section class="card"><h3>💬 ' + esc(L({ fr: "Racontez votre visite", en: "Tell us about your visit", kr: "Rakont out vizit" })) + '</h3><p>' + esc(L({ fr: "Votre avis, quel qu'il soit, aide Kélonia à améliorer l'aventure. La même invitation est faite à tous les visiteurs.", en: "Your opinion, whatever it is, helps Kélonia improve. Every visitor gets the same invitation." })) + '</p>' + btn(esc(L({ fr: "Donner mon avis", en: "Give feedback", kr: "Donn mon lavi" })), "avis", "sec") + '</section>' +
    '<div class="rang-btn">' + btn("🃏 " + esc(L({ fr: "Mon carnet", en: "My cards", kr: "Mon karné" })), "go", "sec", { r: "carnet" }) + btn("🏅 " + ui("diplome"), "go", "sec", { r: "diplome" }) + '</div>' +
    dock(btn("🔁 " + esc(L({ fr: "Rejouer", en: "Play again", kr: "Rozoué" })), "reset", "sec") + btn("ℹ️ " + esc(L({ fr: "Crédits", en: "Credits", kr: "Kredi" })), "credits", "sec"), "flow");

  // ===================== CARNET DE COLLECTION =====================
  SCREENS.carnet = () => {
    const f = Store.faits();
    return '<span class="kicker">' + esc(L({ fr: "Carnet de collection", en: "Collection", kr: "Karné" })) + '</span><h2>🃏 ' + esc(L({ fr: "Les 5 tortues de La Réunion", en: "Réunion's 5 sea turtles", kr: "Lé 5 tortu La Rényon" })) + '</h2>' +
      '<p class="small dim">' + esc(L({ fr: "Cinq espèces dans les eaux de La Réunion : deux fréquentent régulièrement les côtes, trois sont rares et observées au large. Une carte par bassin réussi.", en: "Five species around Réunion: two regularly visit the coast, three are rare offshore. One card per pool." })) + ' <small class="src-i">[K3]</small></p><div class="cartes">' +
      C.stations.map(S => {
        const E = C.especes[S.espece], ok = !!f[S.id], st = C.statuts[E.statut], rg = C.statuts[E.reg];
        return '<article class="carte ' + (ok ? "" : "verrou") + '"><div class="carte-art">' + Art.espece(S.espece, E.couleur, !ok) + '</div>' + (ok ?
          '<h3>' + esc(LF(E.nom)) + '</h3><i>' + esc(E.latin) + '</i><p>' + esc(LF(E.presence)) + '</p><p>' + esc(LF(E.trait)) + '</p><span class="statut" style="--c:' + st.c + '">' + esc(L({ fr: "Monde", en: "World" })) + ' : ' + esc(LF(st)) + '</span><span class="statut" style="--c:' + rg.c + '">' + esc(L({ fr: "La Réunion", en: "Réunion" })) + ' : ' + esc(LF(rg)) + '</span>'
          : '<h3>???</h3><p class="small">' + esc(L({ fr: "Réussis le bassin " + S.id + " pour la débloquer.", en: "Complete pool " + S.id + " to unlock." })) + '</p>') + '</article>';
      }).join("") + '</div><p class="note small">' + esc(L({ fr: "Statuts de la Liste rouge de l'UICN : « Monde » (évaluation mondiale ; tortue verte réévaluée en 2025) et « La Réunion » (Liste rouge régionale, 2010). Une espèce peut aller mieux à l'échelle du monde et rester menacée ici : c'est le cas de la tortue verte.", en: "IUCN Red List status: World (global assessment; green turtle reassessed in 2025) and Réunion (regional list, 2010). A species can do better worldwide yet remain threatened here: that's the case of the green turtle." })) + ' <small class="src-i">[K11]</small></p>' +
      dock(btn("🗺️ " + ui("retourParcours"), "hub", "sec") + btn("➜ " + ui("fin"), "go", "sec", { r: "fin" }), "flow");
  };

  // ===================== FICHE ENSEIGNANT (imprimable) =====================
  SCREENS.fiche = () => '<article class="doc fiche">' +
    '<div class="bandeau-relire">À RELIRE PAR LE SERVICE ÉDUCATIF DE KÉLONIA · version de travail du 30/10/2026</div>' +
    '<h2>Fiche enseignant · « Le dossier Kawann »</h2><p class="doc-sous">Aventure sur téléphone, cycle 3 (CM1, CM2, 6e) · Kélonia, Saint-Leu · 1 téléphone pour 2 à 5 élèves</p>' +
    '<h3>Objectifs</h3><ul><li>Découvrir le travail du centre de soins de Kélonia : radiographie, mesures, convalescence, relâcher.</li><li>Classer la tortue marine parmi les reptiles à partir de caractères partagés (écailles, quatre membres, respiration pulmonaire).</li><li>Situer la tortue caouanne dans une chaîne alimentaire (plancton → méduse → caouanne).</li><li>Identifier des impacts humains (pêche, plastique, lumière, vitesse des bateaux) et des gestes pour les réduire.</li><li>Pratiquer une démarche d\'enquête : observer, compter, comparer, conclure (photo-identification).</li></ul>' +
    '<h3>Liens avec le programme de sciences et technologie du cycle 3</h3><p class="small">Nouveau programme publié au BO n° 24 du 11 juin 2026 : en vigueur en CM1 dès 2026-2027, en CM2 et en 6e en 2027-2028 (programme de 2023 d\'ici là). Domaine « Les êtres vivants dans leur environnement » :</p><ul><li><b>Unité et diversité du vivant</b> (classification, liens de parenté) : bassins 3 et 4.</li><li><b>Écosystèmes</b> (relations alimentaires, effets des activités humaines) : bassins 1, 2 et 5.</li></ul><p class="mini-note">Intitulés exacts et attendus à vérifier dans le texte officiel avant diffusion [K14].</p>' +
    '<h3>Déroulé (≈ 45 min sur place, à ajuster)</h3><ol><li>Accueil, constitution des équipes, choix du public « Classe cycle 3 » (2 min).</li><li>Bassins 1 à 5 dans l\'ordre libre, 6 à 8 min chacun : consigne, mini-jeu, encadré « Pour la classe » à débattre.</li><li>Dossier de soin complété, relâcher, diplôme (5 min).</li><li>Mise en commun avec le médiateur (10 min) : les trois questions de l\'enquête.</li></ol>' +
    '<h3>Corrigés</h3><table><tr><th>Bassin</th><th>Réponse attendue</th></tr>' +
    '<tr><td>1 · Radio</td><td>Hameçon ; il vient d\'une ligne de pêche (capture accidentelle). Entre 1998 et 2023, plus de 7 tortues sur 10 accueillies avaient avalé un hameçon [K4].</td></tr>' +
    '<tr><td>2 · Tri</td><td>À retirer : sac plastique, fil de pêche, bouteille, ballon. À laisser : méduse, crabe, coquillage (régime de la caouanne [K12]). Le sac ressemble à une méduse [K16].</td></tr>' +
    '<tr><td>3 · Photo-ID</td><td>4 écailles derrière l\'œil ; fiche B (même dessin). La fiche C a aussi 4 écailles mais une rangée suivante différente [K5].</td></tr>' +
    '<tr><td>4 · Contrôle</td><td>Carapace mesurée (valeur fictive) ; la tortue remonte pour respirer : elle a des poumons, c\'est un reptile [K3].</td></tr>' +
    '<tr><td>5 · Plage</td><td>Éteindre ou remplacer par une lumière jaune tournée vers le sol : les bébés tortues rejoignent la mer [K6] [K7] [K9].</td></tr></table>' +
    '<h3>Point de vigilance</h3><p>Kawann « parle » : c\'est une convention de fiction, annoncée aux élèves dès l\'intro. À reprendre en classe : une tortue marine ne parle pas, ne se fait pas d\'« amis » et ne reconnaît pas ses soigneurs ; l\'histoire de Kawann est inventée, mais plausible d\'après les données de Kélonia [K4].</p>' +
    '<h3>Avant la visite</h3><ul><li>Lister ce que les élèves savent des tortues marines ; noter leurs questions.</li><li>Rappeler la différence entre reptile, poisson et mammifère.</li><li>Ressources du service éducatif de Kélonia (« Découvrir les tortues marines », cycles 1 à 3) [K8].</li></ul>' +
    '<h3>Après la visite</h3><ul><li>Construire la chaîne alimentaire de la caouanne et y placer le plastique.</li><li>Réaliser une affiche « Les gestes qui protègent les tortues » ; lien possible avec le parrainage à distance proposé aux classes par Kélonia [K2].</li><li>Enquête à la maison : quelles lumières restent allumées la nuit dans mon quartier ?</li></ul>' +
    '<p class="mini-note">Sources détaillées : SOURCES.md. Personnages et mesures de Kawann fictifs. Document de travail, non validé.</p></article>' +
    dock(btn("🖨️ Imprimer la fiche", "print", "sec") + btn("🏠 Accueil", "accueil", "sec"), "flow noprint");

  // ===================== QR CODES (pour l'équipe) =====================
  function baseURL() { return Store.get("baseqr") || (location.origin + location.pathname); }
  function qrCartes() {
    const b = baseURL(), sep = b.includes("?") ? "&" : "?";
    const liste = [{ c: "", t: "Accueil de l'aventure", l: "Entrée / billetterie (à définir)" }].concat(C.stations.map(S => ({ c: String(S.id), t: S.ico + " " + S.id + " · " + S.titre.fr, l: S.lieu.fr }))).concat([{ c: "fiche", t: "Fiche enseignant", l: "Pour les classes" }]);
    return liste.map(x => { const url = b + (x.c ? sep + "station=" + x.c : ""); return '<article class="qrcarte">' + QR.svg(url, { taille: 180 }) + '<h3>' + esc(x.t) + '</h3><p class="small">📍 ' + esc(x.l) + '</p><code>' + esc(url) + '</code></article>'; }).join("");
  }
  SCREENS.qr = () => '<span class="kicker noprint">Pour l\'équipe de Kélonia</span><h2>🔳 QR codes des bassins</h2>' +
    '<p class="small noprint">Générés <b>sur ce téléphone</b> (aucun service en ligne). À imprimer, plastifier et fixer près de chaque bassin. Le scan avec l\'appareil photo ouvre directement la bonne station ; une fois l\'aventure chargée, tout fonctionne sans réseau.</p>' +
    '<div class="card noprint"><label for="base" class="small"><b>Adresse du site</b> (celle qui sera hébergée)</label><input class="field" id="base" value="' + esc(baseURL()) + '"></div>' +
    '<div class="qrgrille" id="qrg">' + qrCartes() + '</div>' + dock(btn("🖨️ Imprimer les QR codes", "print", "sec") + btn("🏠 Accueil", "accueil", "sec"), "flow noprint");
  AFTER.qr = () => { const i = document.getElementById("base"); if (i) i.addEventListener("change", () => { Store.set("baseqr", i.value.trim()); document.getElementById("qrg").innerHTML = qrCartes(); toast("QR codes régénérés ✓"); }); };

  // ===================== POUR KÉLONIA (mode présentation) =====================
  function graphe() { // données FICTIVES de démonstration
    const sem = [42, 58, 51, 77, 64, 96, 88, 120], max = 130, w = 300, h = 120, bw = 26;
    const barres = sem.map((v, i) => '<rect x="' + (14 + i * 36) + '" y="' + (h - v / max * h) + '" width="' + bw + '" height="' + (v / max * h) + '" rx="5" fill="' + (i === 5 ? "#ff6f59" : "#0f8a96") + '"/><text x="' + (14 + i * 36 + bw / 2) + '" y="' + (h + 16) + '" text-anchor="middle" font-size="11" fill="currentColor">S' + (i + 1) + '</text>').join("");
    const pubs = [["Famille", 54, "#0f8a96"], ["Soirée", 18, "#e8b04a"], ["Classe", 28, "#ff6f59"]];
    const lgs = [["FR", 71], ["KR", 17], ["EN", 12]];
    const fun = [["Accueil", 100], ["Bassin 1", 92], ["Bassin 3", 81], ["Bassin 5", 74], ["Diplôme", 68]];
    return '<div class="dash"><p class="fictif">DONNÉES FICTIVES DE DÉMONSTRATION</p>' +
      '<h4>Parties lancées par semaine</h4><svg viewBox="0 -24 310 164" class="graphe" role="img" aria-label="Histogramme fictif">' + barres + '<text x="2" y="-10" font-size="12" fill="#e0553f" font-weight="700">■ S6 = semaine avec une soirée « Jours de la Nuit »</text></svg>' +
      '<div class="dash2"><div><h4>Publics</h4>' + pubs.map(p => '<div class="barre"><span>' + p[0] + '</span><i style="width:' + p[1] + '%;background:' + p[2] + '"></i><b>' + p[1] + ' %</b></div>').join("") + '</div>' +
      '<div><h4>Langue des voix</h4>' + lgs.map(p => '<div class="barre"><span>' + p[0] + '</span><i style="width:' + p[1] + '%"></i><b>' + p[1] + ' %</b></div>').join("") + '</div></div>' +
      '<h4>Jusqu\'où vont les joueurs</h4>' + fun.map(p => '<div class="barre"><span>' + p[0] + '</span><i style="width:' + p[1] + '%"></i><b>' + p[1] + ' %</b></div>').join("") +
      '<p class="mini-note">Proposition : comptages anonymes uniquement, sans cookie ni donnée personnelle (à valider avec la RMR et son DPO).</p></div>';
  }
  function editeur() {
    const opts = C.stations.map(S => '<option value="st' + S.id + '-brief">Bassin ' + S.id + ' · ' + esc(S.titre.fr) + ' (consigne de Jo)</option>').join("") + '<option value="intro0">Intro · appel de Kawann</option>';
    return '<div class="editeur"><p class="fictif">MAQUETTE · les modifications restent sur ce téléphone</p><label class="small" for="ed-id"><b>Texte à modifier</b></label><select class="field" id="ed-id">' + opts + '</select>' +
      '<div class="seg ed-lg" role="group" aria-label="Langue"><button class="btn mini" data-act="edlg" data-v="fr" aria-pressed="true">FR</button><button class="btn mini" data-act="edlg" data-v="kr" aria-pressed="false">KR</button><button class="btn mini" data-act="edlg" data-v="en" aria-pressed="false">EN</button></div>' +
      '<textarea class="field" id="ed-txt" rows="4"></textarea><p class="small dim" id="ed-cpt"></p><div class="ed-apercu" id="ed-ap"></div>' +
      '<div class="rang-btn">' + btn("💾 Enregistrer", "edsave", "") + btn("↩️ Texte d'origine", "edreset", "sec") + '</div></div>';
  }
  SCREENS.kelonia = () => '<span class="kicker">Mode présentation</span><h2>🏛️ Ce que Kélonia obtient</h2>' +
    '<ul class="obtient">' + [
      ["🌙", "Une aventure pour vos soirées", "Jo, le soigneur de nuit, joué en direct par Jonathan lors des « Jours de la Nuit » ou de la Nuit des musées ; personnage dessiné et voix le reste de l'année."],
      ["📱", "Un parcours permanent par QR code", "Sans application à télécharger, sans compte, et qui fonctionne sans réseau une fois ouvert."],
      ["🗣️", "Français, créole, anglais", "Voix enregistrées par Jonathan et des voix créoles choisies avec vous (à venir) ; le texte reste toujours affiché à l'écran, comme des sous-titres."],
      ["🎓", "Une version cycle 3 relue par vous", "Consignes scolaires, mots-clés, fiche enseignant ; vous gardez la main sur les contenus."],
      ["♿", "Accessible", "Taille du texte, contraste « plein soleil », lecture facilitée, boutons larges, jouable au clavier, respect de « moins d'animations »."],
      ["👥", "1 téléphone pour 1 à 5 enfants", "Mode équipe : l'appli indique à qui passer le téléphone à chaque bassin."]
    ].map(x => '<li><span aria-hidden="true">' + x[0] + '</span><span><b>' + esc(x[1]) + '</b><br>' + esc(x[2]) + '</span></li>').join("") + '</ul>' +
    '<section class="card"><h3>✏️ Vos textes, modifiables par votre équipe</h3>' + editeur() + '</section>' +
    '<section class="card"><h3>📊 Tableau de bord de fréquentation</h3>' + graphe() + '</section>' +
    '<section class="card"><h3>🧭 Raccourcis</h3><div class="rang-btn">' + btn("🔳 QR codes", "go", "sec", { r: "qr" }) + btn("🎓 Fiche enseignant", "go", "sec", { r: "fiche" }) + btn("🌙 Version soirée", "saut", "sec", { n: "st5", s: "brief", p: "soiree" }) + btn("🃏 Carnet", "go", "sec", { r: "carnet" }) + '</div></section>' +
    '<section class="card"><h3>🏛️ Et ailleurs dans le réseau RMR ?</h3><p>Le même moteur peut accueillir une enquête à Stella Matutina, à la Cité du Volcan ou au MADOI, avec ses propres personnages et contenus.</p></section>' +
    '<section class="card"><h3>🤝 À construire ensemble</h3><ul class="clean"><li>Relecture scientifique et pédagogique de tous les textes</li><li>Vrais noms des bassins et emplacement des QR codes</li><li>Relecture du créole et enregistrement des voix</li><li>Photos du lieu pour des illustrations fidèles</li></ul></section>' +
    dock(btn("🏠 Accueil", "accueil", "sec") + btn("▶ Jouer", "start", ""), "flow");
  let edLang = "fr";
  function edCharge() {
    const id = document.getElementById("ed-id"); if (!id) return;
    const base = id.value === "intro0" ? C.intro[0] : ST(+id.value.slice(2, 3)).brief, e = (Store.get("edits") || {})[id.value] || {};
    const ta = document.getElementById("ed-txt"); ta.value = e[edLang] != null ? e[edLang] : (base[edLang] || "");
    edApercu();
  }
  function edApercu() {
    const id = document.getElementById("ed-id").value, ta = document.getElementById("ed-txt");
    const base = id === "intro0" ? C.intro[0] : ST(+id.slice(2, 3)).brief;
    document.getElementById("ed-cpt").textContent = ta.value.trim().split(/\s+/).filter(Boolean).length + " mots (conseil : 35 au maximum pour une bulle)";
    document.getElementById("ed-ap").innerHTML = '<div class="guide qui-' + (base.qui || "jo") + ' compact">' + avatar(base.qui || "jo", base.expr, "av") + '<div class="bubble"><div class="who">Aperçu</div><p class="txt">' + esc(ta.value) + '</p></div></div>';
  }
  AFTER.kelonia = () => {
    const id = document.getElementById("ed-id"), ta = document.getElementById("ed-txt");
    if (id) { id.addEventListener("change", edCharge); ta.addEventListener("input", edApercu); edCharge(); }
  };

  // ===================== RÉGLAGES, ÉQUIPE, CRÉDITS =====================
  function closeSheets() { document.querySelectorAll(".sheet").forEach(s => s.remove()); }
  function sheet(label, html) {
    closeSheets();
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-modal", "true"); sh.setAttribute("aria-label", label);
    sh.innerHTML = '<div class="sheet-in">' + html + '</div>'; document.body.appendChild(sh);
    sh.addEventListener("click", e => { if (e.target === sh) closeSheets(); });
    const f = sh.querySelector("[data-focus]") || sh.querySelector("button"); if (f) f.focus();
  }
  const seg = (act, cur, items) => '<div class="seg">' + items.map(i => '<button class="btn mini" data-act="' + act + '" data-v="' + i[0] + '" aria-pressed="' + (String(cur) === String(i[0])) + '">' + i[1] + '</button>').join("") + '</div>';
  function reglages() {
    sheet("Réglages", '<h3>⚙️ Réglages</h3>' +
      '<p class="lab">Public</p>' + seg("pub", pub(), [["famille", "👨‍👩‍👧 Famille"], ["soiree", "🌙 Soirée"], ["classe", "🎓 Classe"]]) +
      '<p class="lab">Langue des bulles et des voix</p>' + seg("lang", lang(), [["fr", "Français"], ["kr", "Kréol"], ["en", "English"]]) +
      '<p class="lab">Affichage' + (nuit() ? " (soirée : écran ambré imposé)" : "") + '</p>' + seg("th", Store.get("theme"), [["lagon", "🌊 Lagon"], ["soleil", "☀️ Plein soleil"]]) +
      '<p class="lab">Taille du texte</p>' + seg("taille", Store.get("taille"), [[1, "A"], [2, "A+"], [3, "A++"]]) +
      '<p class="lab">Lecture facilitée (espacement, pas d\'italique)</p>' + seg("facile", Store.get("facile") ? 1 : 0, [[0, "Non"], [1, "Oui"]]) +
      '<p class="lab">Son et vibrations</p>' + seg("son", Store.get("son") ? 1 : 0, [[1, "🔊 Oui"], [0, "🔇 Non"]]) +
      '<p class="lab">Pour l\'équipe de Kélonia</p><div class="rang-btn">' + btn("🔳 QR codes", "go", "sec", { r: "qr" }) + btn("🎓 Fiche enseignant", "go", "sec", { r: "fiche" }) + btn("🏛️ Pour Kélonia", "go", "sec", { r: "kelonia" }) + '</div>' +
      '<div class="rang-btn">' + btn("ℹ️ Crédits", "credits", "sec") + btn("🔁 Remise à zéro", "reset", "sec") + '</div>' +
      btn("Fermer", "fermer", "", { focus: 1 }));
  }
  function equipe() {
    const eq = Store.get("equipe") || [];
    let champs = ""; for (let i = 0; i < 5; i++) champs += '<input class="field eqn" maxlength="14" autocomplete="off" aria-label="Prénom ' + (i + 1) + '" placeholder="' + (i === 0 ? "Prénom 1" : "Prénom " + (i + 1) + " (facultatif)") + '" value="' + esc(eq[i] || "") + '">';
    sheet("Joueurs", '<h3>👥 Joueurs sur ce téléphone</h3><p class="small">De 1 à 5 enfants. À chaque bassin, l\'appli dit à qui passer le téléphone.</p>' + champs + btn("✔ Valider", "eqok") + btn("Fermer", "fermer", "sec"));
  }
  function credits() {
    sheet("Crédits", '<h3>ℹ️ Crédits</h3><span class="badge alert">PROTOTYPE · CONTENUS À FAIRE RELIRE PAR KÉLONIA</span><ul class="clean">' + C.credits.map(c => "<li>" + esc(c) + "</li>").join("") + '</ul>' + btn("Fermer", "fermer"));
  }

  // ===================== BARRE DE PRÉSENTATION (démo RDV) =====================
  const NOMS_DEMO = { ouverture: "Ouverture", accueil: "Accueil", intro: "Histoire", hub: "Les bassins", st1: "Bassin 1 · radio", st2: "Bassin 2 · tri", st3: "Bassin 3 · photo-ID", st4: "Bassin 4 · mesure", st5: "Bassin 5 · plage", dossier: "Dossier de soin", relacher: "Relâcher", diplome: "Diplôme", fin: "Et après", carnet: "Carnet", fiche: "Fiche enseignant", qr: "QR codes", kelonia: "Pour Kélonia" };
  function updatePresbar() {
    let p = document.getElementById("presbar");
    if (!demoMode) { if (p) p.remove(); document.body.classList.remove("has-presbar"); return; }
    if (!p) { p = document.createElement("nav"); p.id = "presbar"; p.className = "presbar"; p.setAttribute("aria-label", "Barre de démonstration"); document.body.appendChild(p); }
    document.body.classList.add("has-presbar");
    const i = C.demo.findIndex(x => x[0] === route.n && (x[1] || null) === (route.step || null)); if (i >= 0) demoIdx = i;
    const x = C.demo[demoIdx];
    p.innerHTML = '<button data-act="dprev" aria-label="Écran précédent">◀</button><span class="lbl"><b>' + (demoIdx + 1) + '/' + C.demo.length + '</b> ' + esc(NOMS_DEMO[x[0]] || x[0]) + (x[2] ? " · " + C.publics[x[2]].fr : "") + '</span><button data-act="dnext" aria-label="Écran suivant">▶</button>';
  }
  function demoGo(d) {
    demoIdx = Math.max(0, Math.min(C.demo.length - 1, demoIdx + d));
    const x = C.demo[demoIdx];
    if (x[2]) Store.set("public", x[2]); else if (["accueil", "intro", "hub", "ouverture"].includes(x[0])) Store.set("public", "famille");
    // en démo, les bassins « déjà présentés » sont validés pour que le dossier et la fin soient cohérents
    C.demo.forEach((y, k) => { if (k < demoIdx && /^st\d$/.test(y[0])) Store.fait(+y[0].slice(2), true); });
    if (["dossier", "relacher", "diplome", "fin", "carnet"].includes(x[0])) [1, 2, 3, 4, 5].forEach(k => Store.fait(k, true));
    go(x[0], x[1]);
  }

  // ===================== ÉVÉNEMENTS =====================
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    const a = b.dataset.act; Audio2.Sfx.unlock();
    switch (a) {
      case "start": { Audio2.Sfx.bulle(); const premiere = !Store.get("intro"); Store.set("intro", true); premiere ? go("intro", "0") : go("hub"); break; }
      case "accueil": go("accueil"); break;
      case "pub": Store.set("public", b.dataset.v); Audio2.Sfx.tap(); if (b.closest(".sheet")) { go(route.n, route.step, true); reglages(); } else go(route.n, route.step, true); break;
      case "lang": Store.set("lang", b.dataset.v); Audio2.Sfx.tap(); applyTheme(); if (b.closest(".bubble")) majBulles(); else if (b.closest(".sheet")) { go(route.n, route.step, true); reglages(); } else go(route.n, route.step, true); break;
      case "th": Store.set("theme", b.dataset.v); applyTheme(); reglages(); break;
      case "taille": Store.set("taille", +b.dataset.v); applyTheme(); reglages(); break;
      case "facile": Store.set("facile", b.dataset.v === "1"); applyTheme(); reglages(); break;
      case "son": Store.set("son", b.dataset.v === "1"); reglages(); break;
      case "voix": {
        const t = BULLES[b.dataset.bid]; if (!t) break;
        b.classList.add("playing"); setTimeout(() => b.classList.remove("playing"), 1200);
        Audio2.parle(b.dataset.id, lang(), txtBulle(t)).then(r => { if (r === "aucune") toast(lang() === "kr" ? "🎙️ Voix créole à enregistrer : texte à relire avant" : "Voix indisponible sur cet appareil : lis le texte !"); });
        break;
      }
      case "intro": Audio2.Sfx.page(); go("intro", b.dataset.i); break;
      case "hub": go("hub"); break;
      case "station": Audio2.Sfx.bulle(); go("st" + b.dataset.id, "brief"); break;
      case "go": Audio2.Sfx.tap(); go(b.dataset.r, b.dataset.s || null); break;
      case "saut": if (b.dataset.p) Store.set("public", b.dataset.p); go(b.dataset.n, b.dataset.s || null); break;
      case "rep": repondre(+b.dataset.i); break;
      case "resoudre": if (jeu) jeu.solve(); break;
      case "print": window.print(); break;
      case "png": exportPNG(); break;
      case "avis": toast("Lien d'avis à définir avec Kélonia (le même pour tous les visiteurs)."); break;
      case "equipe": equipe(); break;
      case "eqok": { const v = Array.from(document.querySelectorAll(".eqn")).map(i => i.value.trim()).filter(Boolean).slice(0, 5); Store.set("equipe", v); Store.set("tour", 0); closeSheets(); render(); toast(v.length > 1 ? "Mode équipe : " + v.length + " joueurs ✓" : "Joueurs enregistrés ✓"); break; }
      case "reset": if (confirm("Recommencer l'aventure depuis le début ?")) { Store.reset(); closeSheets(); go("accueil"); } break;
      case "reglages": reglages(); break;
      case "fermer": closeSheets(); break;
      case "credits": credits(); break;
      case "edlg": { edLang = b.dataset.v; document.querySelectorAll('[data-act="edlg"]').forEach(x => x.setAttribute("aria-pressed", x === b)); edCharge(); break; }
      case "edsave": { const id = document.getElementById("ed-id").value, ed = Object.assign({}, Store.get("edits")); ed[id] = Object.assign({}, ed[id], { [edLang]: document.getElementById("ed-txt").value }); Store.set("edits", ed); toast("Enregistré ✓ (sur ce téléphone seulement)"); break; }
      case "edreset": { const id = document.getElementById("ed-id").value, ed = Object.assign({}, Store.get("edits")); delete ed[id]; Store.set("edits", ed); edCharge(); toast("Texte d'origine rétabli"); break; }
      case "dprev": demoGo(-1); break;
      case "dnext": demoGo(1); break;
    }
  });
  window.addEventListener("online", topbar); window.addEventListener("offline", topbar);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheets(); if (demoMode && !e.target.closest("input,textarea,select")) { if (e.key === "PageDown") demoGo(1); if (e.key === "PageUp") demoGo(-1); } });

  // ===================== DÉMARRAGE =====================
  function init() {
    const q = new URLSearchParams(location.search);
    if (q.get("theme")) Store.set("theme", q.get("theme"));
    if (q.get("public") && C.publics[q.get("public")]) Store.set("public", q.get("public"));
    if (q.get("lang") && ["fr", "kr", "en"].includes(q.get("lang"))) Store.set("lang", q.get("lang"));
    demoMode = q.get("demo") === "1";
    const s = q.get("station");
    if (/^[1-5]$/.test(s || "")) go("st" + s, "brief");
    else if (s && SCREENS[s] && s !== "ouverture") go(s);
    else if (demoMode) { demoIdx = 0; Store.reset(); Store.set("public", "famille"); go("ouverture"); }
    else go("accueil");
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).then(() => setTimeout(topbar, 300)).catch(() => { });
      navigator.serviceWorker.addEventListener("controllerchange", topbar);
    }
  }
  window.App = { go, route: () => route, jeu: () => jeu, demoGo, Content: C };
  init();
})();
