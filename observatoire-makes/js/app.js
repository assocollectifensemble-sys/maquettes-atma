/* ============================================================
   APP.JS — Navigation, écrans et logique de l'aventure
   « Ti-Fil et la Croix du Sud » · Observatoire des Makes (démo)
   ============================================================ */
(function () {
  "use strict";
  const C = window.Content;
  const $screen = document.getElementById("screen");
  const $app = document.getElementById("app");
  let route = { n: "accueil", step: null };
  let aimInst = null, demoMode = false, voiceId = 0;
  const bonusMsg = {};

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  const STAR_OF = { 1: "acrux", 2: "mimosa", 3: "gacrux", b: "imai" };

  // ---------- utilitaires d'affichage ----------
  function bulle(id, t, opts) {
    opts = opts || {};
    voiceId++;
    const kr = Store.get("voix") === "kr";
    return '<div class="guide">' + Art.tifil(t.expr, opts.saute ? "saute" : "") +
      '<div class="bubble" role="group" aria-label="Ti-Fil dit"><div class="who">⭐ Ti-Fil</div>' +
      '<div class="fr">' + t.fr + '</div>' +
      '<div class="kr" ' + (kr ? "" : "hidden") + ' lang="rcf"><b>Kréol</b> <span class="badge alert" style="font-size:11px">à valider</span><br>' + esc(t.kr) + '</div>' +
      '<div class="voices"><button class="voicebtn" data-voix="fr" data-id="' + id + '" data-txt="' + esc(t.fr.replace(/<[^>]+>/g, "")) + '" aria-label="Écouter en français">🔊 Français</button>' +
      '<button class="voicebtn" data-voix="kr" data-id="' + id + '" aria-label="Voir et écouter en créole">🔊 Kréol</button></div></div></div>';
  }
  function dock(html, cls) { return '<div class="dock ' + (cls || '') + '">' + html + '</div>'; }
  function btn(label, act, cls) { return '<button class="btn ' + (cls || "") + '" data-act="' + act + '">' + label + '</button>'; }
  function classeBox(lignes) {
    if (Store.get("public") !== "classe" || !lignes) return "";
    return '<div class="classe-box"><h3>🎓 Pour la classe</h3><ul class="clean small">' + lignes.map(l => "<li>" + esc(l) + "</li>").join("") + '</ul></div>';
  }
  function surPlace(t) { return '<div class="note">📍 ' + esc(t) + '</div>'; }
  function confetti() {
    const d = document.createElement("div"); d.className = "confetti"; d.setAttribute("aria-hidden", "true");
    const cols = ["#ffd23f", "#7be0ff", "#ff9ec4", "#9dffb0", "#fff"];
    for (let i = 0; i < 46; i++) { const e = document.createElement("i"); e.style.left = Math.random() * 100 + "%"; e.style.background = cols[i % 5]; e.style.animationDuration = (1.8 + Math.random() * 1.8) + "s"; e.style.animationDelay = Math.random() * .5 + "s"; d.appendChild(e); }
    document.body.appendChild(d); setTimeout(() => d.remove(), 4200);
  }
  function toast(t) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 3400); }

  // ---------- haut de page ----------
  function topbar() {
    const st = Store.stars(); let pips = "";
    ["1", "2", "3", "b"].forEach(k => { pips += '<span class="' + (st[k] ? "on" : "") + '" aria-hidden="true" style="display:contents">' + Art.ICO.pip.replace('class="pip"', 'class="pip ' + (st[k] ? "on" : "") + '"') + '</span>'; });
    document.getElementById("topbar").innerHTML =
      '<div class="brand"><svg width="30" height="30" viewBox="-6 6 212 200" aria-hidden="true">' + Art.tifilInner("content") + '</svg><span>Ti-Fil · Makes</span></div>' +
      '<div class="pips" role="img" aria-label="' + Store.count() + ' étoile(s) retrouvée(s) sur 4">' + pips + '</div>' +
      '<button class="iconbtn" data-act="reglages" aria-label="Réglages">⚙️</button>';
  }

  // ---------- routeur ----------
  function go(n, step, noScroll) {
    if (aimInst) { aimInst.destroy(); aimInst = null; }
    Audio2.stopVoix(); Audio2.stopPing();
    const ad = document.getElementById("aimdock"); if (ad) ad.remove(); // bouton « passer » : ne doit pas survivre à l'écran de visée
    if (bonusMsg.sim && n !== "bonus") { Sky.setSim("now"); bonusMsg.sim = false; } // fin de la simulation de nuit du bonus
    route = { n, step: step || null };
    const u = new URL(location.href); u.searchParams.delete("station");
    if (n === "accueil") u.searchParams.delete("station"); else u.searchParams.set("station", n === "s1" ? "1" : n === "s2" ? "2" : n === "s3" ? "3" : n);
    try { history.replaceState(null, "", u); } catch (e) { /* file:// */ }
    document.body.dataset.theme = (n === "bonus" && step !== "brief0") ? "rouge" : Store.get("theme");
    render();
    if (!noScroll) window.scrollTo(0, 0);
    const h = $screen.querySelector("h1,h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    updatePresbar();
  }

  function render() {
    topbar();
    const fn = SCREENS[route.n]; if (!fn) return go("accueil");
    $screen.innerHTML = fn(route.step);
    const after = AFTER[route.n]; if (after) after(route.step);
  }

  const SCREENS = {}, AFTER = {};

  // ===================== ACCUEIL =====================
  SCREENS.accueil = () => {
    const pub = Store.get("public"), th = Store.get("theme");
    const pubBtn = (k, l) => '<button class="btn" data-act="pub" data-v="' + k + '" aria-pressed="' + (pub === k) + '">' + l + '</button>';
    return '<div class="hero">' + Art.homeScene() + '</div>' +
      '<div class="titre"><span class="kicker">Observatoire des Makes · La Réunion</span><h1>Ti-Fil et la<br>Croix du Sud</h1><p class="sub">Une aventure sur ton téléphone, du parcours de jour à la soirée étoilée.</p></div>' +
      '<div class="card"><h3>Qui joue ?</h3><div class="seg" role="group" aria-label="Public">' + pubBtn("famille", "👨‍👩‍👧 Famille") + pubBtn("classe", "🎓 Classe") + pubBtn("soiree", "🌙 Soirée") + '</div></div>' +
      '<div class="seg" role="group" aria-label="Affichage"><button class="btn" data-act="th" data-v="ciel" aria-pressed="' + (th === "ciel") + '">🌌 Ciel</button><button class="btn" data-act="th" data-v="soleil" aria-pressed="' + (th === "soleil") + '">☀️ Plein soleil</button></div>' +
      '<p class="small dim center">Fonctionne sans connexion une fois chargée · Aucune donnée envoyée</p>' +
      dock(btn("🚀 Commencer l'aventure", "start"));
  };

  // ===================== INTRO =====================
  SCREENS.intro = step => {
    const i = Math.max(0, Math.min(C.intro.length - 1, +step || 0));
    const last = i === C.intro.length - 1;
    return '<h2 class="sr-only">Histoire</h2><div style="min-height:46vh;display:flex;flex-direction:column;justify-content:center;gap:16px">' +
      '<div class="center">' + Art.tifil(C.intro[i].expr, "").replace('class="tifil ', 'style="width:150px;margin:0 auto" class="tifil ') + '</div>' + bulle("intro" + i, C.intro[i]) + '</div>' +
      '<div class="center dim small">' + (i + 1) + ' / ' + C.intro.length + '</div>' +
      dock(btn(last ? "🗺️ Voir le parcours" : "Suite ➜", last ? "hub" : "intro", "") .replace('data-act="intro"', 'data-act="intro" data-i="' + (i + 1) + '"'));
  };

  // ===================== PARCOURS (HUB) =====================
  SCREENS.hub = () => {
    const st = Store.stars(), done = Store.count();
    const row = (k, n, s, extra) => '<button class="station ' + (st[k] ? "done " : "") + (extra || "") + '" data-act="scan" data-k="' + k + '"><span class="num" aria-hidden="true">' + (st[k] ? "✓" : (k === "b" ? "★" : k)) + '</span><span><span class="t">' + esc(n.titre) + '</span><br><span class="s">' + esc(n.court) + (st[k] ? " · étoile gagnée" : "") + '</span></span><span class="go" aria-hidden="true">📷</span></button>';
    return '<span class="kicker">Ton parcours</span><h2>Retrouve les 4 étoiles</h2>' +
      bulle("hub", { fr: done === 0 ? "Sur place, chaque panneau a un QR code : scanne-le pour lancer la station. Ici, touche une station pour simuler le scan !" : done >= 3 ? "Super, tu as presque fini ! Il reste le bonus de soirée, ou tu peux terminer la mission." : "Bien joué ! Continue avec la station suivante.", kr: "Skann lo KR kod !", expr: done >= 3 ? "fete" : "content" }) +
      '<div style="display:flex;flex-direction:column;gap:10px">' + row("1", C.s1) + row("2", C.s2) + row("3", C.s3) + row("b", C.bonus, "night") + '</div>' +
      '<div class="note small">🔗 Chaque station a son adresse : <b>?station=1</b>, <b>?station=2</b>, <b>?station=3</b>, <b>?station=bonus</b> (c\'est ce que contient le QR code).</div>' +
      dock((done >= 3 ? btn("🏁 Terminer la mission", "fin") : "") + (done >= 1 && done < 3 ? '<p class="small dim center" style="margin:0">' + done + ' / 3 stations de jour</p>' : ""));
  };
  AFTER.hub = () => { };

  // Scan QR simulé
  function scan(k) {
    const cible = { 1: "s1", 2: "s2", 3: "s3", b: "bonus" }[k];
    const seed = ({ 1: 7, 2: 13, 3: 21, b: 33 })[k];
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Scan du QR code");
    sh.innerHTML = '<div><h3>📷 Scan du QR code (simulé)</h3><div class="scan"><div style="position:absolute;inset:14%;background:#fff;border-radius:10px">' + Art.fakeQR(seed) + '</div><div class="scanline"></div></div><p class="small dim center" id="scantxt">Je cherche le QR code…</p></div>';
    document.body.appendChild(sh); Audio2.Sfx.tap();
    setTimeout(() => { const t = sh.querySelector("#scantxt"); if (t) t.textContent = "QR reconnu ✓ → ?station=" + (k === "b" ? "bonus" : k); Audio2.Sfx.ok(); }, 1100);
    setTimeout(() => { sh.remove(); go(cible, "brief"); }, 1700);
  }

  // ===================== STATION générique =====================
  function enTete(S, num) {
    return '<span class="kicker">' + (num === "b" ? "Bonus de soirée" : "Station " + num + " sur 3") + '</span><h2>' + S.ico + " " + esc(S.titre) + '</h2>';
  }
  function suivant(l, act, extra) { return dock(btn(l, act) + (extra || "")); }

  // ----- Quiz commun
  function quizHTML(q) {
    return '<div class="card warm"><h3>❓ Question</h3><p>' + esc(q.texte) + '</p></div><div class="opts" id="opts">' +
      q.opts.map((o, i) => '<button class="opt" data-act="rep" data-i="' + i + '"><span class="lettre">' + "ABCD"[i] + '</span><span>' + esc(o) + '</span></button>').join("") + '</div><div id="fb" aria-live="polite"></div>';
  }
  function repondre(q, i, fait, next, pas) {
    const opts = $screen.querySelectorAll(".opt"); if (opts[i].classList.contains("ok")) return;
    const bon = i === q.ok, fb = document.getElementById("fb");
    if (bon) {
      opts.forEach(o => o.disabled = true); opts[i].classList.add("ok"); Audio2.Sfx.ok(); Audio2.vibre(60);
      fb.innerHTML = '<div class="feedback ok"><span class="ic">✅</span>' + esc(q.bravo) + '</div>' + (fait ? '<div class="card"><h3>💡 Le savais-tu ?</h3><p>' + esc(fait) + '</p></div>' : "");
      const d = document.querySelector(".dock"); if (d) d.innerHTML = btn(next.label, next.act);
      fb.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      opts[i].classList.add("ko"); opts[i].disabled = true; Audio2.Sfx.ko(); Audio2.vibre(120);
      fb.innerHTML = '<div class="feedback ko"><span class="ic">🔁</span>' + esc(q.rate) + '</div>';
    }
  }

  // ----- Vise le ciel (écran commun)
  function viserHTML(titre, bulleTxt, id) {
    return '<span class="kicker">🎯 Vise le ciel</span><h2>' + esc(titre) + '</h2>' + bulle(id, bulleTxt) + '<div id="aimhost"></div>';
  }
  function lanceViser(opts, onWin) {
    const host = document.getElementById("aimhost");
    aimInst = Aim.mount(host, Object.assign({}, opts, { onSuccess: onWin }));
    // porte de secours accessible : après 40 s, ou toujours en mode démo
    const d = document.createElement("div"); d.className = "dock"; d.id = "aimdock"; d.innerHTML = '<button class="btn ghost" data-act="aimskip" style="background:var(--card)">⏭ Je n\'arrive pas — passer</button>'; $app.appendChild(d);
    d.style.display = demoMode ? "flex" : "none"; setTimeout(() => { if (d.isConnected) d.style.display = "flex"; }, 40000);
  }

  // ===================== STATION 1 =====================
  SCREENS.s1 = step => {
    const S = C.s1;
    if (step === "brief") return enTete(S, 1) + bulle("s1b", S.brief, { saute: 1 }) + surPlace(S.surPlace) + classeBox(S.classe) + dock(btn("Je suis prêt(e) ➜", "go", "").replace('data-act="go"', 'data-act="go" data-r="s1" data-s="quiz"'));
    if (step === "quiz") return enTete(S, 1) + quizHTML(S.q) + dock('<p class="small dim center" style="margin:0">Choisis une réponse</p>');
    if (step === "viser") return viserHTML("L'axe du Monde", S.visee, "s1v");
    if (step === "gain") return gainHTML("1", S.fin, "s1g", "🧭 Axe du Monde");
  };
  AFTER.s1 = step => {
    if (step === "viser") lanceViser({ targetId: "pole", tol: Store.get("tolerance"), mission: "le pôle sud céleste, vers le sud, environ 21° au-dessus de l'horizon", consigne: "Tourne-toi vers le <b>sud</b> et lève le téléphone d'environ 21° : le viseur doit se poser sur le pôle sud céleste.", apres: S1apres() }, () => go("s1", "gain"));
  };
  const S1apres = () => C.s1.apres;

  // ===================== STATION 2 =====================
  function dateCadran() { // heure utilisée pour le cadran
    const d = Sky.now(); return Sky.sunAlt(d) > 5 ? d : (() => { const p = Sky.reunionParts(d); return new Date(Date.UTC(p.y, p.m, p.d, 6, 30)); })(); // sinon : 10h30 locale
  }
  SCREENS.s2 = step => {
    const S = C.s2;
    if (step === "brief") return enTete(S, 2) + bulle("s2b", S.brief, { saute: 1 }) + surPlace(S.surPlace) + classeBox(S.classe) + dock(btn("Je suis prêt(e) ➜", "go").replace('data-act="go"', 'data-act="go" data-r="s2" data-s="cadran"'));
    if (step === "cadran") {
      const d = dateCadran(), reel = Sky.sunAlt(Sky.now()) > 5;
      const sol = Sky.solarMinutes(d), leg = Sky.legalMinutes(d);
      return enTete(S, 2) + '<div class="dialwrap">' + Art.sundial(sol) + '</div>' +
        '<div class="clocks"><div class="clock"><span>☀️ Cadran (heure solaire)</span><b>' + hm(sol) + '</b></div><div class="clock"><span>📱 Téléphone (heure légale)</span><b>' + hm(leg) + '</b></div></div>' +
        '<div class="note small">' + (reel ? "Valeurs calculées pour l'instant présent aux Makes." : "Il fait nuit : on montre l'exemple d'une matinée à 10 h 30 (heure du téléphone).") + ' Sur place, compare avec un vrai cadran !</div>' +
        dock(btn("Je compare ➜", "go").replace('data-act="go"', 'data-act="go" data-r="s2" data-s="quiz"'));
    }
    if (step === "quiz") return enTete(S, 2) + quizHTML(S.q) + dock('<p class="small dim center" style="margin:0">Choisis une réponse</p>');
    if (step === "viser") return viserHTML(viseInfo2().titre, viseInfo2().bulle, "s2v");
    if (step === "gain") return gainHTML("2", S.fin, "s2g", "☀️ Cadrans");
  };
  function viseInfo2() {
    const d = Sky.now(), S = C.s2, sun = Sky.target("soleil", d), moon = Sky.target("lune", d), croix = Sky.target("croix", d);
    if (sun.visible) return { id: "soleil", titre: "Vise le Soleil", bulle: S.viseSoleil, consigne: "Suis la flèche. <b>Ne regarde jamais le Soleil</b> : regarde seulement l'écran.", apres: "Il est en ce moment à " + Math.round(sun.alt) + "° au-dessus de l'horizon." };
    if (moon.visible) return { id: "lune", titre: "Vise la Lune", bulle: S.viseLune, consigne: "Suis la flèche jusqu'à la Lune.", apres: "" };
    if (croix.visible) return { id: "croix", etoiles: true, titre: "Vise la Croix du Sud", bulle: S.viseNuit, consigne: "Suis la flèche jusqu'à la Croix du Sud.", apres: "" };
    return { id: "pole", titre: "Vise le pôle sud céleste", bulle: S.viseSecours, consigne: "Tourne-toi vers le sud, environ 21° au-dessus de l'horizon.", apres: "" };
  }
  AFTER.s2 = step => {
    if (step === "viser") { const v = viseInfo2(); lanceViser({ targetId: v.id, etoiles: v.etoiles, tol: Store.get("tolerance"), mission: v.titre.toLowerCase().replace("vise ", ""), consigne: v.consigne, apres: v.apres }, () => go("s2", "gain")); }
    if (step === "cadran") animeCadran();
  };
  function animeCadran() { const o = document.getElementById("ombre"); if (o) { o.style.transformOrigin = "160px 150px"; o.animate([{ transform: "rotate(-14deg)", opacity: 0 }, { transform: "rotate(0)", opacity: .78 }], { duration: 900, easing: "ease-out" }); } }

  // ===================== STATION 3 =====================
  SCREENS.s3 = step => {
    const S = C.s3;
    if (step === "brief") return enTete(S, 3) + bulle("s3b", S.brief, { saute: 1 }) + surPlace(S.surPlace) + classeBox(S.classe) + dock(btn("Je suis prêt(e) ➜", "go").replace('data-act="go"', 'data-act="go" data-r="s3" data-s="quiz"'));
    if (step === "quiz") {
      const cartes = S.cartes.slice(); // ordre fixe mais t60 pas en dernier : on décale pour ne pas deviner
      const ordre = [cartes[1], cartes[3], cartes[0], cartes[2]];
      return enTete(S, 3) + '<div class="card warm"><h3>❓ Question</h3><p>' + esc(S.q.texte) + '</p></div><div class="tgrid" id="tgrid">' +
        ordre.map(c => '<button class="tcard" data-act="tel" data-id="' + c.id + '" aria-label="' + esc(c.nom + ", " + c.sous) + '">' + Art.telescope(c.art) + '<b>' + esc(c.nom) + '</b><small>' + esc(c.sous) + '</small></button>').join("") + '</div><div id="fb" aria-live="polite"></div>' +
        dock('<p class="small dim center" style="margin:0">Touche le bon télescope</p>');
    }
    if (step === "gain") return gainHTML("3", S.fin, "s3g", "🔭 T60");
  };

  // ===================== BONUS =====================
  SCREENS.bonus = step => {
    const S = C.bonus;
    if (step === "brief") return enTete(S, "b") + bulle("bb", S.brief, { saute: 1 }) + surPlace(S.note) + classeBox(S.classe) + dock(btn("Je suis prêt(e) ➜", "go").replace('data-act="go"', 'data-act="go" data-r="bonus" data-s="viser"'));
    if (step === "viser") return viserHTML("La Croix du Sud", S.visee, "bv");
    if (step === "axe") return enTete(S, "b") + '<div class="croixwrap" style="background:#0b0000">' + Art.poleMap({ axe: true, pointeurs: true }) + '</div><div class="card"><h3>🧭 Retrouver le sud</h3><p>' + esc(S.axe) + '</p></div>' + dock(btn("⭐ Recevoir l'étoile", "go").replace('data-act="go"', 'data-act="go" data-r="bonus" data-s="gain"'));
    if (step === "gain") return gainHTML("b", S.fin, "bg", "🌌 Croix du Sud");
  };
  AFTER.bonus = step => {
    if (step === "viser") {
      const d = Sky.now(); if (!Sky.isNight(d)) { Sky.setSim("nuit"); bonusMsg.sim = true; }
      lanceViser({ targetId: "croix", etoiles: true, tol: Store.get("tolerance"), mission: "la Croix du Sud, dans le ciel du sud", consigne: (bonusMsg.sim ? "🌙 <b>Simulation : il est " + hm(Sky.legalMinutes(Sky.now())).replace(":", " h ") + ".</b> " : "") + "Tourne-toi vers le <b>sud</b>, lève le téléphone : la Croix du Sud est entourée de deux étoiles brillantes, les Pointeurs.", apres: C.bonus.apres }, () => go("bonus", "axe"));
    }
    if (step === "axe") setTimeout(() => { const l = document.querySelector(".ligne-croix"); if (l) l.classList.add("on"); }, 300);
  };

  // ===================== GAIN D'ÉTOILE =====================
  function gainHTML(k, texte, id, lib) {
    const got = {}; Object.keys(STAR_OF).forEach(x => got[STAR_OF[x]] = !!Store.stars()[x] || x === k);
    return '<span class="kicker">Étoile retrouvée</span><h2>⭐ ' + esc(lib) + '</h2><div class="croixwrap" id="gainbox">' + Art.croix(got, false) + '</div>' + bulle(id, texte, { saute: 1 }) +
      dock(btn(k === "b" ? "🏁 Terminer la mission" : "🗺️ Retour au parcours", "valide").replace('data-act="valide"', 'data-act="valide" data-k="' + k + '"'));
  }
  AFTER.s1 = (o => step => { o(step); if (step === "gain") effetGain(); })(AFTER.s1);
  AFTER.s2 = (o => step => { o(step); if (step === "gain") effetGain(); })(AFTER.s2);
  AFTER.s3 = step => { if (step === "gain") effetGain(); };
  AFTER.bonus = (o => step => { o(step); if (step === "gain") effetGain(); })(AFTER.bonus);
  function effetGain() { Audio2.Sfx.etoile(); confetti(); Audio2.vibre([60, 40, 60]); }

  // ===================== FIN =====================
  SCREENS.fin = () => {
    const n = Store.count(), complet = n >= 4, nom = Store.get("nom");
    const got = {}; Object.keys(STAR_OF).forEach(x => got[STAR_OF[x]] = !!Store.stars()[x]);
    const t = complet ? C.fin.ok : C.fin.presque;
    return '<span class="kicker">' + (complet ? "Mission accomplie" : "Presque !") + '</span><h2>' + (complet ? "🏆 Bravo, astronome !" : "⭐ " + n + " étoiles sur 4") + '</h2>' +
      '<div class="croixwrap">' + Art.croix(got, true) + '</div>' + bulle("fin", t, { saute: 1 }) +
      '<div class="card"><h3>✍️ Ton prénom pour le brevet</h3><input class="field" id="nom" maxlength="20" autocomplete="off" placeholder="Ton prénom" value="' + esc(nom) + '" aria-label="Ton prénom"></div>' +
      '<div class="brevet"><div>' + Art.ICO.badgeStar + '</div><h2>Brevet d\'astronome des Makes</h2><div class="nom" id="brnom">' + esc(nom || "…") + '</div><p>a retrouvé <b>' + n + ' étoile' + (n > 1 ? "s" : "") + ' sur 4</b> de la Croix du Sud avec Ti-Fil.</p><p class="small">Observatoire astronomique des Makes · La Réunion</p></div>' +
      '<div class="note small">🏫 <b>Pour l\'Observatoire :</b> à la fin, l\'aventure peut proposer l\'achat de la visite suivante, un quiz en classe, ou l\'inscription à une soirée d\'observation (à décider ensemble).</div>' +
      dock(btn("🖨️ Imprimer / enregistrer le brevet", "print") + (complet ? "" : btn("🌙 Aller au bonus de soirée", "scanb", "sec")) + btn("🔁 Rejouer depuis le début", "reset", "sec"), "flow");
  };
  AFTER.fin = () => { if (Store.count() >= 4) { Audio2.Sfx.fin(); confetti(); } const i = document.getElementById("nom"); if (i) i.addEventListener("input", () => { Store.set("nom", i.value.trim()); document.getElementById("brnom").textContent = i.value.trim() || "…"; }); };

  // ===================== RÉGLAGES =====================
  function reglages() {
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Réglages");
    const th = Store.get("theme"), tol = Store.get("tolerance"), vx = Store.get("voix"), sim = Sky.getSim();
    const seg = (act, cur, items) => '<div class="seg">' + items.map(i => '<button class="btn" data-act="' + act + '" data-v="' + i[0] + '" aria-pressed="' + (String(cur) === String(i[0])) + '">' + i[1] + '</button>').join("") + '</div>';
    sh.innerHTML = '<div><h3>⚙️ Réglages</h3>' +
      '<p class="small"><b>Affichage</b></p>' + seg("th", th, [["ciel", "🌌 Ciel"], ["soleil", "☀️ Plein soleil"], ["rouge", "🔴 Nuit rouge"]]) +
      '<p class="small"><b>Créole</b> (texte écrit sous les bulles, à faire relire)</p>' + seg("voix", vx, [["fr", "Français seul"], ["kr", "+ Kréol"]]) +
      '<p class="small"><b>Tolérance de visée</b> (boussole imprécise : large = plus facile)</p>' + seg("tol", tol, [[12, "± 12°"], [18, "± 18°"], [25, "± 25°"]]) +
      '<p class="small"><b>Son et vibrations</b></p>' + seg("son", Store.get("son") ? "1" : "0", [["1", "🔊 Oui"], ["0", "🔇 Non"]]) +
      '<p class="small"><b>Heure du ciel (démo)</b> — pour essayer de jour comme de soirée</p>' + seg("sim", sim, [["now", "Réelle"], ["midi", "Midi"], ["matin", "Matin"], ["soir", "Soir 21 h"], ["nuit", "Aube 4 h 30"]]) +
      '<button class="btn sec" data-act="reset">🔁 Tout remettre à zéro</button>' +
      '<button class="btn sec" data-act="credits">ℹ️ Crédits et mentions</button>' +
      '<button class="btn" data-act="fermer">Fermer</button></div>';
    document.body.appendChild(sh);
    const f = sh.querySelector('[data-act="fermer"]'); if (f) f.focus();
  }
  function credits() {
    closeSheets();
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Crédits");
    sh.innerHTML = '<div><h3>ℹ️ Crédits</h3><span class="badge alert" style="align-self:flex-start">DÉMO À FAIRE RELIRE PAR L\'OBSERVATOIRE</span><ul class="clean">' + C.credits.map(c => "<li>" + esc(c) + "</li>").join("") + '</ul><button class="btn" data-act="fermer">Fermer</button></div>';
    document.body.appendChild(sh);
  }
  function closeSheets() { document.querySelectorAll(".sheet").forEach(s => s.remove()); }

  // ===================== BARRE DE PRÉSENTATION (démo RDV) =====================
  let demoIdx = 0;
  function updatePresbar() {
    let p = document.getElementById("presbar");
    if (!demoMode) { if (p) p.remove(); document.body.classList.remove("has-presbar"); return; }
    if (!p) { p = document.createElement("div"); p.id = "presbar"; p.className = "presbar"; $app.appendChild(p); }
    document.body.classList.add("has-presbar");
    const i = C.demo.findIndex(x => x[0] === route.n && (x[1] || null) === (route.step || null)); if (i >= 0) demoIdx = i;
    p.innerHTML = '<button data-act="dprev" aria-label="Étape précédente">◀</button><span class="lbl">Démo · étape ' + (demoIdx + 1) + ' / ' + C.demo.length + '</span><button data-act="dsim" aria-label="Changer l\'heure du ciel">🕒 ' + ({ now: "réelle", midi: "midi", matin: "matin", soir: "soir", nuit: "nuit" }[Sky.getSim()] || "") + '</button><button data-act="dnext" aria-label="Étape suivante">▶</button>';
  }
  function demoGo(d) {
    demoIdx = Math.max(0, Math.min(C.demo.length - 1, demoIdx + d));
    const x = C.demo[demoIdx]; if (x[0] === "accueil") { go("accueil"); return; }
    // en démo enchaînée, chaque étape de station vaut une étoile pour que le hub/la fin soient cohérents
    // les étoiles des stations déjà « passées » sont attribuées pour que la fin soit cohérente
    C.demo.forEach((y, k) => { if (k < demoIdx) { const m = { s1: "1", s2: "2", s3: "3", bonus: "b" }[y[0]]; if (m && C.demo.slice(k + 1, demoIdx + 1).some(z => z[0] !== y[0])) Store.star(m, true); } });
    if (x[0] === "accueil") Store.reset();
    go(x[0], x[1]);
  }

  // ===================== ÉVÉNEMENTS =====================
  document.addEventListener("click", e => {
    const v = e.target.closest(".voicebtn");
    if (v) {
      const lang = v.dataset.voix, box = v.closest(".bubble");
      if (lang === "kr") { const kr = box.querySelector(".kr"); kr.hidden = false; Audio2.parle(v.dataset.id, "kr", "").then(r => { if (r === "aucune") toast("🎙️ Enregistrement créole à venir : texte à faire relire"); }); }
      else { v.classList.add("playing"); Audio2.parle(v.dataset.id, "fr", v.dataset.txt).then(r => { if (r === "aucune") toast("Voix indisponible sur cet appareil : lis le texte !"); setTimeout(() => v.classList.remove("playing"), 600); }); }
      return;
    }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act; Audio2.Sfx.unlock();
    switch (a) {
      case "start": Audio2.Sfx.tap(); Store.get("intro") ? go("hub") : go("intro", "0"); Store.set("intro", true); break;
      case "pub": Store.set("public", b.dataset.v); if (b.dataset.v === "soiree") { Store.set("theme", "ciel"); } render(); break;
      case "th": Store.set("theme", b.dataset.v); document.body.dataset.theme = b.dataset.v; closeSheets(); render(); if (b.closest(".sheet") === null) { } break;
      case "intro": go("intro", b.dataset.i); break;
      case "hub": go("hub"); break;
      case "scan": scan(b.dataset.k); break;
      case "go": Audio2.Sfx.tap(); go(b.dataset.r, b.dataset.s); break;
      case "rep": {
        const q = route.n === "s1" ? C.s1.q : C.s2.q, i = +b.dataset.i;
        const fait = route.n === "s1" ? C.s1.fait : C.s2.pourquoi;
        repondre(q, i, fait, { label: "🎯 Vise le ciel ➜", act: "go" }, null);
        if (i === q.ok) { const d = document.querySelector(".dock .btn"); if (d) { d.dataset.r = route.n; d.dataset.s = "viser"; } }
        else if (route.n === "s2") { /* pour le cadran, on explique après la réponse */ const fb = document.getElementById("fb"); fb.insertAdjacentHTML("beforeend", '<div class="card"><h3>💡 Pourquoi ?</h3><p>' + esc(C.s2.pourquoi) + '</p></div>'); }
        break;
      }
      case "tel": {
        const S = C.s3, ok = b.dataset.id === "t60", fb = document.getElementById("fb");
        if (ok) {
          $screen.querySelectorAll(".tcard").forEach(t => { t.disabled = true; t.classList.add(t === b ? "ok" : "off"); }); Audio2.Sfx.ok(); Audio2.vibre(60);
          fb.innerHTML = '<div class="feedback ok"><span class="ic">✅</span>' + esc(S.q.bravo) + '</div><div class="card"><h3>💡 Le savais-tu ?</h3><p>' + esc(S.fait) + '</p></div>';
          document.querySelector(".dock").innerHTML = btn("⭐ Recevoir l'étoile", "go").replace('data-act="go"', 'data-act="go" data-r="s3" data-s="gain"');
          fb.scrollIntoView({ behavior: "smooth", block: "center" });
        } else { b.classList.add("ko"); b.disabled = true; Audio2.Sfx.ko(); Audio2.vibre(120); fb.innerHTML = '<div class="feedback ko"><span class="ic">🔁</span>' + esc(S.q.rate) + '</div>'; }
        break;
      }
      case "aimskip": if (aimInst) { const dock = document.getElementById("aimdock"); if (dock) dock.remove(); toast("On continue !"); go(route.n, route.n === "bonus" ? "axe" : "gain"); } break;
      case "valide": Store.star(b.dataset.k, true); topbar(); go(b.dataset.k === "b" ? "fin" : "hub"); break;
      case "fin": go("fin"); break;
      case "scanb": scan("b"); break;
      case "print": window.print(); break;
      case "reset": if (confirm("Remettre l'aventure à zéro ?")) { Store.reset(); closeSheets(); Sky.setSim("now"); go("accueil"); } break;
      case "reglages": reglages(); break;
      case "fermer": closeSheets(); break;
      case "credits": credits(); break;
      case "voix": Store.set("voix", b.dataset.v); closeSheets(); reglages(); break;
      case "tol": Store.set("tolerance", +b.dataset.v); closeSheets(); reglages(); break;
      case "son": Store.set("son", b.dataset.v === "1"); closeSheets(); reglages(); break;
      case "sim": Sky.setSim(b.dataset.v); closeSheets(); reglages(); updatePresbar(); break;
      case "dprev": demoGo(-1); break;
      case "dnext": demoGo(1); break;
      case "dsim": { const l = ["now", "midi", "soir", "nuit"]; Sky.setSim(l[(l.indexOf(Sky.getSim()) + 1) % l.length]); updatePresbar(); toast("Heure du ciel : " + Sky.getSim()); break; }
    }
  });
  // thème appliqué depuis les réglages : maj immédiate
  document.addEventListener("click", e => { const b = e.target.closest('.sheet [data-act="th"]'); if (b) { closeSheets(); reglages(); } }, true);

  // ===================== DÉMARRAGE =====================
  function init() {
    const q = new URLSearchParams(location.search);
    document.body.dataset.theme = Store.get("theme");
    if (q.get("theme")) { Store.set("theme", q.get("theme")); document.body.dataset.theme = q.get("theme"); }
    if (q.get("sim")) Sky.setSim(q.get("sim"));
    if (q.get("public")) Store.set("public", q.get("public"));
    demoMode = q.get("demo") === "1";
    const s = q.get("station");
    if (s === "1") go("s1", "brief"); else if (s === "2") go("s2", "brief"); else if (s === "3") go("s3", "brief");
    else if (s === "bonus") go("bonus", "brief"); else if (s === "fin") go("fin"); else if (s === "hub") go("hub");
    else go("accueil");
    // service worker (hors connexion)
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("sw.js").catch(() => { });
    }
  }
  window.App = { go, route: () => route, aim: () => aimInst, demoGo };
  init();
})();
