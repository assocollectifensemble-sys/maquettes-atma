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
  let aimInst = null, demoMode = false;
  const bonusMsg = {};

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  const hh = h => { const m = Math.round(h * 60) % 1440; return Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0"); };
  const STAR_OF = { 1: "acrux", 2: "mimosa", 3: "gacrux", b: "imai" };

  // ---------- thème (le bonus force la nuit rouge ; filtre rouge global = vision de nuit préservée) ----------
  function applyTheme() {
    const th = (route.n === "bonus") ? "rouge" : Store.get("theme");
    document.body.dataset.theme = th;
    document.documentElement.classList.toggle("nuit", th === "rouge");
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = th === "rouge" ? "#080000" : th === "soleil" ? "#e9f4ff" : "#040a22";
  }

  // ---------- utilitaires d'affichage ----------
  function bulle(id, t, opts) {
    opts = opts || {};
    const kr = Store.get("voix") === "kr";
    const krTxt = t.kr ? '<div class="kr" ' + (kr ? "" : "hidden") + ' lang="rcf"><b>Kréol</b> <span class="badge alert">à valider</span><br>' + esc(t.kr) + '</div>' : "";
    const krBtn = t.kr ? '<button class="voicebtn" data-voix="kr" data-id="' + id + '" aria-label="Voir et écouter en créole">🔊 Kréol</button>' : "";
    return '<div class="guide' + (opts.compact ? " compact" : "") + '">' + Art.tifil(t.expr, opts.saute ? "saute" : "") +
      '<div class="bubble" role="group" aria-label="Ti-Fil dit"><div class="who">Ti-Fil</div>' +
      '<div class="fr">' + t.fr + '</div>' + krTxt +
      '<div class="voices"><button class="voicebtn" data-voix="fr" data-id="' + id + '" data-txt="' + esc(t.fr.replace(/<[^>]+>/g, "")) + '" aria-label="Écouter en français">🔊 Français</button>' + krBtn + '</div></div></div>';
  }
  function dock(html, cls) { return '<div class="dock ' + (cls || '') + '">' + html + '</div>'; }
  function btn(label, act, cls, data) {
    let d = ""; if (data) Object.keys(data).forEach(k => { d += ' data-' + k + '="' + esc(data[k]) + '"'; });
    return '<button class="btn ' + (cls || "") + '" data-act="' + act + '"' + d + '>' + label + '</button>';
  }
  function classeBox(lignes) {
    if (Store.get("public") !== "classe" || !lignes) return "";
    return '<div class="classe-box"><h3>🎓 Pour la classe</h3><ul class="clean small">' + lignes.map(l => "<li>" + esc(l) + "</li>").join("") + '</ul></div>';
  }
  function surPlace(t) { return '<div class="note">📍 ' + esc(t) + '</div>'; }
  function confetti() {
    const d = document.createElement("div"); d.className = "confetti"; d.setAttribute("aria-hidden", "true");
    const cols = ["#ffd23f", "#7be0ff", "#ff9ec4", "#9dffb0", "#fff"];
    for (let i = 0; i < 46; i++) { const e = document.createElement("i"); e.style.left = Math.random() * 100 + "%"; e.style.background = cols[i % 5]; e.style.animationDuration = (1.8 + Math.random() * 1.8) + "s"; e.style.animationDelay = Math.random() * .5 + "s"; if (i % 3 === 0) e.className = "etoile"; d.appendChild(e); }
    document.body.appendChild(d); setTimeout(() => d.remove(), 4200);
  }
  function toast(t) { const e = document.createElement("div"); e.className = "toast"; e.setAttribute("role", "status"); e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 3400); }

  // ---------- haut de page ----------
  function topbar() {
    const st = Store.stars(); let pips = "";
    ["1", "2", "3", "b"].forEach(k => { pips += Art.ICO.pip.replace('class="pip"', 'class="pip ' + (st[k] ? "on" : "") + '"'); });
    document.getElementById("topbar").innerHTML =
      '<button class="brand" data-act="accueil" aria-label="Retour à l\'accueil"><svg width="32" height="32" viewBox="-6 6 212 200" aria-hidden="true">' + Art.tifilInner("content") + '</svg><span>Ti-Fil <small>· Makes</small></span></button>' +
      '<div class="pips" role="img" aria-label="' + Store.count() + ' étoile(s) retrouvée(s) sur 4">' + pips + '</div>' +
      '<button class="iconbtn" data-act="reglages" aria-label="Réglages">⚙️</button>';
  }

  // ---------- routeur ----------
  function go(n, step, noScroll) {
    if (aimInst) { aimInst.destroy(); aimInst = null; }
    Audio2.stopVoix(); Audio2.stopPing();
    if (bonusMsg.sim && n !== "bonus") { Sky.setSim(bonusMsg.prev); bonusMsg.sim = false; } // fin de la simulation de nuit du bonus
    route = { n, step: step || null };
    const u = new URL(location.href); u.searchParams.delete("station");
    if (n !== "accueil") u.searchParams.set("station", n === "s1" ? "1" : n === "s2" ? "2" : n === "s3" ? "3" : n);
    try { history.replaceState(null, "", u); } catch (e) { /* file:// */ }
    applyTheme();
    render();
    if (!noScroll) window.scrollTo(0, 0);
    const h = $screen.querySelector("h1,h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    updatePresbar();
  }

  function render() {
    topbar();
    const fn = SCREENS[route.n]; if (!fn) return go("accueil");
    $screen.classList.remove("entre"); void $screen.offsetWidth; $screen.classList.add("entre"); // relance l'animation d'entrée
    $screen.innerHTML = fn(route.step);
    const after = AFTER[route.n]; if (after) after(route.step);
  }

  const SCREENS = {}, AFTER = {};

  // ===================== ACCUEIL =====================
  SCREENS.accueil = () => {
    const pub = Store.get("public"), th = Store.get("theme"), n = Store.count();
    const pubBtn = (k, ico, l) => '<button class="btn" data-act="pub" data-v="' + k + '" aria-pressed="' + (pub === k) + '"><span aria-hidden="true">' + ico + '</span>' + l + '</button>';
    const enCours = n > 0 && n < 4;
    return '<div class="hero">' + Art.homeScene() + '</div>' +
      '<div class="titre"><span class="kicker">Observatoire des Makes · La Réunion</span><h1>Ti-Fil <span>et la</span> Croix du Sud</h1>' +
      '<p class="sub">Aide <b>Ti-Fil, la petite étoile filante</b>, à retrouver les 4 étoiles qu\'elle a perdues au-dessus des Makes.</p></div>' +
      '<ul class="promesses" aria-label="En bref"><li><b>4</b> étapes sur place</li><li><b>10</b> minutes</li><li><b>0</b> connexion</li></ul>' +
      '<div class="card"><h3>Qui joue ?</h3><div class="seg" role="group" aria-label="Public">' + pubBtn("famille", "👨‍👩‍👧", "Famille") + pubBtn("classe", "🎓", "Classe") + pubBtn("soiree", "🌙", "Soirée") + '</div>' +
      '<p class="small dim" style="margin-top:8px">' + ({ famille: "Parcours de la visite de jour, à faire ensemble.", classe: "Avec des encadrés « Pour la classe » (programmes, ateliers de l\'Observatoire).", soiree: "Commence par le bonus de soirée, en mode nuit rouge." })[pub] + '</p></div>' +
      '<div class="seg" role="group" aria-label="Affichage"><button class="btn" data-act="th" data-v="ciel" aria-pressed="' + (th === "ciel") + '">🌌 Ciel</button><button class="btn" data-act="th" data-v="soleil" aria-pressed="' + (th === "soleil") + '">☀️ Plein soleil</button></div>' +
      '<p class="small dim center">Fonctionne sans connexion une fois chargée · Aucune donnée envoyée</p>' +
      dock(btn(enCours ? "🚀 Continuer l'aventure (" + n + "/4 ⭐)" : "🚀 Commencer l'aventure", "start", "big"));
  };
  AFTER.accueil = () => { };

  // ===================== INTRO =====================
  SCREENS.intro = step => {
    const i = Math.max(0, Math.min(C.intro.length - 1, +step || 0));
    const last = i === C.intro.length - 1;
    return '<h2 class="sr-only">Histoire</h2><div class="intro-scene">' +
      '<div class="intro-tifil">' + Art.tifil(C.intro[i].expr, "grand") + '</div>' + bulle("intro" + i, C.intro[i]) + '</div>' +
      '<div class="dots" aria-label="Étape ' + (i + 1) + ' sur ' + C.intro.length + '">' + C.intro.map((x, k) => '<i class="' + (k === i ? "on" : "") + '"></i>').join("") + '</div>' +
      dock(last ? btn("🗺️ Voir le parcours", "hub") : btn("Suite ➜", "intro", "", { i: i + 1 }));
  };

  // ===================== PARCOURS (HUB) =====================
  SCREENS.hub = () => {
    const st = Store.stars(), done = Store.count(), soir = Store.get("public") === "soiree";
    const row = (k, n) => '<button class="station ' + (st[k] ? "done " : "") + (k === "b" ? "night" : "") + '" data-act="scan" data-k="' + k + '"><span class="num" aria-hidden="true">' + (st[k] ? "✓" : (k === "b" ? "★" : k)) + '</span><span><span class="t">' + esc(n.titre) + '</span><br><span class="s">' + esc(n.court) + (st[k] ? " · étoile gagnée" : "") + '</span></span><span class="go" aria-hidden="true">📷</span></button>';
    const lignes = soir ? [row("b", C.bonus), row("1", C.s1), row("2", C.s2), row("3", C.s3)] : [row("1", C.s1), row("2", C.s2), row("3", C.s3), row("b", C.bonus)];
    return '<span class="kicker">Ton parcours</span><h2>Retrouve les 4 étoiles</h2>' +
      '<div class="progress" role="img" aria-label="' + done + ' étoiles sur 4"><i style="width:' + (done * 25) + '%"></i><span>' + done + ' / 4 ⭐</span></div>' +
      bulle("hub", { fr: done === 0 ? (soir ? "Ce soir, commence par le bonus : la Croix du Sud t'attend dans le ciel ! Les stations de jour se font lors de la visite." : "Sur place, chaque panneau a un QR code : scanne-le pour lancer la station. Ici, touche une station pour simuler le scan !") : done >= 3 ? "Super, tu as presque fini ! Il reste le bonus de soirée, ou tu peux terminer la mission." : "Bien joué ! Continue avec la station suivante.", kr: "Skann lo KR kod !", expr: done >= 3 ? "fete" : "content" }) +
      '<div class="stations">' + lignes.join("") + '</div>' +
      '<div class="note small">🔗 Chaque station a son adresse : <b>?station=1</b>, <b>?station=2</b>, <b>?station=3</b>, <b>?station=bonus</b> (c\'est ce que contient le QR code).</div>' +
      (done >= 3 ? dock(btn("🏁 Terminer la mission", "fin")) : "");
  };

  // Scan QR simulé
  function scan(k) {
    const cible = { 1: "s1", 2: "s2", 3: "s3", b: "bonus" }[k];
    const seed = ({ 1: 7, 2: 13, 3: 21, b: 33 })[k];
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Scan du QR code");
    sh.innerHTML = '<div><h3>📷 Scan du QR code (simulé)</h3><div class="scan"><div class="qr">' + Art.fakeQR(seed) + '</div><div class="scanline"></div></div><p class="small dim center" id="scantxt">Je cherche le QR code…</p></div>';
    document.body.appendChild(sh); Audio2.Sfx.tap();
    setTimeout(() => { const t = sh.querySelector("#scantxt"); if (t) t.textContent = "QR reconnu ✓ → ?station=" + (k === "b" ? "bonus" : k); Audio2.Sfx.ok(); }, 1100);
    setTimeout(() => { sh.remove(); go(cible, "brief"); }, 1700);
  }

  // ===================== STATION générique =====================
  function enTete(S, num) {
    return '<span class="kicker">' + (num === "b" ? "Bonus de soirée" : "Station " + num + " sur 3") + '</span><h2><span aria-hidden="true">' + S.ico + "</span> " + esc(S.titre) + '</h2>';
  }
  function illu(svg, legende) { return '<figure class="illu">' + svg + (legende ? '<figcaption>' + esc(legende) + '</figcaption>' : "") + '</figure>'; }

  // ----- Quiz commun
  function quizHTML(q) {
    return '<div class="card warm"><h3>❓ Question</h3><p>' + esc(q.texte) + '</p></div><div class="opts" id="opts">' +
      q.opts.map((o, i) => '<button class="opt" data-act="rep" data-i="' + i + '"><span class="lettre">' + "ABCD"[i] + '</span><span>' + esc(o) + '</span></button>').join("") + '</div><div id="fb" aria-live="polite"></div>';
  }
  function repondre(q, i, fait, next) {
    const opts = $screen.querySelectorAll(".opt"); if (opts[i].classList.contains("ok")) return;
    const bon = i === q.ok, fb = document.getElementById("fb");
    if (bon) {
      opts.forEach(o => o.disabled = true); opts[i].classList.add("ok"); Audio2.Sfx.ok(); Audio2.vibre(60);
      fb.innerHTML = '<div class="feedback ok"><span class="ic">✅</span>' + esc(q.bravo) + '</div>' + (fait ? '<div class="card"><h3>💡 Le savais-tu ?</h3><p>' + esc(fait) + '</p></div>' : "");
      const d = document.querySelector(".dock"); if (d) d.innerHTML = btn(next.label, "go", "", { r: next.r, s: next.s });
      fb.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      opts[i].classList.add("ko"); opts[i].disabled = true; Audio2.Sfx.ko(); Audio2.vibre(120);
      fb.innerHTML = '<div class="feedback ko"><span class="ic">🔁</span>' + esc(q.rate) + '</div>';
    }
  }

  // ----- Vise le ciel (écran commun) : bulle compacte, le ciel prend la place
  function viserHTML(titre, bulleTxt, id) {
    return '<span class="kicker">🎯 Vise le ciel</span><h2>' + esc(titre) + '</h2>' + bulle(id, bulleTxt, { compact: true }) + '<div id="aimhost"></div>';
  }
  function lanceViser(opts, onWin) {
    const host = document.getElementById("aimhost");
    aimInst = Aim.mount(host, Object.assign({ skipNow: demoMode }, opts, { onSuccess: onWin }));
  }

  // ===================== STATION 1 =====================
  SCREENS.s1 = step => {
    const S = C.s1;
    if (step === "brief") return enTete(S, 1) + illu(Art.jaiSing(), S.jaiSing) + bulle("s1b", S.brief, { saute: 1 }) + surPlace(S.surPlace) + classeBox(S.classe) + dock(btn("Je suis prêt(e) ➜", "go", "", { r: "s1", s: "quiz" }));
    if (step === "quiz") return enTete(S, 1) + quizHTML(S.q) + dock('<p class="small dim center" style="margin:0">Choisis une réponse</p>');
    if (step === "viser") return viserHTML("L'axe du Monde", S.visee, "s1v");
    if (step === "gain") return gainHTML("1", S.fin, "s1g", "🧭 Axe du Monde");
  };
  AFTER.s1 = step => {
    if (step === "viser") lanceViser({ targetId: "pole", titreCourt: "Pôle sud céleste", tol: Store.get("tolerance"), mission: "vers le sud, environ 21° au-dessus de l'horizon", consigne: "Tourne-toi vers le <b>sud</b> et lève le téléphone d'environ 21° : le viseur doit se poser sur le pôle sud céleste.", apres: C.s1.apres }, () => go("s1", "gain"));
    if (step === "gain") effetGain();
  };

  // ===================== STATION 2 =====================
  function dateCadran() { // heure utilisée pour le cadran : maintenant si le Soleil est haut, sinon 10 h 30
    const d = Sky.now(); return Sky.sunAlt(d) > 5 ? d : Sky.heureLocale(d, 10.5);
  }
  SCREENS.s2 = step => {
    const S = C.s2;
    if (step === "brief") return enTete(S, 2) + bulle("s2b", S.brief, { saute: 1 }) + surPlace(S.surPlace) + classeBox(S.classe) + dock(btn("Je suis prêt(e) ➜", "go", "", { r: "s2", s: "cadran" }));
    if (step === "cadran") {
      const d = dateCadran(), reel = Sky.sunAlt(Sky.now()) > 5;
      const sol = Sky.solarMinutes(d), leg = Sky.legalMinutes(d);
      return enTete(S, 2) + '<div class="dialwrap">' + Art.sundial(sol) + '</div>' +
        '<div class="clocks"><div class="clock"><span>☀️ Cadran<br>(heure solaire)</span><b id="hsol">' + hm(sol) + '</b></div><div class="clock"><span>📱 Téléphone<br>(heure légale)</span><b id="hleg">' + hm(leg) + '</b></div></div>' +
        '<div class="slider"><label for="curs">' + esc(S.curseur) + '</label><input type="range" id="curs" min="390" max="1050" step="5" value="' + Math.round(Math.min(1050, Math.max(390, sol))) + '" aria-describedby="hsol"><div class="slider-l" aria-hidden="true"><span>🌅 matin</span><span>midi</span><span>soir 🌇</span></div></div>' +
        '<div class="card"><h3>🌀 Le savais-tu ?</h3><p>' + esc(S.ombre) + '</p></div>' +
        '<div class="note small">' + (reel ? "Valeurs calculées pour l'instant présent aux Makes." : "Le Soleil est bas ou couché : on montre l'exemple d'une matinée à 10 h 30 (heure du téléphone).") + ' Sur place, compare avec un vrai cadran !</div>' +
        dock(btn("Je compare ➜", "go", "", { r: "s2", s: "quiz" }));
    }
    if (step === "quiz") return enTete(S, 2) + quizHTML(S.q) + dock('<p class="small dim center" style="margin:0">Choisis une réponse</p>');
    if (step === "viser") { const v = viseInfo2(); return viserHTML(v.titre, v.bulle, "s2v"); }
    if (step === "gain") return gainHTML("2", S.fin, "s2g", "☀️ Cadrans");
  };
  // Choix de la cible de la station 2 selon le VRAI ciel ; le texte dit pourquoi (même règle que sky.js)
  function viseInfo2() {
    const d = Sky.now(), S = C.s2, sun = Sky.target("soleil", d), moon = Sky.target("lune", d), croix = Sky.target("croix", d);
    if (sun.visible) return { id: "soleil", titre: "Vise le Soleil", court: "Le Soleil", bulle: S.viseSoleil, consigne: "Suis la flèche. <b>Ne regarde jamais le Soleil</b> : regarde seulement l'écran.", apres: "Il est en ce moment à " + Math.round(sun.alt) + "° au-dessus de l'horizon." };
    // le Soleil n'est pas visible : on corrige le texte français si le Soleil est levé mais trop bas
    const bas = sun.alt >= 0, corrige = t => bas ? Object.assign({}, t, { fr: t.fr.replace("Il fait nuit : le Soleil est couché.", "Le Soleil est trop bas sur l'horizon.").replace("Le Soleil est couché", "Le Soleil est trop bas sur l'horizon") }) : t;
    const pourquoi = "☀️ <b>Pourquoi pas le Soleil ?</b> " + esc(sun.raison) + " ";
    if (moon.visible) return { id: "lune", titre: "Vise la Lune", court: "La Lune", bulle: corrige(S.viseLune), consigne: pourquoi + "Suis la flèche jusqu'à la Lune.", apres: "" };
    if (croix.visible) return { id: "croix", etoiles: true, titre: "Vise la Croix du Sud", court: "La Croix du Sud", bulle: corrige(S.viseNuit), consigne: pourquoi + "Suis la flèche jusqu'à la Croix du Sud.", apres: "" };
    return { id: "pole", titre: "Vise le pôle sud céleste", court: "Pôle sud céleste", bulle: corrige(S.viseSecours), consigne: pourquoi + "🌙 La Lune : " + esc(moon.raison.toLowerCase()) + " Tourne-toi vers le sud, environ 21° au-dessus de l'horizon.", apres: "" };
  }
  AFTER.s2 = step => {
    if (step === "viser") { const v = viseInfo2(); lanceViser({ targetId: v.id, titreCourt: v.court, etoiles: v.etoiles, tol: Store.get("tolerance"), mission: "la flèche te guide", consigne: v.consigne, apres: v.apres }, () => go("s2", "gain")); }
    if (step === "cadran") cadranInteractif();
    if (step === "gain") effetGain();
  };
  function cadranInteractif() {
    const o = document.getElementById("ombre"), r = document.getElementById("curs"); if (!o || !r) return;
    // petite animation d'arrivée : l'ombre vient de l'OUEST (matin) et tourne dans le sens inverse des aiguilles d'une montre
    o.style.transformOrigin = "160px 100px"; o.style.transformBox = "view-box";
    o.animate([{ transform: "rotate(18deg)", opacity: 0 }, { transform: "rotate(0)", opacity: .55 }], { duration: 1100, easing: "ease-out" });
    const d0 = dateCadran(), ecart = Sky.legalMinutes(d0) - Sky.solarMinutes(d0); // le cadran retarde de « ecart » minutes
    let last = 0;
    r.addEventListener("input", () => {
      const sol = +r.value, s = Art.sundialShadow(sol);
      o.setAttribute("x2", s.x2); o.setAttribute("y2", s.y2);
      document.getElementById("hsol").textContent = hm(sol); document.getElementById("hleg").textContent = hm(sol + ecart);
      const n = performance.now(); if (n - last > 90) { last = n; Audio2.Sfx.tap(); }
    });
  }

  // ===================== STATION 3 =====================
  SCREENS.s3 = step => {
    const S = C.s3;
    if (step === "brief") return enTete(S, 3) + illu(Art.domeScene(), "Sous une coupole : le T60, télescope de recherche de l'Observatoire (dessin).") + bulle("s3b", S.brief, { saute: 1 }) + surPlace(S.surPlace) + classeBox(S.classe) + dock(btn("Je suis prêt(e) ➜", "go", "", { r: "s3", s: "quiz" }));
    if (step === "quiz") {
      const c = S.cartes, ordre = [c[1], c[3], c[0], c[2]]; // le T60 n'est ni premier ni dernier
      return enTete(S, 3) + '<div class="card warm"><h3>❓ Question</h3><p>' + esc(S.q.texte) + '</p></div><div class="tgrid" id="tgrid">' +
        ordre.map(x => '<button class="tcard" data-act="tel" data-id="' + x.id + '" aria-label="' + esc(x.nom + ", " + x.sous) + '">' + Art.telescope(x.art) + '<b>' + esc(x.nom) + '</b><small>' + esc(x.sous) + '</small></button>').join("") + '</div><div id="fb" aria-live="polite"></div>' +
        dock('<p class="small dim center" style="margin:0">Touche le bon télescope</p>');
    }
    if (step === "gain") return gainHTML("3", S.fin, "s3g", "🔭 T60");
  };
  AFTER.s3 = step => { if (step === "gain") effetGain(); };

  // ===================== BONUS =====================
  // Si la Croix du Sud n'est pas visible maintenant (jour, ou couchée en début de soirée),
  // on simule la meilleure heure de la nuit (calculée) : jamais de cible sous l'horizon.
  function preparerNuit() {
    const reel = Sky.now(), c = Sky.target("croix", reel);
    if (c.visible) return null;
    const b = Sky.bestCroixHour(reel);
    if (!bonusMsg.sim) { bonusMsg.prev = Sky.getSim(); }
    Sky.setSim(b.h); bonusMsg.sim = true; bonusMsg.raison = c.raison;
    return b;
  }
  SCREENS.bonus = step => {
    const S = C.bonus;
    if (step === "brief") { const b = Sky.bestCroixHour(Sky.now()); return enTete(S, "b") + bulle("bb", S.brief, { saute: 1 }) + surPlace(S.note.replace("{h}", hh(b.h))) + classeBox(S.classe) + dock(btn("Je suis prêt(e) ➜", "go", "", { r: "bonus", s: "viser" })); }
    if (step === "viser") return viserHTML("La Croix du Sud", S.visee, "bv");
    if (step === "axe") return enTete(S, "b") + '<div class="croixwrap rouge">' + Art.poleMap({ axe: false, pointeurs: true }) + '</div><div class="card"><h3>🧭 Retrouver le sud</h3><p>' + esc(S.axe) + '</p></div>' + dock(btn("⭐ Recevoir l'étoile", "go", "", { r: "bonus", s: "gain" }));
    if (step === "gain") return gainHTML("b", S.fin, "bg", "🌌 Croix du Sud");
  };
  AFTER.bonus = step => {
    if (step === "viser") {
      const b = preparerNuit();
      const intro = b ? "🌙 <b>Simulation : il est " + hh(b.h) + "</b> (en ce moment, la Croix du Sud : " + esc(bonusMsg.raison.replace(/^Il fait jour.*/, "il fait jour").replace(/^Elle est /, "").replace(/ en ce moment\.$/, "").replace(/\.$/, "")) + "). " : "";
      lanceViser({ targetId: "croix", titreCourt: "La Croix du Sud", etoiles: true, tol: Store.get("tolerance"), mission: "dans le ciel du sud", consigne: intro + "Tourne-toi vers le <b>sud</b>, lève le téléphone : la Croix du Sud est accompagnée de deux étoiles brillantes, les Pointeurs.", apres: C.bonus.apres }, () => go("bonus", "axe"));
    }
    if (step === "axe") setTimeout(() => { const l = document.querySelector(".ligne-croix"); if (l) l.classList.add("on"); }, 400);
    if (step === "gain") effetGain();
  };

  // ===================== GAIN D'ÉTOILE =====================
  function gainHTML(k, texte, id, lib) {
    const got = {}; Object.keys(STAR_OF).forEach(x => got[STAR_OF[x]] = !!Store.stars()[x] || x === k);
    return '<span class="kicker">Étoile retrouvée</span><h2>⭐ ' + esc(lib) + '</h2><div class="croixwrap" id="gainbox">' + Art.croix(got, false, STAR_OF[k]) + '</div>' + bulle(id, texte, { saute: 1 }) +
      dock(btn(k === "b" ? "🏁 Terminer la mission" : "🗺️ Retour au parcours", "valide", "", { k }));
  }
  function effetGain() { Audio2.Sfx.etoile(); confetti(); Audio2.vibre([60, 40, 60]); }

  // ===================== FIN =====================
  SCREENS.fin = () => {
    const n = Store.count(), complet = n >= 4, nom = Store.get("nom"), st = Store.stars();
    const got = {}; Object.keys(STAR_OF).forEach(x => got[STAR_OF[x]] = !!st[x]);
    let t = C.fin.ok;
    if (!complet) { // texte français exact selon les étoiles qui manquent vraiment
      const manque = Object.keys(STAR_OF).filter(x => !st[x]).map(x => Art.NOMS[STAR_OF[x]]);
      const liste = manque.length > 1 ? manque.slice(0, -1).join(", ") + " et " + manque[manque.length - 1] : manque[0];
      t = Object.assign({}, C.fin.presque, { fr: (n >= 2 ? C.fin.manque : C.fin.manque.replace(/^Presque ! /, "")).replace("{liste}", liste) + " " + (!st.b ? C.fin.manqueImai : C.fin.manqueJour) });
    }
    const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Indian/Reunion" });
    const liste = ["1", "2", "3", "b"].map(x => '<li class="' + (st[x] ? "ok" : "") + '">' + (st[x] ? "★" : "☆") + " " + Art.NOMS[STAR_OF[x]] + '</li>').join("");
    return '<span class="kicker">' + (complet ? "Mission accomplie" : n >= 2 ? "Presque !" : "Ton brevet") + '</span><h2>' + (complet ? "🏆 Bravo, astronome !" : "⭐ " + n + " étoile" + (n > 1 ? "s" : "") + " sur 4") + '</h2>' +
      '<div class="croixwrap">' + Art.croix(got, complet) + '</div>' + bulle("fin", t, { saute: 1 }) +
      '<div class="card secret"><h3>🤫 Le secret de Ti-Fil</h3><p>' + esc(C.fin.secret) + '</p></div>' +
      '<div class="card"><h3><label for="nom">✍️ Ton prénom pour le brevet</label></h3><input class="field" id="nom" maxlength="20" autocomplete="off" placeholder="Ton prénom" value="' + esc(nom) + '"></div>' +
      '<div class="brevet" id="brevet"><div class="brevet-in">' +
        '<div class="sceau">' + Art.sceau() + '</div>' +
        '<p class="brevet-k">Observatoire astronomique des Makes</p><h2>Brevet d\'astronome</h2><p class="brevet-d">décerné à</p>' +
        '<div class="nom" id="brnom">' + esc(nom || "…") + '</div>' +
        '<p>qui a retrouvé <b>' + n + ' étoile' + (n > 1 ? "s" : "") + ' sur 4</b> de la Croix du Sud avec Ti-Fil, l\'étoile filante.</p>' +
        '<ul class="brevet-l">' + liste + '</ul>' +
        '<p class="brevet-f"><span>Les Makes, La Réunion</span><span>' + esc(date) + '</span></p>' +
      '</div></div>' +
      '<div class="note small">🏫 <b>Pour l\'Observatoire :</b> à la fin, l\'aventure peut proposer l\'achat de la visite suivante, un quiz en classe, ou l\'inscription à une soirée d\'observation (à décider ensemble).</div>' +
      dock(btn("🖨️ Imprimer / enregistrer le brevet", "print") + (st.b ? "" : btn("🌙 Aller au bonus de soirée", "scanb", "sec")) + btn("🔁 Rejouer depuis le début", "reset", "sec"), "flow");
  };
  AFTER.fin = () => {
    if (Store.count() >= 4) { Audio2.Sfx.fin(); setTimeout(confetti, 300); }
    const i = document.getElementById("nom");
    if (i) i.addEventListener("input", () => { Store.set("nom", i.value.trim()); document.getElementById("brnom").textContent = i.value.trim() || "…"; });
  };

  // ===================== RÉGLAGES =====================
  function reglages() {
    closeSheets();
    const sh = document.createElement("div"); sh.className = "sheet"; sh.setAttribute("role", "dialog"); sh.setAttribute("aria-label", "Réglages");
    const th = Store.get("theme"), tol = Store.get("tolerance"), vx = Store.get("voix"), sim = Sky.getSim();
    const seg = (act, cur, items) => '<div class="seg">' + items.map(i => '<button class="btn" data-act="' + act + '" data-v="' + i[0] + '" aria-pressed="' + (String(cur) === String(i[0])) + '">' + i[1] + '</button>').join("") + '</div>';
    sh.innerHTML = '<div><h3>⚙️ Réglages</h3>' +
      '<p class="small"><b>Affichage</b>' + (route.n === "bonus" ? " (le bonus reste en nuit rouge)" : "") + '</p>' + seg("th", th, [["ciel", "🌌 Ciel"], ["soleil", "☀️ Plein soleil"], ["rouge", "🔴 Nuit rouge"]]) +
      '<p class="small"><b>Créole</b> (texte écrit sous les bulles, à faire relire)</p>' + seg("voix", vx, [["fr", "Français seul"], ["kr", "+ Kréol"]]) +
      '<p class="small"><b>Tolérance de visée</b> (boussole imprécise : large = plus facile)</p>' + seg("tol", tol, [[12, "± 12°"], [18, "± 18°"], [25, "± 25°"]]) +
      '<p class="small"><b>Son et vibrations</b></p>' + seg("son", Store.get("son") ? "1" : "0", [["1", "🔊 Oui"], ["0", "🔇 Non"]]) +
      '<p class="small"><b>Heure du ciel (démo)</b> — pour essayer de jour comme de soirée</p>' + seg("sim", sim, [["now", "Réelle"], ["midi", "Midi"], ["matin", "Matin"], ["soir", "21 h"], ["nuit", "4 h 30"]]) +
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
    const s = Sky.getSim();
    p.innerHTML = '<button data-act="dprev" aria-label="Étape précédente">◀</button><span class="lbl">Démo · étape ' + (demoIdx + 1) + ' / ' + C.demo.length + '</span><button data-act="dsim" aria-label="Changer l\'heure du ciel">🕒 ' + (typeof s === "number" ? hh(s) : ({ now: "réelle", midi: "midi", matin: "matin", soir: "soir", nuit: "nuit" }[s] || "")) + '</button><button data-act="dnext" aria-label="Étape suivante">▶</button>';
  }
  function demoGo(d) {
    demoIdx = Math.max(0, Math.min(C.demo.length - 1, demoIdx + d));
    const x = C.demo[demoIdx]; if (x[0] === "accueil") { go("accueil"); return; }
    // en démo enchaînée, les étoiles des stations déjà « passées » sont attribuées pour que le hub et la fin soient cohérents
    C.demo.forEach((y, k) => { if (k < demoIdx) { const m = { s1: "1", s2: "2", s3: "3", bonus: "b" }[y[0]]; if (m && C.demo.slice(k + 1, demoIdx + 1).some(z => z[0] !== y[0])) Store.star(m, true); } });
    go(x[0], x[1]);
  }

  // ===================== ÉVÉNEMENTS =====================
  document.addEventListener("click", e => {
    const v = e.target.closest(".voicebtn");
    if (v) {
      const lang = v.dataset.voix, box = v.closest(".bubble");
      if (lang === "kr") { const kr = box.querySelector(".kr"); if (kr) kr.hidden = false; Audio2.parle(v.dataset.id, "kr", "").then(r => { if (r === "aucune") toast("🎙️ Enregistrement créole à venir : texte à faire relire"); }); }
      else { v.classList.add("playing"); Audio2.parle(v.dataset.id, "fr", v.dataset.txt).then(r => { if (r === "aucune") toast("Voix indisponible sur cet appareil : lis le texte !"); setTimeout(() => v.classList.remove("playing"), 600); }); }
      return;
    }
    const b = e.target.closest("[data-act]"); if (!b) return;
    const a = b.dataset.act; Audio2.Sfx.unlock();
    switch (a) {
      case "start": { Audio2.Sfx.filante(); const premiere = !Store.get("intro"); Store.set("intro", true); premiere ? go("intro", "0") : go("hub"); break; }
      case "accueil": go("accueil"); break;
      case "pub": Store.set("public", b.dataset.v); Audio2.Sfx.tap(); render(); break;
      case "th": {
        const inSheet = !!b.closest(".sheet"); Store.set("theme", b.dataset.v); applyTheme(); render();
        if (inSheet) reglages(); // on garde le panneau ouvert, avec le bon bouton enfoncé
        break;
      }
      case "intro": Audio2.Sfx.page(); go("intro", b.dataset.i); break;
      case "hub": go("hub"); break;
      case "scan": scan(b.dataset.k); break;
      case "go": Audio2.Sfx.tap(); go(b.dataset.r, b.dataset.s); break;
      case "rep": {
        const q = route.n === "s1" ? C.s1.q : C.s2.q, i = +b.dataset.i;
        const fait = route.n === "s1" ? C.s1.fait : C.s2.pourquoi;
        repondre(q, i, fait, { label: "🎯 Vise le ciel ➜", r: route.n, s: "viser" });
        if (i !== q.ok && route.n === "s2" && !document.getElementById("pq")) { document.getElementById("fb").insertAdjacentHTML("beforeend", '<div class="card" id="pq"><h3>💡 Pourquoi ?</h3><p>' + esc(C.s2.pourquoi) + '</p></div>'); }
        break;
      }
      case "tel": {
        const S = C.s3, ok = b.dataset.id === "t60", fb = document.getElementById("fb");
        if (ok) {
          $screen.querySelectorAll(".tcard").forEach(t => { t.disabled = true; t.classList.add(t === b ? "ok" : "off"); }); Audio2.Sfx.ok(); Audio2.vibre(60);
          fb.innerHTML = '<div class="feedback ok"><span class="ic">✅</span>' + esc(S.q.bravo) + '</div><div class="card"><h3>💡 Le savais-tu ?</h3><p>' + esc(S.fait) + '</p></div>';
          document.querySelector(".dock").innerHTML = btn("⭐ Recevoir l'étoile", "go", "", { r: "s3", s: "gain" });
          fb.scrollIntoView({ behavior: "smooth", block: "center" });
        } else { b.classList.add("ko"); b.disabled = true; Audio2.Sfx.ko(); Audio2.vibre(120); fb.innerHTML = '<div class="feedback ko"><span class="ic">🔁</span>' + esc(S.q.rate) + '</div>'; }
        break;
      }
      case "aimskip": if (aimInst) { toast("On continue !"); go(route.n, route.n === "bonus" ? "axe" : "gain"); } break;
      case "valide": Store.star(b.dataset.k, true); topbar(); go(b.dataset.k === "b" ? "fin" : "hub"); break;
      case "fin": go("fin"); break;
      case "scanb": scan("b"); break;
      case "print": window.print(); break;
      case "reset": if (confirm("Remettre l'aventure à zéro ?")) { Store.reset(); closeSheets(); Sky.setSim("now"); bonusMsg.sim = false; go("accueil"); } break;
      case "reglages": reglages(); break;
      case "fermer": closeSheets(); break;
      case "credits": credits(); break;
      case "voix": Store.set("voix", b.dataset.v); render(); reglages(); break;
      case "tol": Store.set("tolerance", +b.dataset.v); reglages(); break;
      case "son": Store.set("son", b.dataset.v === "1"); reglages(); break;
      case "sim": Sky.setSim(b.dataset.v); bonusMsg.sim = false; reglages(); updatePresbar(); break;
      case "dprev": demoGo(-1); break;
      case "dnext": demoGo(1); break;
      case "dsim": { const l = ["now", "midi", "soir", "nuit"]; const s = Sky.getSim(); Sky.setSim(l[(l.indexOf(s) + 1) % l.length]); bonusMsg.sim = false; updatePresbar(); toast("Heure du ciel : " + Sky.getSim()); break; }
    }
  });

  // ===================== DÉMARRAGE =====================
  function init() {
    const q = new URLSearchParams(location.search);
    if (q.get("theme")) Store.set("theme", q.get("theme"));
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
